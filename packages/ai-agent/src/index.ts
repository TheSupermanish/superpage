#!/usr/bin/env node
/**
 * Superio CLI — Trustless AI shopping agent.
 *
 *   superio                       Interactive mode
 *   superio "buy weather API"     One-shot mode
 *   superio --help                Show help
 */
import * as readline from "readline";
import { loadConfig } from "./config.js";
import { createAgent, chat } from "./agent.js";
import * as ui from "./ui.js";

// Programmatic exports
export { runAgent, createAgent, chat, chatSync } from "./agent.js";
export type { AgentContext } from "./agent.js";
export { loadConfig } from "./config.js";
export type { AgentConfig } from "./config.js";
export { A2AClient } from "./a2a-client.js";
export { Wallet } from "./wallet.js";
export { createAllTools } from "./tools/index.js";
export type { MerchantState } from "./tools/index.js";
export { ERC8004Client } from "./erc8004/index.js";

function question(
  rl: readline.Interface,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function interactive() {
  const config = loadConfig();
  ui.banner();

  const ctx = await createAgent(config);
  const balance = await ctx.wallet.getUsdcBalance();

  ui.walletInfo(ctx.wallet.address, balance);
  ui.info("Model", `${config.llmProvider}/${config.llmModel}`);
  ui.info("Merchant", config.merchantUrl);
  ui.info("Network", config.network);
  if (config.erc8004AgentId) {
    ui.info("Agent ID", config.erc8004AgentId);
  }
  ui.hint("Type a message or /help for commands. Ctrl+C to exit.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("close", () => {
    ui.goodbye();
    process.exit(0);
  });

  while (true) {
    const input = await question(rl, ui.userPrompt());
    const trimmed = input.trim();

    if (!trimmed) continue;

    // Slash commands
    if (trimmed.startsWith("/")) {
      const cmd = trimmed.slice(1).toLowerCase().split(/\s+/)[0];

      switch (cmd) {
        case "help":
        case "h":
          ui.slashCommand("help", "Show this help message");
          ui.slashCommand("balance", "Show wallet USDC balance");
          ui.slashCommand("merchant", "Show merchant auth status");
          ui.slashCommand("config", "Show current configuration");
          ui.slashCommand("clear", "Clear conversation history");
          ui.slashCommand("exit", "Exit the agent");
          break;

        case "balance":
        case "bal": {
          const bal = await ctx.wallet.getUsdcBalance();
          ui.walletInfo(ctx.wallet.address, bal);
          break;
        }

        case "config":
          ui.info("Model", `${config.llmProvider}/${config.llmModel}`);
          ui.info("Merchant", config.merchantUrl);
          ui.info("Network", config.network);
          ui.info("Wallet", `${ctx.wallet.address.slice(0, 6)}...${ctx.wallet.address.slice(-4)}`);
          ui.info("Turns", `${Math.floor(ctx.messages.length / 2)}`);
          break;

        case "merchant": {
          if (ctx.merchantState.authToken) {
            ui.info("Merchant", "Authenticated");
            ui.hint("JWT token active. Use merchant tools to manage resources.");
          } else {
            ui.info("Merchant", "Not authenticated");
            ui.hint('Say "login as merchant" or use merchant_login tool.');
          }
          break;
        }

        case "clear":
          ctx.messages.length = 0;
          ui.hint("Conversation history cleared.");
          break;

        case "exit":
        case "quit":
        case "q":
          ui.goodbye();
          rl.close();
          process.exit(0);

        default:
          ui.hint(`Unknown command: /${cmd}. Type /help for commands.`);
      }
      continue;
    }

    // Exit aliases
    if (["exit", "quit", "q"].includes(trimmed.toLowerCase())) {
      ui.goodbye();
      rl.close();
      process.exit(0);
    }

    try {
      await chat(ctx, trimmed);
    } catch (err: any) {
      ui.error(err.message);
    }
  }
}

async function oneShot(message: string) {
  const config = loadConfig();
  ui.banner();

  const ctx = await createAgent(config);
  const balance = await ctx.wallet.getUsdcBalance();

  ui.walletInfo(ctx.wallet.address, balance);
  ui.info("Model", `${config.llmProvider}/${config.llmModel}`);
  ui.info("Merchant", config.merchantUrl);
  ui.hint(`> ${message}\n`);

  try {
    await chat(ctx, message);

    const newBalance = await ctx.wallet.getUsdcBalance();
    if (newBalance !== balance) {
      ui.walletInfo(ctx.wallet.address, newBalance);
      ui.hint(
        `Spent: ${(parseFloat(balance) - parseFloat(newBalance)).toFixed(6)} USDC`
      );
    }
  } catch (err: any) {
    ui.error(err.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
  \x1b[1mSuperio\x1b[0m — Your trustless AI shopping agent

  \x1b[2mUsage:\x1b[0m
    superio                           Interactive mode
    superio "buy me weather API"      One-shot mode

  \x1b[2mCommands (interactive):\x1b[0m
    /help        Show available commands
    /balance     Show wallet USDC balance
    /merchant    Show merchant auth status
    /config      Show current configuration
    /clear       Clear conversation history
    /exit        Exit the agent

  \x1b[2mEnvironment:\x1b[0m
    LLM_PROVIDER                   anthropic | openai | google
    ANTHROPIC_API_KEY              For Claude
    OPENAI_API_KEY                 For GPT
    GOOGLE_GENERATIVE_AI_API_KEY   For Gemini
    WALLET_PRIVATE_KEY             0x-prefixed (with USDC on Base Sepolia)
    MERCHANT_URL                   Default: http://localhost:3001
    ERC8004_AGENT_ID               On-chain agent ID (set after registration)
    AUTO_APPROVE_PAYMENTS          true = skip payment confirmations
    VERBOSE                        true = show tool calls
`);
    process.exit(0);
  }

  const message = args.join(" ").trim();

  if (message) {
    await oneShot(message);
  } else {
    await interactive();
  }
}

// Only run CLI when executed directly (not when imported as library)
const isDirectRun =
  process.argv[1]?.endsWith("/index.js") ||
  process.argv[1]?.endsWith("/index.ts") ||
  process.argv[1]?.includes("ai-agent");

if (isDirectRun) {
  main();
}
