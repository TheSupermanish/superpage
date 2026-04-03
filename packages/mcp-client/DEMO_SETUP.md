# Airaa MCP Client - Demo Setup

## Quick Setup for Claude Desktop (Localhost Demo)

### 1. Find Your Claude Desktop Config

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### 2. Add Airaa MCP Server

Open `claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "superpage-x402": {
      "command": "node",
      "args": [
        "/Users/beyond/Desktop/projects/superpay-x402-eth/packages/mcp-client/superpage-x402.js"
      ],
      "env": {
        "SUPERPAGE_SERVER": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "REDACTED_WALLET_PRIVATE_KEY",
        "X402_CHAIN": "initia-testnet",
        "X402_CURRENCY": "USDC",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}
```

**Important:** Update the `args` path to match your actual project location!

### 3. Restart Claude Desktop

Close and reopen Claude Desktop completely.

### 4. Verify Connection

In Claude Desktop, try these prompts:

```
Can you show me what's available on Airaa?
```

```
List all resources on Airaa
```

```
What stores are connected to Airaa?
```

## Available MCP Tools

Once configured, Claude can use these tools:

- ✅ `x402_discover` - Discover platform overview
- ✅ `x402_list_resources` - Browse APIs, files, articles
- ✅ `x402_list_stores` - See connected Shopify stores
- ✅ `x402_browse_products` - Browse store products
- ✅ `x402_buy` - Purchase resources with crypto
- ✅ `x402_request` - Access purchased resources
- ✅ `x402_wallet` - Check wallet balance
- ✅ `x402_send` - Send crypto payments
- ✅ `x402_order_status` - Check order status

## Demo Workflow

### Example 1: Discover and Browse
```
Agent: "Show me what's available on Airaa"
(Uses x402_discover)

Agent: "List all API resources under $1"
(Uses x402_list_resources, filters by price)
```

### Example 2: Purchase Resource
```
Agent: "I want to buy the Weather API"
(Uses x402_list_resources to find it)
(Uses x402_buy to purchase)
(Shows transaction hash)
```

### Example 3: Check Wallet
```
Agent: "What's my USDC balance?"
(Uses x402_wallet)

Agent: "Do I have enough to buy the premium API?"
(Checks balance, compares to price)
```

## Troubleshooting

### Tools Not Showing Up
1. Make sure Claude Desktop is completely restarted
2. Check the path to `superpage-x402.js` is correct
3. Verify Node.js is installed: `node --version`

### Connection Errors
1. Ensure local server is running: `./dev.sh`
2. Check server is accessible: `curl http://localhost:3001/health`
3. Verify backend and frontend are both running

### Payment Errors
1. Check wallet has USDC balance
2. Verify network is `initia-testnet`
3. Ensure WALLET_PRIVATE_KEY is set correctly

## Test Data

The local database has these demo users:
- `open-fans` - Example creator
- `open-weather` - Weather data provider
- `x402` - Platform demo store
- `skill-master` - AI skills marketplace
- `data-oracle` - Data services
- `code-sage` - Code resources
- `crypto-scholar` - Crypto education
- `ai-architect` - AI architecture resources

## For Production

When ready to use production server:

```json
{
  "env": {
    "SUPERPAGE_SERVER": "http://20.168.79.130",
    "WALLET_PRIVATE_KEY": "your-production-wallet-key",
    "X402_CHAIN": "initia-testnet",
    "X402_CURRENCY": "USDC",
    "MAX_AUTO_PAYMENT": "10.00"
  }
}
```

## Security Note

⚠️ **DEMO ONLY**: The wallet private key shown above is for demonstration purposes only.

For production:
- Use a dedicated agent wallet
- Fund it with limited USDC
- Set MAX_AUTO_PAYMENT to a safe limit
- Monitor transactions regularly
