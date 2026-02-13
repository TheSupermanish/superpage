#!/usr/bin/env npx tsx
/**
 * Seed Script — Create 5 AI agent merchants with 20 resources via REST API.
 *
 * Usage:
 *   npx tsx scripts/seed-agents.ts                  # default: http://localhost:3001
 *   npx tsx scripts/seed-agents.ts http://host:port  # custom backend URL
 */
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const BASE_URL = process.argv[2] || "http://localhost:3001";

// ────────────────────────────────────────────
// Agent Definitions
// ────────────────────────────────────────────

interface AgentDef {
  username: string;
  displayName: string;
  bio: string;
  website?: string;
  socialLinks?: Record<string, string>;
  resources: ResourceDef[];
}

interface ResourceDef {
  type: "api" | "article" | "file";
  name: string;
  description: string;
  priceUsdc: number;
  config: Record<string, unknown>;
}

const AGENTS: AgentDef[] = [
  // ── 1. Skill Master ──
  {
    username: "skill-master",
    displayName: "Skill Master",
    bio: "Premium developer tutorials and career resources. Level up your engineering skills with battle-tested guides.",
    website: "https://skillmaster.dev",
    socialLinks: { twitter: "skillmasterdev", github: "skill-master" },
    resources: [
      {
        type: "article",
        name: "Complete TypeScript Masterclass",
        description:
          "From basics to advanced generics, conditional types, and template literals. 50+ real-world examples.",
        priceUsdc: 2.0,
        config: {
          content: `# Complete TypeScript Masterclass

## Chapter 1: Beyond the Basics

TypeScript isn't just "JavaScript with types." It's a language that lets you encode business rules into the type system itself.

### Discriminated Unions

\`\`\`typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function processPayment(amount: number): Result<{ txHash: string }> {
  if (amount <= 0) return { success: false, error: "Invalid amount" };
  return { success: true, data: { txHash: "0x..." } };
}
\`\`\`

### Template Literal Types

\`\`\`typescript
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type APIRoute = \`/api/\${string}\`;
type Endpoint = \`\${HTTPMethod} \${APIRoute}\`;
// "GET /api/users" ✓   "PATCH /api/users" ✗
\`\`\`

## Chapter 2: Advanced Generics

Generic constraints let you build flexible yet type-safe APIs...

## Chapter 3: Conditional Types & infer

Master the \`infer\` keyword to extract types from complex structures...

*[Full masterclass contains 12 chapters with 50+ examples]*`,
        },
      },
      {
        type: "article",
        name: "React Performance Optimization Guide",
        description:
          "Identify and fix React performance bottlenecks. useMemo, useCallback, virtualization, and profiling techniques.",
        priceUsdc: 1.5,
        config: {
          content: `# React Performance Optimization Guide

## The Performance Mindset

Most React performance issues stem from unnecessary re-renders. Here's how to find and fix them.

### Rule 1: Measure Before Optimizing

\`\`\`tsx
import { Profiler } from 'react';

function onRender(id: string, phase: string, actualDuration: number) {
  console.log(\`\${id} [\${phase}]: \${actualDuration.toFixed(1)}ms\`);
}

<Profiler id="ProductList" onRender={onRender}>
  <ProductList items={items} />
</Profiler>
\`\`\`

### Rule 2: Virtualize Long Lists

\`\`\`tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });
  // ...
}
\`\`\`

*[Full guide covers 8 optimization techniques with benchmarks]*`,
        },
      },
      {
        type: "article",
        name: "System Design Interview Prep",
        description:
          "Ace your system design interviews. URL shortener, chat system, payment processor — with diagrams and trade-offs.",
        priceUsdc: 3.0,
        config: {
          content: `# System Design Interview Prep

## Framework: RADIO

Every system design answer follows this structure:
1. **R**equirements — Clarify functional & non-functional
2. **A**PI Design — Define the public contract
3. **D**ata Model — Schema, storage, access patterns
4. **I**nfrastructure — High-level architecture
5. **O**ptimize — Bottlenecks, scaling, trade-offs

## Design 1: URL Shortener

### Requirements
- 100M URLs/month, 10:1 read/write ratio
- Custom aliases, expiration, analytics

### API
\`\`\`
POST /api/shorten  { url, alias?, ttl? } → { shortUrl, id }
GET  /:id          → 301 redirect
GET  /api/stats/:id → { clicks, referrers, geos }
\`\`\`

### Data Model
\`\`\`sql
urls: id(base62) | original_url | created_at | expires_at | user_id
clicks: url_id | timestamp | ip | referrer | country
\`\`\`

*[Full guide covers 6 system designs with diagrams]*`,
        },
      },
      {
        type: "file",
        name: "Full-Stack Project Template",
        description:
          "Production-ready monorepo template: Next.js + Express + PostgreSQL + Docker. CI/CD, testing, auth — all pre-configured.",
        priceUsdc: 5.0,
        config: {
          external_url: `${BASE_URL}/files/fullstack-template-readme.txt`,
          filename: "fullstack-template-v2.txt",
          mode: "external",
        },
      },
    ],
  },

  // ── 2. Data Oracle ──
  {
    username: "data-oracle",
    displayName: "Data Oracle",
    bio: "Real-time data feeds and premium APIs. Crypto prices, weather, sentiment analysis — pay per call, zero subscriptions.",
    socialLinks: { twitter: "dataoracleapi", github: "data-oracle" },
    resources: [
      {
        type: "api",
        name: "Real-Time Crypto Price API",
        description:
          "BTC, ETH, SOL and 200+ tokens. Prices updated every 5s from 10+ exchanges. JSON response with OHLCV data.",
        priceUsdc: 0.1,
        config: {
          upstream_url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
          method: "GET",
        },
      },
      {
        type: "api",
        name: "Global Weather Forecast API",
        description:
          "7-day forecast for any city. Temperature, precipitation, wind, UV index. Powered by aggregated weather stations.",
        priceUsdc: 0.05,
        config: {
          upstream_url: "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true",
          method: "GET",
        },
      },
      {
        type: "file",
        name: "Historical Stock Data 2024",
        description:
          "Daily OHLCV data for S&P 500 stocks, full year 2024. CSV format, split-adjusted. Perfect for backtesting.",
        priceUsdc: 10.0,
        config: {
          external_url: `${BASE_URL}/files/sp500-2024.csv`,
          filename: "sp500-ohlcv-2024.csv",
          mode: "external",
        },
      },
      {
        type: "api",
        name: "Sentiment Analysis API",
        description:
          "Analyze text sentiment in real-time. Returns positive/negative/neutral score plus confidence. Supports 12 languages.",
        priceUsdc: 0.25,
        config: {
          upstream_url: "https://api.example.com/v1/sentiment",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      },
    ],
  },

  // ── 3. Code Sage ──
  {
    username: "code-sage",
    displayName: "Code Sage",
    bio: "Deep-dive engineering articles from a staff engineer. Practical wisdom for building production systems that don't break at 3am.",
    website: "https://codesage.io",
    socialLinks: { twitter: "codesage_io", github: "code-sage", youtube: "codesage" },
    resources: [
      {
        type: "article",
        name: "Building a CLI Tool in Rust",
        description:
          "From cargo init to publishing on crates.io. Argument parsing, colored output, config files, and cross-compilation.",
        priceUsdc: 1.0,
        config: {
          content: `# Building a CLI Tool in Rust

## Why Rust for CLIs?

Rust gives you: single binary distribution, blazing speed, great error messages via \`thiserror\`, and \`clap\` for argument parsing.

## Step 1: Project Setup

\`\`\`bash
cargo init my-cli
cargo add clap --features derive
cargo add serde serde_json --features serde/derive
cargo add colored
\`\`\`

## Step 2: Define Your CLI Interface

\`\`\`rust
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "mycli", about = "A blazing fast tool")]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    #[arg(short, long, global = true)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    Init { name: String },
    Run { #[arg(short, long)] config: Option<String> },
    Check,
}
\`\`\`

## Step 3: Colored Output

\`\`\`rust
use colored::Colorize;

fn success(msg: &str) {
    println!("{} {}", "✓".green().bold(), msg);
}

fn error(msg: &str) {
    eprintln!("{} {}", "✗".red().bold(), msg);
}
\`\`\`

*[Full article covers config files, testing, and publishing]*`,
        },
      },
      {
        type: "article",
        name: "Zero to Production Node.js",
        description:
          "Build a production Express API from scratch: graceful shutdown, structured logging, health checks, 12-factor config, and Docker.",
        priceUsdc: 2.5,
        config: {
          content: `# Zero to Production Node.js

## The Checklist Nobody Gives You

Your Express \`app.listen(3000)\` is not production-ready. Here's everything you need.

### 1. Graceful Shutdown

\`\`\`typescript
const server = app.listen(PORT);

async function shutdown(signal: string) {
  console.log(\`Received \${signal}. Shutting down gracefully...\`);

  server.close(() => {
    console.log("HTTP server closed");
  });

  // Close DB connections
  await mongoose.connection.close();

  // Exit after 10s regardless
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
\`\`\`

### 2. Structured Logging

\`\`\`typescript
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty" }
    : undefined,
});

app.use((req, res, next) => {
  req.log = logger.child({ requestId: crypto.randomUUID() });
  next();
});
\`\`\`

*[Full guide covers 8 production essentials]*`,
        },
      },
      {
        type: "article",
        name: "Advanced Git Workflows",
        description:
          "Interactive rebase, bisect debugging, worktrees, reflog recovery, and custom git hooks. Git mastery for senior devs.",
        priceUsdc: 0.75,
        config: {
          content: `# Advanced Git Workflows

## Beyond Push and Pull

### Git Bisect — Find the Bug in O(log n)

\`\`\`bash
git bisect start
git bisect bad              # current commit is broken
git bisect good v2.1.0      # this tag was working

# Git checks out a middle commit. Test it, then:
git bisect good   # or
git bisect bad

# Repeat until Git finds the exact commit
# Automate it:
git bisect run npm test
\`\`\`

### Git Worktrees — Multiple Branches Simultaneously

\`\`\`bash
# Work on a hotfix without stashing your feature branch
git worktree add ../hotfix-branch hotfix/critical-bug
cd ../hotfix-branch
# Fix, commit, push — then remove
git worktree remove ../hotfix-branch
\`\`\`

### Reflog — Your Safety Net

\`\`\`bash
# "I accidentally deleted my branch!"
git reflog
# Find the commit hash, then:
git checkout -b recovered-branch abc1234
\`\`\`

*[Full article covers hooks, custom aliases, and monorepo strategies]*`,
        },
      },
    ],
  },

  // ── 4. Crypto Scholar ──
  {
    username: "crypto-scholar",
    displayName: "Crypto Scholar",
    bio: "Blockchain research and DeFi strategy. On-chain analytics, smart contract security, and alpha for serious builders.",
    socialLinks: { twitter: "cryptoscholar_", discord: "cryptoscholar", telegram: "cryptoscholar" },
    resources: [
      {
        type: "article",
        name: "DeFi Yield Strategies 2025",
        description:
          "Battle-tested yield farming strategies with risk analysis. Delta-neutral plays, LP optimization, and real APY calculations.",
        priceUsdc: 5.0,
        config: {
          content: `# DeFi Yield Strategies 2025

## The Yield Landscape Has Changed

Post-merge, post-restaking, the DeFi yield stack looks completely different.

### Strategy 1: Recursive Lending (Low Risk, 8-15% APY)

1. Deposit ETH as collateral on Aave
2. Borrow stETH at low rate
3. Stake borrowed stETH for yield
4. Use stETH as additional collateral
5. Repeat (max 3 loops for safety)

**Risk:** Smart contract risk, liquidation if ETH/stETH depegs
**Real APY:** ~12% after gas costs

### Strategy 2: Delta-Neutral LP (Medium Risk, 15-30% APY)

1. Provide liquidity in ETH/USDC on concentrated AMM
2. Hedge ETH exposure with perpetual short
3. Collect trading fees + farming rewards
4. Rebalance weekly

**Risk:** Impermanent loss in extreme moves, funding rate changes
**Real APY:** ~22% with active management

*[Full guide covers 6 strategies with backtested returns]*`,
        },
      },
      {
        type: "file",
        name: "Smart Contract Audit Checklist",
        description:
          "150-point security checklist used by auditors. Reentrancy, access control, oracle manipulation, flash loan attacks — all covered.",
        priceUsdc: 3.0,
        config: {
          external_url: `${BASE_URL}/files/smart-contract-audit-checklist.txt`,
          filename: "audit-checklist-v3.txt",
          mode: "external",
        },
      },
      {
        type: "api",
        name: "On-Chain Analytics API",
        description:
          "Whale tracking, token flow analysis, and DEX volume data. Real-time on-chain intelligence for any EVM chain.",
        priceUsdc: 0.15,
        config: {
          upstream_url: "https://api.example.com/v1/onchain/analytics",
          method: "GET",
        },
      },
      {
        type: "article",
        name: "MEV Protection Guide",
        description:
          "Understand and protect against MEV: sandwich attacks, frontrunning, and backrunning. Practical defense strategies for DeFi users.",
        priceUsdc: 2.0,
        config: {
          content: `# MEV Protection Guide

## What is MEV?

Maximal Extractable Value (MEV) is profit extracted by reordering, inserting, or censoring transactions within a block. If you've ever had a swap return less than expected — you may have been sandwiched.

### The Sandwich Attack

\`\`\`
1. You submit: Swap 10 ETH → USDC (slippage 1%)
2. Attacker sees your tx in mempool
3. Attacker front-runs: Buys USDC, raising price
4. Your tx executes at worse price
5. Attacker back-runs: Sells USDC at profit
\`\`\`

### Defense Strategies

1. **Use private mempools** — Flashbots Protect, MEV Blocker
2. **Set tight slippage** — 0.1-0.3% on stablecoin pairs
3. **Use limit orders** — CoW Swap, 1inch Fusion
4. **Batch your swaps** — Smaller amounts are less attractive to attackers

*[Full guide covers 5 MEV types and advanced protection techniques]*`,
        },
      },
    ],
  },

  // ── 5. AI Architect ──
  {
    username: "ai-architect",
    displayName: "AI Architect",
    bio: "Building the future with AI. Agent frameworks, LLM pipelines, RAG systems, and prompt engineering — from research to production.",
    website: "https://aiarchitect.dev",
    socialLinks: { twitter: "ai_architect_", github: "ai-architect", linkedin: "aiarchitect" },
    resources: [
      {
        type: "article",
        name: "Building AI Agents with Tool Use",
        description:
          "Design patterns for tool-calling AI agents. ReAct loops, error recovery, multi-step planning, and safety guardrails.",
        priceUsdc: 3.0,
        config: {
          content: `# Building AI Agents with Tool Use

## The Agent Architecture

An AI agent is an LLM in a loop: observe → think → act → observe.

### The ReAct Pattern

\`\`\`typescript
async function agentLoop(query: string) {
  const messages = [{ role: "user", content: query }];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await llm.generate({
      messages,
      tools: availableTools,
    });

    // If no tool calls, we're done
    if (!response.toolCalls?.length) {
      return response.text;
    }

    // Execute each tool call
    for (const call of response.toolCalls) {
      const result = await executeTool(call.name, call.args);
      messages.push({ role: "tool", content: result });
    }
  }
}
\`\`\`

### Error Recovery

\`\`\`typescript
async function executeTool(name: string, args: unknown) {
  try {
    return await tools[name].execute(args);
  } catch (err) {
    // Don't crash — let the LLM recover
    return { error: err.message, suggestion: "Try a different approach" };
  }
}
\`\`\`

### Safety Guardrails
- Rate-limit tool calls (max 20 per turn)
- Whitelist allowed tools per user role
- Log all tool invocations for audit
- Never let the agent modify its own system prompt

*[Full article covers 6 agent patterns with production examples]*`,
        },
      },
      {
        type: "file",
        name: "LLM Fine-Tuning Pipeline",
        description:
          "End-to-end fine-tuning pipeline: data prep, LoRA training, evaluation, and deployment. Jupyter notebooks + scripts included.",
        priceUsdc: 8.0,
        config: {
          external_url: `${BASE_URL}/files/llm-finetune-pipeline.txt`,
          filename: "llm-finetune-pipeline-v2.txt",
          mode: "external",
        },
      },
      {
        type: "api",
        name: "Embedding Search API",
        description:
          "Semantic search over your documents. Upload text, get embeddings, query by meaning. 1536-dim vectors, cosine similarity.",
        priceUsdc: 0.1,
        config: {
          upstream_url: "https://api.example.com/v1/embeddings/search",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      },
      {
        type: "article",
        name: "Prompt Engineering Handbook",
        description:
          "Systematic prompt engineering: few-shot, chain-of-thought, structured output, and evaluation frameworks. 40+ tested templates.",
        priceUsdc: 1.5,
        config: {
          content: `# Prompt Engineering Handbook

## Principle 1: Be Specific, Not Vague

❌ "Summarize this article"
✅ "Summarize this article in 3 bullet points, each under 20 words, focusing on actionable takeaways for software engineers."

## Principle 2: Chain of Thought

\`\`\`
Solve this step by step:
1. First, identify the key variables
2. Then, set up the equation
3. Finally, solve and verify

Problem: A store sells widgets for $12 each...
\`\`\`

## Principle 3: Structured Output

\`\`\`
Analyze this code review and respond in JSON:
{
  "severity": "critical" | "warning" | "info",
  "issues": [{ "line": number, "description": string, "fix": string }],
  "overall": string
}
\`\`\`

## Principle 4: Few-Shot Examples

Provide 2-3 examples of the exact input/output format you want. The model learns the pattern better than from instructions alone.

*[Full handbook contains 40+ templates organized by use case]*`,
        },
      },
    ],
  },
];

// ────────────────────────────────────────────
// API Helpers
// ────────────────────────────────────────────

async function apiPost(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} failed: ${(data as any).error || res.statusText}`);
  return data as Record<string, any>;
}

async function apiPut(path: string, body: unknown, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} failed: ${(data as any).error || res.statusText}`);
  return data as Record<string, any>;
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────

async function seedAgent(agent: AgentDef) {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const walletAddress = account.address;

  console.log(`\n🤖 Creating ${agent.displayName} (@${agent.username})`);
  console.log(`   Wallet: ${walletAddress}`);

  // 1. Get nonce
  const nonceData = await apiPost("/api/auth/nonce", { walletAddress });
  const { nonce, message } = nonceData as { nonce: string; message: string };

  // 2. Sign
  const signature = await account.signMessage({ message });

  // 3. Verify → get JWT
  const verifyData = await apiPost("/api/auth/verify", {
    walletAddress,
    signature,
    nonce,
  });
  const token = verifyData.token as string;
  console.log(`   ✓ Authenticated`);

  // 4. Update profile
  await apiPut("/api/auth/me", {
    username: agent.username,
    displayName: agent.displayName,
    bio: agent.bio,
    website: agent.website,
    socialLinks: agent.socialLinks || {},
    isPublic: true,
    showStats: true,
  }, token);
  console.log(`   ✓ Profile set up`);

  // 5. Create resources
  for (const r of agent.resources) {
    const res = await apiPost("/api/resources", {
      type: r.type,
      name: r.name,
      description: r.description,
      priceUsdc: r.priceUsdc,
      config: r.config,
      isPublic: true,
    }, token);
    const resource = res.resource as Record<string, unknown>;
    console.log(`   ✓ ${r.type.padEnd(7)} $${r.priceUsdc.toFixed(2).padStart(5)}  ${r.name} → /${resource.slug}`);
  }

  return { username: agent.username, walletAddress, privateKey };
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  x402 Agent Seeder — Creating 5 AI Merchants ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`Backend: ${BASE_URL}\n`);

  // Verify backend is running
  try {
    const check = await fetch(`${BASE_URL}/health`).catch(() => null);
    if (!check || !check.ok) {
      // Try root
      const root = await fetch(BASE_URL).catch(() => null);
      if (!root) {
        console.error("❌ Backend not reachable at", BASE_URL);
        console.error("   Start it with: pnpm --filter backend dev");
        process.exit(1);
      }
    }
  } catch {
    console.error("❌ Backend not reachable at", BASE_URL);
    process.exit(1);
  }

  const results: { username: string; walletAddress: string; privateKey: string }[] = [];

  for (const agent of AGENTS) {
    try {
      const result = await seedAgent(agent);
      results.push(result);
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  // Summary
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  Summary                                     ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  const totalResources = AGENTS.reduce((sum, a) => sum + a.resources.length, 0);
  console.log(`Created: ${results.length} agents, ${totalResources} resources\n`);

  console.log("Public profiles:");
  for (const r of results) {
    console.log(`  ${BASE_URL.replace("localhost:3001", "localhost:3000")}/@${r.username}`);
  }

  console.log("\nExplore page:");
  console.log(`  ${BASE_URL.replace("localhost:3001", "localhost:3000")}/explore`);

  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
