"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit">
            <span className="material-symbols-outlined text-xs leading-none">psychology</span>
            AI Agent Skills
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            SuperPage Skills Reference
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Complete reference for all AI agent skills. Agents can discover, purchase, and access digital resources and physical products using USDC payments.
          </p>
        </div>
      </section>

      {/* Discovery Skills */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">Discovery Skills</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_discover</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Probe any URL to check if it supports x402 payments</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_list_resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Browse all public resources (APIs, files, articles) with prices</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_list_stores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">List all connected Shopify stores</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_browse_products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Search product catalogs in any store</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Discover Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-0.5 rounded text-foreground">GET /api/explore</code> &mdash; Get an overview of everything available on SuperPage.
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`curl http://localhost:3001/api/explore

// Response
{
  "success": true,
  "data": {
    "creators": [...],
    "resources": [...],
    "stores": [...],
    "products": [...]
  }
}`}</pre>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              List Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-0.5 rounded text-foreground">GET /x402/resources</code> &mdash; Browse all available digital resources.
            </p>
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">Parameters:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">type</code> &mdash; Filter by type: <code className="bg-muted px-1 rounded">api</code>, <code className="bg-muted px-1 rounded">file</code>, <code className="bg-muted px-1 rounded">article</code>, <code className="bg-muted px-1 rounded">shopify</code></li>
                <li><code className="bg-muted px-1 rounded">limit</code> &mdash; Number of results (default: 50)</li>
              </ul>
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`curl http://localhost:3001/x402/resources?type=api&limit=10`}</pre>
          </CardContent>
        </Card>
      </section>

      {/* Purchase Skills */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">Payment & Purchase Skills</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_buy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Full checkout flow: create order, pay USDC on-chain, confirm order</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_request</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Make any HTTP request; if 402 is returned, auto-pay and retry</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">How x402 Payments Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="flex-shrink-0 size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <p className="text-muted-foreground">Request a resource &rarr; server returns <code className="bg-muted px-1 rounded">402 Payment Required</code> with payment details</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <p className="text-muted-foreground">Agent sends USDC payment on-chain to the specified recipient</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <p className="text-muted-foreground">Agent retries the request with payment proof in <code className="bg-muted px-1 rounded">X-PAYMENT</code> header</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <p className="text-muted-foreground">Server verifies payment on-chain and serves the content</p>
              </div>
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`# Step 1: Request resource
curl http://localhost:3001/x402/resource/premium-api
# Returns: 402 Payment Required with payment details

# Step 2: Send USDC payment on-chain (via viem/ethers)

# Step 3: Access resource with payment proof
curl http://localhost:3001/x402/resource/premium-api \\
  -H "X-Payment-Hash: 0x..."
# Returns: Resource content`}</pre>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Purchase Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-0.5 rounded text-foreground">POST /x402/purchase/product</code> &mdash; Buy physical or digital products from Shopify stores.
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`{
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
}`}</pre>
          </CardContent>
        </Card>
      </section>

      {/* Wallet Skills */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">Wallet & Balance Skills</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Check your ETH and USDC balance, wallet address, network</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">x402_send</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Send USDC to any wallet address (peer-to-peer)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Check Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`// ETH Balance
const ethBalance = await publicClient.getBalance({
  address: walletAddress
})

// USDC Balance
const usdcBalance = await publicClient.readContract({
  address: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
  abi: erc20ABI,
  functionName: 'balanceOf',
  args: [walletAddress]
})`}</pre>
          </CardContent>
        </Card>
      </section>

      {/* Resource Types */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">Resource Types</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-semibold text-foreground">Type</th>
                <th className="text-left py-3 pr-4 font-semibold text-foreground">Description</th>
                <th className="text-left py-3 font-semibold text-foreground">Price Range</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><code className="bg-muted px-2 py-0.5 rounded text-primary">api</code></td>
                <td className="py-3 pr-4">Paywalled API endpoints &mdash; pay per request</td>
                <td className="py-3">$0.01 &mdash; $1.00</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><code className="bg-muted px-2 py-0.5 rounded text-primary">file</code></td>
                <td className="py-3 pr-4">Digital files &mdash; datasets, documents, models</td>
                <td className="py-3">$0.50 &mdash; $50.00</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><code className="bg-muted px-2 py-0.5 rounded text-primary">article</code></td>
                <td className="py-3 pr-4">Premium written content &mdash; guides, research</td>
                <td className="py-3">$0.10 &mdash; $10.00</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className="bg-muted px-2 py-0.5 rounded text-primary">shopify</code></td>
                <td className="py-3 pr-4">Physical/digital products from connected stores</td>
                <td className="py-3">Varies</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Example Workflows */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">Example Agent Workflows</span>
        </h2>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Discover and Purchase API Access</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`// 1. Discover available APIs
const resources = await fetch('http://localhost:3001/x402/resources?type=api')
const apis = await resources.json()

// 2. Select an API
const weatherAPI = apis.resources.find(r => r.name.includes('Weather'))

// 3. Request access (get payment requirements)
const response = await fetch(\`/x402/resource/\${weatherAPI.id}\`)
// Returns 402 with payment details

// 4. Pay with USDC
const hash = await sendUSDC(paymentDetails.recipient, paymentDetails.amount)

// 5. Access API with payment proof
const data = await fetch(\`/x402/resource/\${weatherAPI.id}\`, {
  headers: { 'X-Payment-Hash': hash }
})`}</pre>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Autonomous Agent Shopping</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`// Agent receives task: "Buy the cheapest API access under $1"

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
  const result = await purchaseResource(cheapest.id)
  return result
}`}</pre>
          </CardContent>
        </Card>
      </section>

      {/* Safety */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">Safety & Security</span>
        </h2>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">&#x2022;</span>
                Payments are capped at <code className="bg-muted px-1 rounded">MAX_AUTO_PAYMENT</code> &mdash; the agent will refuse to pay more without confirmation
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">&#x2022;</span>
                All transactions are verified on-chain before content is served
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">&#x2022;</span>
                No payment is made without explicit tool invocation
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">&#x2022;</span>
                Rate limiting: Discovery 100 req/min, Purchase 10 req/min
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground text-sm">Set up your agent with SuperPage:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/openclaw">
              <Button variant="outline" className="w-full justify-start">
                OpenClaw Setup
              </Button>
            </Link>
            <Link href="/docs/mcp">
              <Button variant="outline" className="w-full justify-start">
                MCP Server Guide
              </Button>
            </Link>
            <Link href="/docs/ai-agents">
              <Button variant="outline" className="w-full justify-start">
                AI Agent Payments
              </Button>
            </Link>
            <Link href="/docs/api">
              <Button variant="outline" className="w-full justify-start">
                REST API Reference
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
