"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Copy, Check } from "lucide-react";
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

export default function MCPDocsPage() {
  return (
    <div>
      <div>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
            <Zap className="h-4 w-4" />
            MCP Server
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Model Context Protocol
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Enable AI agents like Claude to discover and purchase from x402 using the Model Context Protocol (MCP)
          </p>
        </div>

        <div className="space-y-8">
          {/* What is MCP */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">What is MCP?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Model Context Protocol (MCP) is an open standard that enables AI agents to securely interact with external tools and services.
              </p>
              <p>
                Think of it as "APIs for AI" - MCP allows agents to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Discover available tools and resources</li>
                <li>Execute actions (like making payments)</li>
                <li>Retrieve data from external systems</li>
                <li>All through a standardized JSON-RPC 2.0 interface</li>
              </ul>
              <p className="pt-4">
                <strong className="text-foreground">x402's MCP server</strong> exposes payment-enabled commerce tools that agents can use autonomously.
              </p>
            </CardContent>
          </Card>

          {/* Setup */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Installation & Setup</CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure Claude Desktop to use x402's MCP server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step 1: Locate MCP Client</h3>
                <p className="text-muted-foreground mb-3">
                  The MCP client is located at <code className="bg-muted px-2 py-1 rounded">packages/mcp-client/superpage-x402.js</code>
                </p>
                <CodeBlock code={`cd packages/mcp-client
pnpm install`} language="bash" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step 2: Configure Claude Desktop</h3>
                <p className="text-muted-foreground mb-3">
                  Edit your Claude Desktop configuration file:
                </p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-muted-foreground">
                    • macOS: <code className="bg-muted px-2 py-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Windows: <code className="bg-muted px-2 py-1 rounded">%APPDATA%\Claude\claude_desktop_config.json</code>
                  </p>
                </div>
                <CodeBlock code={`{
  "mcpServers": {
    "x402": {
      "command": "node",
      "args": [
        "/absolute/path/to/USDC/packages/mcp-client/superpage-x402.js"
      ],
      "env": {
        "SUPERPAGE_SERVER": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "0xYourPrivateKeyHere",
        "ETH_NETWORK": "mainnet",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}`} language="json" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step 3: Restart Claude</h3>
                <p className="text-muted-foreground">
                  Quit Claude Desktop completely and relaunch it. You should see MCP tools available in the chat interface.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Options */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Configuration Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-bold text-foreground mb-2">SUPERPAGE_SERVER</h4>
                  <p className="text-muted-foreground mb-1">URL of your x402 backend server</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">http://localhost:3001</code>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-bold text-foreground mb-2">WALLET_PRIVATE_KEY</h4>
                  <p className="text-muted-foreground mb-1">Ethereum wallet private key (with 0x prefix)</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">0x...</code>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-bold text-foreground mb-2">ETH_NETWORK</h4>
                  <p className="text-muted-foreground mb-1">Ethereum network to use</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">mainnet</code> or <code className="text-sm bg-muted px-2 py-1 rounded">sepolia</code>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-bold text-foreground mb-2">MAX_AUTO_PAYMENT</h4>
                  <p className="text-muted-foreground mb-1">Maximum amount (in USDC) agent can pay automatically</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">10.00</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Tools */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Available MCP Tools</CardTitle>
              <CardDescription className="text-muted-foreground">
                Tools exposed by the x402 MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    name: "x402_wallet",
                    description: "Check ETH and USDC token balance",
                    example: "Check my x402 wallet balance"
                  },
                  {
                    name: "x402_discover",
                    description: "Check if a URL supports x402 payments",
                    example: "Does https://example.com/api support x402?"
                  },
                  {
                    name: "x402_list_stores",
                    description: "List all available Shopify stores",
                    example: "Show me available stores on x402"
                  },
                  {
                    name: "x402_browse_products",
                    description: "Browse products in a specific store",
                    example: "Browse products in store shopify/yf8vem-uw"
                  },
                  {
                    name: "x402_buy",
                    description: "Purchase a product with USDC",
                    example: "Buy the Example Perfume and ship to 123 Main St, NYC"
                  },
                  {
                    name: "x402_list_resources",
                    description: "List APIs, files, and articles",
                    example: "List available resources on x402"
                  },
                  {
                    name: "x402_request",
                    description: "Access paid content (auto-pays if 402 returned)",
                    example: "Access the article 'look-at-the-bright-side'"
                  }
                ].map((tool, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h4 className="font-bold text-foreground mb-2 font-mono">{tool.name}</h4>
                    <p className="text-muted-foreground mb-2">{tool.description}</p>
                    <div className="bg-muted p-3 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">Example prompt:</p>
                      <p className="text-sm text-foreground mt-1">"{tool.example}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Example Conversation */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Example Conversation with Claude</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">You:</p>
                  <p className="text-foreground">"Check my x402 wallet balance"</p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">Claude:</p>
                  <p className="text-foreground">Your x402 wallet has:</p>
                  <ul className="text-foreground mt-2 space-y-1">
                    <li>• 50.25 USDC ($50.25 USD)</li>
                    <li>• 0.15 ETH (for gas fees)</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">You:</p>
                  <p className="text-foreground">"Show me stores on x402"</p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">Claude:</p>
                  <p className="text-foreground">I found 2 stores:</p>
                  <ul className="text-foreground mt-2 space-y-1">
                    <li>• x402-shop (12 products)</li>
                    <li>• yf8vem-uw (3 products)</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">You:</p>
                  <p className="text-foreground">"Browse products in yf8vem-uw"</p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">Claude:</p>
                  <p className="text-foreground">Products in yf8vem-uw:</p>
                  <ul className="text-foreground mt-2 space-y-2">
                    <li>1. Example Perfume - $25.00</li>
                    <li>2. Luxury Watch - $150.00</li>
                    <li>3. Designer Sunglasses - $75.00</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">You:</p>
                  <p className="text-foreground">"Buy the Example Perfume for test@example.com, ship to John Doe, 123 Main St, NYC, NY 10001, US"</p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">Claude:</p>
                  <p className="text-foreground">Purchase complete!</p>
                  <ul className="text-foreground mt-2 space-y-1">
                    <li>• Order ID: #1234</li>
                    <li>• Paid: 25.00 USDC</li>
                    <li>• Tx: 0xabc123...</li>
                  </ul>
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
                <p className="font-semibold text-foreground mb-2">MCP tools not appearing?</p>
                <p>Make sure you've completely quit and restarted Claude Desktop. Check the Console app (macOS) or Event Viewer (Windows) for error messages.</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Connection errors?</p>
                <p>Verify that your x402 backend is running on the specified port (default: 3001) and that the SUPERPAGE_SERVER URL is correct.</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Payment failures?</p>
                <p>Ensure your wallet has both USDC tokens for payment AND ETH for gas fees. Check that you're on the correct network (mainnet vs sepolia).</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Wallet balance showing 0?</p>
                <p>Verify that WALLET_PRIVATE_KEY is correctly set and includes the 0x prefix. Make sure the wallet has been funded with USDC and ETH.</p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Security Considerations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">!</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Private Key Storage</p>
                  <p>The MCP client stores your private key in the config file. Make sure this file has appropriate permissions and is not shared.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">!</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Set Payment Limits</p>
                  <p>Always configure MAX_AUTO_PAYMENT to prevent agents from spending more than intended.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">!</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Use Dedicated Wallets</p>
                  <p>Create a separate wallet for MCP with limited funds, don't use your main wallet.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Learn More</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Explore AI agent integration and SDK documentation
              </p>
              <div className="flex gap-4">
                <Link href="/docs/ai-agents">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    AI Agent Examples
                  </Button>
                </Link>
                <Link href="/docs/sdk">
                  <Button variant="outline" className="border-border text-foreground">
                    SDK Reference
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
