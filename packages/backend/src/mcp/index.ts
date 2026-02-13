/**
 * MCP Module - Modular Model Context Protocol Implementation
 * 
 * This module provides a pluggable MCP server system with:
 * - Tool registry for centralized tool management
 * - Category-based tool organization
 * - Shared JSON-RPC 2.0 handler
 * - Pre-built tools for shopping, payments, and resources
 */

// Core exports
export { toolRegistry, defineTool } from "./tool-registry.js";
export { createMCPHandler, type MCPHandlerOptions } from "./base-handler.js";
export type { 
  MCPToolDefinition, 
  MCPToolMetadata, 
  MCPToolResult,
  MCPServerInfo,
  JsonRpcRequest,
  JsonRpcResponse,
} from "./types.js";

// Tool registration exports
export { registerShoppingTools } from "./tools/shopping.js";
export { registerPaymentTools } from "./tools/payment.js";
export { registerResourceTools } from "./tools/resources.js";
export { registerA2ATools } from "./tools/a2a.js";
export { registerERC8004Tools } from "./tools/erc8004.js";

// Import for internal use
import { registerShoppingTools } from "./tools/shopping.js";
import { registerPaymentTools } from "./tools/payment.js";
import { registerResourceTools } from "./tools/resources.js";
import { registerA2ATools } from "./tools/a2a.js";
import { registerERC8004Tools } from "./tools/erc8004.js";
import { createMCPHandler } from "./base-handler.js";

/**
 * Initialize all MCP tools
 * Call this once at server startup
 */
export function initializeMCPTools(): void {
  registerShoppingTools();
  registerPaymentTools();
  registerResourceTools();
  registerA2ATools();
  registerERC8004Tools();

  console.log("[MCP] All tools initialized");
}

/**
 * Create pre-configured MCP handlers
 */
export function createMCPServers() {
  // Shopping Agent - e-commerce tools
  const shoppingHandler = createMCPHandler({
    serverInfo: {
      name: "x402-shopping-agent",
      version: "2.0.0",
      description: "E-commerce shopping tools for browsing stores and checkout",
    },
    category: "shopping",
  });

  // Payment Agent - blockchain payment tools
  const paymentHandler = createMCPHandler({
    serverInfo: {
      name: "x402-payment-agent",
      version: "2.0.0",
      description: "EVM blockchain payment tools for Cronos, Ethereum, and more",
    },
    category: "payment",
  });

  // Resource Agent - x402 resource access tools
  const resourceHandler = createMCPHandler({
    serverInfo: {
      name: "x402-resource-agent",
      version: "2.0.0",
      description: "Tools for accessing payment-gated resources",
    },
    category: "resources",
  });

  // A2A Agent - agent-to-agent protocol tools
  const a2aHandler = createMCPHandler({
    serverInfo: {
      name: "x402-a2a-agent",
      version: "2.0.0",
      description: "A2A protocol tools for agent-to-agent commerce with x402 payments",
    },
    category: "a2a",
  });

  // ERC-8004 Agent - trustless agent identity, reputation, and validation tools
  const erc8004Handler = createMCPHandler({
    serverInfo: {
      name: "x402-erc8004-agent",
      version: "1.0.0",
      description: "ERC-8004 Trustless Agents: on-chain identity, reputation, and validation",
    },
    category: "erc8004",
  });

  // Universal Agent - all tools
  const universalHandler = createMCPHandler({
    serverInfo: {
      name: "x402-universal-agent",
      version: "2.0.0",
      description: "Complete x402 agent with shopping, payment, and resource access",
    },
    // No category filter = all tools
  });

  return {
    shopping: shoppingHandler,
    payment: paymentHandler,
    resources: resourceHandler,
    a2a: a2aHandler,
    erc8004: erc8004Handler,
    universal: universalHandler,
  };
}
