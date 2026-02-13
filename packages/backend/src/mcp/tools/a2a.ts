/**
 * A2A MCP Tools
 *
 * MCP tools that expose A2A functionality to connected agents,
 * allowing them to discover the AgentCard, send A2A messages,
 * and manage tasks via the MCP protocol.
 */

import { z } from "zod";
import { toolRegistry, defineTool } from "../tool-registry.js";
import { buildAgentCard } from "../../a2a/agent-card.js";
import {
  createPurchaseTask,
  createResourceTask,
  processPayment,
  createCartFromIntent,
  processPaymentMandate,
  getTask,
  listTasks,
} from "../../a2a/task-manager.js";
import type { IntentMandate, PaymentMandate } from "../../a2a/types.js";

// ============================================================
// Tool Definitions
// ============================================================

const getAgentCardTool = defineTool({
  name: "get_agent_card",
  description:
    "Get this server's A2A AgentCard, which describes supported skills, payment networks, and the A2A endpoint URL.",
  inputSchema: z.object({}),
  handler: async () => {
    const baseUrl = process.env.APP_URL || "http://localhost:3001";
    const card = buildAgentCard(baseUrl);
    return { success: true, agentCard: card };
  },
});

const sendA2AMessageTool = defineTool({
  name: "send_a2a_message",
  description:
    "Send an A2A message to initiate a purchase or resource access task. Returns a task with payment requirements.",
  inputSchema: z.object({
    action: z
      .enum(["purchase", "access-resource"])
      .describe("The action type"),
    storeId: z
      .string()
      .optional()
      .describe("Store ID (required for purchase)"),
    productId: z
      .string()
      .optional()
      .describe("Product ID (required for purchase)"),
    quantity: z
      .number()
      .optional()
      .describe("Quantity (for purchase, defaults to 1)"),
    resourceId: z
      .string()
      .optional()
      .describe("Resource ID (required for access-resource)"),
  }),
  handler: async ({ action, storeId, productId, quantity, resourceId }) => {
    if (action === "purchase") {
      if (!storeId || !productId) {
        return {
          success: false,
          error: "storeId and productId are required for purchase",
        };
      }
      const result = await createPurchaseTask({
        action: "purchase",
        storeId,
        productId,
        quantity,
      });
      return {
        success: true,
        task: result.task,
        paymentRequirements: result.paymentRequirements,
      };
    }

    if (action === "access-resource") {
      if (!resourceId) {
        return {
          success: false,
          error: "resourceId is required for access-resource",
        };
      }
      const result = await createResourceTask({
        action: "access-resource",
        resourceId,
      });
      return {
        success: true,
        task: result.task,
        paymentRequirements: result.paymentRequirements,
      };
    }

    return { success: false, error: `Unknown action: ${action}` };
  },
});

