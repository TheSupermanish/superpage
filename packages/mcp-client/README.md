# SUPERPAGE x402 - MCP Client for AI Agents

An MCP (Model Context Protocol) client that enables AI agents like Claude to shop and pay using USDC stablecoin on Initia testnet.

## Features

- 💳 **x402 Payments** - Automatic payment handling for paid APIs and content
- 🛒 **Shopify Integration** - Browse and purchase from x402-enabled stores
- 🔍 **Resource Discovery** - Find paid APIs, files, and articles
- 💰 **Wallet Management** - Check balances, send USDC

## Installation

```bash
cd packages/mcp-client
npm install
```

## Configuration for Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "superpage-x402": {
      "command": "node",
      "args": ["/absolute/path/to/superpay-x402-eth/packages/mcp-client/superpage-x402.js"],
      "env": {
        "SUPERPAGE_SERVER": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "0xYourPrivateKeyHere",
        "X402_CHAIN": "initia-testnet",
        "X402_CURRENCY": "USDC",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPERPAGE_SERVER` | SuperPage backend server URL | `http://localhost:3001` |
| `WALLET_PRIVATE_KEY` | Ethereum private key (with 0x prefix) | Required for payments |
| `X402_CHAIN` | Network (`initia-testnet`, `mainnet`, `sepolia`, etc.) | `initia-testnet` |
| `X402_CURRENCY` | Payment currency (`USDC`, `USDT`, `DAI`) | `USDC` |
| `MAX_AUTO_PAYMENT` | Maximum USDC amount agent can pay automatically | `10.00` |

## Available Tools

### Discovery
- `x402_discover` - Check if a URL supports x402 payments
- `x402_list_resources` - List all public resources (APIs, files, articles)

### Shopping
- `x402_list_stores` - List available stores
- `x402_browse_products` - Browse products in a store
- `x402_buy` - Purchase products with USDC

### Payments
- `x402_request` - Make paid API requests (auto-pays on 402)
- `x402_wallet` - Check ETH and USDC balances
- `x402_send` - Send USDC to any address

### Orders
- `x402_order_status` - Get order details

---

## Test Examples for Claude

Copy these prompts into Claude to test the MCP client:

### 1. Check Wallet Balance
```
Check my x402 wallet balance
```

### 2. List Available Stores
```
Show me the available stores on x402
```

### 3. Browse Products
```
Browse products in the store "shopify/yf8vem-uw"
```

### 4. List Resources
```
List all available x402 resources
```

### 5. Check Payment Requirements
```
Discover if http://localhost:3001/x402/resource/look-at-the-bright-side supports x402 payments
```

### 6. Access a Paid Resource
```
Access the resource "look-at-the-bright-side" on x402 (it costs 0.01 USDC)
```

### 7. Buy a Product
```
Buy the "Example Perfume - Premium" (variant ID: gid://shopify/ProductVariant/43703572398215) from store "shopify/yf8vem-uw" for test@example.com with shipping to:
- Name: John Doe
- Address: 123 Test St
- City: San Francisco
- State: CA
- Postal Code: 94102
- Country: US
```

---

## Database Data for Testing

### Stores
| ID | Name | Domain |
|----|------|--------|
| `shopify/yf8vem-uw` | x402 | x402-shop.myshopify.com |

### Products (Store: shopify/yf8vem-uw)
| Name | Price | Variant ID |
|------|-------|------------|
| Example Hat - Grey | $17.99 | `gid://shopify/ProductVariant/43703572365447` |
| Example Perfume - Premium | $0.01 | `gid://shopify/ProductVariant/43703572398215` |
| Example T-Shirt - Small | $0.01 | `gid://shopify/ProductVariant/43703572267143` |

### Resources
| Name | Type | Price (USDC) | Slug |
|------|------|--------------|------|
| Look at the bright side | article | 0.01 | `look-at-the-bright-side` |
| Test Resource | file | 12.99 | `test-resource` |

---

## Example Claude Conversations

### Conversation 1: Explore and Buy
```
User: What stores are available on x402?

Claude: [Uses x402_list_stores]
I found 1 store:
- **x402** (shopify/yf8vem-uw) - Accepts USDC on Ethereum

User: What products do they have?

Claude: [Uses x402_browse_products]
Here are the products:
1. Example Hat - Grey - $17.99 USDC
2. Example Perfume - Premium - $0.01 USDC
3. Example T-Shirt - Small - $0.01 USDC

User: Buy the perfume for me, send to John Doe, 123 Main St, NYC, NY 10001, US. Email: john@example.com

Claude: [Uses x402_buy]
✅ Order confirmed!
- Order ID: xxx
- Total: 0.01 USDC
- Payment TX: 0x...
```

### Conversation 2: Access Paid Content
```
User: Can you access the article "Look at the bright side" on x402?

Claude: [Uses x402_discover, then x402_request]
This article requires 0.01 USDC payment. I'll pay and access it...

✅ Paid 0.01 USDC
TX: 0x...

Here's the content: [article content]
```

---

## Token Information

**USDC** is a USD-backed stablecoin:
- Contract: `0x06d1a12b351cab22727515c1f4fec2544f42d751`
- Decimals: 6
- Network: Initia Testnet
- Chain ID: 3981013683081008
- RPC: `http://0.0.0.0:8545`
- Explorer: `https://scan.testnet.initia.xyz`

---

## Troubleshooting

### "No wallet configured"
Set the `WALLET_PRIVATE_KEY` environment variable with your Ethereum private key.

### "Payment failed: insufficient funds"
Make sure your wallet has enough USDC tokens and ETH for gas fees.

### "Failed to connect to server"
Ensure the x402 backend is running at the URL specified in `SUPERPAGE_SERVER`.

---

## License

MIT
