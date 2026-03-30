/**
 * Discovery and resource tools for SuperPage x402.
 */

import {
  SERVER_URL,
  NETWORK,
  CURRENCY,
  TOKEN_DECIMALS,
} from "../config.js";

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLS = [
  {
    name: "x402_discover",
    description:
      "Probe any URL to check if it supports x402 payments. Returns payment requirements if the resource requires payment.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to check for x402 support (any HTTP endpoint)",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          description: "HTTP method to use (default: GET)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "x402_list_resources",
    description:
      "List all public x402 resources (APIs, files, articles). Returns resource IDs, prices, types, and full URLs. IMPORTANT: Use the 'url' field directly with x402_request - it contains the correct server URL.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["api", "file", "article", "shopify"],
          description: "Filter by resource type (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of resources to return (default: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "x402_search_resources",
    description:
      "Search resources by keyword across name and description. Filter by type (api, file, article). Returns matching resources with prices and URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword (e.g., 'weather', 'typescript', 'AI')",
        },
        type: {
          type: "string",
          enum: ["api", "file", "article"],
          description: "Filter by resource type (optional)",
        },
      },
      required: ["query"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function discoverX402(url, method = "GET") {
  try {
    const res = await fetch(url, { method });

    if (res.status === 402) {
      const paymentReq = await res.json();
      return {
        x402Enabled: true,
        status: 402,
        paymentRequired: {
          amountRaw: paymentReq.amount,
          amount:
            paymentReq.amount && !isNaN(paymentReq.amount)
              ? (parseInt(paymentReq.amount) / (10 ** TOKEN_DECIMALS)).toFixed(6)
              : null,
          currency: paymentReq.currency || CURRENCY,
          network: paymentReq.network || "ethereum",
          payTo: paymentReq.payTo,
          description: paymentReq.description,
        },
        message: "This endpoint requires payment. Use x402_request to pay and access.",
      };
    }

    return {
      x402Enabled: false,
      status: res.status,
      message: `Endpoint returned ${res.status} - no payment required`,
    };
  } catch (err) {
    return { error: `Failed to probe ${url}: ${err.message}` };
  }
}

async function listResources(type, limit = 50) {
  let url = `${SERVER_URL}/x402/resources?limit=${limit}`;
  if (type) {
    url += `&type=${type}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list resources: ${res.status}` };
  }

  const data = await res.json();

  return {
    serverUrl: SERVER_URL,
    resources: (data.resources || []).map((r) => ({
      id: r.id,
      slug: r.slug,
      type: r.type,
      name: r.name,
      description: r.description,
      price: r.priceUsdc,
      priceFormatted: `${r.priceUsdc} ${CURRENCY}`,
      accessCount: r.accessCount,
      endpoint: r.endpoint,
      // Full URL for direct use - always use SERVER_URL
      url: `${SERVER_URL}${r.endpoint}`,
      creator: r.creator,
    })),
    count: data.count || 0,
    currency: CURRENCY,
    network: NETWORK,
    note: `Use the 'url' field directly with x402_request. Base server: ${SERVER_URL}`,
  };
}

async function searchResources(query, type) {
  let url = `${SERVER_URL}/x402/resources?limit=50`;
  if (type) {
    url += `&type=${type}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to search resources: ${res.status}` };
  }

  const data = await res.json();
  const q = query.toLowerCase();

  const matched = (data.resources || []).filter((r) =>
    r.name?.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q) ||
    r.slug?.toLowerCase().includes(q)
  );

  return {
    query,
    type: type || "all",
    resources: matched.map((r) => ({
      id: r.id,
      slug: r.slug,
      type: r.type,
      name: r.name,
      description: r.description,
      price: r.priceUsdc,
      priceFormatted: `${r.priceUsdc} ${CURRENCY}`,
      url: `${SERVER_URL}${r.endpoint}`,
      creator: r.creator,
    })),
    count: matched.length,
    currency: CURRENCY,
    network: NETWORK,
  };
}

export const handlers = {
  x402_discover: (args) => discoverX402(args.url, args.method),
  x402_list_resources: (args) => listResources(args.type, args.limit),
  x402_search_resources: (args) => searchResources(args.query, args.type),
};
