# Initia Rollup Deployment -- Complete Research

## Table of Contents
1. [Key Terminology](#key-terminology)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Configuration Options](#configuration-options)
5. [Infrastructure & Costs](#infrastructure--costs)
6. [EVM (MiniEVM) Specifics](#evm-minievm-specifics)
7. [Interwoven Bridge](#interwoven-bridge)
8. [Hackathon Requirements](#hackathon-requirements)
9. [Testnet vs Mainnet](#testnet-vs-mainnet)
10. [Quick Reference Commands](#quick-reference-commands)

---

## Key Terminology

| Term | Meaning |
|------|---------|
| **Initia L1** | The base Layer 1 blockchain. Uses CometBFT consensus + MoveVM. Orchestration layer for security, liquidity, routing, interoperability. Chain ID: `interwoven-1` (mainnet). |
| **Minitia** | "Mini Initia" -- a Layer 2 rollup deployed on top of Initia L1. VM-agnostic (EVM, MoveVM, WasmVM). Does NOT have its own consensus -- relies on L1. |
| **OPinit Stack** | Initia's optimistic rollup framework (inspired by Optimism Bedrock). Built for Cosmos SDK. Has fraud proofs + rollback. |
| **OPHost** | L1-side module: finalizes output proposals from Minitias, resolves disputes. |
| **OPChild** | L2-side module: handles execution of messages and withdrawal events on the rollup. |
| **OPinit Bots** | Off-chain agents (Executor, Challenger, BatchSubmitter) that relay between L1 and L2. |
| **Weave** | The CLI tool for deploying and managing Initia rollups. This is your primary tool. |
| **MiniEVM** | EVM-flavored Minitia rollup. Full Solidity/EVM compatibility with Cosmos precompiles. |
| **MiniWasm** | CosmWasm-flavored Minitia rollup. |
| **MiniMove** | MoveVM-flavored Minitia rollup. |
| **Anvil Credits** | Free infrastructure credits from Initia for chain deployment on mainnet (first 2-3 months). Hackathon prize. |
| **InterwovenKit** | React library (`@initia/interwovenkit-react`) for wallet connection and transaction handling. Required for hackathon. |
| **Minitswap** | DEX on L1 that enables instant L2->L1 withdrawals (bypasses 7-day optimistic challenge period). |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Celestia DA                    │
│              (Data Availability Layer)           │
└───────────────────────┬─────────────────────────┘
                        │ TIA payments for blob submission
┌───────────────────────┴─────────────────────────┐
│                  Initia L1                       │
│  CometBFT + MoveVM + DPoS                       │
│  Modules: OPHost, Bridge, BatchInbox,            │
│           L2OutputOracle, InitiaDEX              │
│  Chain ID: interwoven-1 (mainnet)                │
└───┬───────────┬───────────┬─────────────────────┘
    │           │           │
    │ IBC       │ IBC       │ IBC
    │           │           │
┌───┴───┐  ┌───┴───┐  ┌───┴───┐
│MiniEVM│  │MiniWasm│ │MiniMove│  <-- Your rollup is one of these
│(L2)   │  │(L2)    │ │(L2)    │
│OPChild│  │OPChild │ │OPChild │
└───────┘  └────────┘ └────────┘

Off-chain bots (run by you):
  - Executor: bridges, submits state to L1, submits DA to Celestia
  - Challenger: validates Executor proposals
  - IBC Relayer: relays messages between L1 and L2
```

**Key architectural facts:**
- Minitias are Cosmos SDK chains WITHOUT staking/consensus modules
- A single sequencer (you) produces blocks
- L1 validators only get involved during disputes
- Settlement: txs sequenced on L2, batched to L1 + Celestia
- 500ms block times, 10,000+ TPS per rollup
- Fraud proof window: ~7 days for standard withdrawals (Minitswap bypasses this)

---

## Step-by-Step Deployment

### Prerequisites

- **OS**: Linux or macOS
- **Go**: v1.23+ (for building from source) / v1.24+ (for MiniEVM)
- **LZ4**: compression tool
  - macOS: `brew install lz4`
  - Ubuntu: `apt-get install lz4`
- **Node.js + npm**: required for IBC relayer
- **INIT tokens**: for OPinit bot bridging transactions
- **TIA tokens**: for Celestia data submissions

### Step 1: Install Weave CLI

```bash
# macOS (recommended for hackathon)
brew install initia-labs/tap/weave

# Linux AMD64
VERSION=$(curl -s https://api.github.com/repos/initia-labs/weave/releases/latest | grep '"tag_name":' | cut -d'"' -f4 | cut -c 2-)
wget https://github.com/initia-labs/weave/releases/download/v$VERSION/weave-$VERSION-linux-amd64.tar.gz
tar -xvf weave-$VERSION-linux-amd64.tar.gz

# Linux ARM64
VERSION=$(curl -s https://api.github.com/repos/initia-labs/weave/releases/latest | grep '"tag_name":' | cut -d'"' -f4 | cut -c 2-)
wget https://github.com/initia-labs/weave/releases/download/v$VERSION/weave-$VERSION-linux-arm64.tar.gz
tar -xvf weave-$VERSION-linux-arm64.tar.gz

# From source
git clone https://github.com/initia-labs/weave.git
cd weave
VERSION=$(curl -s https://api.github.com/repos/initia-labs/weave/releases/latest | grep '"tag_name":' | cut -d'"' -f4 | cut -c 2-)
git checkout tags/v$VERSION
make install
```

**Latest version:** v0.3.8 (as of March 2026)

### Step 2: Initialize Gas Station Account

```bash
weave init
```

This will:
- Generate a new account OR import an existing mnemonic
- This account funds the OPinit bots and Celestia DA submissions

**Fund the account with:**
- **INIT tokens** -- for bridging transactions between L1 and your rollup
- **TIA tokens** -- for submitting data blobs to Celestia

**How to get tokens:**
- Testnet faucet: https://faucet.testnet.initia.xyz/
- Testnet app: https://app.testnet.initia.xyz/
- Faucet rate limit: once per 8-24 hours (check current limit)
- You receive both GAS and INIT tokens from the faucet

### Step 3: Launch the Rollup

```bash
weave rollup launch
```

**Interactive configuration prompts:**

| Option | Description | Example |
|--------|-------------|---------|
| VM Type | EVM, MoveVM, or WasmVM | `minievm` |
| Chain ID | Your rollup's unique chain ID | `airaa-1` |
| Gas Token Denom | Default gas token denomination | `umin` |
| DA Layer | Data Availability layer choice | Celestia |
| Price Oracle | Enable/disable oracle price feeds | enable |
| Genesis Accounts | Addresses with initial token balances | Your address |

**CRITICAL:** Add at least 1 address you control to genesis accounts, otherwise you cannot transact on your chain.

**Navigation tips during setup:**
- `Ctrl+T` -- show tooltips for current option
- `Ctrl+Z` -- go back to previous step

**Output after successful launch:**
```
Rollup Endpoints:
  REST API:  http://localhost:1317
  RPC:       http://localhost:26657
  RPC-WS:    ws://localhost:26657/websocket
  gRPC:      http://localhost:9090
```

A magic link is also provided to add your rollup to InitiaScan (the block explorer).

**At this point your rollup is running!** But for full functionality (bridging, oracles, etc.), continue with steps 4-6.

### Step 4: Start OPinit Executor Bot

The Executor handles: bridging L1<->L2, state output submission to L1, DA data submission to Celestia.

```bash
weave opinit init
# Select "Executor" when prompted
# Configure: listen address (default: localhost:3000), L1 RPC, rollup chain ID, rollup RPC, gas denom

weave opinit start executor
```

### Step 5: Start OPinit Challenger Bot

The Challenger validates Executor proposals and ensures output validity.

```bash
weave opinit init
# Select "Challenger" when prompted
# Configure: listen address (default: localhost:3001)

weave opinit start challenger
```

**Production note:** Run Challenger on a separate machine from the Executor for security.

### Step 6: Start IBC Relayer

The IBC Relayer enables: oracle price updates, IBC bridging, Minitswap compatibility.

```bash
weave relayer init
# Select "Local Rollup" for your deployment
# Subscribe to transfer and nft-transfer channels (minimal setup)
# Choose key setup (recommend: use challenger key)
```

The relayer runs via the rapid-relayer:
```bash
git clone https://github.com/initia-labs/rapid-relayer
cd rapid-relayer
npm install
cp ~/.relayer/config.json ./config.json
npm start
```

Or start via weave:
```bash
weave relayer start
```

---

## Configuration Options

### VM Options

| VM | Binary | Best For | Language |
|----|--------|----------|---------|
| **MiniEVM** | `minitiad` | EVM dApps, Solidity contracts, existing Ethereum tooling | Solidity |
| **MiniWasm** | `minitiad` | CosmWasm contracts | Rust (CosmWasm) |
| **MiniMove** | `minitiad` | Move contracts (same as Initia L1) | Move |

**For this hackathon: MiniEVM is likely the best choice** if you want maximum tooling compatibility (Hardhat, Foundry, ethers.js, MetaMask, etc.).

### Block Time
- **Default: 500ms** (fixed across all Minitias)
- 10,000+ TPS capacity
- NOT configurable to 100ms (that's not an Initia feature based on current docs)

### Gas Configuration
- Gas token denomination is set during `weave rollup launch`
- Rollups can customize their gas fee model
- Example denom: `umin` (micro-min)

### DA Layer Options
- **Celestia** (primary, requires TIA tokens)
- The BatchInbox module on L1 can also serve as DA (fallback)

### Ports (Default)

| Service | Port |
|---------|------|
| REST API | 1317 |
| RPC (Tendermint/CometBFT) | 26657 |
| RPC WebSocket | 26657/websocket |
| gRPC | 9090 |
| JSON-RPC (EVM only) | 8545 (standard Ethereum) |
| OPinit Executor | 3000 |
| OPinit Challenger | 3001 |

---

## Infrastructure & Costs

### Hardware Requirements (Estimated)
Initia doesn't publish exact minimums, but based on Cosmos SDK chains:
- **CPU**: 4+ cores recommended
- **RAM**: 16GB+ recommended
- **Storage**: SSD, 100GB+ (grows with chain usage)
- **Network**: Stable connection required for bot operations

For hackathon / dev: your Mac Mini M4 should be sufficient to run everything locally.

### Running Costs
- **INIT tokens**: needed for gas station account (OPinit bot operations)
- **TIA tokens**: needed for Celestia DA submissions (costs depend on data volume)
- **Anvil Credits**: hackathon winners get 2-3 months free chain deployment on mainnet
- **Testnet**: free (use faucet tokens)

### What You Need to Run
Minimum 4 processes running simultaneously:
1. **Rollup node** (the chain itself)
2. **OPinit Executor** (bridges + DA submissions)
3. **OPinit Challenger** (validates proposals)
4. **IBC Relayer** (message relay)

For development/hackathon, you can start with just the rollup node (step 3) and add bots later for full functionality.

---

## EVM (MiniEVM) Specifics

### What MiniEVM Gives You
- Full Solidity smart contract deployment
- Standard Ethereum JSON-RPC API (51 supported methods)
- Works with: MetaMask, Hardhat, Foundry, ethers.js, viem, wagmi
- Cosmos precompiles to read L1 state and send Cosmos transactions
- Single unified token standard (all tokens appear as ERC20)
- IBC-bridged assets accessible as ERC20

### Supported JSON-RPC Methods (Key Ones)
- `eth_sendRawTransaction` -- submit transactions
- `eth_call` -- read-only contract calls
- `eth_estimateGas` -- gas estimation
- `eth_getBalance`, `eth_getCode`, `eth_getStorageAt`
- `eth_blockNumber`, `eth_getBlockByHash`, `eth_getBlockByNumber`
- `eth_gasPrice`, `eth_feeHistory`
- `eth_getLogs`, `eth_newFilter`
- `debug_traceTransaction` -- debugging
- `cosmos_cosmosTxHashByTxHash` -- cross-chain hash lookup

### NOT Supported
- `eth_sendTransaction` (use `eth_sendRawTransaction` instead)
- `eth_sign`, `eth_signTypedData`
- `personal_*` namespace (no server-side key management)

### Deploying Solidity Contracts
Since MiniEVM supports standard JSON-RPC, use normal Ethereum tools:

**Hardhat config example:**
```javascript
module.exports = {
  networks: {
    minievm: {
      url: "http://localhost:8545",  // or your rollup's JSON-RPC endpoint
      chainId: YOUR_EVM_CHAIN_ID,
      accounts: [PRIVATE_KEY]
    }
  }
};
```

**Foundry:**
```bash
forge create --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY src/Contract.sol:Contract
```

### Cosmos Precompiles
MiniEVM adds custom precompiles that let EVM contracts:
- Read Cosmos chain state (balances, IBC data)
- Query Connect oracle data (price feeds)
- Send Cosmos transactions from Solidity

---

## Interwoven Bridge

### How It Works
1. **Deposits (L1 -> L2)**: Instant. User calls `initialize_deposit` on L1 Bridge module. The Executor bot relays it to L2.
2. **Standard Withdrawals (L2 -> L1)**: ~7 day challenge period. User initiates on L2, Executor submits output root to L1, must wait for challenge period.
3. **Fast Withdrawals via Minitswap**: Instant. Uses IBC + Minitswap DEX on L1 to swap L2 tokens back to L1 without waiting.

### Trust Model
- The native bridge has NO additional trust assumptions beyond the two chains
- Uses optimistic fraud proofs: challengers can delete invalid output proposals
- Dispute resolution happens via L1 governance (validators vote)

### Bridge Components
- **OPHost** (on L1): manages bridge creation, output root storage
- **OPChild** (on L2): manages deposits, constructs withdrawal Merkle trees
- **Executor Bot**: relays deposits/withdrawals between layers
- **Challenger Bot**: monitors and validates all bridge operations

### IBC Channels
Your rollup connects to L1 via IBC channels for:
- `transfer` -- token transfers
- `nft-transfer` -- NFT transfers
- Oracle price updates
- Minitswap compatibility

---

## Hackathon Requirements (INITIATE)

### Mandatory Requirements
1. **Deployed as its own appchain/rollup** -- must have a valid rollup chain ID
2. **Use InterwovenKit** (`@initia/interwovenkit-react`) for wallet connection and/or transaction handling
3. **Implement at least ONE Initia-native feature:**
   - Auto-signing / Session UX
   - Interwoven Bridge
   - Initia Usernames (.init)

### Submission Files
- `.initia/submission.json` -- required metadata file
- `README.md` -- human-readable summary
- Demo video

### Evidence Required
- Valid rollup chain ID
- Transaction link OR deployment link

### Prizes
- **Anvil Credits**: 2-3 months free chain deployment on mainnet
- **EIR (Entrepreneur in Residence)**: fundraising support, investor intros
- **Mac Mini hardware**: for top 2-3 teams at MVP Demo Day (mid-hackathon)
- **Mentorship**: direct from Initia team + ecosystem builders
- **Infrastructure support**: deployment + scaling help

### Auto-Signing (Session UX) Implementation
```tsx
import { useInterwovenKit } from '@initia/interwovenkit-react'

const { autoSign, submitTxBlock } = useInterwovenKit()

// Enable auto-signing for a chain
await autoSign.enable(chainId)
// User signs ONE tx granting authz + feegrant to ghost wallet
// All subsequent txs are auto-signed

// Send auto-signed transaction
const { transactionHash } = await submitTxBlock({ messages, fee })

// Check status
const isEnabled = autoSign.isEnabledByChain[chainId]
const expiration = autoSign.expiredAtByChain[chainId]

// Disable
await autoSign.disable(chainId)
```

---

## Testnet vs Mainnet

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| L1 Chain ID | `initiation-2` (or current) | `interwoven-1` |
| Tokens | Free from faucet | Real INIT + TIA |
| Faucet | https://faucet.testnet.initia.xyz/ | N/A |
| Explorer | scan.testnet.initia.xyz | scan.initia.xyz |
| App | app.testnet.initia.xyz | app.initia.xyz |
| RPC | rpc.testnet.initia.xyz:443 | rpc.initia.xyz:443 |
| Cost | Free | INIT for gas, TIA for DA |
| For hackathon | Start here | Deploy later with Anvil Credits |

**Recommendation for hackathon:** Start on testnet, get everything working, then deploy to mainnet if you win Anvil Credits.

---

## Quick Reference Commands

```bash
# Install
brew install initia-labs/tap/weave

# Initialize gas station
weave init

# Launch rollup (interactive)
weave rollup launch

# Setup OPinit Executor
weave opinit init        # select Executor
weave opinit start executor

# Setup OPinit Challenger
weave opinit init        # select Challenger
weave opinit start challenger

# Setup IBC Relayer
weave relayer init
weave relayer start

# Check weave version
weave version

# Upgrade weave
weave upgrade

# Disable analytics
weave analytics disable

# Get help
weave --help
weave rollup --help
weave opinit --help
weave relayer --help
```

---

## Key GitHub Repositories

- **Weave CLI**: https://github.com/initia-labs/weave (v0.3.8)
- **Initia L1**: https://github.com/initia-labs/initia
- **OPinit Stack**: https://github.com/initia-labs/OPinit (v1.3.0)
- **MiniEVM**: https://github.com/initia-labs/minievm
- **MiniWasm**: https://github.com/initia-labs/miniwasm
- **Rapid Relayer**: https://github.com/initia-labs/rapid-relayer
- **Initia Registry**: https://github.com/initia-labs/initia-registry

---

## Critical Path for Hackathon

1. `brew install initia-labs/tap/weave`
2. `weave init` (fund with testnet INIT from faucet)
3. `weave rollup launch` (choose MiniEVM, set chain ID, add your address to genesis)
4. Deploy your Solidity contracts via Hardhat/Foundry to the local JSON-RPC endpoint
5. Build frontend with InterwovenKit for wallet connection
6. Implement auto-signing or bridge feature
7. Set up OPinit bots + relayer for full bridge functionality
8. Create `.initia/submission.json` + demo video
9. Submit on DoraHacks
