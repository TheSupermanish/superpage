# SuperPage Skills

SuperPage is an AI-native marketplace where agents can discover, purchase, and access digital resources and physical products using cryptocurrency payments.

**Base URL:** `http://localhost:3001` (local) | `http://20.168.79.130` (production)

**Payment:** USDC on Flow EVM Testnet (chain ID 545)

---

## 🔍 Discovery Skills

### discover_platform
Get an overview of what's available on SuperPage

**Method:** `GET /api/explore`

**Returns:**
- Featured creators
- Available resources (APIs, files, articles)
- Connected Shopify stores
- Featured products

**Example Response:**
```json
{
  "success": true,
  "data": {
    "creators": [...],
    "resources": [...],
    "stores": [...],
    "products": [...]
  }
}
```

### list_resources
Browse all available digital resources

**Method:** `GET /x402/resources`

**Parameters:**
- `type` (optional): Filter by type (`api`, `file`, `article`, `shopify`)
- `limit` (optional): Number of results (default: 50)

**Returns:** Array of resources with:
- `id`: Resource identifier
- `name`: Resource name
- `description`: What it does
- `type`: Resource type
- `priceUsdc`: Price in USDC
- `accessCount`: Number of purchases
- `creator`: Creator information

**Example:**
```bash
curl http://localhost:3001/x402/resources?type=api&limit=10
```

### list_stores
Get all connected Shopify stores

**Method:** `GET /x402/stores`

**Returns:** Array of stores with:
- `id`: Store identifier
- `name`: Store name
- `domain`: Shopify domain
- `productCount`: Number of products

### browse_products
Browse products from a specific store or all stores

**Method:** `GET /x402/store-products`

**Parameters:**
- `storeId` (optional): Filter by specific store
- `limit` (optional): Number of results (default: 30)

**Returns:** Array of products with:
- `id`: Product identifier
- `name`: Product name
- `description`: Product description
- `price`: Price in USD
- `currency`: Currency (USDC)
- `image`: Product image URL
- `inventory`: Stock available

### get_creator_profile
View a creator's profile and their offerings

**Method:** `GET /@{username}`

**Parameters:**
- `username`: Creator's username (e.g., `skill-master`)

**Returns:**
- Creator profile (name, bio, avatar, social links)
- Their resources
- Their store products
- Statistics (sales, revenue)

**Example:**
```bash
curl http://localhost:3001/@skill-master
```

---

## 💰 Payment & Purchase Skills

### purchase_resource
Buy access to a digital resource (API, file, or article)

**Method:** POST to resource endpoint with payment

**Process:**
1. Request resource → Receive 402 Payment Required
2. Get payment requirements from response
3. Send USDC to specified address
4. Include transaction hash in `X-Payment-Hash` header
5. Retry request → Receive content

**Payment Requirements Format:**
```json
{
  "amount": "1.50",
  "currency": "USDC",
  "recipient": "0x...",
  "resourceId": "resource_id",
  "chainId": 545
}
```

**Example Flow:**
```bash
# Step 1: Request resource
curl http://localhost:3001/x402/resource/premium-api
# Returns: 402 Payment Required with payment details

# Step 2: Send USDC payment on-chain
# (Use viem/ethers to send USDC transfer)

# Step 3: Access resource with payment proof
curl http://localhost:3001/x402/resource/premium-api \
  -H "X-Payment-Hash: 0x..."
# Returns: Resource content
```

### purchase_product
Buy a physical/digital product from a Shopify store

**Method:** `POST /x402/purchase/product`

**Body:**
```json
{
  "productId": "product_variant_id",
  "quantity": 1,
  "shippingAddress": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "San Francisco",
    "province": "CA",
    "country": "US",
    "zip": "94102"
  },
  "paymentHash": "0x..."
}
```

**Returns:**
```json
{
  "success": true,
  "orderId": "order_123",
  "status": "pending",
  "total": "25.00"
}
```

### check_order_status
Check the status of a product order

