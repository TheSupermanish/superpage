"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Copy, Check } from "lucide-react";
import { useState } from "react";

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute right-4 top-4 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
      </button>
      <pre className="bg-muted p-6 rounded-xl overflow-x-auto text-sm border border-border">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

export default function ShopifyDocsPage() {
  return (
    <div>
      <div>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
            <ShoppingBag className="h-4 w-4" />
            Shopify Integration
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Shopify + Crypto Payments
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Connect your Shopify store and accept USDC cryptocurrency payments from AI agents and users
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                    <p className="text-foreground font-semibold">Connect Store</p>
                  </div>
                  <p className="text-muted-foreground ml-11">Link your Shopify store using OAuth</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                    <p className="text-foreground font-semibold">Select Products</p>
                  </div>
                  <p className="text-muted-foreground ml-11">Choose which products to sell via x402</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                    <p className="text-foreground font-semibold">Auto-Sync</p>
                  </div>
                  <p className="text-muted-foreground ml-11">Product changes sync automatically via webhooks</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</div>
                    <p className="text-foreground font-semibold">Accept Payments</p>
                  </div>
                  <p className="text-muted-foreground ml-11">Orders appear in your Shopify dashboard instantly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Setup Guide</CardTitle>
              <CardDescription className="text-muted-foreground">
                Connect your Shopify store in 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step 1: Get Shopify API Credentials</h3>
                <ol className="text-muted-foreground space-y-2 ml-6 list-decimal">
                  <li>Go to your Shopify Admin → Settings → Apps and sales channels</li>
                  <li>Click "Develop apps" → "Create an app"</li>
                  <li>Name it "x402 Integration" and create it</li>
                  <li>Go to "Configuration" → "Admin API integration"</li>
                  <li>Enable these scopes: <code className="bg-muted px-2 py-1 rounded">read_products</code>, <code className="bg-muted px-2 py-1 rounded">write_orders</code></li>
                  <li>Save and install the app</li>
                  <li>Copy the Admin API access token</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step 2: Connect via x402 Dashboard</h3>
                <ol className="text-muted-foreground space-y-2 ml-6 list-decimal">
                  <li>Go to <Link href="/dashboard/stores" className="text-primary hover:underline">/dashboard/stores</Link></li>
                  <li>Click "Connect New Store"</li>
                  <li>Enter your store domain (e.g., <code className="bg-muted px-2 py-1 rounded">mystore.myshopify.com</code>)</li>
                  <li>Paste your Admin API access token</li>
                  <li>Click "Connect Store"</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step 3: Import Products</h3>
                <ol className="text-muted-foreground space-y-2 ml-6 list-decimal">
                  <li>Your products will be automatically fetched</li>
                  <li>Select which products you want to sell via x402</li>
                  <li>Click "Import Selected Products"</li>
                  <li>Products are now available for AI agents and users to purchase!</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Sync */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Automatic Product Sync</CardTitle>
              <CardDescription className="text-muted-foreground">
                Keep your products up-to-date with Shopify webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                x402 automatically syncs product changes from Shopify using webhooks:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Product price updates</li>
                <li>Product title/description changes</li>
                <li>Product image updates</li>
                <li>Product deletions</li>
              </ul>
              <p className="pt-4">
                <strong className="text-foreground">No manual work required!</strong> Changes in your Shopify admin automatically reflect on x402.
              </p>
            </CardContent>
          </Card>

          {/* Purchase Flow */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Purchase Flow</CardTitle>
              <CardDescription className="text-muted-foreground">
                How customers/agents buy your products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Agent/User Browses Products</h4>
                    <p className="text-muted-foreground text-sm">They discover your store via MCP or public profile</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Initiate Purchase</h4>
                    <p className="text-muted-foreground text-sm">POST to /x402/eth/store/:storeId/product/:productId</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Server Returns HTTP 402</h4>
                    <p className="text-muted-foreground text-sm">Payment requirements (amount, USDC token, recipient address)</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Payment Sent</h4>
                    <p className="text-muted-foreground text-sm">USDC transferred on Ethereum blockchain</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">5</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Payment Verified</h4>
                    <p className="text-muted-foreground text-sm">x402 verifies transaction on-chain</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">6</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Order Created</h4>
                    <p className="text-muted-foreground text-sm">Order appears in your Shopify admin automatically</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Example */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">API Example</CardTitle>
              <CardDescription className="text-muted-foreground">
                Purchase a product programmatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Using @super-x402/sdk</h3>
                <CodeBlock code={`import { X402Client } from '@super-x402/sdk';

const client = new X402Client({
  network: 'mainnet',
  privateKey: process.env.WALLET_PRIVATE_KEY!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
});

const response = await client.fetch(
  'http://localhost:3001/x402/eth/store/STORE_ID/product/PRODUCT_ID',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@example.com',
      shipping: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        zip: '10001',
        country: 'US',
        phone: '+1234567890'
      }
    })
  }
);

const order = await response.json();
console.log('Order created:', order.orderId);
console.log('Shopify Order:', order.shopifyOrderId);`} />
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Keep Products Updated</p>
                  <p>Make sure your Shopify inventory is accurate - x402 syncs automatically</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Clear Product Descriptions</p>
                  <p>AI agents rely on descriptions to understand products - be detailed</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Monitor Orders</p>
                  <p>Check both x402 dashboard and Shopify admin for order tracking</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Set Competitive Prices</p>
                  <p>USDC is USD-backed (1:1) so pricing is straightforward</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-2">Products not syncing?</p>
                <p>Check that webhooks are properly configured in your Shopify admin and that your API token has the correct permissions.</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Orders not appearing in Shopify?</p>
                <p>Verify that your store has <code className="bg-muted px-2 py-1 rounded">write_orders</code> permission enabled in the API credentials.</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Payment verification failing?</p>
                <p>Ensure you have sufficient ETH for gas fees in addition to USDC tokens. Check that the transaction was confirmed on-chain.</p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Ready to Connect Your Store?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Start accepting crypto payments for your Shopify products today
              </p>
              <div className="flex gap-4">
                <Link href="/dashboard/stores">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Connect Shopify Store
                  </Button>
                </Link>
                <Link href="/docs/api">
                  <Button variant="outline" className="border-border text-foreground">
                    API Reference
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
