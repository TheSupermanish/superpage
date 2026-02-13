/**
 * Resource MCP Tools
 * 
 * Tools for accessing x402 payment-gated resources (APIs, files, etc.)
 */

import { z } from "zod";
import { toolRegistry, defineTool } from "../tool-registry.js";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// ============================================================
// Helper Functions
// ============================================================

async function fetchResource(
  resourceId: string,
  paymentProof?: { transactionHash: string; network: string; chainId?: number; timestamp: number },
  walletAddress?: string
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  const walletQuery = walletAddress ? `?wallet=${walletAddress.toLowerCase()}` : "";
  const url = `${BACKEND_URL}/x402/resource/${resourceId}${walletQuery}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (paymentProof) {
    headers["X-PAYMENT"] = JSON.stringify(paymentProof);
  }

  const response = await fetch(url, { headers });
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return { status: response.status, data, headers: responseHeaders };
}

// ============================================================
// Tool Definitions
// ============================================================

const listResourcesTool = defineTool({
  name: "list_resources",
  description: "List all available x402 payment-gated resources (APIs, files, etc.)",
  inputSchema: z.object({
    type: z.string().optional().describe("Filter by resource type: api, file, article"),
  }),
  handler: async ({ type }) => {
    console.log(`[list_resources] 📋 Fetching resources...`);

    const url = type 
      ? `${BACKEND_URL}/x402/resources?type=${type}`
      : `${BACKEND_URL}/x402/resources`;

    const response = await fetch(url);
    const data = await response.json() as { resources?: any[] };

    if (response.status !== 200) {
      return {
        success: false,
        error: "Failed to fetch resources",
        details: data,
      };
    }

    const resources = data.resources || [];
    console.log(`[list_resources] ✅ Found ${resources.length} resource(s)`);

    return {
      success: true,
      resources: resources.map((r: any) => ({
        id: r.id || r._id,
        name: r.name,
        type: r.type,
        description: r.description,
        priceUsdc: r.priceUsdc,
        currency: r.currency || "USDC",
      })),
      count: resources.length,
    };
  },
});

const getResourceInfoTool = defineTool({
  name: "get_resource_info",
  description: "Get payment requirements for a specific resource (returns 402 info). Pass walletAddress to check if already paid.",
  inputSchema: z.object({
    resourceId: z.string().describe("The resource ID or slug (e.g., 'weather-api')"),
    walletAddress: z.string().optional().describe("Wallet address to check for prior payment (0x...)"),
  }),
  handler: async ({ resourceId, walletAddress }) => {
    console.log(`[get_resource_info] 🔍 Getting info for resource: ${resourceId}`);

    const result = await fetchResource(resourceId, undefined, walletAddress);

    if (result.status === 402) {
      return {
        success: true,
        requiresPayment: true,
        resourceId: result.data.resourceId,
        resourceName: result.data.resourceName,
        resourceType: result.data.resourceType,
        description: result.data.description,
        paymentRequirements: {
          network: result.data.network,
          chainId: result.data.chainId,
          token: result.data.token,
          amount: result.data.amount,
          recipient: result.data.recipient,
          scheme: result.data.scheme,
        },
        message: `Payment required: ${result.data.amount} base units of ${result.data.token}`,
        nextStep: "Use make_payment tool with the recipient and amount, then access_resource with payment proof",
      };
    }

    if (result.status === 200) {
      return {
        success: true,
        requiresPayment: false,
        message: "Resource is accessible without payment (or already paid)",
        data: result.data,
      };
    }

    return {
      success: false,
      error: "Failed to get resource info",
      status: result.status,
      details: result.data,
    };
  },
});

const accessResourceTool = defineTool({
  name: "access_resource",
  description: "Access a payment-gated resource with payment proof. Returns the actual resource data (API response, file, etc.). Pass walletAddress to skip payment if already paid.",
  inputSchema: z.object({
    resourceId: z.string().describe("The resource ID or slug (e.g., 'weather-api')"),
    walletAddress: z.string().optional().describe("Wallet address to check for prior payment (0x...)"),
    paymentProof: z.object({
      transactionHash: z.string().describe("EVM transaction hash (0x...)"),
      network: z.string().describe("Network where transaction was executed"),
      chainId: z.number().optional().describe("Chain ID"),
      timestamp: z.number().describe("Unix timestamp of payment"),
    }).optional().describe("Payment proof. Not needed if wallet already paid for this resource."),
  }),
  handler: async ({ resourceId, walletAddress, paymentProof }) => {
    console.log(`[access_resource] 🔓 Accessing resource: ${resourceId}`);
    if (paymentProof) {
      console.log(`[access_resource] 💳 Payment: ${paymentProof.transactionHash}`);
    } else if (walletAddress) {
      console.log(`[access_resource] 👛 Checking prior access for wallet: ${walletAddress}`);
    }

    const result = await fetchResource(resourceId, paymentProof, walletAddress);

    if (result.status === 200) {
      console.log(`[access_resource] ✅ Resource accessed successfully`);
      return {
        success: true,
        resourceId,
        data: result.data,
        message: "Resource accessed successfully with valid payment",
      };
    }

    if (result.status === 402) {
      return {
        success: false,
        error: "Payment verification failed or payment insufficient",
        status: 402,
        details: result.data,
        hint: "Make sure the transaction is confirmed and sent to the correct recipient with correct amount",
      };
    }

    return {
      success: false,
      error: "Failed to access resource",
      status: result.status,
      details: result.data,
    };
  },
});

// ============================================================
// Register all resource tools
// ============================================================

export function registerResourceTools(): void {
  toolRegistry.register(listResourcesTool, "resources");
  toolRegistry.register(getResourceInfoTool, "resources");
  toolRegistry.register(accessResourceTool, "resources");
  
  console.log("[Resource Tools] ✅ Registered 3 tools");
}
