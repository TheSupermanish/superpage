/**
 * Base MCP Handler
 * 
 * Shared JSON-RPC 2.0 handler that can be used by any MCP server.
 * Handles protocol methods (initialize, tools/list, tools/call).
 */

import { Request, Response } from "express";
import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  MCPServerInfo 
} from "./types.js";
import { toolRegistry } from "./tool-registry.js";

export interface MCPHandlerOptions {
  /** Server info for initialize response */
  serverInfo: MCPServerInfo;
  /** Tool names to expose (if undefined, exposes all tools) */
  tools?: string[];
  /** Tool category to expose */
  category?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Create an MCP HTTP handler
 */
export function createMCPHandler(options: MCPHandlerOptions) {
  const { serverInfo, tools, category, verbose = true } = options;

  return async function handler(req: Request, res: Response) {
    const requestId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    const log = verbose 
      ? (...args: any[]) => console.log(`[${requestId}]`, ...args)
      : () => {};

    log(`\n${"=".repeat(80)}`);
    log(`🤖 ${serverInfo.name} - MCP Request (JSON-RPC 2.0)`);
    log(`${"=".repeat(80)}`);

    try {
      const body: JsonRpcRequest = req.body;
      const { method, params = {}, id } = body;

      log(`📨 Method: ${method}`);
      if (verbose && params && Object.keys(params).length > 0) {
        log(`📋 Params:`, JSON.stringify(params, null, 2));
      }

      let response: JsonRpcResponse;

      switch (method) {
        case "initialize":
          response = handleInitialize(id, serverInfo);
          break;

        case "tools/list":
          response = handleToolsList(id, tools, category);
          break;

        case "tools/call":
          response = await handleToolsCall(id, params, tools, category, log);
          break;

        case "resources/list":
          response = handleResourcesList(id);
          break;

        case "prompts/list":
          response = handlePromptsList(id);
          break;

        default:
          response = {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }

      const duration = Date.now() - startTime;
      log(`⏱️  Completed in ${duration}ms\n`);

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Error:`, error.message);

      return res.status(200).json({
        jsonrpc: "2.0",
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: "Internal server error",
          data: error.message,
        },
      } as JsonRpcResponse);
    }
  };
}

/**
 * Handle initialize request
 */
function handleInitialize(
  id: string | number | null, 
  serverInfo: MCPServerInfo
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      protocolVersion: "2025-06-18",
      capabilities: {
        tools: {},
        resources: { subscribe: false },
        prompts: {},
      },
      serverInfo: {
        name: serverInfo.name,
        version: serverInfo.version,
      },
    },
  };
}

/**
 * Handle tools/list request
 */
function handleToolsList(
  id: string | number | null,
  toolNames?: string[],
  category?: string
): JsonRpcResponse {
  // Get tool names to include
  let names = toolNames;
  if (!names && category) {
    names = toolRegistry.getNamesByCategory(category);
  }

  const tools = toolRegistry.getMetadata(names);

  return {
    jsonrpc: "2.0",
    id,
    result: { tools },
  };
}

/**
 * Handle tools/call request
 */
async function handleToolsCall(
  id: string | number | null,
  params: Record<string, any>,
  allowedTools?: string[],
  category?: string,
  log: (...args: any[]) => void = () => {}
): Promise<JsonRpcResponse> {
  const { name: toolName, arguments: toolArgs = {} } = params;

  // Check if tool is allowed
  if (allowedTools && !allowedTools.includes(toolName)) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Tool not available: ${toolName}`,
      },
    };
  }

  if (category) {
    const categoryTools = toolRegistry.getNamesByCategory(category);
    if (!categoryTools.includes(toolName)) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Tool not available in this server: ${toolName}`,
        },
      };
    }
  }

  log(`🔨 Executing tool: ${toolName}`);
  
  const result = await toolRegistry.execute(toolName, toolArgs);
  
  log(`✅ Tool result:`, JSON.stringify(result, null, 2).substring(0, 500));

  return {
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
}

/**
 * Handle resources/list (empty for now)
 */
function handleResourcesList(id: string | number | null): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result: { resources: [] },
  };
}

/**
 * Handle prompts/list (empty for now)
 */
function handlePromptsList(id: string | number | null): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result: { prompts: [] },
  };
}
