import { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * MCP Server Handler for x402 Shopping Agent
 * Implements JSON-RPC 2.0 protocol for tool access
 */

let mcpServerInstance: McpServer | null = null;

/**
 * Initialize MCP server with tools
 */
async function initializeMCPServer(): Promise<McpServer> {
  if (mcpServerInstance) {
    return mcpServerInstance;
  }

  const server = new McpServer({
    name: "x402-shopping-agent",
    version: "1.0.0",
  });

  // Register list_stores tool
  server.tool(
    "list_stores",
    "Get a list of all available stores",
    {},
    async () => {
      return await handleListStores();
    }
  );

  // Register get_store_products tool
  server.tool(
    "get_store_products",
    "Get all products available in a specific store",
    {
      storeId: z.string().describe("The ID of the store"),
    },
    async (args) => {
      return await handleGetStoreProducts(args as { storeId: string });
    }
  );

  // Register initiate_checkout tool
  server.tool(
    "initiate_checkout",
    "Initiate checkout for selected items (PHASE 1)",
    {
      storeId: z.string().describe("The ID of the store"),
      items: z
        .array(
          z.object({
            productId: z.string().describe("The product variant ID"),
            quantity: z.number().describe("Quantity to purchase"),
          })
        )
        .describe("Array of items to purchase"),
      email: z.string().describe("Buyer email address"),
      shippingAddress: z.object({
        name: z.string().describe("Full name"),
        address1: z.string().describe("Street address"),
        city: z.string().describe("City"),
        state: z.string().optional().describe("State/Province"),
        postalCode: z.string().describe("Postal code"),
        country: z.string().describe("Country"),
      }),
    },
    async (args) => {
      return await handleInitiateCheckout(args as any);
    }
  );

  // Register finalize_checkout tool
  server.tool(
    "finalize_checkout",
    "Finalize checkout after user confirms payment (PHASE 2)",
    {
      storeId: z.string().describe("The ID of the store"),
      orderIntentId: z
        .string()
        .describe("The order intent ID from Phase 1 (402 response)"),
      items: z
        .array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
          })
        )
        .describe("Same items array from Phase 1"),
      email: z.string().describe("Buyer email address (same as Phase 1)"),
      shippingAddress: z.object({
        name: z.string(),
        address1: z.string(),
        city: z.string(),
        state: z.string().optional(),
        postalCode: z.string(),
        country: z.string(),
      }),
      paymentProof: z.object({
        transactionHash: z.string().describe("EVM transaction hash (0x...)"),
        network: z
          .string()
          .describe("Network ID where transaction was executed (e.g. base-sepolia, bite-v2-sandbox, base)"),
        chainId: z.number().optional().describe("Chain ID of the network"),
        timestamp: z.number().describe("Unix timestamp of payment"),
      }),
    },
    async (args) => {
      return await handleFinalizeCheckout(args as any);
    }
  );

  // Register get_order_details tool
  server.tool(
    "get_order_details",
    "Get order details by order ID",
    {
      orderId: z.string().describe("The order ID to retrieve details for"),
    },
    async (args) => {
      return await handleGetOrderDetails(args as { orderId: string });
    }
  );

  mcpServerInstance = server;
  return server;
}

/**
 * Handle MCP requests via HTTP using JSON-RPC 2.0 protocol
 */