**Method:** `GET /x402/orders/{orderId}`

**Returns:**
```json
{
  "orderId": "order_123",
  "status": "completed",
  "items": [...],
  "total": "25.00",
  "createdAt": "2024-02-14T10:00:00Z"
}
```

---

## 💳 Wallet & Balance Skills

### check_wallet_balance
Check ETH and USDC balance

**On-Chain Query (via viem/ethers):**
```javascript
// ETH Balance
const ethBalance = await publicClient.getBalance({
  address: walletAddress
})

// USDC Balance
const usdcBalance = await publicClient.readContract({
  address: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
  abi: erc20ABI,
  functionName: 'balanceOf',
  args: [walletAddress]
})
```

**Returns:** Balance in wei/smallest unit (divide by 10^6 for USDC)

### send_payment
Send cryptocurrency to another address

**On-Chain Transaction:**
```javascript
// Send USDC
const hash = await walletClient.writeContract({
  address: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8', // USDC
  abi: erc20ABI,
  functionName: 'transfer',
  args: [recipientAddress, amountInSmallestUnit]
})
```

---

## 🔑 Authentication Skills

### connect_wallet
Authenticate using Ethereum wallet

**Method:** `POST /api/auth/wallet`

**Process:**
1. Get nonce: `GET /api/auth/nonce?address={walletAddress}`
2. Sign message with wallet
3. Submit signature: `POST /api/auth/wallet`

**Body:**
```json
{
  "address": "0x...",
  "signature": "0x...",
  "message": "nonce_message"
}
```

**Returns:**
```json
{
  "token": "jwt_token",
  "user": {
    "walletAddress": "0x...",
    "username": "user123"
  }
}
```

---

## 📊 Creator Skills

### create_resource
Create a new digital resource for sale

**Method:** `POST /api/resources`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Premium Weather API",
  "description": "Real-time weather data worldwide",
  "type": "api",
  "priceUsdc": 0.50,
  "url": "https://api.example.com/weather",
  "isPublic": true
}
```

### connect_shopify_store
Connect a Shopify store to accept crypto payments

**Method:** OAuth flow via `/api/shopify/oauth/start`

**Process:**
1. Redirect to Shopify OAuth
2. Callback receives access token
3. Store syncs automatically
4. Products available for crypto purchase

---

## 🤖 Agent-to-Agent (A2A) Protocol

SuperPage supports the Agent-to-Agent Protocol (AP2) for autonomous agent interactions.

### get_agent_card
Discover agent capabilities

**Method:** `GET /.well-known/agent.json`

**Returns:** AgentCard with:
- Agent identity
- Supported protocols
- Available services
- Payment methods

### send_message
Send a message to the agent (JSON-RPC 2.0)

**Method:** `POST /a2a`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": {
    "content": "I want to buy premium-api",
    "metadata": {
      "sender": "agent_id"
    }
  },
  "id": 1
}
```

---

## 🌐 Blockchain Details

**Network:** Flow EVM Testnet
- **Chain ID:** 545
- **RPC:** `https://testnet.evm.nodes.onflow.org`
- **Explorer:** `https://evm-testnet.flowscan.io`
- **Gas:** FLOW (~$0.01 per tx)
- **Native Token:** FLOW
- **Faucet:** `https://faucet.flow.com/fund-account`

**USDC Contract:** `0x291b030d596cf505f774426d8de7c946ce5af7a5`
- **Decimals:** 6
- **Standard:** ERC-20 (MockUSDC)

---

## 📖 Resource Types

### API Resources
Paywalled API endpoints - pay per request or subscription

**Example:** Weather API, Stock Data, AI Model Access

### File Resources
Digital files - documents, images, datasets, models

**Example:** Research Papers, Datasets, Software Downloads

### Article Resources
Premium written content - guides, tutorials, research

**Example:** Technical Guides, Market Research, Tutorials

### Shopify Products
Physical or digital products from connected stores

