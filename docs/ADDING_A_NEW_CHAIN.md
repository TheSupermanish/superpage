# Adding a New Chain to Airaa

This guide covers every file and configuration change required to add a new EVM-compatible chain to Airaa.

## Overview

Adding a chain touches **10 source files**, **3 test files**, **1 hardhat config**, and requires a **deploy script** + **environment updates**. Follow each section in order.

The codebase is modular — each package owns its own chain config. There is no single "add chain here" file. This guide walks through every package systematically.

---

## 1. Prerequisites

Before starting, gather:

| Info | Example (Flow) |
|------|-----------------|
| Chain ID (mainnet) | 747 |
| Chain ID (testnet) | 545 |
| RPC URL | `https://testnet.evm.nodes.onflow.org` |
| Block explorer | `https://evm-testnet.flowscan.io` |
| Native token symbol | FLOW |
| Native token decimals | 18 |
| USDC address (if exists on mainnet) | `0xF1815bd50389c46847f0Bda824eC8da914045D14` |
| Testnet faucet URL | `https://faucet.flow.com/fund-account` |

Check if viem has a built-in chain definition:
```ts
import { flowTestnet } from "viem/chains"; // works for standard chains
```

If not, you'll need a custom `defineChain()` call (see Section 3).

---

## 2. Files to Modify (Checklist)

### Source Files

- [ ] `packages/x402-sdk-eth/src/chains.ts` — SDK chain registry
- [ ] `packages/backend/src/config/chain-config.ts` — Backend chain registry
- [ ] `packages/frontend/lib/chains.ts` — Frontend viem chains
- [ ] `packages/frontend/lib/chain-config.ts` — Frontend display config (USDC addresses, explorers, etc.)
- [ ] `packages/frontend/components/providers/ethereum-wallet-provider.tsx` — RainbowKit/wagmi provider
- [ ] `packages/mcp-client/src/config.js` — MCP client chain + token mapping
- [ ] `packages/contracts/hardhat.config.ts` — Hardhat network config
- [ ] `packages/x402-sdk-eth/src/evm-utils.ts` — SDK legacy chain maps (CHAINS, CHAIN_IDS, TOKEN_ADDRESSES, etc.)
- [ ] `packages/x402-sdk-eth/src/x402-types.ts` — Zod schemas (NetworkSchema, TokenTypeSchema)
- [ ] `packages/mcp-client/src/wallet.js` — Explorer URLs + native currency detection

### ERC-8004 Files (if deploying identity/reputation contracts)

- [ ] `packages/backend/src/erc8004/config.ts` — Contract addresses, chain ID, RPC, explorer
- [ ] `packages/backend/src/erc8004/client.ts` — Viem client chain definition
- [ ] `packages/ai-agent/src/erc8004/client.ts` — AI agent ERC-8004 client chain + contracts

### Test Files

- [ ] `packages/x402-sdk-eth/src/__tests__/chains.test.ts` — Update network count + add assertions
- [ ] `packages/x402-sdk-eth/src/__tests__/evm-utils.test.ts` — Update CHAINS count
- [ ] `packages/backend/src/__tests__/config/chain-config.test.ts` — Update network count + add assertions

### New Files

- [ ] `packages/contracts/scripts/deploy-<chain>.ts` — Deployment script
- [ ] `docs/<chain>.md` — Chain-specific documentation

### Environment

- [ ] `packages/backend/.env` — Set `X402_CHAIN=<chain-id>`
- [ ] `packages/frontend/.env.local` — Set `NEXT_PUBLIC_X402_CHAIN=<chain-id>`
- [ ] `packages/contracts/.env` — Set `DEPLOY_PRIVATE_KEY`

---

## 3. Step-by-Step Changes

### 3.1 — x402-sdk-eth (`packages/x402-sdk-eth/src/chains.ts`)

**A. Add to `NetworkId` type:**
```ts
export type NetworkId =
  | "mainnet"
  | "base"
  // ... existing chains ...
  | "your-chain"
  | "your-chain-testnet";
```

**B. Add to `NativeTokenSymbol` type** (if new native token):
```ts
export type NativeTokenSymbol = "ETH" | "MATIC" | "MNT" | "CRO" | "sFUEL" | "FLOW" | "YOUR_TOKEN";
```

**C. Add custom chain definition** (only if not in `viem/chains`):
```ts
import { defineChain } from "viem";

const yourChain = defineChain({
  id: 12345,
  name: "Your Chain",
  nativeCurrency: { name: "Token", symbol: "TKN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.yourchain.io"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.yourchain.io" },
  },
  testnet: false,
});
```

