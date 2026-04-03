#!/usr/bin/env node
/**
 * Airaa x402 — MCP Client for AI Agents
 *
 * Entry point: assembles tools from all modules, provides CLI mode
 * and MCP STDIO protocol handler.
 */

import { createInterface } from "readline";
import { SERVER_URL, NETWORK, CURRENCY, MAX_AUTO_PAYMENT } from "./config.js";
import { log } from "./wallet.js";

import * as discovery from "./tools/discovery.js";
import * as shopping from "./tools/shopping.js";
import * as requests from "./tools/requests.js";
import * as orders from "./tools/orders.js";

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLS = [
  ...discovery.TOOLS,
  ...shopping.TOOLS,
  ...requests.TOOLS,
  ...orders.TOOLS,
];

// ═══════════════════════════════════════════════════════════════════════════
// MERGED HANDLER DISPATCH
// ═══════════════════════════════════════════════════════════════════════════

const allHandlers = {
  ...discovery.handlers,
  ...shopping.handlers,
  ...requests.handlers,
  ...orders.handlers,
};

export async function handleTool(name, args) {
  try {
    const handler = allHandlers[name];
    if (handler) {
      return await handler(args);
    }
    return { error: `Unknown tool: ${name}` };
  } catch (err) {
    log(`Error in ${name}: ${err.message}`);
    return { error: err.message, tool: name };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI MODE -- for direct invocation by agents (OpenClaw, etc.)
// Usage: node superpage-x402.js <command> [json-args]
// ═══════════════════════════════════════════════════════════════════════════

const CLI_COMMANDS = {
  "list-resources": "x402_list_resources",
  "search": "x402_search_resources",
  "list-stores": "x402_list_stores",
  "browse-products": "x402_browse_products",
  "request": "x402_request",
  "buy": "x402_buy",
  "wallet": "x402_wallet",
  "send": "x402_send",
  "order-status": "x402_order_status",
  "list-orders": "x402_list_orders",
  "list-order-intents": "x402_list_order_intents",
  "discover": "x402_discover",
  "preview": "x402_request",
};

const cliCommand = process.argv[2];

if (cliCommand && CLI_COMMANDS[cliCommand]) {
  // CLI mode: run the command and exit
  const toolName = CLI_COMMANDS[cliCommand];
  let args = {};

  // Parse remaining args as JSON, or as key=value pairs
  const rawArg = process.argv[3];
  if (rawArg) {
    try {
      args = JSON.parse(rawArg);
    } catch {
      // Try key=value format: url=http://... method=GET
      for (let i = 3; i < process.argv.length; i++) {
        const [key, ...rest] = process.argv[i].split("=");
        if (key && rest.length > 0) {
          args[key] = rest.join("=");
        }
      }
    }
  } else {
    // Also try key=value pairs from remaining argv
    for (let i = 3; i < process.argv.length; i++) {
      const [key, ...rest] = process.argv[i].split("=");
      if (key && rest.length > 0) {
        args[key] = rest.join("=");
      }
    }
  }

  // Auto-inject preview flag for the preview command
  if (cliCommand === "preview") {
    args.preview = true;
  }

  (async () => {
    try {
      const result = await handleTool(toolName, args);
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (err) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  })();
} else if (cliCommand === "help" || cliCommand === "--help") {
  console.log(`Airaa x402 CLI \u2014 AI Agent Marketplace

Usage: node superpage-x402.js <command> [json-args]

Commands:
  list-resources          List all available resources with prices
  search                  Search resources by keyword
  list-stores             List connected Shopify stores
  browse-products         Browse products in a store
  request                 Access a paid resource (auto-pays if 402)
  preview                 Check resource price without paying
  buy                     Full checkout flow for store products
  wallet                  Check wallet balance
  send                    Send USDC to a wallet address
  order-status            Get order details
  list-orders             List completed orders
  list-order-intents      List pending order intents
  discover                Probe a URL for x402 support

Examples:
  node superpage-x402.js list-resources
  node superpage-x402.js search '{"query":"weather"}'
  node superpage-x402.js wallet
  node superpage-x402.js request '{"url":"${SERVER_URL}/x402/resource/my-resource"}'
  node superpage-x402.js browse-products '{"storeId":"shopify/my-store"}'

Environment:
  SUPERPAGE_SERVER=${SERVER_URL}
  X402_CHAIN=${NETWORK}
  X402_CURRENCY=${CURRENCY}
  MAX_AUTO_PAYMENT=${MAX_AUTO_PAYMENT}
`);
  process.exit(0);
} else if (cliCommand) {
  console.error(`Unknown command: ${cliCommand}. Run with --help to see available commands.`);
  process.exit(1);
} else {
  // ═══════════════════════════════════════════════════════════════════════════
  // MCP STDIO PROTOCOL -- for MCP hosts (Claude Desktop, etc.)
  // ═══════════════════════════════════════════════════════════════════════════

  const rl = createInterface({ input: process.stdin, terminal: false });

  rl.on("line", async (line) => {
    try {
      const request = JSON.parse(line);
      const { method, params, id } = request;

      let response;

      switch (method) {
        case "initialize":
          const clientVersion = params?.protocolVersion || "2024-11-05";
          response = {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: clientVersion,
              capabilities: { tools: {} },
              serverInfo: {
                name: "superpage-x402",
                version: "2.0.0",
              },
            },
          };
          break;

        case "notifications/initialized":
          // Client acknowledged initialization - no response needed
          return;

        case "tools/list":
          response = {
            jsonrpc: "2.0",
            id,
            result: { tools: TOOLS },
          };
          break;

        case "tools/call":
          const result = await handleTool(params.name, params.arguments || {});
          response = {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          };
          break;

        default:
          response = {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Unknown method: ${method}` },
          };
      }

      console.log(JSON.stringify(response));
    } catch (err) {
      console.log(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        })
      );
    }
  });

  log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  log("  AIRAA x402 MCP Client Ready \u26a1");
  log(`  Network: ${NETWORK} | Token: ${CURRENCY}`);
  log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
}
