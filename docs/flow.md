# Flow EVM Research

> Research compiled: 2026-03-31

---

## 1. Flow EVM Overview

### What is Flow EVM?

Flow EVM is an **EVM-equivalent** environment running natively on the Flow blockchain. Introduced via the **Crescendo upgrade** in September 2024, it allows developers to deploy Solidity smart contracts with zero code changes. Flow is an L1 blockchain, not a rollup or L2 -- EVM runs as a higher-level environment incorporated as a smart contract deployed to Cadence (Flow's native smart contract language).

### Architecture

- **EVM as a Cadence smart contract**: The EVM environment is a smart contract deployed to Cadence. It is not owned by anyone and has its own storage space. EVM transactions are wrapped inside Cadence transactions and passed to the EVM contract for execution.
- **No geth nodes**: Flow EVM does not leverage geth or introduce new node types. It uses the latest EVM byte-code interpreter (`Geth v1.13`) internally.
- **EVM Gateway**: To support web3 clients (ethers.js, viem, etc.), an EVM Gateway honors the Ethereum JSON-RPC specification. The gateway integrates with Flow access nodes and can be run by anyone (unstaked). It functions as a sequencer, accepting EVM transactions, running an internal mempool, and wrapping batches of EVM transactions into Flow transactions before submission.
- **One EVM block per Flow block**: Every Flow block includes at most one EVM block, formed after Flow block execution completes.
- **Cross-VM atomicity**: Cadence can call into EVM and vice versa (via precompiles), enabling atomic cross-environment operations. Neither environment has access to the raw memory of the other, preserving security properties.

### EVM Equivalence

Flow claims **full EVM equivalence**, not just compatibility. Anything that runs on Ethereum after the Pectra upgrade can run on Flow EVM. Supported EIPs include EIP-1014, EIP-1559, EIP-4844, EIP-5656, EIP-6780, and more.

**Source**: [Flow EVM About](https://developers.flow.com/build/evm/about), [How Flow EVM Works](https://developers.flow.com/build/evm/how-it-works), [EVM on Flow](https://flow.com/upgrade/crescendo/evm)

---

## 2. Chain Details

### Mainnet

| Property | Value |
|----------|-------|
| Network Name | Flow EVM Mainnet |
| Chain ID | **747** |
| RPC Endpoint | `https://mainnet.evm.nodes.onflow.org` |
| WebSocket | `wss://mainnet.evm.nodes.onflow.org` |
| Block Explorer | https://evm.flowscan.io |
| Currency Symbol | FLOW |
| Native/Gas Token | FLOW (denominated in Atto-FLOW; 1 FLOW = 10^18 Atto-FLOW) |

### Testnet

| Property | Value |
|----------|-------|
| Network Name | Flow EVM Testnet |
| Chain ID | **545** |
| RPC Endpoint | `https://testnet.evm.nodes.onflow.org` |
| WebSocket | `wss://testnet.evm.nodes.onflow.org` |
| Block Explorer | https://evm-testnet.flowscan.io |
| Currency Symbol | FLOW |

### Third-Party RPC Providers

- **Alchemy**: [Flow RPC](https://www.alchemy.com/rpc/flow)
- **Dwellir**: [Flow EVM](https://www.dwellir.com/docs/flow-evm)
- **ThirdWeb**: [Flow EVM](https://thirdweb.com/flow)
- **ChainList**: [Mainnet (747)](https://chainlist.org/chain/747), [Testnet (545)](https://chainlist.org/chain/545)

**Source**: [Network Information](https://developers.flow.com/build/evm/networks), [ChainList Mainnet](https://chainlist.org/chain/747), [ChainList Testnet](https://chainlist.org/chain/545)

---

## 3. Walletless Onboarding & Account Abstraction

### Flow's Native Account Abstraction

Flow has **native account abstraction** at the protocol level -- this is not an add-on like ERC-4337. Key features:

- **Multi-key accounts**: Flow accounts can have one or more public keys of various weights, enabling native multi-sig.
- **Separate transaction roles**: Flow transactions natively separate the Proposer, Payer, and Authorizer roles. This means a different account can pay gas fees for a user's transaction at the protocol level.
- **Hybrid custody**: A model where app-custodial accounts can later be linked to user-owned wallets, combining the benefits of app custody (frictionless onboarding) and self custody (user ownership).

### Cadence-Owned Accounts (COAs)

COAs are a **new type of EVM smart contract account** unique to Flow. They:
- Are created through Cadence, not via EVM transactions
- Have addresses prefixed with `0x000000000000000000000002`
- Are governed by a Cadence resource (not a private key), enabling ownership transfer without moving assets
- Use a distinct transaction type (`0xff`) to differentiate from standard EVM transactions
- Benefit from all of Flow's native account abstraction features

### Walletless Onboarding on EVM

Yes, Flow supports walletless onboarding on the EVM side through several mechanisms:

1. **Flow Wallet auto-sponsorship**: The Flow Wallet currently sponsors transactions on both testnet and mainnet, eliminating the need for users to hold FLOW tokens initially.
2. **Hybrid custody**: Apps create in-app custodial blockchain accounts for users (via email/social login). Users can later link these to self-custody wallets.
3. **Gas-free EVM endpoint**: Developers can deploy a backend EVM endpoint where the EVM Gateway's service account covers all gas fees.
4. **WebAuthn & Passkey support** (Forte upgrade): Users can authorize transactions via smartphone biometrics without seed phrases while maintaining self-custody.

### Embedded Wallet SDK Support

| Provider | Flow EVM Support | Notes |
|----------|-----------------|-------|
| **MetaMask Embedded Wallets** | Yes | Dedicated docs for Flow integration (React, Node, Android, Unity) |
| **Dynamic** | Yes | Explicitly lists Flow as a supported chain |
| **Web3Auth** | Yes | Supports EVM-based Flow blockchain with specific documentation |
| **Privy** | Yes (via EVM) | Compatible with major EVM networks; works via Wagmi |
| **Gelato Smart Wallet** | Yes | Gasless transactions via EIP-7702, maintains EOA addresses |
| **Magic** | Yes | Specific support for walletless onboarding on Flow |

**Source**: [Walletless Onboarding](https://flow.com/account-linking), [Account Abstraction on Flow](https://www.quicknode.com/guides/other-chains/flow/account-abstraction-on-flow), [MetaMask Embedded Wallets for Flow](https://docs.metamask.io/embedded-wallets/connect-blockchain/evm/flow/), [Building Walletless Applications](https://developers.flow.com/build/guides/account-linking/child-accounts)

---

## 4. Developer Tools

### Solidity Contract Deployment

You can deploy Solidity contracts directly to Flow EVM with **no code changes**. Standard EVM development tools work out of the box.

### Hardhat

Fully supported. Setup:

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    flowTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      accounts: [process.env.DEPLOY_WALLET_1],
      chainId: 545,
    },
    flowMainnet: {
      url: "https://mainnet.evm.nodes.onflow.org",
      accounts: [process.env.DEPLOY_WALLET_1],
      chainId: 747,
    },
  },
  etherscan: {
    customChains: [
      {
        network: "flowTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
          browserURL: "https://evm-testnet.flowscan.io",
        },
      },
    ],
  },
};
```

Deploy: `npx hardhat ignition deploy ./ignition/modules/MyContract.ts --network flowTestnet`
Verify: `hardhat ignition verify chain-545 --include-unrelated-contracts`

**Important**: Use a traditional EOA wallet (MetaMask) for deployment. Flow Wallet COA accounts are not compatible with Hardhat's key management.

### Foundry

Fully supported. Flow provides specific guides for deploying ERC-20 tokens with Foundry.

### Remix IDE

Supported as an alternative deployment tool.

### Viem / Wagmi / Ethers.js

All fully compatible:

- **viem**: Requires version `2.9.6` or greater (contains Flow EVM network definitions)
- **wagmi**: Pre-configured chain definitions available via `@wagmi/core/chains` (`flowTestnet`, `flowMainnet`)
- **ethers.js**: Standard JSON-RPC compatibility

```typescript
import { http, createConfig } from '@wagmi/core';
import { flowTestnet } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

export const config = createConfig({
  chains: [flowTestnet],
  connectors: [injected()],
  transports: {
    [flowTestnet.id]: http(),
  },
});
```

### Contract Verification

Flowscan supports contract verification via the Etherscan API format, configurable in Hardhat.

### ERC-20, ERC-721, ERC-8004 Considerations

- **ERC-20 / ERC-721**: Deploy identically to Ethereum. OpenZeppelin contracts work without modification. The Cross-VM Bridge can automatically bridge these to Cadence equivalents.
- **ERC-8004**: As a standard EIP, ERC-8004 registries are deployable on Flow EVM since it supports all post-Pectra EVM features. No Flow-specific modifications needed.
- **WFLOW**: EVM smart contracts cannot directly interact with native FLOW (it's not ERC-20). Use WFLOW (`0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e`) as the ERC-20 wrapped equivalent, similar to WETH on Ethereum.

**Source**: [EVM Quickstart](https://developers.flow.com/build/evm/quickstart), [Viem & Wagmi](https://developers.flow.com/blockchain-development-tutorials/evm/frameworks/wagmi), [Flow EVM Guides](https://developers.flow.com/evm/guides)

---

## 5. DeFi Ecosystem

### Overview

Flow's DeFi ecosystem reached an all-time TVL of **$49.09M** in early 2025, with significant growth continuing.

### DEXs

| Protocol | Description |
|----------|-------------|
| **KittyPunch** | Fastest growing DeFi protocol on Flow; TVL ~$15.5M. Offers PunchSwap, StableKitty, AggroKitty. Uses WFLOW as base pair. |
| **Trado** | Consumer-focused DEX; $15.7M+ swapped volume, 43,000+ swaps |
| **Hitdex** | Trading app optimized for speed and low fees |
| **Izumi.finance** | Multi-chain DEX-as-a-Service |
| **FlowSwap** | UniswapV2/V3 fork infrastructure on Flow |

### Lending & Borrowing

| Protocol | Description |
|----------|-------------|
| **Increment.fi** | Composable DeFi: lending, borrowing, staking, exchange |
| **More.Markets** | Decentralized lending with dynamic interest rates |
| **Sturdy.Finance** | Interest-free borrowing using yield-bearing assets |

### Stablecoins on Flow EVM (Mainnet Addresses)

| Token | Address | Backing |
|-------|---------|---------|
| USDC | `0xF1815bd50389c46847f0Bda824eC8da914045D14` | Circle |
| USDT | `0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8` | Tether |
| USDF | `0x2aaBea2058b5aC2D339b163C6Ab6f2b6d53aabED` | PYUSD-backed (PayPal) |
| PYUSD0 | `0x99aF3EeA856556646C98c8B9b2548Fe815240750` | PayPal |
| USDC.e (Celer) | `0x7f27352D5F83Db87a5A3E00f4B07Cc2138D8ee52` | Celer-bridged USDC |

### Wrapped & Bridged Assets (Mainnet)

| Token | Address |
|-------|---------|
| WFLOW | `0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e` |
| WETH | `0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590` |
| WBTC | `0x717DAE2BaF7656BE9a9B01deE31d571a9d4c9579` |
| cbBTC | `0xA0197b2044D28b08Be34d98b23c9312158Ea9A18` |

### Staking Derivatives

| Token | Address |
|-------|---------|
| stFlow (Increment) | `0x5598c0652B899EB40f169Dd5949BdBE0BF36ffDe` |
| ankrFLOWEVM (Ankr) | `0x1b97100eA1D7126C4d60027e231EA4CB25314bdb` |

### Oracles

| Service | Address |
|---------|---------|
| Pyth | `0x2880aB155794e7179c9eE2e38200202908C17B43` |
| Stork | `0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62` |

### Bridges

| Bridge | URL | Supported Assets | Notes |
|--------|-----|-----------------|-------|
| Flow Bridge | https://bridge.flow.com | USDC, USDT, USDF | 24+ chains, ultra-low fees |
| Stargate | https://stargate.finance/bridge | USDC, USDT, USDF, ETH | LayerZero-powered |
| Celer cBridge | https://cbridge.celer.network | 150+ tokens | 40+ blockchains |
| Axelar | https://axelar.network | Various | 55+ blockchains |
| DeBridge | https://app.debridge.finance | 100+ tokens | 75+ blockchains |
| LayerZero | https://docs.layerzero.network | Various | Omnichain messaging |
| Hyperlane | https://usenexus.org | Various | Modular interoperability |
| Relay | https://relay.link/bridge | Various | 73+ chains |

**Source**: [DeFi on Flow 2025](https://flow.com/post/defi-on-flow-in-2025), [DeFi Contracts](https://developers.flow.com/ecosystem/defi-liquidity/defi-contracts), [Bridges](https://developers.flow.com/ecosystem/bridges), [Stablecoins FAQ](https://developers.flow.com/defi/faq)

---

## 6. Scheduled Transactions & Cadence Integration

### Scheduled Transactions (Forte Upgrade)

Introduced with the **Forte network upgrade** (October 2025), scheduled transactions are a **first-of-its-kind, fully native on-chain time scheduler**. They work like a cron job for blockchains without any external trigger or human intervention once programmed.

#### How They Work

- A `TransactionHandler` resource is created conforming to the `TransactionHandler` interface
- The handler is scheduled with a future Unix timestamp, computation limit, and priority level
- The protocol automatically executes the handler at the specified time
- No external keepers, oracles, or off-chain infrastructure required

#### Priority Levels

| Priority | Guarantee | Fee Multiplier |
|----------|-----------|---------------|
| High | Guaranteed execution in first block at scheduled time | 10x |
| Medium | Best-effort, as close as possible | 5x |
| Low | Opportunistic, when network capacity allows | 2x |

#### Cancellation

Transactions can be cancelled before execution with a **50% fee refund**.

#### Contract Addresses

- Testnet: `0x8c5303eaa26202d6` (Cadence address)
- Emulator: `0xf8d6e0586b0a20c7`

#### EVM Integration

Scheduled transactions are currently **Cadence-native functionality**. However, since Cadence transactions can wrap EVM calls, scheduled transactions can indirectly trigger EVM contract interactions via COAs.

### Cross-VM Bridge

The Cross-VM Bridge enables **atomic, permissionless bridging** of tokens between Cadence and EVM:

- **Cadence FungibleToken <-> ERC-20**
- **Cadence NonFungibleToken <-> ERC-721**

#### How It Works

- Uses an **escrow-and-mint** pattern
- All bridging must be initiated via Cadence transactions (not EVM transactions)
- Requires a Cadence-Owned Account (COA)
- Onboarding can happen automatically (deploying template contracts) or with custom associations

#### Bridge Contract Addresses

**Testnet:**
- Cadence: `0xdfc20aee650fcbdf`
- ERC20 Deployer: `0x4d45CaD104A71D19991DE3489ddC5C7B284cf263`
- ERC721 Deployer: `0x1B852d242F9c4C4E9Bb91115276f659D1D1f7c56`
- Bridge Escrow COA: `0x0000000000000000000000023f946ffbc8829bfd`

**Mainnet:**
- Cadence: `0x1e4aa0b87d10b141`
- Bridge Escrow COA: `0x00000000000000000000000249250a5c27ecab3b`

#### Cadence Arch Precompile

EVM contracts can call into Cadence via the **Cadence Arch** precompiled contract at `0x0000000000000000000000010000000000000001`:

- `FlowBlockHeight()` -- get the current Flow block height
- `VerifyCOAOwnershipProof()` -- verify COA ownership
- `revertibleRandom()` -- access Flow's secure on-chain randomness
- `getRandomSource()` -- get randomness source

**Source**: [Scheduled Transactions](https://developers.flow.com/build/cadence/advanced-concepts/scheduled-transactions), [Cross-VM Bridge](https://developers.flow.com/blockchain-development-tutorials/cross-vm-apps/vm-bridge), [VM Bridge Contracts](https://developers.flow.com/build/cadence/core-contracts/bridge), [Forte Upgrade](https://flow.com/forte)

---

## 7. Wallet SDKs for Web Apps

### FCL (Flow Client Library)

FCL is Flow's primary JavaScript SDK. It supports **both Cadence and EVM** interactions.

- **Package**: `@onflow/fcl` ([npm](https://www.npmjs.com/package/@onflow/fcl))
- **EVM support**: Via the FCL Ethereum Provider and Wagmi adapter

### FCL Wagmi Adapter

Bridges FCL-authenticated COA wallets into the wagmi/viem ecosystem:

- **Package**: `@onflow/fcl-wagmi-adapter` (npm)
- **Status**: Alpha
- Wraps `@onflow/fcl-ethereum-provider` as an EIP-1193 provider
- Allows COAs to appear as standard Ethereum wallets in wagmi apps
- Enables **multi-call write with one signature** for users with Cadence-compatible wallets

```typescript
import fcl from '@onflow/fcl';
import { fclWagmiConnector } from '@onflow/fcl-wagmi-adapter';

fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
});

const fclConnector = fclWagmiConnector();
```

### FCL RainbowKit Adapter

- **Package**: `@onflow/fcl-rainbowkit-adapter`
- Integrates Flow Wallet into RainbowKit wallet selector alongside MetaMask, WalletConnect, etc.

### MetaMask Support

Full support. Users add Flow EVM as a custom network:

| Setting | Mainnet | Testnet |
|---------|---------|---------|
| Network Name | Flow EVM | Flow EVM Testnet |
| RPC URL | `https://mainnet.evm.nodes.onflow.org` | `https://testnet.evm.nodes.onflow.org` |
| Chain ID | 747 | 545 |
| Symbol | FLOW | FLOW |
| Explorer | `https://evm.flowscan.io` | `https://evm-testnet.flowscan.io` |

Apps can programmatically trigger MetaMask's "Add Network" dialog.

### Flow Wallet Discovery

Flow has a wallet discovery service at `https://fcl-discovery.onflow.org/testnet/authn` (testnet) that allows apps to present available wallets to users.

### Other Wallet Integrations

- **WalletConnect**: Supported via standard wagmi connectors
- **Coinbase Wallet**: Compatible as an EVM wallet
- **Safe.Global**: Multi-sig wallet management available on Flow

**Source**: [FCL Wagmi Adapter](https://developers.flow.com/build/tools/clients/fcl-js/cross-vm/wagmi-adapter), [FCL Docs](https://developers.flow.com/build/tools/clients/fcl-js), [Cross VM Packages](https://developers.flow.com/build/tools/clients/fcl-js/cross-vm), [Update Existing Wagmi App](https://developers.flow.com/blockchain-development-tutorials/cross-vm-apps/add-to-wagmi), [Integrating MetaMask](https://developers.flow.com/blockchain-development-tutorials/evm/setup/integrating-metamask)

---

## 8. Testnet Details

### Configuration

| Property | Value |
|----------|-------|
| Chain ID | 545 |
| RPC | `https://testnet.evm.nodes.onflow.org` |
| WSS | `wss://testnet.evm.nodes.onflow.org` |
| Explorer | https://evm-testnet.flowscan.io |
| Currency | FLOW |

### Faucets

| Faucet | URL | Amount |
|--------|-----|--------|
| **Flow Faucet** (official) | https://faucet.flow.com/fund-account | Large amount (millions of txs worth) |
| **ETHGlobal Faucet** | https://ethglobal.com/faucet/flow-evm-testnet-545 | 0.05 FLOW/day |
| **ThirdWeb** | https://thirdweb.com/testnet | Via bridge |

### Testnet Considerations

- Use a MetaMask EOA (not Flow Wallet COA) for Hardhat/Foundry deployments
- Flow Wallet sponsors gas on testnet
- Testnet Flowscan supports contract verification
- Cross-VM Bridge contracts are deployed on testnet at `0xdfc20aee650fcbdf` (Cadence)

**Source**: [Faucets](https://developers.flow.com/ecosystem/faucets), [Flow Testnet](https://developers.flow.com/protocol/flow-networks/accessing-testnet)

---

## 9. Gas & Fees

### Fee Structure

Flow EVM uses a three-component fee model:

```
Transaction fee = surge x [inclusion fee + (execution effort x unit cost)]
```

| Component | Value | Description |
|-----------|-------|-------------|
| Surge | Dynamic | Adjusts based on network demand |
| Inclusion Fee | 1E-4 FLOW | Covers processing costs (byte size, signatures) |
| Execution Unit Cost | 4E-5 FLOW | Per computation unit |

### Practical Costs

| Operation | Approximate Fee |
|-----------|----------------|
| Cadence token transfer | ~0.000868 FLOW |
| EVM token transfer | ~0.002012 FLOW |
| Average transaction | < $0.01 |
| Typical stablecoin bridge fee | < $1.50 |

EVM gas (e.g., 21,000 for a basic transfer) is mapped to Flow computation units with a multiplier of 0.00005.

### Gas Sponsorship / Gasless Transactions

Flow offers **multiple paths to gasless transactions**:

1. **Flow Wallet auto-sponsorship**: Currently active on both testnet and mainnet -- the Flow Wallet pays all gas fees.

2. **Gas-free EVM endpoint**: Deploy your own EVM Gateway with `GAS_PRICE=0`. The service account covers fees.
   - Works with backends and embedded wallets
   - Does NOT work with frontend + traditional wallets (MetaMask)
   - Requires multiple keys on the service account for concurrent signing

3. **Gelato Smart Wallet**: EIP-7702 smart wallet that sponsors transactions via Gelato's relay infrastructure. Fund with USDC on mainnet.

4. **Native Cadence payer separation**: Cadence natively separates proposer/payer/signer roles, enabling any account to pay fees for any other account.

### Comparison to Other L1s

| Chain | Avg Transaction Fee | Block Time | TPS |
|-------|-------------------|------------|-----|
| Flow EVM | < $0.01 | ~1s | Hundreds-thousands |
| Ethereum L1 | $1-50+ | ~12s | ~15 |
| Solana | ~$0.00025 | ~0.4s | ~4,000 |

**Source**: [Fees](https://developers.flow.com/build/evm/fees), [Gasless Transactions](https://developers.flow.com/blockchain-development-tutorials/gasless-transactions), [Sponsored Transactions EVM Endpoint](https://developers.flow.com/blockchain-development-tutorials/gasless-transactions/sponsored-transactions-evm-endpoint), [Gelato Smart Wallet](https://developers.flow.com/blockchain-development-tutorials/integrations/gelato-sw)

---

## 10. Limitations & Considerations

### Opcode Differences

| Opcode | Ethereum Behavior | Flow EVM Behavior |
|--------|------------------|-------------------|
| `COINBASE` (`block.coinbase`) | Block beneficiary address | Current sequencer's fee wallet address |
| `PREVRANDAO` (`block.prevrandao`) | Beacon chain randomness | Flow protocol-generated random number; **NOT safe for security-sensitive use** -- use Cadence Arch precompile `revertibleRandom()` instead |

### Block & Finality

| Property | Value |
|----------|-------|
| Block time | ~1 second |
| Soft finality ("Executed") | ~4 seconds |
| Hard finality ("Sealed") | ~10-20 seconds |
| Max throughput | Hundreds-thousands TPS (scalable to 5x with parallel execution) |
| EVM block forks | **None** -- Flow's consensus prevents EVM block forks/uncle chains |

### Account Gotchas

- **COA vs EOA**: Flow Wallet creates COA accounts, not EOAs. COAs do not have exportable private keys compatible with Hardhat/Foundry. Use MetaMask EOAs for contract deployment via dev tools.
- **Account creation**: Unlike Ethereum, Flow requires an explicit account creation transaction. Accounts don't exist by default from key generation.
- **Storage model**: Data storage lives in user accounts, not in contracts (Cadence model). This doesn't affect pure EVM contracts.

### Block Hash Differences

RPC endpoints `eth_getBlockByNumber` and `eth_getBlockByHash` may produce different hashes than local go-ethereum calculations due to underlying block implementation variations.

### Account/State Proofs

The initial release does not support state proofs for account storage (`eth_getProof` may be limited).

### MEV Resistance

Flow is designed to ensure equitable access by resisting MEV. The pipelined multi-node architecture separates consensus from computation, preventing block builders from profiting at users' expense through transaction manipulation.

### Cross-VM Limitations

- All Cross-VM Bridge operations must be initiated from Cadence transactions (not EVM)
- EVM-to-Cadence bridging requires a COA resource
- Custom NFT associations, once registered, cannot be updated
- Custom associations are only available for NFTs (ERC-721), not fungible tokens (ERC-20)

### What Works Without Changes

- Standard Solidity contracts (ERC-20, ERC-721, ERC-1155, etc.)
- OpenZeppelin contract libraries
- Hardhat, Foundry, Remix IDE
- ethers.js, viem (v2.9.6+), wagmi
- MetaMask, Coinbase Wallet, WalletConnect
- TheGraph, Dune Analytics
- Standard EVM events and logs

**Source**: [How Flow EVM Works](https://developers.flow.com/build/evm/how-it-works), [Differences vs EVM](https://developers.flow.com/build/differences-vs-evm), [EVM on Flow](https://flow.com/upgrade/crescendo/evm)

---

## Key GitHub Repositories

- [flow-evm-gateway](https://github.com/onflow/flow-evm-gateway) -- EVM Gateway (JSON-RPC)
- [flow-evm-bridge](https://github.com/onflow/flow-evm-bridge) -- Cross-VM Bridge contracts
- [bridged-usdc](https://github.com/onflow/bridged-usdc) -- Bridged USDC standard

## Additional Resources

- [Flow Developer Portal](https://developers.flow.com)
- [Flow EVM Quickstart](https://developers.flow.com/build/evm/quickstart)
- [Cross-VM Apps Tutorial](https://developers.flow.com/blockchain-development-tutorials/cross-vm-apps)
- [DeFi on Flow](https://developers.flow.com/defi)
- [Flow Forte Upgrade](https://flow.com/forte)
- [Flowscan Explorer (Mainnet)](https://evm.flowscan.io)
- [Flowscan Explorer (Testnet)](https://evm-testnet.flowscan.io)

---

## 11. Airaa Integration Status

### Chain Config Added

Flow EVM (mainnet + testnet) has been added to all chain registries:

| Package | File | Status |
|---------|------|--------|
| x402-sdk-eth | `src/chains.ts` | Added `flow` (747) and `flow-testnet` (545) |
| backend | `src/config/chain-config.ts` | Added both networks + FLOW token type |
| backend | `src/x402-sdk/eth-utils.ts` | Added FLOW to token/network types |
| frontend | `lib/chains.ts` | Added to SUPPORTED_CHAINS + CHAIN_BY_NAME |
| frontend | `lib/chain-config.ts` | Added defaults, native tokens, explorer URLs, USDC addresses |
| frontend | `components/providers/ethereum-wallet-provider.tsx` | Added to wagmi config |
| mcp-client | `src/config.js` | Added chain + token addresses |
| contracts | `hardhat.config.ts` | Added flowTestnet + flowMainnet networks |

### Contract Deployment

Deployment script: `packages/contracts/scripts/deploy-flow.ts`

```bash
# Prerequisites
# 1. Get testnet FLOW from https://faucet.flow.com/fund-account
# 2. Set DEPLOY_PRIVATE_KEY in packages/backend/.env

# Compile contracts
cd packages/contracts && npx hardhat compile

# Deploy all contracts to Flow EVM Testnet
npx tsx scripts/deploy-flow.ts
```

Deploys: MockUSDC, IdentityRegistry, ReputationRegistry, ValidationRegistry

### Environment Setup

```bash
# Backend
X402_CHAIN=flow-testnet
X402_CURRENCY=USDC
X402_TOKEN_ADDRESS=<deployed_musdc_address>

# Frontend
NEXT_PUBLIC_X402_CHAIN=flow-testnet
NEXT_PUBLIC_X402_CURRENCY=USDC

# Contracts
DEPLOY_PRIVATE_KEY=0x...  # EOA key, NOT COA
```

### Key Addresses (Mainnet)

| Token | Address |
|-------|---------|
| USDC | `0xF1815bd50389c46847f0Bda824eC8da914045D14` |
| USDT | `0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8` |
| WFLOW | `0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e` |

### TODO

- [ ] Deploy contracts to Flow EVM Testnet
- [ ] Update testnet USDC address in all configs after deployment
- [ ] Test x402 payment flow on Flow EVM
- [ ] Test ERC-8004 identity registration on Flow
- [ ] Explore Flow Wallet Discovery integration for walletless onboarding
- [ ] Consider FCL RainbowKit adapter for improved Flow wallet support
- [ ] Test gasless transactions via Flow Wallet auto-sponsorship
