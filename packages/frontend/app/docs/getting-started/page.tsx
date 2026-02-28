"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GettingStartedPage() {
  return (
    <div>
      <div>
        <h1 className="text-4xl font-bold mb-8 text-primary">
          Getting Started with x402
        </h1>

        <div className="space-y-8">
          {/* Installation */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Install the x402 SDK for Ethereum:
              </p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`npm install @x402/eth-sdk viem
# or
pnpm add @x402/eth-sdk viem
# or
yarn add @x402/eth-sdk viem`}
              </pre>
            </CardContent>
          </Card>

          {/* Server Setup */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🖥️</span>
                Server Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Create a payment-gated API endpoint in 3 steps:
              </p>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">Step 1: Import the SDK</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`import { createX402Server } from '@x402/eth-sdk';
import express from 'express';

const app = express();`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">Step 2: Create x402 Server</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`const x402 = createX402Server({
  network: 'mainnet',              // Ethereum mainnet
  recipientAddress: '0xYourWallet' // Your wallet address
});`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">Step 3: Protect Your Endpoints</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`app.get('/api/premium-data',
  x402.requirePayment({
    amount: '1.00',  // Price in USDC
    token: 'USDC'    // Use USDC stablecoin
  }),
  (req, res) => {
    // Payment verified! Serve content
    res.json({
      data: 'Your premium content here',
      paidAmount: req.payment?.amount,
      token: req.payment?.token
    });
  }
);

app.listen(3000, () => {
  console.log('x402 server running on port 3000');
});`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Client Setup */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💻</span>
                Client Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Make automatic payments from your client:
              </p>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">Node.js / Backend</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`import { x402Fetch } from '@x402/eth-sdk';

// Automatic payment handling
const response = await x402Fetch(
  'https://api.example.com/premium-data',
  {
    network: 'mainnet',
    signer: process.env.PRIVATE_KEY // Your private key
  }
);

const data = await response.json();
console.log(data);`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">Browser / Frontend</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`import { X402Client } from '@x402/eth-sdk';
import { useWalletClient } from 'wagmi';

function MyComponent() {
  const { data: walletClient } = useWalletClient();

  const fetchData = async () => {
    const client = new X402Client({
      network: 'mainnet',
      signer: walletClient
    });

    const response = await client.fetch(
      'https://api.example.com/premium-data'
    );

    return response.json();
  };

  // Use fetchData() when needed
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Create a <code className="bg-muted px-2 py-1 rounded">.env</code> file:
              </p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`# Your Ethereum wallet private key (for client payments)
PRIVATE_KEY=0x...

# Your recipient wallet address (for receiving payments)
RECIPIENT_ADDRESS=0x...

# Optional: Custom RPC endpoint
RPC_ENDPOINT=https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY`}
              </pre>
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">
                  ⚠️ <strong>Security:</strong> Never commit your private keys to git. Add <code>.env</code> to your <code>.gitignore</code> file.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Testing */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                Testing Your Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Test your payment flow:
              </p>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">1. Start your server</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`node server.js
# Server running on port 3000`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">2. Make a test request (without payment)</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`curl http://localhost:3000/api/premium-data

# Response: 402 Payment Required
{
  "scheme": "exact",
  "network": "mainnet",
  "chainId": 1,
  "amount": "1000000",
  "token": "USDC",
  "recipient": "0xYourAddress",
  "requestId": "req_..."
}`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary mb-2">3. Use the SDK to make payment automatically</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`const response = await x402Fetch(
  'http://localhost:3000/api/premium-data',
  { network: 'mainnet', signer: privateKey }
);

// Payment sent automatically!
// Response: 200 OK with your data`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                You're all set! Here's what to explore next:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/docs/USDC">
                  <Button variant="outline" className="w-full justify-start">
                    💰 Learn about USDC
                  </Button>
                </Link>
                <Link href="/docs/examples">
                  <Button variant="outline" className="w-full justify-start">
                    📝 View Examples
                  </Button>
                </Link>
                <Link href="/docs/ai-agents">
                  <Button variant="outline" className="w-full justify-start">
                    🤖 Build AI Agents
                  </Button>
                </Link>
                <Link href="/docs/sdk">
                  <Button variant="outline" className="w-full justify-start">
                    📚 Full SDK Reference
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
