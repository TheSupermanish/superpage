/**
 * Order tracking tools for SuperPage x402.
 */

import {
  SERVER_URL,
  CURRENCY,
} from "../config.js";
import { getExplorerUrl } from "../wallet.js";

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLS = [
  {
    name: "x402_order_status",
    description: "Get the status and details of an existing order by order ID.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID (returned from x402_buy)",
        },
      },
      required: ["orderId"],
    },
  },
  {
    name: "x402_list_orders",
    description:
      "List all completed orders for a store. Shows order IDs, amounts, status, and payment details.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID (e.g., shopify/store-name). Get from x402_list_stores.",
        },
      },
      required: ["storeId"],
    },
  },
  {
    name: "x402_list_order_intents",
    description:
      "List pending (unpaid) order intents for a store. These are checkouts that were started but not yet paid.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID (e.g., shopify/store-name). Get from x402_list_stores.",
        },
      },
      required: ["storeId"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function getOrderStatus(orderId) {
  const res = await fetch(`${SERVER_URL}/x402/orders/${orderId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to get order: ${res.status}` };
  }

  return await res.json();
}

async function listOrders(storeId) {
  const res = await fetch(`${SERVER_URL}/x402/stores/${encodeURIComponent(storeId)}/orders`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list orders: ${res.status}` };
  }

  const data = await res.json();
  const orders = data.orders || data.data?.orders || [];

  return {
    storeId,
    orders: orders.map((o) => ({
      id: o.orderId || o._id,
      shopifyOrderId: o.shopifyOrderId,
      status: o.status,
      total: o.total || o.amounts?.total,
      currency: o.currency || CURRENCY,
      email: o.email,
      txHash: o.transactionHash || o.txHash,
      explorer: o.transactionHash ? getExplorerUrl(o.transactionHash) : null,
      createdAt: o.createdAt,
      items: o.items,
    })),
    count: orders.length,
  };
}

async function listOrderIntents(storeId) {
  const res = await fetch(`${SERVER_URL}/x402/stores/${encodeURIComponent(storeId)}/order-intents`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list order intents: ${res.status}` };
  }

  const data = await res.json();
  const intents = data.orderIntents || data.data?.orderIntents || [];

  return {
    storeId,
    orderIntents: intents.map((oi) => ({
      id: oi.orderIntentId || oi._id,
      status: oi.status,
      total: oi.total || oi.amounts?.total,
      currency: oi.currency || CURRENCY,
      email: oi.email,
      expiresAt: oi.expiresAt,
      createdAt: oi.createdAt,
      items: oi.items,
    })),
    count: intents.length,
  };
}

export const handlers = {
  x402_order_status: (args) => getOrderStatus(args.orderId),
  x402_list_orders: (args) => listOrders(args.storeId),
  x402_list_order_intents: (args) => listOrderIntents(args.storeId),
};