const submitA2APaymentTool = defineTool({
  name: "submit_a2a_payment",
  description:
    "Submit a payment proof for an existing A2A task. The payment must have been made on-chain before calling this.",
  inputSchema: z.object({
    taskId: z.string().describe("The A2A task ID to submit payment for"),
    transactionHash: z
      .string()
      .describe("The on-chain transaction hash (0x...)"),
    network: z.string().describe("The network where the transaction was made"),
    chainId: z.number().describe("The chain ID"),
  }),
  handler: async ({ taskId, transactionHash, network, chainId }) => {
    try {
      const result = await processPayment(taskId, {
        transactionHash,
        network,
        chainId,
        timestamp: Date.now(),
      });
      return {
        success: result.task.status.state === "completed",
        task: result.task,
        receipt: result.receipt,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});

const getA2ATaskTool = defineTool({
  name: "get_a2a_task",
  description: "Get the current status and details of an A2A task by ID.",
  inputSchema: z.object({
    taskId: z.string().describe("The A2A task ID"),
  }),
  handler: async ({ taskId }) => {
    const task = getTask(taskId);
    if (!task) {
      return { success: false, error: `Task not found: ${taskId}` };
    }
    return { success: true, task };
  },
});

const listA2ATasksTool = defineTool({
  name: "list_a2a_tasks",
  description:
    "List A2A tasks, optionally filtered by state.",
  inputSchema: z.object({
    state: z
      .string()
      .optional()
      .describe(
        "Filter by task state: submitted, working, input-required, completed, failed, canceled"
      ),
  }),
  handler: async ({ state }) => {
    const all = listTasks(state as any);
    return {
      success: true,
      tasks: all,
      count: all.length,
    };
  },
});

// ============================================================
// AP2 Mandate Tools
// ============================================================

const sendAP2IntentTool = defineTool({
  name: "send_ap2_intent",
  description:
    "Send an AP2 IntentMandate to start a mandate-based shopping flow. Returns a CartMandate with W3C PaymentRequest using x402 as payment method.",
  inputSchema: z.object({
    description: z
      .string()
      .describe("Natural language description of what the user wants to buy"),
    skus: z
      .array(z.string())
      .optional()
      .describe("Optional SKU or product IDs to match"),
    userConfirmationRequired: z
      .boolean()
      .optional()
      .describe("Whether the user must confirm the cart (default true)"),
    expiresInMinutes: z
      .number()
      .optional()
      .describe("Intent expiry in minutes (default 30)"),
  }),
  handler: async ({
    description,
    skus,
    userConfirmationRequired,
    expiresInMinutes,
  }) => {
    const expiryMs = (expiresInMinutes || 30) * 60 * 1000;
    const intent: IntentMandate = {
      natural_language_description: description,
      user_cart_confirmation_required: userConfirmationRequired ?? true,
      skus,
      intent_expiry: new Date(Date.now() + expiryMs).toISOString(),
    };

    try {
      const result = await createCartFromIntent(intent);
      return {
        success: result.task.status.state !== "failed",
        task: result.task,
        cartMandate: result.cartMandate,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});

const submitAP2PaymentMandateTool = defineTool({
  name: "submit_ap2_payment_mandate",
  description:
    "Submit an AP2 PaymentMandate with x402 payment proof for an existing cart task. Verifies on-chain and returns a PaymentReceipt.",
  inputSchema: z.object({
    taskId: z.string().describe("The A2A task ID from the cart creation step"),
    transactionHash: z
      .string()
      .describe("The on-chain transaction hash (0x...)"),
    network: z
      .string()
      .optional()
      .describe("Network where tx was made (defaults to configured chain)"),
    chainId: z
      .number()
      .optional()
      .describe("Chain ID (defaults to configured chain)"),
  }),
  handler: async ({ taskId, transactionHash, network, chainId }) => {
    // Build a PaymentMandate from the provided proof
    const mandate: PaymentMandate = {
      payment_mandate_contents: {
        payment_mandate_id: `pm_${Date.now()}`,
        payment_details_id: taskId,
        payment_details_total: {
          label: "Total",
          amount: { currency: "USD", value: 0 }, // Will be resolved from task
        },
        payment_response: {
          request_id: taskId,
          method_name: "https://www.x402.org/",
          details: {
            transactionHash,
            network: network || undefined,
            chainId: chainId || undefined,
            timestamp: Date.now(),
          },
        },
        merchant_agent:
          process.env.APP_URL || "http://localhost:3001",
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const result = await processPaymentMandate(taskId, mandate);
      return {
        success: result.task.status.state === "completed",
        task: result.task,
        receipt: result.receipt,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});

// ============================================================
// Register all A2A tools
// ============================================================

export function registerA2ATools(): void {
  toolRegistry.register(getAgentCardTool, "a2a");
  toolRegistry.register(sendA2AMessageTool, "a2a");
  toolRegistry.register(submitA2APaymentTool, "a2a");
  toolRegistry.register(getA2ATaskTool, "a2a");
  toolRegistry.register(listA2ATasksTool, "a2a");
  toolRegistry.register(sendAP2IntentTool, "a2a");
  toolRegistry.register(submitAP2PaymentMandateTool, "a2a");

  console.log("[A2A Tools] Registered 7 tools (5 A2A + 2 AP2)");
}