export async function handleMCPRequest(req: Request, res: Response) {
  const requestId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${requestId}] 🤖 MCP HTTP Request Received (JSON-RPC 2.0)`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const body = req.body;
    console.log(`[${requestId}] 📨 Request body:`, JSON.stringify(body, null, 2));

    // Initialize MCP server
    console.log(`[${requestId}] 📌 Initializing MCP server...`);
    await initializeMCPServer();
    console.log(`[${requestId}] ✓ MCP server ready`);

    // Handle JSON-RPC 2.0 request
    console.log(`[${requestId}] ⚙️  Processing JSON-RPC request...`);
    const jsonRpcRequest = body;
    const method = jsonRpcRequest.method;
    const params = jsonRpcRequest.params || {};
    const id = jsonRpcRequest.id;

    console.log(`[${requestId}] 🔧 Method: ${method}`);
    console.log(`[${requestId}] 📝 Params:`, JSON.stringify(params, null, 2));

    let jsonRpcResponse: any;

    // Handle different JSON-RPC methods
    if (method === "initialize") {
      console.log(`[${requestId}] 🔌 Handling initialize request...`);
      jsonRpcResponse = {
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
            name: "x402-shopping-agent",
            version: "1.0.0",
          },
        },
      };
      console.log(`[${requestId}] ✅ Initialize response prepared`);
    } else if (method === "tools/list") {
      console.log(`[${requestId}] 🔧 Handling tools/list request...`);
      const tools = [
        {
          name: "list_stores",
          description: "Get a list of all available stores",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "get_store_products",
          description: "Get all products available in a specific store",
          inputSchema: {
            type: "object",
            properties: {
              storeId: {
                type: "string",
                description: "The ID of the store",
              },
            },
            required: ["storeId"],
          },
        },
        {
          name: "initiate_checkout",
          description: "Initiate checkout for selected items (PHASE 1)",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    productId: { type: "string" },
                    quantity: { type: "number" },
                  },
                },
              },
              email: { type: "string" },
              shippingAddress: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address1: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  postalCode: { type: "string" },
                  country: { type: "string" },
                },
              },
            },
            required: ["storeId", "items", "email", "shippingAddress"],
          },
        },
        {
          name: "finalize_checkout",
          description: "Finalize checkout after user confirms payment (PHASE 2)",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string" },
              orderIntentId: { type: "string" },
              items: { type: "array" },
              email: { type: "string" },
              shippingAddress: { type: "object" },
              paymentProof: {
                type: "object",
                properties: {
                  transactionHash: { type: "string", description: "EVM transaction hash (0x...)" },
                  network: { type: "string", description: "Network ID (e.g. base-sepolia, bite-v2-sandbox, base, mainnet)" },
                  chainId: { type: "number", description: "Chain ID" },
                  timestamp: { type: "number", description: "Unix timestamp" },
                },
              },
            },
            required: ["storeId", "orderIntentId", "items", "email", "shippingAddress", "paymentProof"],
          },
        },
        {
          name: "get_order_details",
          description: "Get order details by order ID",
          inputSchema: {
            type: "object",
            properties: {
              orderId: {
                type: "string",
                description: "The order ID to retrieve details for",
              },
            },
            required: ["orderId"],
          },
        },
      ];

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: { tools },
      };
      console.log(`[${requestId}] ✅ Tools list prepared (${tools.length} tools)`);
    } else if (method === "tools/call") {
      console.log(`[${requestId}] 🔨 Handling tools/call request...`);
      const toolName = params.name;
      const toolArgs = params.arguments || {};

      console.log(`[${requestId}] 📝 Tool name: ${toolName}`);
      console.log(`[${requestId}] 📋 Tool arguments:`, JSON.stringify(toolArgs, null, 2));

      let toolResult;
      switch (toolName) {
        case "list_stores":
          console.log(`[${requestId}] → Calling handleListStores...`);
          toolResult = await handleListStores();
          break;
        case "get_store_products":
          console.log(`[${requestId}] → Calling handleGetStoreProducts...`);
          toolResult = await handleGetStoreProducts(toolArgs);
          break;
        case "initiate_checkout":
          console.log(`[${requestId}] → Calling handleInitiateCheckout...`);
          toolResult = await handleInitiateCheckout(toolArgs);
          break;
        case "finalize_checkout":
          console.log(`[${requestId}] → Calling handleFinalizeCheckout...`);
          toolResult = await handleFinalizeCheckout(toolArgs);
          break;
        case "get_order_details":
          console.log(`[${requestId}] → Calling handleGetOrderDetails...`);
          toolResult = await handleGetOrderDetails(toolArgs);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      console.log(`[${requestId}] ✅ Tool execution completed`);
      console.log(`[${requestId}] 📊 Tool result:`, JSON.stringify(toolResult, null, 2));

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(toolResult, null, 2),
            },
          ],
        },
      };

      console.log(`[${requestId}] 📨 JSON-RPC Response:`, JSON.stringify(jsonRpcResponse, null, 2));
    } else {
      console.error(`[${requestId}] ❌ Unknown JSON-RPC method: ${method}`);
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] 📤 Sending JSON-RPC response...`);
    console.log(`[${requestId}] ⏱️  Request completed in ${duration}ms`);
    console.log(`[${requestId}] ${'='.repeat(76)}\n`);

    return res.status(200).json(jsonRpcResponse);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Request processing failed`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name);
    console.error(`[${requestId}] Error message:`, error?.message);
    console.error(`[${requestId}] Stack:`, error?.stack);
    console.log(`[${requestId}] ⏱️  Request failed after ${duration}ms`);
    console.log(`[${requestId}] ${'='.repeat(76)}\n`);

    return res.status(200).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal server error",
        data: error.message,
      },
    });
  }
}

/**
 * Helper to call backend APIs
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function callBackendAPI(
  endpoint: string,
  method: string = "GET",
  body?: any,
  headers?: any
): Promise<any> {
  const url = `${BACKEND_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: response.status,
    data,
  };
}

/**
 * Handler: List all available stores
 */
