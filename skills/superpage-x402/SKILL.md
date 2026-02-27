---
name: superpage-x402
description: Discover, browse, and purchase digital resources and physical products from the SuperPage marketplace using x402 USDC payments on Base
version: 2.0.0
metadata:
  openclaw:
    requires:
      env:
        - SUPERPAGE_SERVER
        - WALLET_PRIVATE_KEY
      bins:
        - node
    primaryEnv: SUPERPAGE_SERVER
    emoji: "🛒"
    homepage: https://github.com/TheSupermanish/superpage
---

# SuperPage x402 — AI-Native Marketplace

SuperPage is a marketplace where AI agents and humans coexist as both buyers and sellers. Agents can autonomously discover, evaluate, pay for, and access digital resources and physical products.

## What You Can Do

### Discovery
- **x402_discover** — Probe any URL to check if it supports x402 payments
- **x402_list_resources** — Browse all public resources (APIs, files, articles) with prices
- **x402_list_stores** — List all connected Shopify stores
- **x402_browse_products** — Search product catalogs in any store

### Purchase
- **x402_buy** — Full checkout flow: create order, pay USDC on Base, confirm order
- **x402_request** — Make any HTTP request; if 402 is returned, auto-pay and retry

### Wallet
- **x402_wallet** — Check your ETH and USDC balance, wallet address, network
- **x402_send** — Send USDC to any wallet address (peer-to-peer)

### Order Tracking
- **x402_order_status** — Get order details and delivery status

## How Payments Work

SuperPage uses the x402 protocol (HTTP 402 Payment Required):

1. Request a resource → server returns `402` with payment requirements
2. Agent sends USDC payment on-chain to the specified recipient
3. Agent retries the request with payment proof in `X-PAYMENT` header
4. Server verifies payment on-chain and serves the content

All payments are in USDC on Base. Verification is on-chain — trustless and transparent.

## Example Workflows

### Buy access to a premium API
```
1. x402_list_resources (type: "api") → see available APIs with prices
2. x402_request (url: resource_url) → auto-pays if 402, returns API response
```

### Shop from a Shopify store
```
1. x402_list_stores → find stores
2. x402_browse_products (storeId: "shopify/store-name") → see products
3. x402_buy (storeId, items, email, shippingAddress) → complete purchase
```

### Check your budget before shopping
```
1. x402_wallet → see USDC balance
2. x402_list_resources → compare prices
3. x402_request → purchase what fits your budget
```

## Resource Types

| Type | Description | Price Range |
|------|-------------|-------------|
| API | Paywalled API endpoints — pay per request | $0.01 — $1.00 |
| File | Digital files — datasets, documents, models | $0.50 — $50.00 |
| Article | Premium written content — guides, research | $0.10 — $10.00 |
| Shopify | Physical/digital products from real stores | Varies |

## Configuration

Set these environment variables:

- `SUPERPAGE_SERVER` — SuperPage backend URL (e.g., `http://localhost:3001`)
- `WALLET_PRIVATE_KEY` — Your Ethereum private key (0x-prefixed) with USDC on Base
- `X402_CHAIN` — Network name (default: `base`)
- `X402_CURRENCY` — Payment token (default: `USDC`)
- `MAX_AUTO_PAYMENT` — Maximum auto-payment in USDC (default: `10.00`)

## Safety

- Payments are capped at `MAX_AUTO_PAYMENT` — the agent will refuse to pay more without confirmation
- All transactions are verified on-chain before content is served
- Agent identity and reputation tracked via ERC-8004
- No payment is made without explicit tool invocation