**D. Add to `CHAIN_REGISTRY`:**
```ts
"your-chain": {
  id: "your-chain",
  chainId: 12345,
  name: "Your Chain",
  shortName: "YC",
  isTestnet: false,
  viemChain: yourChain,
  rpcUrl: "https://rpc.yourchain.io",
  explorerUrl: "https://explorer.yourchain.io",
  nativeToken: { symbol: "TKN", name: "Token", decimals: 18 },
  tokens: {
    USDC: { symbol: "USDC", decimals: 6, address: "0x..." },
  },
  defaultPaymentToken: "USDC",
},
```

### 3.2 — Backend (`packages/backend/src/config/chain-config.ts`)

**A. Add to `NetworkId` type** (must match SDK).

**B. Add to `NativeTokenSymbol` type** (if new native token).

**C. Add to `TOKEN_DECIMALS`** (if new native token):
```ts
TKN: 18,
```

**D. Add to `CHAIN_REGISTRY`:**
```ts
"your-chain": {
  chainId: 12345,
  name: "Your Chain",
  rpcUrl: "https://rpc.yourchain.io",
  explorerUrl: "https://explorer.yourchain.io",
  nativeToken: { symbol: "TKN", decimals: 18 },
  tokens: {
    USDC: { address: "0x...", decimals: 6 },
  },
  defaultPaymentToken: "USDC",
  isTestnet: false,
},
```

### 3.3 — Frontend chains (`packages/frontend/lib/chains.ts`)

**A. Import or define the chain:**
```ts
import { yourChain } from "viem/chains";
// OR define with defineChain() if custom
```

**B. Add to `SUPPORTED_CHAINS` array** (mainnets before testnets):
```ts
export const SUPPORTED_CHAINS: Chain[] = [
  // ... existing chains ...
  yourChain,
  yourChainTestnet,
];
```

**C. Add to `CHAIN_BY_NAME`:**
```ts
"your-chain": yourChain,
"your-chain-testnet": yourChainTestnet,
```

**D. Add to `CHAIN_REGISTRY`** with full metadata (token addresses, explorer, etc.).

### 3.4 — Frontend chain-config (`packages/frontend/lib/chain-config.ts`)

Add entries to each mapping:

```ts
// CHAIN_DEFAULTS
"your-chain": { defaultCurrency: "USDC" },

// NATIVE_TOKENS
"your-chain": "TKN",

// CHAIN_IDS
"your-chain": 12345,

// EXPLORER_URLS
"your-chain": "https://explorer.yourchain.io",

// USDC_ADDRESSES
"your-chain": "0x...",
```

### 3.5 — Wallet provider (`packages/frontend/components/providers/ethereum-wallet-provider.tsx`)

```ts
import { yourChain, yourChainTestnet } from "wagmi/chains";
// OR import from your custom chains file

const supportedChains: readonly [Chain, ...Chain[]] = [
  baseSepolia,
  // ... existing chains ...
  yourChain,
  yourChainTestnet,
];
```

### 3.6 — MCP client (`packages/mcp-client/src/config.js`)

**A. Import chain:**
```ts
import { yourChain, yourChainTestnet } from "viem/chains";
```

**B. Add to `CHAINS`:**
```ts
"your-chain": yourChain,
"your-chain-testnet": yourChainTestnet,
```

**C. Add to `TOKEN_ADDRESSES`:**
```ts
"your-chain": {
  USDC: "0x...",
},
"your-chain-testnet": {
  USDC: "0x...",  // MockUSDC after deployment
},
```

### 3.7 — Hardhat config (`packages/contracts/hardhat.config.ts`)

```ts
networks: {
  yourChainTestnet: {
    type: "http",
    url: "https://rpc.yourchain-testnet.io",
    accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : [],
    chainId: 12346,
  },
  yourChainMainnet: {
    type: "http",
    url: "https://rpc.yourchain.io",
    accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : [],
    chainId: 12345,
  },
},
```

> **Note:** Hardhat 3 requires `type: "http"` for remote networks.

### 3.8 — x402-sdk-eth evm-utils (`packages/x402-sdk-eth/src/evm-utils.ts`)

This file has hardcoded chain maps that mirror `chains.ts`. All must be updated:

**A. Import chain from viem:**
```ts
import { yourChain, yourChainTestnet } from "viem/chains";
```

