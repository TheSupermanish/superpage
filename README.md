<div align="center">

# SuperPage

### **The x402 Payment Skill for the Agent Internet**

*An OpenClaw skill that lets autonomous AI agents discover, preview, confirm, and pay for digital resources and physical products using on-chain USDC micro-payments.*

[![Coinbase x402 Winner](https://img.shields.io/badge/Coinbase_x402-Winner-0052FF)](https://x402.org)
[![Flow Testnet](https://img.shields.io/badge/Flow-Testnet-00EF8B)](https://flow.com)
[![x402 Protocol](https://img.shields.io/badge/x402-Enabled-blue)](https://x402.org)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-orange)](https://openclaw.ai)
[![MCP Protocol](https://img.shields.io/badge/MCP-Integrated-purple)](https://modelcontextprotocol.io)

**Coinbase x402 Track Winner — SURGE x OpenClaw Hackathon 2026**
**Now targeting PL Genesis Flow Hackathon — Flow Track + Existing Code + ERC-8004**

[Live Demo](https://superpa.ge) · [Telegram Bot](https://t.me/HeySuperioBot) · [Documentation](#documentation)

</div>

---

## Hackathon Submission

**Track:** Autonomous Payments & Monetized Skills

**What it is:** An OpenClaw skill + marketplace platform that gives any AI agent the ability to spend USDC to access premium APIs, digital content, and Shopify products — all through a trustless x402 payment flow running on Flow EVM Testnet.

**Built With:**
- **OpenClaw** — Local-first agent runtime (Telegram bot + skill system)
- **x402 Protocol** — HTTP 402 payment-gated resources
- **Flow EVM** — EVM L2 for on-chain USDC payments
- **A2A Protocol** — Agent-to-agent communication (JSON-RPC 2.0)
- **AP2** — Google's Agent Payments Protocol (mandate-based shopping)
- **MCP** — Model Context Protocol (Claude Desktop integration)
- **ERC-8004** — On-chain agent identity & reputation

---

## The Problem

AI agents can research, write, and plan — but they can't **buy** or **sell** anything. Premium APIs, gated content, and e-commerce are locked behind human payment flows. There's no standard way for an autonomous agent to discover a resource, pay for it, or monetize its own creations.

## The Solution

SuperPage is an AI-native commerce platform where **agents and humans coexist as both buyers AND sellers**.

**Agents as Buyers** — discover resources, preview prices, confirm with users, pay USDC on-chain, and access content autonomously.

**Agents as Creators** — AI agents can generate content (articles, datasets, guides, code templates) and list them on the marketplace with a price. Other agents and humans pay to access them. An AI agent can write a guide, publish it on SuperPage, and earn USDC every time someone buys it — fully autonomous creator economy.

The platform gives agents a complete payment workflow:

```
1. Agent searches the marketplace          → list-resources / search
2. Agent previews a resource price         → preview (no payment yet)
3. Agent shows price and asks to confirm   → "Buy Weather API for $0.50 USDC?"
4. User says yes                           → "yes"
5. Agent pays and delivers content         → request (pays + returns data)
6. Agent shows receipt with tx hash        → on-chain proof
```

This works across three surfaces:
- **Telegram** — via OpenClaw gateway (`@HeySuperioBot`)
- **Claude Desktop** — via MCP server (12 autonomous tools)
- **CLI** — via standalone AI agent (`pnpm agent`)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     AGENT SURFACES                               │
│                                                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐      │
│   │  Telegram    │   │   Claude    │   │  Standalone CLI  │      │
│   │  (OpenClaw)  │   │   Desktop   │   │  (superio)       │      │
│   └──────┬──────┘   └──────┬──────┘   └───────┬─────────┘      │
│          │                 │                   │                  │
│     OpenClaw Skill      MCP Server        AI SDK (Vercel)        │
│     (CLI exec)         (stdio/JSON-RPC)   (Anthropic/OpenAI/     │
│                                            Google)               │
│          └─────────────────┼───────────────────┘                 │
│                            │                                     │
│                            ▼                                     │
│              ┌──────────────────────────┐                        │
│              │  superpage-x402.js       │                        │
│              │  (CLI + MCP dual-mode)   │                        │
│              │                          │                        │
│              │  • preview (price only)  │                        │
│              │  • request (pay + fetch) │                        │
│              │  • list-resources        │                        │
│              │  • search                │                        │
│              │  • wallet                │                        │
│              │  • send                  │                        │
│              │  • buy (Shopify)         │                        │
│              └────────────┬─────────────┘                        │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SUPERPAGE PLATFORM                           │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│   │ x402 Gateway │  │  A2A Server  │  │  AP2 Mandates    │     │
│   │ (HTTP 402)   │  │  (JSON-RPC)  │  │  (Shopping Flow) │     │
│   └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘     │
│          │                 │                    │                │
│   ┌──────┴─────────────────┴────────────────────┴──────────┐    │
│   │              Express Backend (TypeScript)               │    │
│   │  • Resource marketplace (26+ items)                     │    │
│   │  • Shopify store integration                            │    │
│   │  • Payment verification (on-chain)                      │    │
│   │  • ERC-8004 identity & reputation                       │    │
│   │  • MongoDB state management                             │    │
│   └──────────────────────┬─────────────────────────────────┘    │
│                          │                                       │
│   ┌──────────────────────┴─────────────────────────────────┐    │
│   │              Next.js Frontend                           │    │
│   │  • Creator dashboard & profiles                         │    │
│   │  • Resource explorer & marketplace                      │    │
│   │  • Faucet for test USDC                                 │    │
│   │  • Wallet connect (RainbowKit)                          │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Flow EVM Testnet     │
                │                       │
                │  • USDC payments      │
                │  • Chain ID: 545      │
                │  • ~1s block time     │
                │  • On-chain receipts  │
                └───────────────────────┘
```

---

## Features

### OpenClaw Skill (Telegram Agent)

The `superpage-x402` skill runs inside OpenClaw and connects to Telegram via `@HeySuperioBot`. The agent can:

- **Search** — `"find me a weather API"` → searches the marketplace
- **Preview** — shows resource name, description, and price before paying
- **Confirm** — asks `"Want me to buy Weather API for $0.50 USDC?"` and waits
- **Pay** — executes on-chain USDC transfer only after user confirms
- **Deliver** — returns the resource content + transaction receipt

Commands available via CLI exec:
```
list-resources          List all available resources
search '{"q":"weather"}'  Search by keyword
preview '{"url":"..."}'   Get price without paying
request '{"url":"..."}'   Pay and access resource
wallet                    Check ETH + USDC balance
send '{"to":"0x...","amount":"1.00"}'  Send USDC
list-stores              List Shopify stores
browse-products '{"storeId":"..."}'  Browse store products
buy '{"storeId":"...","items":[...]}'  Full checkout
```

### MCP Server (Claude Desktop)

12 tools exposed via Model Context Protocol:

| Tool | Description |
|------|-------------|
| `x402_discover` | Probe any URL for x402 payment support |
| `x402_list_resources` | Browse all digital resources |
| `x402_search_resources` | Search resources by keyword |
| `x402_request` | Access/buy a paid resource (auto-pay on 402) |
| `x402_list_stores` | List Shopify stores |
| `x402_browse_products` | Browse products in a store |
| `x402_buy` | Full Shopify checkout with USDC |
| `x402_wallet` | Check wallet balance |
| `x402_send` | Send USDC to any address |
| `x402_order_status` | Check order status |
| `x402_list_orders` | List all orders |
| `x402_list_order_intents` | List pending order intents |

### A2A Server (Agent-to-Agent)

Discoverable at `/.well-known/agent.json` with:
- **4 skills**: purchase, resource-access, ap2-shopping, erc8004-trust
- **3 extensions**: x402 payment, AP2 mandates, ERC-8004 identity
- JSON-RPC 2.0 endpoint at `/a2a`

### AP2 Shopping Flow (Google Agent Payments Protocol)

Full mandate-based shopping:
```
IntentMandate (what the agent wants to buy)
    → CartMandate (itemized cart with W3C PaymentRequest)
        → PaymentMandate (on-chain tx hash as proof)
            → PaymentReceipt (verified settlement)
```

### Standalone AI Agent

Multi-LLM CLI agent (`packages/ai-agent`) supporting Anthropic, OpenAI, and Google:
```bash
pnpm agent                          # Interactive mode
pnpm agent "buy me a weather API"   # One-shot mode
```

### Web Platform

- **Explore** — Browse all resources with prices
- **Creator Dashboard** — Manage resources, view orders, analytics
- **Faucet** — Mint test USDC on Flow EVM
- **Wallet Connect** — RainbowKit integration
- **Creator Profiles** — Public pages with tipping

---

## Monorepo Structure

```
superpage/
├── packages/
│   ├── frontend/          Next.js 16 + React 19 + Tailwind 4
│   ├── backend/           Express + MongoDB + A2A + AP2 + x402
│   ├── mcp-client/        MCP server + CLI (superpage-x402.js)
│   ├── ai-agent/          Standalone AI agent (Anthropic/OpenAI/Google)
│   ├── x402-sdk-eth/      Payment verification SDK
│   └── contracts/         Smart contract ABIs
├── dev.sh                 Start all services
└── package.json           pnpm workspace root
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 8+
- MongoDB
- A wallet private key with USDC on Flow EVM Testnet

### 1. Clone & Install

```bash
git clone https://github.com/AIProjects402/superpage.git
cd superpage
pnpm install
```

### 2. Environment Setup

```bash
cp .env.sample .env
```

Key environment variables:

```bash
# Server
PORT=3001
MONGODB_URI=mongodb://localhost:27017/x402

# Flow EVM Testnet
X402_CHAIN=flow-testnet
RPC_URL=https://sepolia.base.org
USDC_ADDRESS=0xa059e27967e5a573a14a62c706ebd1be75333f9a

# Wallet
WALLET_PRIVATE_KEY=0x...
X402_RECIPIENT_ADDRESS=0x...

# Auth
JWT_SECRET=your-secret

# LLM (for ai-agent)
LLM_PROVIDER=anthropic          # or openai, google
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start Development

```bash
./dev.sh
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Payment Service**: x402 verification

### 4. OpenClaw Setup (Telegram Agent)

Install the SuperPage x402 skill:

```bash
# Copy skill to OpenClaw workspace
cp -r ~/.openclaw/skills/superpage-x402 ~/.openclaw/skills/

# Start OpenClaw gateway
openclaw gateway
```

Then message `@HeySuperioBot` on Telegram.

### 5. Claude Desktop Setup

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "superpage-x402": {
      "command": "node",
      "args": ["/path/to/superpage/packages/mcp-client/superpage-x402.js"],
      "env": {
        "SUPERPAGE_SERVER": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "0x...",
        "X402_CHAIN": "flow-testnet",
        "X402_CURRENCY": "USDC",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}
```

Restart Claude Desktop, then ask: *"List all resources on SuperPage"*

### 6. Standalone AI Agent

```bash
pnpm agent                          # Interactive REPL
pnpm agent "show me all resources"  # One-shot
```

---

## x402 Payment Flow

```
Agent                    SuperPage                 Flow EVM
  │                         │                          │
  │  GET /x402/resource/X   │                          │
  │────────────────────────>│                          │
  │                         │                          │
  │  402 Payment Required   │                          │
  │  {amount, recipient,    │                          │
  │   chainId, payScheme}   │                          │
  │<────────────────────────│                          │
  │                         │                          │
  │  (preview mode stops    │                          │
  │   here — returns price  │                          │
  │   to user for confirm)  │                          │
  │                         │                          │
  │  USDC.transfer(to, amt) │                          │
  │─────────────────────────┼─────────────────────────>│
  │                         │                          │
  │                         │        tx confirmed      │
  │                         │<─────────────────────────│
  │                         │                          │
  │  GET /x402/resource/X   │                          │
  │  X-PAYMENT: {txHash}    │                          │
  │────────────────────────>│                          │
  │                         │  verify on-chain         │
  │                         │─────────────────────────>│
  │                         │<─────────────────────────│
  │  200 OK + content       │                          │
  │<────────────────────────│                          │
```

---

## Agent Discovery

### A2A Agent Card

```bash
curl http://localhost:3001/.well-known/agent.json
```

```json
{
  "name": "x402-merchant-agent",
  "url": "http://localhost:3001/a2a",
  "version": "0.2.1",
  "skills": [
    { "id": "purchase", "name": "Product Purchase" },
    { "id": "resource-access", "name": "Resource Access" },
    { "id": "ap2-shopping", "name": "AP2 Shopping Flow" },
    { "id": "erc8004-trust", "name": "On-Chain Trust & Reputation" }
  ],
  "extensions": [
    { "uri": "urn:x-a2a:extension:x402-payment" },
    { "uri": "https://github.com/google-agentic-commerce/ap2/v1" },
    { "uri": "urn:eip:8004:trustless-agents" }
  ]
}
```

### ERC-8004 Registration

```bash
curl http://localhost:3001/.well-known/agent-registration.json
```

Returns the agent's on-chain identity, service endpoints (A2A, MCP, Web), and trust registrations per the ERC-8004 spec.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Agent Runtime** | OpenClaw | Local-first agent execution, Telegram integration |
| **Frontend** | Next.js 16, React 19, Tailwind 4 | Marketplace, dashboard, creator profiles |
| **Backend** | Express, TypeScript, MongoDB | API, A2A server, AP2 handler, x402 gateway |
| **MCP Client** | Node.js, viem | Claude Desktop integration (12 tools) |
| **AI Agent** | Vercel AI SDK | Multi-LLM CLI agent (Anthropic/OpenAI/Google) |
| **SDK** | @super-x402/sdk | Payment verification middleware |
| **Blockchain** | Flow EVM, viem | USDC payments, on-chain verification |
| **E-commerce** | Shopify Admin API | Product sync, order creation |
| **Identity** | ERC-8004 | Agent identity, reputation, validation |
| **Wallet** | RainbowKit, wagmi | Browser wallet connection |

### Protocols

| Protocol | Purpose | Spec |
|----------|---------|------|
| **x402** | HTTP 402 payment-gated resources | [x402.org](https://x402.org) |
| **A2A** | Agent-to-agent discovery & communication | JSON-RPC 2.0 |
| **AP2** | Mandate-based agent shopping | [google-agentic-commerce/ap2](https://github.com/google-agentic-commerce/ap2) |
| **MCP** | LLM tool integration | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| **ERC-8004** | On-chain agent identity | [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) |

---

## Network Details

| Property | Value |
|----------|-------|
| **Network** | Flow EVM Testnet |
| **Chain ID** | 545 |
| **RPC URL** | `https://testnet.evm.nodes.onflow.org` |
| **USDC Contract** | `0x291b030d596cf505f774426d8de7c946ce5af7a5` |
| **Token** | USDC (6 decimals) |
| **Block Time** | ~1 second |
| **Explorer** | `https://evm-testnet.flowscan.io` |

---

## API Endpoints

```bash
# Health
GET  /health

# Resources
GET  /x402/resources                    # List all resources
GET  /x402/resource/:slug               # Access resource (402 if unpaid)

# Stores
GET  /x402/stores                       # List Shopify stores
GET  /x402/store-products               # Browse products
POST /x402/checkout                     # Shopify checkout

# Agent Discovery
GET  /.well-known/agent.json            # A2A Agent Card
GET  /.well-known/agent-registration.json  # ERC-8004 Registration

# A2A
POST /a2a                               # JSON-RPC 2.0 endpoint

# MCP
POST /mcp/universal                     # MCP server endpoint
```

---

## Demo

### Telegram Agent (`@HeySuperioBot`)

1. **"What resources are available?"** — lists all 26+ resources with prices
2. **"Search for weather APIs"** — finds matching resources
3. **"Buy the Weather API"** — previews price, asks to confirm, pays on-chain, delivers content
4. **"Check my wallet"** — shows ETH and USDC balances

### AI as Creator (Agent-Generated Content)

An AI agent can autonomously create and sell content on the marketplace:

1. Agent writes a guide, dataset, or code template
2. Agent lists it on SuperPage with a title, description, and price
3. Other agents and humans discover it via search or browse
4. Buyers pay USDC → content delivered → creator agent earns revenue

This creates a fully autonomous creator economy where AI agents generate value, price it, and earn from both human and agent customers — no human intervention required.

### Claude Desktop (MCP)

1. **"List all resources on SuperPage"** — calls `x402_list_resources`
2. **"Access the Advanced Git Workflows guide"** — calls `x402_request`, pays, returns content
3. **"What's my balance?"** — calls `x402_wallet`

### CLI Agent

```bash
$ pnpm agent "buy me a weather API"

  SuperPage Agent v1.0.0
  Wallet: 0x20a0...4F72  |  1,009,894.98 USDC
  Model: anthropic/claude-sonnet-4-20250514
  Network: flow-testnet

  > buy me a weather API

  I found the Weather API for $0.50 USDC. Want me to purchase it?
  > yes
  Paid 0.50 USDC — tx: 0x01e59f01...
  Here's the weather data: { temperature: 72, ... }
```

---

## Hackathon Track Alignment

### Track 5: Autonomous Payments & Monetized Skills

SuperPage is an **x402-integrated OpenClaw skill** that charges USDC fees per resource access:

- **Preview + Confirm flow** — agent shows price, waits for user approval, then pays
- **Micro-payments** — resources priced from $0.01 to $5.00 USDC
- **12 MCP tools** — full marketplace operations from any LLM
- **Revenue for creators** — on-chain USDC payments directly to resource creators
- **Reusable skill** — any OpenClaw agent can install `superpage-x402` and start paying for resources

### Also applicable:

- **Track 1: Agent Execution & Real World Actions** — autonomous shopping, wallet management, Shopify checkout
- **Track 2: Agent-Powered Productivity & DeFi Tools** — portfolio tracking, payment automation
- **Track 3: Developer Infrastructure** — x402 SDK, MCP server, A2A protocol implementation

---

## Security

- **Spending caps** — `MAX_AUTO_PAYMENT` limits per-transaction spend
- **Confirmation flow** — agent previews price and asks before paying
- **Non-custodial** — agent controls its own private key
- **On-chain verification** — every payment verified against Flow EVM
- **Time-bounded** — 15-minute payment windows
- **Audit trail** — transaction hash, amount, timestamp, recipient logged

---

## Documentation

- **Docs site**: http://localhost:3000/docs
  - Getting Started
  - SDK Reference
  - API Documentation
  - Shopify Integration
  - MCP Setup
  - OpenClaw Skills
- **Agent Discovery**: `GET /.well-known/agent.json`
- **ERC-8004 Registration**: `GET /.well-known/agent-registration.json`

---

## Links

| Resource | URL |
|----------|-----|
| **Live Demo** | [superpa.ge](https://superpa.ge) |
| **Telegram Bot** | [@HeySuperioBot](https://t.me/HeySuperioBot) |
| **GitHub** | [AIProjects402/superpage](https://github.com/AIProjects402/superpage) |
| **x402 Protocol** | [x402.org](https://x402.org) |
| **OpenClaw** | [openclaw.ai](https://openclaw.ai) |
| **MCP Docs** | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| **ERC-8004** | [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) |
| **AP2 Spec** | [google-agentic-commerce/ap2](https://github.com/google-agentic-commerce/ap2) |
| **Flow EVM** | [base.org](https://base.org) |

---

<div align="center">

**SuperPage** — The x402 Payment Skill for the Agent Internet

Built for SURGE × OpenClaw Hackathon 2026

</div>
