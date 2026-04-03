"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OpenClawPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit">
            <span className="material-symbols-outlined text-xs leading-none">extension</span>
            Integration
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            OpenClaw Setup
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            OpenClaw is a skill manifest specification that lets AI agents discover and use Airaa tools automatically. Configure your SKILL.md to make your agent marketplace-ready.
          </p>
        </div>
      </section>

      {/* What is OpenClaw */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground">What is OpenClaw?</h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              OpenClaw is an open specification for declaring AI agent skills. It defines what environment variables, binaries, and configuration an agent needs to function. When a platform or agent runtime reads a <code className="bg-muted px-1.5 py-0.5 rounded">SKILL.md</code> file with OpenClaw metadata, it can automatically provision the agent with the right tools and credentials.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Airaa uses OpenClaw to declare its x402 marketplace skill, so any compatible agent framework can plug in and start buying/selling resources immediately.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* SKILL.md Structure */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground">SKILL.md Structure</h2>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Full Example</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Here is the complete <code className="bg-muted px-1.5 py-0.5 rounded">SKILL.md</code> for Airaa&apos;s x402 skill:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`---
name: superpage-x402
description: >
  Discover, browse, and purchase digital resources and physical
  products from the Airaa marketplace using x402 USDC payments
  on Base
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
    homepage: https://github.com/TheSupermanish/airaa
---

# Airaa x402 — AI-Native Marketplace
...`}</pre>
          </CardContent>
        </Card>
      </section>

      {/* Frontmatter Fields */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground">Frontmatter Fields</h2>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">name</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unique identifier for the skill. Used for registration and deduplication.
              </p>
              <pre className="bg-muted p-3 rounded-lg mt-2 text-sm">name: superpage-x402</pre>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Human-readable summary of what the skill does. Displayed in skill registries and agent UIs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">version</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Semantic version string. Increment when skill capabilities change.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono text-primary">metadata.openclaw</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The OpenClaw-specific configuration block:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Field</th>
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Type</th>
                      <th className="text-left py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">requires.env</code></td>
                      <td className="py-2 pr-4">string[]</td>
                      <td className="py-2">Environment variables the skill needs</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">requires.bins</code></td>
                      <td className="py-2 pr-4">string[]</td>
                      <td className="py-2">Required binary executables (e.g., <code className="bg-muted px-1 rounded">node</code>)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">primaryEnv</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">The main env var that identifies the service</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">emoji</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Display emoji for the skill in UIs</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">homepage</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">URL to the project or documentation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Environment Variables */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground">Environment Variables</h2>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Variable</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Required</th>
                    <th className="text-left py-2 font-semibold text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1.5 py-0.5 rounded text-primary">SUPERPAGE_SERVER</code></td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Airaa backend URL (e.g., <code className="bg-muted px-1 rounded">http://localhost:3001</code>)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1.5 py-0.5 rounded text-primary">WALLET_PRIVATE_KEY</code></td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Ethereum private key (0x-prefixed) with USDC on Base</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1.5 py-0.5 rounded text-primary">X402_CHAIN</code></td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Network name (default: <code className="bg-muted px-1 rounded">base</code>)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1.5 py-0.5 rounded text-primary">X402_CURRENCY</code></td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Payment token (default: <code className="bg-muted px-1 rounded">USDC</code>)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code className="bg-muted px-1.5 py-0.5 rounded text-primary">MAX_AUTO_PAYMENT</code></td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Maximum auto-payment in USDC (default: <code className="bg-muted px-1 rounded">10.00</code>)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Setup Guide */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground">Setup Guide</h2>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Claude Desktop (MCP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add Airaa to your <code className="bg-muted px-1.5 py-0.5 rounded">claude_desktop_config.json</code>:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`{
  "mcpServers": {
    "superpage": {
      "command": "node",
      "args": ["/path/to/packages/mcp-client/superpage-x402.js"],
      "env": {
        "SUPERPAGE_SERVER": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "0x...",
        "X402_CHAIN": "initia-testnet",
        "X402_CURRENCY": "USDC",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}`}</pre>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              REST API (Any Agent Framework)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the Airaa API directly from any agent framework:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`import requests

# Discover
response = requests.get('http://localhost:3001/api/explore')
data = response.json()

# List resources
resources = requests.get('http://localhost:3001/x402/resources').json()

# Purchase (implement payment flow)
# See Skills Reference for full details`}</pre>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              A2A Protocol (Agent-to-Agent)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the Agent-to-Agent protocol for autonomous agent interactions:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`// Get agent card
const card = await fetch(
  'http://localhost:3001/.well-known/agent.json'
)

// Send message (JSON-RPC 2.0)
const response = await fetch('http://localhost:3001/a2a', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'message/send',
    params: { content: 'Show me your APIs' },
    id: 1
  })
})`}</pre>
          </CardContent>
        </Card>
      </section>

      {/* Creating Your Own SKILL.md */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground">Create Your Own SKILL.md</h2>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To make your own agent or service discoverable via OpenClaw, create a <code className="bg-muted px-1.5 py-0.5 rounded">SKILL.md</code> in your project root:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`---
name: my-agent-skill
description: What your skill does in one sentence
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - MY_API_KEY
        - MY_SECRET
      bins:
        - node
    primaryEnv: MY_API_KEY
    emoji: "🔧"
    homepage: https://github.com/your-org/your-repo
---

# My Agent Skill

Description of what your agent can do...

## Available Tools
- **tool_name** — What it does
...`}</pre>
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <p className="text-sm text-foreground">
                The markdown body below the frontmatter serves as the skill&apos;s documentation. Write it as instructions for the AI agent &mdash; what tools are available, example workflows, and safety guidelines.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground text-sm">Explore more about building with Airaa:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/skills">
              <Button variant="outline" className="w-full justify-start">
                Skills Reference
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
            <Link href="/docs/sdk">
              <Button variant="outline" className="w-full justify-start">
                SDK Reference
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