**B. Add to `CHAINS`:**
```ts
export const CHAINS: Record<Network, Chain> = {
  // ...
  "your-chain": yourChain,
  "your-chain-testnet": yourChainTestnet,
};
```

**C. Add to `CHAIN_IDS`:**
```ts
"your-chain": 12345,
"your-chain-testnet": 12346,
```

**D. Add to `TOKEN_ADDRESSES`:** (add your token to the `Exclude<>` type if native)
```ts
"your-chain": {
  USDC: "0x..." as Address,
  USDT: "0x0000000000000000000000000000000000000000" as Address,
  DAI: "0x0000000000000000000000000000000000000000" as Address,
},
```

**E. Add to `TOKEN_DECIMALS`** (if new native token):
```ts
TKN: 18, // Your chain native token
```

**F. Add to `getRpcEndpoint()`:**
```ts
"your-chain": "https://rpc.yourchain.io",
"your-chain-testnet": "https://rpc.yourchain-testnet.io",
```

**G. Update native token checks** in `createPaymentTransaction()`, `sendPaymentTransaction()`, and `verifyPaymentTransaction()`:
```ts
if (requirements.token === "ETH" || ... || requirements.token === "TKN") {
```

### 3.9 — x402-types Zod schemas (`packages/x402-sdk-eth/src/x402-types.ts`)

**A. Add to `NetworkSchema`:**
```ts
export const NetworkSchema = z.enum([
  // ...
  "your-chain",
  "your-chain-testnet",
]);
```

**B. Add to `TokenTypeSchema`** (if new native token):
```ts
export const TokenTypeSchema = z.enum(["ETH", "USDC", "USDT", "DAI", "CRO", "MNT", "sFUEL", "FLOW", "TKN"]);
```

### 3.10 — MCP client wallet (`packages/mcp-client/src/wallet.js`)

**A. Add to `getExplorerUrl()` map:**
```js
'your-chain': `https://explorer.yourchain.io/tx/${txHash}`,
'your-chain-testnet': `https://explorer.yourchain-testnet.io/tx/${txHash}`,
```

**B. Add to native currency detection in `getWalletBalance()`:**
```js
const nativeCurrency = NETWORK.includes('your-chain') ? 'TKN'
  : NETWORK.includes('mantle') ? 'MNT'
  // ... existing checks ...
  : 'ETH';
```

### 3.11 — ERC-8004 (if deploying identity/reputation contracts)

If you're deploying ERC-8004 registries to the new chain, update these 3 files:

**A. Backend config (`packages/backend/src/erc8004/config.ts`):**
```ts
export const ERC8004_CHAIN_ID = 12346;
export const ERC8004_NETWORK = "your-chain-testnet" as const;
export const ERC8004_RPC_URL = "https://rpc.yourchain-testnet.io";
export const ERC8004_EXPLORER_URL = "https://explorer.yourchain-testnet.io";

export const ERC8004_CONTRACTS = {
  identityRegistry: "0x..." as `0x${string}`,
  reputationRegistry: "0x..." as `0x${string}`,
  validationRegistry: "0x..." as `0x${string}`,
} as const;
```

**B. Backend client (`packages/backend/src/erc8004/client.ts`):**
```ts
import { yourChainTestnet } from "viem/chains";
// Replace chain in getERC8004PublicClient() and getERC8004WalletClient()
```

**C. AI agent client (`packages/ai-agent/src/erc8004/client.ts`):**
```ts
import { yourChainTestnet } from "viem/chains";
// Update ERC8004_CONTRACTS addresses
// Update RPC URL and chain references in constructor
```

---

## 4. Deploy Contracts

### 4.1 — Create deployment script

Copy `packages/contracts/scripts/deploy-flow.ts` as a template. Key changes:

```ts
import { yourChainTestnet } from "viem/chains";

// Update chain in createWalletClient/createPublicClient
const walletClient = createWalletClient({
  account,
  chain: yourChainTestnet,
  transport: http(),
});

// Update explorer URL
const explorer = "https://explorer.yourchain-testnet.io/address";
```

The script deploys 4 contracts:
1. **MockUSDC** — ERC-20 test token (1M minted to deployer)
2. **IdentityRegistry** — ERC-8004 agent identity
3. **ReputationRegistry** — Agent reputation (references IdentityRegistry)
4. **ValidationRegistry** — Third-party validation (references IdentityRegistry)

### 4.2 — Compile and deploy

```bash
cd packages/contracts