async function handleListStores(): Promise<any> {
  console.log(`[handleListStores] 🏪 Starting list stores handler...`);
  console.log(`[handleListStores] 📡 Calling backend API: GET /x402/stores`);

  const result = await callBackendAPI("/x402/stores");

  console.log(`[handleListStores] 📥 Backend response status: ${result.status}`);
  console.log(`[handleListStores] 📦 Response data:`, JSON.stringify(result.data, null, 2));

  if (result.status !== 200) {
    console.error(`[handleListStores] ❌ API call failed`);
    return {
      error: "Failed to fetch stores",
      status: result.status,
      details: result.data,
    };
  }

  console.log(`[handleListStores] ✅ API call successful`);
  // Backend returns { success: true, data: { stores: [...] } }
  const stores = Array.isArray(result.data) 
    ? result.data 
    : (result.data?.data?.stores || result.data?.stores || []);
  console.log(`[handleListStores] 📋 Found ${stores.length} store(s)`);
  stores.forEach((store: any, idx: number) => {
    console.log(`[handleListStores]   ${idx + 1}. ${store.name} (${store.id})`);
  });

  const response = {
    success: true,
    stores: stores,
  };
  console.log(`[handleListStores] 📤 Returning response:`, JSON.stringify(response, null, 2));
  return response;
}

/**
 * Handler: Get products from a store
 */
async function handleGetStoreProducts(args: any): Promise<any> {
  const storeId = String(args.storeId);
  const encodedStoreId = encodeURIComponent(storeId);
  console.log(`[handleGetStoreProducts] 🔍 Store ID: ${storeId} → Encoded: ${encodedStoreId}`);
  
  const result = await callBackendAPI(`/x402/stores/${encodedStoreId}/products`);
  
  console.log(`[handleGetStoreProducts] 📥 Response status: ${result.status}`);
  
  if (result.status !== 200) {
    console.error(`[handleGetStoreProducts] ❌ API call failed:`, result.data);
    return {
      error: "Failed to fetch products",
      status: result.status,
      details: result.data,
    };
  }
  
  const products = result.data.products || [];
  console.log(`[handleGetStoreProducts] ✅ Found ${products.length} product(s)`);
  
  return {
    success: true,
    storeId,
    products,
  };
}

/**
 * Handler: Initiate checkout (PHASE 1)
 */
async function handleInitiateCheckout(args: any): Promise<any> {
  const checkoutBody = {
    storeId: args.storeId,
    items: args.items,
    email: args.email,
    shippingAddress: args.shippingAddress,
    clientReferenceId: `agent_${Date.now()}`,
  };

  const result = await callBackendAPI("/x402/checkout", "POST", checkoutBody);

  if (result.status === 402) {
    // Expected response - payment required
    return {
      success: true,
      phase: "1_payment_required",
      orderIntentId: result.data.orderIntentId,
      amounts: result.data.amounts,
      paymentRequirements: result.data.paymentRequirements,
      message: `Payment Required: ${result.data.amounts.total} ${result.data.amounts.currency}`,
    };
  }

  return {
    error: "Unexpected response from checkout",
    status: result.status,
    details: result.data,
  };
}

/**
 * Handler: Finalize checkout (PHASE 2)
 */
async function handleFinalizeCheckout(args: any): Promise<any> {
  const paymentProof = args.paymentProof as {
    transactionHash: string;
    network: string;
    chainId?: number;
    timestamp: number;
  };

  const checkoutBody = {
    storeId: args.storeId,
    items: args.items,
    email: args.email,
    shippingAddress: args.shippingAddress,
    orderIntentId: args.orderIntentId,
    clientReferenceId: `agent_${Date.now()}`,
  };

  // Send payment proof in X-PAYMENT header as JSON (not base64)
  const result = await callBackendAPI("/x402/checkout", "POST", checkoutBody, {
    "X-PAYMENT": JSON.stringify(paymentProof),
  });

  if (result.status === 200) {
    // Successful order
    return {
      success: true,
      phase: "2_order_confirmed",
      orderId: result.data.orderId,
      shopifyOrderId: result.data.shopifyOrderId,
      status: result.data.status,
      amounts: result.data.amounts,
      message: `Order confirmed! Order ID: ${result.data.orderId}`,
    };
  }

  if (result.status === 402) {
    // Payment verification failed - need to retry
    return {
      error: "Payment verification failed",
      status: 402,
      details: result.data,
      message: "Payment could not be verified. Please retry.",
    };
  }

  return {
    error: "Unexpected response from checkout finalization",
    status: result.status,
    details: result.data,
  };
}

/**
 * Handler: Get order details
 */
async function handleGetOrderDetails(args: any): Promise<any> {
  const orderId = String(args.orderId);
  const result = await callBackendAPI(`/x402/orders/${orderId}`);

  if (result.status !== 200) {
    return {
      error: "Failed to fetch order details",
      status: result.status,
      details: result.data,
    };
  }

  return {
    success: true,
    order: result.data,
  };
}
