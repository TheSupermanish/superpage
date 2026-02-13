/**
 * Shopping MCP Tools
 * 
 * Tools for e-commerce operations: stores, products, checkout
 */

import { z } from "zod";
import { toolRegistry, defineTool } from "../tool-registry.js";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// ============================================================
// Helper Functions
// ============================================================

async function callBackendAPI(
  endpoint: string,
  method: string = "GET",
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; data: any }> {
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

  return { status: response.status, data };
}

// ============================================================
// Tool Definitions
// ============================================================

const listStoresTool = defineTool({
  name: "list_stores",
  description: "Get a list of all available stores for shopping",
  inputSchema: z.object({}),
  handler: async () => {
    console.log(`[list_stores] 🏪 Fetching stores...`);
    
    const result = await callBackendAPI("/x402/stores");

    if (result.status !== 200) {
      return {
        success: false,
        error: "Failed to fetch stores",
        details: result.data,
      };
    }

    const stores = Array.isArray(result.data)
      ? result.data
      : result.data?.data?.stores || result.data?.stores || [];

    console.log(`[list_stores] ✅ Found ${stores.length} store(s)`);

    return {
      success: true,
      stores,
      count: stores.length,
    };
  },
});

const getStoreProductsTool = defineTool({
  name: "get_store_products",
  description: "Get all products available in a specific store",
  inputSchema: z.object({
    storeId: z.string().describe("The ID of the store"),
  }),
  handler: async ({ storeId }) => {
    console.log(`[get_store_products] 📦 Fetching products for store: ${storeId}`);
    
    const encodedStoreId = encodeURIComponent(storeId);
    const result = await callBackendAPI(`/x402/stores/${encodedStoreId}/products`);

    if (result.status !== 200) {
      return {
        success: false,
        error: "Failed to fetch products",
        details: result.data,
      };
    }

    const products = result.data.products || [];
    console.log(`[get_store_products] ✅ Found ${products.length} product(s)`);

    return {
      success: true,
      storeId,
      products,
      count: products.length,
    };
  },
});

const initiateCheckoutTool = defineTool({
  name: "initiate_checkout",
  description: "Initiate checkout for selected items. Returns payment requirements (Phase 1 of 2-phase checkout).",
  inputSchema: z.object({
    storeId: z.string().describe("The ID of the store"),
    items: z.array(
      z.object({
        productId: z.string().describe("The product variant ID"),
        quantity: z.number().describe("Quantity to purchase"),
      })
    ).describe("Array of items to purchase"),
    email: z.string().describe("Buyer email address"),
    shippingAddress: z.object({
      name: z.string().describe("Full name"),
      address1: z.string().describe("Street address"),
      city: z.string().describe("City"),
      state: z.string().optional().describe("State/Province"),
      postalCode: z.string().describe("Postal code"),
      country: z.string().describe("Country code (e.g., US, UK)"),
    }),
  }),
  handler: async ({ storeId, items, email, shippingAddress }) => {
    console.log(`[initiate_checkout] 🛒 Starting checkout for ${items.length} item(s)`);

    const checkoutBody = {
      storeId,
      items,
      email,
      shippingAddress,
      clientReferenceId: `agent_${Date.now()}`,
    };

    const result = await callBackendAPI("/x402/checkout", "POST", checkoutBody);

    if (result.status === 402) {
      console.log(`[initiate_checkout] ✅ Payment required - Phase 1 complete`);
      return {
        success: true,
        phase: "1_payment_required",
        orderIntentId: result.data.orderIntentId,
        amounts: result.data.amounts,
        paymentRequirements: result.data.paymentRequirements,
        message: `Payment Required: ${result.data.amounts.total} ${result.data.amounts.currency}`,
        nextStep: "Make payment using make_payment tool, then call finalize_checkout",
      };
    }

    return {
      success: false,
      error: "Unexpected response from checkout",
      status: result.status,
      details: result.data,
    };
  },
});

const finalizeCheckoutTool = defineTool({
  name: "finalize_checkout",
  description: "Finalize checkout after payment is made. Requires payment proof from make_payment tool (Phase 2 of 2-phase checkout).",
  inputSchema: z.object({
    storeId: z.string().describe("The ID of the store"),
    orderIntentId: z.string().describe("The order intent ID from Phase 1"),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
      })
    ).describe("Same items array from Phase 1"),
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
      network: z.string().describe("Network ID (e.g. bite-v2-sandbox, base, mainnet)"),
      chainId: z.number().optional().describe("Chain ID of the network"),
      timestamp: z.number().describe("Unix timestamp of payment"),
    }),
  }),
  handler: async ({ storeId, orderIntentId, items, email, shippingAddress, paymentProof }) => {
    console.log(`[finalize_checkout] 📝 Finalizing order: ${orderIntentId}`);

    const checkoutBody = {
      storeId,
      items,
      email,
      shippingAddress,
      orderIntentId,
      clientReferenceId: `agent_${Date.now()}`,
    };

    const result = await callBackendAPI("/x402/checkout", "POST", checkoutBody, {
      "X-PAYMENT": JSON.stringify(paymentProof),
    });

    if (result.status === 200) {
      console.log(`[finalize_checkout] ✅ Order confirmed: ${result.data.orderId}`);
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
      return {
        success: false,
        error: "Payment verification failed",
        status: 402,
        details: result.data,
        message: "Payment could not be verified. Please check transaction and retry.",
      };
    }

    return {
      success: false,
      error: "Checkout finalization failed",
      status: result.status,
      details: result.data,
    };
  },
});

const getOrderDetailsTool = defineTool({
  name: "get_order_details",
  description: "Get details of a completed order by order ID",
  inputSchema: z.object({
    orderId: z.string().describe("The order ID to retrieve"),
  }),
  handler: async ({ orderId }) => {
    console.log(`[get_order_details] 📋 Fetching order: ${orderId}`);

    const result = await callBackendAPI(`/x402/orders/${orderId}`);

    if (result.status !== 200) {
      return {
        success: false,
        error: "Failed to fetch order details",
        status: result.status,
        details: result.data,
      };
    }

    return {
      success: true,
      order: result.data,
    };
  },
});

// ============================================================
// Register all shopping tools
// ============================================================

export function registerShoppingTools(): void {
  toolRegistry.register(listStoresTool, "shopping");
  toolRegistry.register(getStoreProductsTool, "shopping");
  toolRegistry.register(initiateCheckoutTool, "shopping");
  toolRegistry.register(finalizeCheckoutTool, "shopping");
  toolRegistry.register(getOrderDetailsTool, "shopping");
  
  console.log("[Shopping Tools] ✅ Registered 5 tools");
}
