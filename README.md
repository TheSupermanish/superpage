<div align="center">

# InitPage

### **AI-Native Commerce Platform — The Era of AI Commerce**

*An AI-native commerce platform where autonomous agents and humans buy, sell, and monetize digital resources — running on its own Initia appchain with trustless on-chain payments.*

[![Initia](https://img.shields.io/badge/Initia-Appchain-00D4AA)](https://initia.xyz)
[![x402 Protocol](https://img.shields.io/badge/x402-Enabled-blue)](https://x402.org)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Agent%20Identity-purple)](https://eips.ethereum.org/EIPS/eip-8004)
[![MCP Protocol](https://img.shields.io/badge/MCP-12%20Tools-orange)](https://modelcontextprotocol.io)

**INITIATE Hackathon (Season 1) — AI & Tooling Track**

</div>

---

## Initia Hackathon Submission

- **Project Name**: InitPage

### Project Overview

InitPage is an AI-native commerce platform where autonomous AI agents and humans buy, sell, and monetize digital resources using on-chain USDC micro-payments. It solves the problem that AI agents cannot transact autonomously — they can research and plan but can't purchase APIs, datasets, or digital content without human intervention. Built for AI developers and content creators, InitPage provides a trustless marketplace where every payment is verified on-chain, agents build reputation through ERC-8004 identity, and the entire platform runs on its own Initia appchain for maximum revenue capture.

### Implementation Detail

- **The Custom Implementation**: InitPage implements a complete agent commerce stack: x402 HTTP 402 payment-gated resources, ERC-8004 on-chain agent identity (IdentityRegistry, ReputationRegistry, ValidationRegistry), A2A agent-to-agent protocol, MCP integration with 12 autonomous tools for Claude Desktop, and a multi-LLM CLI agent (Anthropic/OpenAI/Google). Smart contracts are deployed on our MiniEVM rollup (MockUSDC + 3 ERC-8004 registries). The marketplace supports APIs (proxied with live data), articles (markdown), and file downloads — each with different access models (pay-per-request for APIs, buy-once for articles/files).

- **The Native Feature**: InitPage uses **Auto-signing (Session Keys)** to enable frictionless agent transactions. When enabled, AI agents can purchase resources without requiring a wallet confirmation popup for each transaction — they sign once and trade freely. This is implemented via InterwovenKit's `enableAutoSign` configuration and exposed through a toggle in the wallet dropdown UI. The UX improvement is critical for autonomous agents: without session keys, every purchase would require human wallet approval, defeating the purpose of autonomous commerce.

### How to Run Locally

1. **Install dependencies and start the rollup:**
   ```bash
   brew install initia-labs/tap/weave
   weave gas-station setup && weave rollup launch  # Select EVM, chain-id "initpage"
   ```

2. **Deploy contracts:**
   ```bash
   pnpm install
   cd packages/contracts && pnpm compile && pnpm deploy:initia
   ```

3. **Start the application:**
   ```bash
   pnpm --filter backend dev   # Backend on http://localhost:1337
   pnpm --filter frontend dev  # Frontend on http://localhost:3000
   ```

4. **Connect and test:** Open http://localhost:3000, connect via InterwovenKit (social login or MetaMask), and explore the marketplace.

### Deployed Contracts (on InitPage Rollup)

| Contract | Address | Chain |
|----------|---------|-------|
| MockUSDC | `0x06d1a12b351cab22727515c1f4fec2544f42d751` | initpage |
| IdentityRegistry (ERC-8004) | `0x4c40c94680ad6a137e033356a3fccd6eb1b2d02d` | initpage |
| ReputationRegistry (ERC-8004) | `0x0aa5c9ddda3d7d0d3f3415d31fa495a3a1f83847` | initpage |
| ValidationRegistry (ERC-8004) | `0x1027c50cf44a931c41740fa2114c0c4f9719235e` | initpage |

---

## The Problem

AI agents can research, write, and plan — but they can't **buy** or **sell** anything. Premium APIs, gated content, and digital resources are locked behind human payment flows. There's no standard way for an autonomous agent to discover a resource, pay for it, or monetize its own creations.

## The Solution

InitPage is an **agent commerce chain** — a dedicated Initia appchain where AI agents and humans operate as both buyers and sellers in a trustless marketplace.

**Why an appchain?** Every transaction on InitPage generates revenue for the platform, not gas fees leaked to a shared chain. Session keys let agents transact autonomously without wallet popups. The Interwoven Bridge lets users deposit from any chain in the Initia ecosystem.

### How It Works

```
1. Agent discovers a resource on the marketplace       → search / list-resources
2. Agent previews the price (no payment)                → 402 Payment Required
3. Agent confirms with user                             → "Buy Weather API for $0.50 USDC?"
4. Agent pays USDC on the InitPage appchain               → on-chain ERC-20 transfer
5. Server verifies payment and delivers content         → 200 OK + data
6. Transaction recorded on-chain with receipt           → verifiable proof
```

### Agent Surfaces

- **Telegram Bot** — via OpenClaw gateway
- **Claude Desktop** — via MCP server (12 autonomous tools)
- **CLI Agent** — multi-LLM support (Anthropic, OpenAI, Google)
- **Web Marketplace** — Next.js frontend with InterwovenKit

---

## Why Initia

InitPage leverages Initia's unique capabilities that aren't available on shared chains:

| Feature | How InitPage Uses It |
|---------|----------------------|
| **Own Appchain** | Every marketplace transaction = platform revenue. No gas leakage to L1. |
| **Session Keys (AutoSign)** | AI agents transact autonomously — sign once, trade freely. No wallet popup per purchase. |
| **Interwoven Bridge** | Users deposit USDC from any Initia ecosystem chain. No manual bridging. |
| **Initia Usernames (.init)** | Agent profiles display `.init` names instead of hex addresses. |
| **Social Login (Privy)** | Users onboard with email/Google — no wallet setup needed. |
| **500ms Blocks** | Near-instant payment confirmation for real-time agent commerce. |

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   AGENT SURFACES                        │
│                                                         │
│   Telegram Bot    Claude Desktop    CLI Agent    Web    │
│   (OpenClaw)      (MCP Server)     (AI SDK)   (Next.js)│
│        │               │              │           │     │
│        └───────────────┼──────────────┘           │     │
│                        ▼                          ▼     │
│         ┌─────────────────────────────────────────┐     │
│         │     Express Backend (TypeScript)         │     │
│         │                                         │     │
│         │  x402 Gateway — payment-gated resources │     │
│         │  A2A Server  — agent-to-agent protocol  │     │
│         │  AP2 Handler — Google shopping mandates  │     │
│         │  ERC-8004    — agent identity & trust    │     │
│         │  MongoDB     — state & analytics         │     │
│         └──────────────┬──────────────────────────┘     │
│                        │                                 │
│         ┌──────────────┴──────────────────────────┐     │
│         │     Next.js Frontend (InterwovenKit)     │     │
│         │                                         │     │
│         │  Marketplace explorer                   │     │
│         │  Creator dashboard & profiles           │     │
│         │  Wallet: AutoSign + Bridge + .init      │     │
│         │  USDC Faucet                            │     │
│         └─────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   InitPage Appchain   │
              │  (Initia MiniEVM)     │
              │                       │
              │  MockUSDC (ERC-20)    │
              │  ERC-8004 Identity    │
              │  ERC-8004 Reputation  │
              │  ERC-8004 Validation  │
              │                       │
              │  Chain ID: superpage  │
              │  ~500ms blocks        │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Initia L1 Testnet   │
              │   (initiation-2)      │
              │                       │
              │  State proofs         │
              │  Interwoven Bridge    │
              │  Cross-chain deposits │
              └───────────────────────┘
```

---

## x402 Payment Flow

```
Agent                     InitPage                 InitPage Appchain
  │                          │                           │
  │  GET /x402/resource/X    │                           │
  │─────────────────────────>│                           │
  │                          │                           │
  │  402 {amount, recipient} │                           │
  │<─────────────────────────│                           │
  │                          │                           │
  │  USDC.transfer(to, amt)  │                           │
  │──────────────────────────┼──────────────────────────>│
  │                          │                           │
  │  GET /x402/resource/X    │     verify on-chain       │
  │  X-PAYMENT: {txHash}     │──────────────────────────>│
  │─────────────────────────>│<──────────────────────────│
  │                          │                           │
  │  200 OK + content        │                           │
  │<─────────────────────────│                           │
```

---

## ERC-8004: Trustless Agent Identity

InitPage implements [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) for on-chain agent identity and reputation:

- **IdentityRegistry** — ERC-721 based agent NFTs with metadata, wallet binding, and URI storage
- **ReputationRegistry** — On-chain feedback system with ratings, tags, and agent responses
- **ValidationRegistry** — Third-party validator attestations for agent capabilities

Agents build verifiable reputation through on-chain transactions, not self-reported claims.

---

## Features

### MCP Server (Claude Desktop) — 12 Tools

| Tool | Description |
|------|-------------|
| `x402_list_resources` | Browse all digital resources |
| `x402_search_resources` | Search resources by keyword |
| `x402_request` | Buy a paid resource (auto-pay on 402) |
| `x402_preview` | Check price without paying |
| `x402_wallet` | Check wallet balance |
| `x402_send` | Send USDC to any address |
| `x402_list_stores` | List Shopify stores |
| `x402_browse_products` | Browse store products |
| `x402_buy` | Full Shopify checkout with USDC |
| `x402_order_status` | Check order status |
| `x402_list_orders` | List completed orders |
| `x402_discover` | Probe any URL for x402 support |

### A2A Server (Agent-to-Agent)

4 skills discoverable at `/.well-known/agent.json`:
- **purchase** — Product purchase via x402
- **resource-access** — Digital resource access
- **ap2-shopping** — Google Agent Payments Protocol flow
- **erc8004-trust** — On-chain trust & reputation queries

### Web Marketplace

- **Explore** — Browse resources with type filters and pricing
- **Creator Dashboard** — Manage resources, view orders, analytics
- **Creator Profiles** — Public pages with .init username display and tipping
- **Faucet** — Mint test USDC on the InitPage appchain

---

## Monorepo Structure

```
initpage/
├── .initia/
│   └── submission.json         Hackathon submission metadata
├── packages/
│   ├── frontend/               Next.js 16 + React 19 + InterwovenKit
│   ├── backend/                Express + MongoDB + A2A + AP2 + x402
│   ├── mcp-client/             MCP server for Claude Desktop (12 tools)
│   ├── ai-agent/               Standalone AI agent (multi-LLM)
│   ├── x402-sdk-eth/           Payment verification SDK
│   └── contracts/              Solidity contracts + deploy scripts
├── scripts/
│   ├── fix-genesis.py          Fix rollup genesis balances
│   └── patch-cosmjs.js         Postinstall fix for cosmjs-types exports
└── package.json                pnpm workspace root
```

---

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm 10+
- MongoDB running on localhost
- [Weave CLI](https://docs.initia.xyz/developers/developer-guides/tools/clis/weave-cli) for rollup

### 1. Clone & Install

```bash
git clone <repo-url>
cd initpage
pnpm install
```

### 2. Start the Rollup

```bash
# Install weave CLI
brew install initia-labs/tap/weave

# Setup gas station (one-time)
weave gas-station setup

# Fund gas station with INIT from faucet:
# https://faucet.testnet.initia.xyz/

# Launch rollup
weave rollup launch
# Select: Testnet → EVM → chain-id "superpage"
```

### 3. Deploy Contracts

```bash
# Set your deployer private key
export WALLET_PRIVATE_KEY=0x...

# Compile and deploy all contracts
cd packages/contracts
pnpm compile
pnpm deploy:initia
```

### 4. Environment Setup

```bash
cp packages/backend/.env.sample packages/backend/.env
# Edit with your wallet key and contract addresses
```

Key variables:
```bash
X402_CHAIN=initia-testnet
WALLET_PRIVATE_KEY=0x...
X402_RECIPIENT_ADDRESS=0x...
JWT_SECRET=your-secret
```

### 5. Start Development

```bash
./dev.sh
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:1337

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Appchain** | Initia MiniEVM (Solidity, 500ms blocks) |
| **Frontend** | Next.js 16, React 19, InterwovenKit v2.5.1, Tailwind CSS 4 |
| **Backend** | Express, TypeScript, MongoDB |
| **Smart Contracts** | Solidity 0.8.24 (MockUSDC, ERC-8004 registries) |
| **Wallet** | InterwovenKit (AutoSign, Bridge, .init usernames, social login) |
| **Agent Protocols** | x402, A2A (JSON-RPC 2.0), AP2, MCP, ERC-8004 |
| **AI** | Vercel AI SDK (Anthropic, OpenAI, Google) |

---

## Market Understanding

**Target Users:**
- AI agent developers who need their agents to transact autonomously
- Content creators who want to monetize APIs, datasets, and guides
- Developers building agent-to-agent commerce workflows

**Competitive Landscape:**
- Traditional marketplaces (Gumroad, RapidAPI) require human payment flows
- Existing crypto payment solutions don't support agent-native discovery and purchasing
- No platform combines x402 + ERC-8004 + agent commerce on a dedicated appchain

**Revenue Model:**
- Platform fee on every marketplace transaction (captured at the appchain level)
- Zero gas leakage — every transaction on InitPage generates protocol revenue
- Creator fees for premium listings and analytics

---

## License

MIT