# Compile
npx hardhat compile

# Deploy
npx tsx scripts/deploy-your-chain.ts
```

### 4.3 — Update MockUSDC address

After deployment, copy the MockUSDC address and update it in all 4 config files:
- `packages/backend/src/config/chain-config.ts`
- `packages/frontend/lib/chain-config.ts`
- `packages/x402-sdk-eth/src/chains.ts`
- `packages/mcp-client/src/config.js`

Replace the `0x000...000` placeholder with the actual deployed address.

---

## 5. Update Tests

### 5.1 — `packages/x402-sdk-eth/src/__tests__/chains.test.ts`

```ts
// Update network count (currently 16)
expect(networks.length).toBe(18); // +2 for mainnet + testnet

// Add assertions
expect(networks).toContain("your-chain");
expect(networks).toContain("your-chain-testnet");
```

### 5.2 — `packages/x402-sdk-eth/src/__tests__/evm-utils.test.ts`

```ts
// Update CHAINS count
expect(Object.keys(CHAINS).length).toBe(16); // increment
```

### 5.3 — `packages/backend/src/__tests__/config/chain-config.test.ts`

```ts
// Update network count (currently 16)
expect(networks.length).toBe(18);

// Add assertions
expect(networks).toContain("your-chain");
expect(networks).toContain("your-chain-testnet");
```

---

## 6. Update Environment

### Backend (`packages/backend/.env`)
```env
X402_CHAIN=your-chain-testnet
X402_CURRENCY=USDC
```

### Frontend (`packages/frontend/.env.local`)
```env
NEXT_PUBLIC_X402_CHAIN=your-chain-testnet
NEXT_PUBLIC_X402_CURRENCY=USDC
```

### Contracts (`packages/contracts/.env`)
```env
DEPLOY_PRIVATE_KEY=0x...
```

---

## 7. Verification Checklist

After all changes, run these checks in order:

### 7.1 — Compile & Unit Tests

```bash
# 1. Compile contracts
cd packages/contracts && npx hardhat compile

# 2. Run SDK tests (99 tests: chains, evm-utils, types, server, client)
cd packages/x402-sdk-eth && npx vitest run

# 3. Run backend tests (137 tests: config, payment helpers, A2A, MCP tools)
cd packages/backend && npm test

# 4. Type-check backend
cd packages/backend && npx tsc --noEmit
```

The tests validate:
- Chain registry has correct count and entries (`chains.test.ts`)
- CHAINS/CHAIN_IDS maps include new chain (`evm-utils.test.ts`)
- Network/token Zod schemas accept new chain (`x402-types.test.ts`)
- Chain config resolves correctly (`chain-config.test.ts`)

### 7.2 — On-chain Verification

```bash
# Verify deployed contracts
node -e "
const {createPublicClient, http, formatUnits} = require('viem');
const {yourChainTestnet} = require('viem/chains');
const client = createPublicClient({chain: yourChainTestnet, transport: http()});

const MUSDC = '0x_YOUR_DEPLOYED_MUSDC_ADDRESS';
const DEPLOYER = '0x_YOUR_DEPLOYER_ADDRESS';

(async () => {
  const balance = await client.readContract({
    address: MUSDC,
    abi: [{inputs:[{name:'a',type:'address'}],name:'balanceOf',outputs:[{type:'uint256'}],stateMutability:'view',type:'function'}],
    functionName: 'balanceOf',
    args: [DEPLOYER],
  });
  console.log('mUSDC balance:', formatUnits(balance, 6));
})();
"
```

### 7.3 — MCP Client Config

```bash
X402_CHAIN=your-chain-testnet X402_CURRENCY=USDC \
WALLET_PRIVATE_KEY=0x_YOUR_KEY \
node -e "
import('./packages/mcp-client/src/wallet.js').then(async (m) => {
  const balance = await m.getWalletBalance();
  console.log(JSON.stringify(balance, null, 2));
});
"
```

Verify:
- `network` = your chain name
- `balances` shows correct native token symbol (not "ETH")
- `tokenContract` = your deployed MockUSDC address

### 7.4 — Resource Purchasing Flow

Start the backend and test the full payment cycle:

```bash
cd packages/backend && npx tsx src/index.ts &

# 1. List resources (should return resources)
curl -s http://localhost:1337/x402/resources | python3 -m json.tool | head -10

