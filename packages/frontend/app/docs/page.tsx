"use client";

import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col gap-12">
      <section>
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit">
            <span className="material-symbols-outlined text-xs leading-none">auto_awesome</span>
            Documentation Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Learn how to build with Airaa.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            From your first payment-gated API to AI agent integration, we've got everything you need to monetize with HTTP 402 and USDC.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/docs/getting-started" className="group p-6 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-sm">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
            <span className="material-symbols-outlined text-[28px] leading-none">rocket_launch</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Quick Start</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Get up and running in 5 minutes. Install the SDK and create your first payment-gated API endpoint.
          </p>
        </Link>

        <Link href="/docs/sdk" className="group p-6 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-sm">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
            <span className="material-symbols-outlined text-[28px] leading-none">code</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">SDK Reference</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Complete API reference for @super-x402/sdk. Server middleware, client helpers, and TypeScript types.
          </p>
        </Link>

        <Link href="/docs/examples" className="group p-6 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-sm">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
            <span className="material-symbols-outlined text-[28px] leading-none">integration_instructions</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Code Examples</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Working examples you can copy and use. APIs, file downloads, dynamic pricing, and more.
          </p>
        </Link>

        <Link href="/docs/ai-agents" className="group p-6 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-sm">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
            <span className="material-symbols-outlined text-[28px] leading-none">smart_toy</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">AI Agent Payments</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Enable AI agents to discover and purchase from your APIs. MCP integration and Claude Desktop setup.
          </p>
        </Link>
      </section>

      <article className="prose prose-slate max-w-none border-t border-border pt-12">
        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
          <span className="material-symbols-outlined text-sm leading-none">auto_stories</span>
          Featured Guide
        </div>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Integrating x402 in 3 minutes
          </h2>
          <p className="text-muted-foreground mb-6">
          Our SDK is designed to be as simple as possible. To get started, you'll need to initialize the <code>X402Server</code> with your Ethereum wallet credentials.
        </p>
        <pre className="mb-6">
          <code>{`import { X402Server } from '@super-x402/sdk';

const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY,
  recipientAddress: '0xYourAddress',
  tokenAddress: '0x06d1a12b351cab22727515c1f4fec2544f42d751' // USDC on Initia testnet
});

app.get('/api/premium',
  x402.middleware({ price: '1.00' }),
  (req, res) => {
    res.json({ data: 'premium content' });
  }
);`}</code>
        </pre>
          <p className="text-muted-foreground mb-8">
            This creates a payment-gated endpoint that returns HTTP 402 with payment requirements. Clients using the SDK automatically pay with USDC and receive the content. The transaction is verified on-chain instantly.
          </p>
          <div className="p-8 rounded-2xl bg-muted border border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <h4 className="font-bold text-foreground">Was this article helpful?</h4>
              <p className="text-sm text-muted-foreground">Help us improve our documentation</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border hover:border-primary hover:text-primary transition-all font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
              Yes
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border hover:border-red-500 hover:text-red-500 transition-all font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
              No
            </button>
          </div>
        </div>
      </article>

      <section className="border-t border-border pt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">What is Airaa?</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Airaa is an AI-native marketplace for creating payment-gated APIs and content using the HTTP 402 Payment Required status code.
            It enables automatic, programmable payments for AI agents, APIs, and digital commerce.
          </p>
          <p>
            Built on Base with <strong className="text-primary">USDC stablecoin</strong>, Airaa makes it easy to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Create payment-gated APIs and content</li>
            <li>Accept cryptocurrency payments automatically</li>
            <li>Build AI agents that can pay for services</li>
            <li>Monetize Shopify stores with crypto</li>
            <li>Enable micropayments for digital goods</li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border pt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">How It Works</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Client Requests Resource</h4>
              <p className="text-muted-foreground text-sm">
                Your client (user, AI agent, or app) makes a request to a protected endpoint.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Server Returns 402</h4>
              <p className="text-muted-foreground text-sm">
                Server responds with HTTP 402 and payment requirements (amount, token, recipient address).
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Client Sends Payment</h4>
              <p className="text-muted-foreground text-sm">
                Client automatically sends USDC payment on Ethereum blockchain.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Server Verifies Payment</h4>
              <p className="text-muted-foreground text-sm">
                Server verifies the payment on-chain and serves the protected content.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 mb-12 flex flex-wrap justify-between gap-8 py-8 border-t border-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <span className="material-symbols-outlined text-[14px] leading-none">payments</span>
            </div>
            <span className="font-bold text-foreground">Airaa Docs</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Airaa. All rights reserved.</p>
        </div>
        <div className="flex gap-12">
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Community</h5>
            <a className="text-sm text-foreground hover:text-primary transition-colors" href="#">
              GitHub
            </a>
            <a className="text-sm text-foreground hover:text-primary transition-colors" href="#">
              Twitter
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resources</h5>
            <Link href="/dashboard" className="text-sm text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/docs/api" className="text-sm text-foreground hover:text-primary transition-colors">
              API Reference
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