**Example:** T-shirts, Coffee, Digital Art, Software Licenses

---

## 🔒 Security & Best Practices

### Payment Verification
All payments are verified on-chain before granting access:
1. Transaction must be to correct recipient
2. Amount must match or exceed price
3. Token must be correct (USDC)
4. Transaction must be confirmed

### Rate Limiting
- Discovery endpoints: 100 requests/minute
- Purchase endpoints: 10 requests/minute
- Authenticated endpoints: Higher limits

### Error Handling
Standard HTTP status codes:
- `200` - Success
- `402` - Payment Required
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

---

## 💡 Example Agent Workflows

### Workflow 1: Discover and Purchase API Access
```javascript
// 1. Discover available APIs
const resources = await fetch('http://localhost:3001/x402/resources?type=api')
const apis = await resources.json()

// 2. Select an API
const weatherAPI = apis.resources.find(r => r.name.includes('Weather'))

// 3. Request access (get payment requirements)
const response = await fetch(`http://localhost:3001/x402/resource/${weatherAPI.id}`)
// Returns 402 with payment details

// 4. Pay with USDC
const hash = await sendUSDC(paymentDetails.recipient, paymentDetails.amount)

// 5. Access API with payment proof
const data = await fetch(
  `http://localhost:3001/x402/resource/${weatherAPI.id}`,
  { headers: { 'X-Payment-Hash': hash } }
)
```

### Workflow 2: Browse and Buy Product
```javascript
// 1. List available stores
const stores = await fetch('http://localhost:3001/x402/stores')

// 2. Browse products
const products = await fetch('http://localhost:3001/x402/store-products?limit=20')

// 3. Purchase product
const order = await fetch('http://localhost:3001/x402/purchase/product', {
  method: 'POST',
  body: JSON.stringify({
    productId: selectedProduct.id,
    quantity: 1,
    shippingAddress: {...},
    paymentHash: txHash
  })
})
```

### Workflow 3: Autonomous Agent Shopping
```javascript
// Agent receives task: "Buy the cheapest API access under $1"

// 1. Discover all APIs
const allResources = await discoverResources({ type: 'api' })

// 2. Filter by price
const affordable = allResources.filter(r => r.priceUsdc < 1.0)

// 3. Sort by price
const cheapest = affordable.sort((a, b) => a.priceUsdc - b.priceUsdc)[0]

// 4. Check budget (wallet balance)
const balance = await checkWalletBalance()

// 5. Auto-approve if under MAX_AUTO_PAYMENT
if (cheapest.priceUsdc <= MAX_AUTO_PAYMENT && balance >= cheapest.priceUsdc) {
  // 6. Execute purchase
  const result = await purchaseResource(cheapest.id)
  return result
}
```

---

## 🚀 Quick Start for AI Agents

### Using MCP (Claude Desktop)
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "superpage": {
      "command": "node",
      "args": ["/path/to/packages/mcp-client/superpage-x402.js"],
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

### Using REST API (Any Agent Framework)
```python
import requests

# Discover
response = requests.get('http://localhost:3001/api/explore')
data = response.json()

# List resources
resources = requests.get('http://localhost:3001/x402/resources').json()

# Purchase (implement payment flow)
```

### Using A2A Protocol (Agent-to-Agent)
```javascript
// Get agent card
const card = await fetch('http://localhost:3001/.well-known/agent.json')

// Send message
const response = await fetch('http://localhost:3001/a2a', {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'message/send',
    params: { content: 'Show me your APIs' }
  })
})
```

---

## 📞 Support

- **Documentation:** `/docs`
- **API Reference:** `/docs/api`
- **MCP Guide:** `/docs/mcp`
- **Agent Guide:** `/docs/ai-agents`

**Platform:** SuperPage - AI-Native Web3 Commerce
**Protocol:** HTTP 402 Payment Required + x402 SDK
**Blockchain:** Flow EVM (chain ID 545)
**Currency:** USDC (stablecoin)