# 2. Access without payment (should return 402 with your chain's payment requirements)
curl -s http://localhost:1337/x402/resource/weather-api | python3 -m json.tool
# Verify: network = your-chain-testnet, chainId = YOUR_CHAIN_ID, token = USDC

# 3. Make payment via MCP tool
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"make_payment","arguments":{"recipientAddress":"0xRECIPIENT","amount":"10000","network":"your-chain-testnet","token":"USDC"}},"id":1}'
# Save the transactionHash from the response

# 4. Access resource with payment proof
curl -s http://localhost:1337/x402/resource/weather-api \
  -H 'X-PAYMENT: {"transactionHash":"0xYOUR_TX_HASH","network":"your-chain-testnet","chainId":YOUR_CHAIN_ID,"timestamp":TIMESTAMP}'
# Should return 200 with resource content
```

### 7.5 — Shopping/Checkout Flow

```bash
# 1. List stores
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_stores","arguments":{}},"id":1}'

# 2. Browse products
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_store_products","arguments":{"storeId":"shopify/YOUR_STORE"}},"id":2}'

# 3. Phase 1: Initiate checkout (returns 402 with payment requirements)
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"initiate_checkout","arguments":{"storeId":"shopify/YOUR_STORE","items":[{"productId":"VARIANT_ID","quantity":1}],"email":"test@example.com","shippingAddress":{"name":"John Doe","address1":"123 Main St","city":"New York","state":"NY","postalCode":"10001","country":"US"}}},"id":3}'
# Save orderIntentId and payment amount

# 4. Make payment (same as resource flow)

# 5. Phase 2: Finalize checkout with payment proof
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"finalize_checkout","arguments":{"storeId":"shopify/YOUR_STORE","orderIntentId":"ORDER_INTENT_ID","items":[{"productId":"VARIANT_ID","quantity":1}],"email":"test@example.com","shippingAddress":{"name":"John Doe","address1":"123 Main St","city":"New York","state":"NY","postalCode":"10001","country":"US"},"paymentProof":{"transactionHash":"0xTX_HASH","network":"your-chain-testnet","chainId":YOUR_CHAIN_ID,"timestamp":TIMESTAMP}}},"id":4}'
# Should return orderId and shopifyOrderId
```

### 7.6 — ERC-8004 (if deployed)

```bash
# Register agent
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"register_agent","arguments":{"agentURI":"https://yourserver/.well-known/agent-registration.json"}},"id":1}'

# Check agent info
curl -s -X POST http://localhost:1337/mcp/universal \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_agent_info","arguments":{"agentId":"0"}},"id":2}'
# Verify chain shows eip155:YOUR_CHAIN_ID

# Check registration file
curl -s http://localhost:1337/.well-known/agent-registration.json
# Verify agentRegistry shows your chain
```

---

## 8. Chain-Specific Considerations

### Gas tokens
- Some chains have zero gas (SKALE/sFUEL) — set `defaultPaymentToken` to USDC
- Some testnets may not have USDC — use native token as `defaultPaymentToken`

### Custom RPC
- If the chain isn't in viem's built-in list, use `defineChain()` in every file that needs it
- Consider adding a shared custom chain definitions file if reuse is needed

### Wallet support
- Standard EVM wallets (MetaMask, WalletConnect) work for all EVM chains
- Chain-specific wallets (e.g., Flow Wallet) may need additional SDK integration (FCL)

### Block explorer verification
- Flowscan, Etherscan-compatible explorers work with Hardhat verify plugin
- Non-standard explorers may not support contract verification

---

## Quick Reference: File Count

| Category | Files | Count |
|----------|-------|-------|
| Chain registries | SDK chains.ts, backend chain-config.ts, frontend chains.ts, frontend chain-config.ts, MCP config.js | 5 |
| SDK internals | evm-utils.ts, x402-types.ts | 2 |
| MCP client | wallet.js (explorer + native currency) | 1 |
| Wallet provider | ethereum-wallet-provider.tsx | 1 |
| Hardhat | hardhat.config.ts | 1 |
| Deploy script | scripts/deploy-<chain>.ts | 1 (new) |
| Tests | chains.test.ts, evm-utils.test.ts, chain-config.test.ts | 3 |
| ERC-8004 (optional) | backend config.ts, backend client.ts, ai-agent client.ts | 3 |
| Environment | backend .env, frontend .env.local, contracts .env | 3 |
| Documentation | docs/<chain>.md | 1 (new) |
| **Total** | | **21 files** |
