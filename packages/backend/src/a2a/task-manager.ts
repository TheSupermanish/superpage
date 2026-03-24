/**
 * A2A Task Manager
 *
 * Manages A2A task lifecycle with x402 payment integration.
 * Tasks flow: submitted → input-required (payment) → working → completed
 */

import crypto from "crypto";
import { createPublicClient, http, type Hash } from "viem";
import type {
  A2ATask,
  A2ATaskState,
  A2AMessage,
  A2AArtifact,
  AP2PaymentRequirements,
  AP2PaymentPayload,
  AP2SettleResponse,
  PurchaseAction,
  ResourceAccessAction,
  IntentMandate,
  CartMandate,
  PaymentMandate,
  PaymentReceipt,
} from "./types.js";
import { AP2_DATA_KEYS } from "./types.js";
import {
  toAP2Requirements,
  toAP2Receipt,
  buildPaymentRequest,
  buildCartMandate,
  buildPaymentReceipt,
  extractX402ProofFromPaymentResponse,
} from "./converters.js";
import { createPaymentRequirements } from "../utils/x402-payment-helpers.js";
import {
  getChainConfig,
  getChainMetadata,
  isValidNetwork,
  SPAY_SCHEME,
  type NetworkId,
} from "../config/chain-config.js";

// Lazy import to avoid circular dependency at module load
async function getVerifyFn() {
  const { verifyPaymentTransaction } = await import(
    "../../../x402-sdk-eth/src/evm-utils.js"
  );
  return verifyPaymentTransaction;
}

// ============================================================
// In-memory task store
// ============================================================

const tasks = new Map<string, A2ATask>();

// Store payment requirements alongside tasks
const taskPaymentReqs = new Map<string, AP2PaymentRequirements>();

// Store cart mandates for AP2 payment mandate processing
const taskCartMandates = new Map<string, CartMandate>();

// ============================================================
// Public API
// ============================================================

/**
 * Create a new task from a purchase action.
 * Returns the task in `input-required` state with payment requirements.
 */
export async function createPurchaseTask(
  action: PurchaseAction
): Promise<{ task: A2ATask; paymentRequirements: AP2PaymentRequirements }> {
  const taskId = generateTaskId();
  const requestId = crypto.randomUUID();

  // Look up product price from store
  const price = await resolveProductPrice(action.storeId, action.productId);
  const quantity = action.quantity || 1;

  const totalStr = (price * quantity).toFixed(2);
  const amounts = {
    subtotal: totalStr,
    shipping: "0.00",
    tax: "0.00",
    total: totalStr,
    currency: "USD",
  };

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  // Generate x402 payment requirements using existing helper
  const x402Reqs = createPaymentRequirements(
    requestId,
    amounts,
    expiresAt
  );
  const x402Req = x402Reqs[0] as Record<string, any>;

  // Convert to AP2 format
  const chainConfig = getChainConfig();
  const ap2Reqs = toAP2Requirements(
    {
      scheme: (x402Req.scheme || SPAY_SCHEME) as any,
      network: chainConfig.network as any,
      chainId: chainConfig.chainId,
      amount: x402Req.amount,
      token: (x402Req.token || x402Req.asset || chainConfig.currency) as any,
      recipient: x402Req.recipient || x402Req.payTo,
      requestId,
    },
    requestId,
    expiresAt.toISOString()
  );

  // Create task
  const task: A2ATask = {
    id: taskId,
    status: {
      state: "input-required",
      message: {
        role: "agent",
        parts: [
          {
            type: "text",
            text: `Payment of ${amounts.total} ${ap2Reqs.asset} required for purchase.`,
          },
          {
            type: "data",
            data: {
              paymentRequirements: ap2Reqs,
              action: "purchase",
              storeId: action.storeId,
              productId: action.productId,
              quantity,
            },
          },
        ],
      },
      timestamp: new Date().toISOString(),
    },
    metadata: {
      requestId,
      action: "purchase",
      storeId: action.storeId,
      productId: action.productId,
      quantity,
    },
  };

  tasks.set(taskId, task);
  taskPaymentReqs.set(taskId, ap2Reqs);

  console.log(`[A2A] Created purchase task ${taskId} — ${amounts.total} ${ap2Reqs.asset}`);

  return { task, paymentRequirements: ap2Reqs };
}

/**
 * Create a new task for resource access.
 * Returns the task in `input-required` state with payment requirements.
 */
export async function createResourceTask(
  action: ResourceAccessAction
): Promise<{ task: A2ATask; paymentRequirements: AP2PaymentRequirements }> {
  const taskId = generateTaskId();
  const requestId = crypto.randomUUID();

  // Look up resource price
  const price = await resolveResourcePrice(action.resourceId);

  const totalStr = price.toFixed(2);
  const amounts = {
    subtotal: totalStr,
    shipping: "0.00",
    tax: "0.00",
    total: totalStr,
    currency: "USD",
  };

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const x402Reqs = createPaymentRequirements(requestId, amounts, expiresAt);
  const x402Req = x402Reqs[0] as Record<string, any>;

  const chainConfig = getChainConfig();
  const ap2Reqs = toAP2Requirements(
    {
      scheme: (x402Req.scheme || SPAY_SCHEME) as any,
      network: chainConfig.network as any,
      chainId: chainConfig.chainId,
      amount: x402Req.amount,
      token: (x402Req.token || x402Req.asset || chainConfig.currency) as any,
      recipient: x402Req.recipient || x402Req.payTo,
      requestId,
    },
    requestId,
    expiresAt.toISOString()
  );

  const task: A2ATask = {
    id: taskId,
    status: {
      state: "input-required",
      message: {
        role: "agent",
        parts: [
          {
            type: "text",
            text: `Payment of ${amounts.total} ${ap2Reqs.asset} required for resource access.`,
          },
          {
            type: "data",
            data: {
              paymentRequirements: ap2Reqs,
              action: "access-resource",
              resourceId: action.resourceId,
            },
          },
        ],
      },
      timestamp: new Date().toISOString(),
    },
    metadata: {
      requestId,
      action: "access-resource",
      resourceId: action.resourceId,
    },
  };

  tasks.set(taskId, task);
  taskPaymentReqs.set(taskId, ap2Reqs);

  console.log(`[A2A] Created resource task ${taskId} — ${amounts.total} ${ap2Reqs.asset}`);

  return { task, paymentRequirements: ap2Reqs };
}

/**
 * Process a payment submission for an existing task.
 * Verifies the on-chain transaction and transitions the task to completed or failed.
 */
export async function processPayment(
  taskId: string,
  payload: AP2PaymentPayload
): Promise<{ task: A2ATask; receipt?: AP2SettleResponse }> {
  const task = tasks.get(taskId);
  if (!task) {
    throw new TaskNotFoundError(taskId);
  }

  if (task.status.state !== "input-required") {
    throw new InvalidStateError(taskId, task.status.state, "input-required");
  }

  // Transition to working
  updateTaskState(task, "working", {
    role: "agent",
    parts: [{ type: "text", text: "Verifying payment on-chain..." }],
  });

  try {
    const paymentReqs = taskPaymentReqs.get(taskId);
    if (!paymentReqs) {
      throw new Error("Payment requirements not found for task");
    }

    // Build x402 PaymentRequirements for verification
    const net = paymentReqs.networks[0];
    const x402Reqs = {
      scheme: paymentReqs.scheme as any,
      network: net.network as any,
      chainId: net.chainId,
      amount: paymentReqs.amount,
      token: paymentReqs.asset as any,
      recipient: paymentReqs.payTo,
      requestId: paymentReqs.requestId,
    };

    // Create public client for on-chain verification
    let rpcUrl = net.rpcUrl;
    if (!rpcUrl && isValidNetwork(net.network)) {
      rpcUrl = getChainMetadata(net.network as NetworkId).rpcUrl;
    }
    if (!rpcUrl) {
      throw new Error(`No RPC URL for network ${net.network}`);
    }

    const publicClient = createPublicClient({ transport: http(rpcUrl) });

    // Verify on-chain
    const verifyPaymentTransaction = await getVerifyFn();
    const isValid = await verifyPaymentTransaction(
      publicClient as any,
      payload.transactionHash as Hash,
      x402Reqs
    );

    if (!isValid) {
      updateTaskState(task, "failed", {
        role: "agent",
        parts: [
          { type: "text", text: "Payment verification failed. Transaction did not meet requirements." },
        ],
      });
      return { task };
    }

    // Build receipt
    const receipt = toAP2Receipt(
      payload.transactionHash,
      net.network,
      net.chainId,
      undefined, // payer — could be extracted from tx
      undefined  // blockNumber
    );

    // Add receipt as artifact
    const artifact: A2AArtifact = {
      name: "payment-receipt",
      description: "On-chain payment verification receipt",
      parts: [
        {
          type: "data",
          data: receipt as unknown as Record<string, unknown>,
        },
      ],
      index: 0,
    };

    task.artifacts = [artifact];

    // Include actual resource content for resource-access tasks
    const resourceContent = await resolveResourceContent(task);
    if (resourceContent) {
      task.artifacts.push({
        name: "resource-content",
        description: resourceContent.name as string | undefined,
        parts: [
          {
            type: "data",
            data: resourceContent as unknown as Record<string, unknown>,
          },
        ],
        index: 1,
      });
    }

    updateTaskState(task, "completed", {
      role: "agent",
      parts: [
        {
          type: "text",
          text: resourceContent?.content
            ? "Payment verified. Here is the content:"
            : "Payment verified successfully.",
        },
        { type: "data", data: receipt as unknown as Record<string, unknown> },
        ...(resourceContent
          ? [
              {
                type: "data" as const,
                data: resourceContent as unknown as Record<string, unknown>,
              },
            ]
          : []),
      ],
    });

    console.log(`[A2A] Task ${taskId} completed — tx: ${payload.transactionHash}`);

    return { task, receipt };
  } catch (err: any) {
    if (err instanceof TaskNotFoundError || err instanceof InvalidStateError) {
      throw err;
    }

    console.error(`[A2A] Payment processing error for task ${taskId}:`, err.message);

    updateTaskState(task, "failed", {
      role: "agent",
      parts: [{ type: "text", text: `Payment processing error: ${err.message}` }],
    });

    return { task };
  }
}

/**
 * Get a task by ID
 */
export function getTask(taskId: string): A2ATask | undefined {
  return tasks.get(taskId);
}

/**
 * Cancel a task
 */
export function cancelTask(taskId: string): A2ATask {
  const task = tasks.get(taskId);
  if (!task) {
    throw new TaskNotFoundError(taskId);
  }

  if (task.status.state === "completed" || task.status.state === "failed") {
    throw new InvalidStateError(taskId, task.status.state, "cancelable state");
  }

  updateTaskState(task, "canceled", {
    role: "agent",
    parts: [{ type: "text", text: "Task canceled by request." }],
  });

  // Clean up payment requirements
  taskPaymentReqs.delete(taskId);

  return task;
}

/**
 * List all tasks, optionally filtered by state
 */
export function listTasks(state?: A2ATaskState): A2ATask[] {
  const all = Array.from(tasks.values());
  if (!state) return all;
  return all.filter((t) => t.status.state === state);
}

// ============================================================
// AP2 Mandate Public API
// ============================================================

/**
 * Create a task from an AP2 IntentMandate (Shopping Agent → Merchant Agent).
 *
 * 1. Resolves products matching the intent (SKU or keyword search)
 * 2. Builds a W3C PaymentRequest with x402 as payment method
 * 3. Wraps it in a CartMandate artifact
 * 4. Returns task in `input-required` state waiting for PaymentMandate
 */
export async function createCartFromIntent(
  intent: IntentMandate
): Promise<{ task: A2ATask; cartMandate: CartMandate }> {
  const taskId = generateTaskId();
  const cartId = crypto.randomUUID();
  const expiresAt = new Date(intent.intent_expiry);

  // Resolve products from intent
  const items = await resolveProductsFromIntent(intent);

  if (items.length === 0) {
    // No products matched — return task in failed state
    const task: A2ATask = {
      id: taskId,
      status: {
        state: "failed",
        message: {
          role: "agent",
          parts: [
            {
              type: "text",
              text: `No products found matching: "${intent.natural_language_description}"`,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      },
      metadata: { action: "ap2:intent-mandate" },
    };
    tasks.set(taskId, task);

    // Return an empty cart mandate for type consistency
    const emptyCartMandate: CartMandate = {
      contents: {
        id: cartId,
        user_cart_confirmation_required: intent.user_cart_confirmation_required,
        payment_request: buildPaymentRequest(cartId, []),
        cart_expiry: expiresAt.toISOString(),
        merchant_name: process.env.STORE_NAME || "x402 Everything",
      },
    };
    return { task, cartMandate: emptyCartMandate };
  }

  // Build W3C PaymentRequest with x402 method
  const paymentRequest = buildPaymentRequest(cartId, items);

  // Wrap in CartMandate
  const cartMandate = buildCartMandate(
    cartId,
    process.env.STORE_NAME || "x402 Everything",
    paymentRequest,
    expiresAt,
    intent.user_cart_confirmation_required
  );

  const totalValue = items.reduce((sum, i) => sum + i.priceUsd, 0);

  const task: A2ATask = {
    id: taskId,
    status: {
      state: "input-required",
      message: {
        role: "agent",
        parts: [
          {
            type: "text",
            text: `Cart ready: ${items.length} item(s), total $${totalValue.toFixed(2)} USD. Submit PaymentMandate to proceed.`,
          },
          {
            type: "data",
            data: {
              [AP2_DATA_KEYS.CART_MANDATE]: cartMandate as unknown as Record<string, unknown>,
            },
          },
        ],
      },
      timestamp: new Date().toISOString(),
    },
    artifacts: [
      {
        name: "cart-mandate",
        description: "AP2 CartMandate with W3C PaymentRequest",
        parts: [
          {
            type: "data",
            data: cartMandate as unknown as Record<string, unknown>,
          },
        ],
        index: 0,
      },
    ],
    metadata: {
      action: "ap2:intent-mandate",
      cartId,
      itemCount: items.length,
      totalUsd: totalValue,
    },
  };

  tasks.set(taskId, task);
  taskCartMandates.set(taskId, cartMandate);

  console.log(
    `[A2A/AP2] Created cart task ${taskId} — ${items.length} items, $${totalValue.toFixed(2)} USD`
  );

  return { task, cartMandate };
}

/**
 * Process an AP2 PaymentMandate (Shopping Agent submits payment proof).
 *
 * 1. Extracts x402 proof from PaymentResponse.details
 * 2. Verifies on-chain via verifyPaymentTransaction()
 * 3. Returns PaymentReceipt artifact
 */
export async function processPaymentMandate(
  taskId: string,
  mandate: PaymentMandate
): Promise<{ task: A2ATask; receipt: PaymentReceipt }> {
  const task = tasks.get(taskId);
  if (!task) {
    throw new TaskNotFoundError(taskId);
  }

  if (task.status.state !== "input-required") {
    throw new InvalidStateError(taskId, task.status.state, "input-required");
  }

  // Transition to working
  updateTaskState(task, "working", {
    role: "agent",
    parts: [{ type: "text", text: "Verifying x402 payment on-chain..." }],
  });

  const mandateContents = mandate.payment_mandate_contents;
  const paymentResponse = mandateContents.payment_response;

  try {
    // Extract x402 proof from PaymentResponse.details
    const proof = extractX402ProofFromPaymentResponse(paymentResponse);
    if (!proof) {
      const failReceipt = buildPaymentReceipt(
        mandateContents.payment_mandate_id,
        "",
        mandateContents.payment_details_total.amount,
        false,
        "No x402 payment proof found in PaymentResponse.details"
      );
      addReceiptArtifact(task, failReceipt);
      updateTaskState(task, "failed", {
        role: "agent",
        parts: [
          { type: "text", text: "No x402 payment proof found in PaymentResponse." },
          {
            type: "data",
            data: { [AP2_DATA_KEYS.PAYMENT_RECEIPT]: failReceipt as unknown as Record<string, unknown> },
          },
        ],
      });
      return { task, receipt: failReceipt };
    }

    // Resolve RPC URL
    const chainConfig = getChainConfig();
    let rpcUrl: string | undefined;
    if (isValidNetwork(proof.network)) {
      rpcUrl = getChainMetadata(proof.network as NetworkId).rpcUrl;
    }
    if (!rpcUrl) {
      rpcUrl = getChainMetadata(chainConfig.network).rpcUrl;
    }

    const publicClient = createPublicClient({ transport: http(rpcUrl) });

    // Build verification requirements from cart mandate or chain config
    const x402Reqs = {
      scheme: SPAY_SCHEME as any,
      network: (proof.network || chainConfig.network) as any,
      chainId: proof.chainId || chainConfig.chainId,
      amount: String(mandateContents.payment_details_total.amount.value),
      token: chainConfig.currency as any,
      recipient:
        process.env.X402_RECIPIENT_ADDRESS ||
        process.env.ETH_RECIPIENT_ADDRESS ||
        "",
      requestId: mandateContents.payment_mandate_id,
    };

    const verifyPaymentTransaction = await getVerifyFn();
    const isValid = await verifyPaymentTransaction(
      publicClient as any,
      proof.transactionHash as Hash,
      x402Reqs
    );

    const receipt = buildPaymentReceipt(
      mandateContents.payment_mandate_id,
      proof.transactionHash,
      mandateContents.payment_details_total.amount,
      isValid,
      isValid ? undefined : "On-chain verification failed"
    );

    addReceiptArtifact(task, receipt);

    if (isValid) {
      updateTaskState(task, "completed", {
        role: "agent",
        parts: [
          { type: "text", text: "Payment verified. Receipt issued." },
          {
            type: "data",
            data: { [AP2_DATA_KEYS.PAYMENT_RECEIPT]: receipt as unknown as Record<string, unknown> },
          },
        ],
      });
      console.log(
        `[A2A/AP2] Task ${taskId} completed — tx: ${proof.transactionHash}`
      );
    } else {
      updateTaskState(task, "failed", {
        role: "agent",
        parts: [
          { type: "text", text: "Payment verification failed on-chain." },
          {
            type: "data",
            data: { [AP2_DATA_KEYS.PAYMENT_RECEIPT]: receipt as unknown as Record<string, unknown> },
          },
        ],
      });
    }

    // Clean up stored cart mandate
    taskCartMandates.delete(taskId);

    return { task, receipt };
  } catch (err: any) {
    if (err instanceof TaskNotFoundError || err instanceof InvalidStateError) {
      throw err;
    }

    console.error(
      `[A2A/AP2] Payment mandate error for task ${taskId}:`,
      err.message
    );

    const errReceipt = buildPaymentReceipt(
      mandateContents.payment_mandate_id,
      "",
      mandateContents.payment_details_total.amount,
      false,
      err.message
    );
    addReceiptArtifact(task, errReceipt);

    updateTaskState(task, "failed", {
      role: "agent",
      parts: [
        { type: "text", text: `Payment mandate error: ${err.message}` },
      ],
    });

    return { task, receipt: errReceipt };
  }
}

// ============================================================
// Helpers
// ============================================================

function generateTaskId(): string {
  return `task_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

function updateTaskState(
  task: A2ATask,
  state: A2ATaskState,
  message?: A2AMessage
): void {
  task.status = {
    state,
    message,
    timestamp: new Date().toISOString(),
  };
  tasks.set(task.id, task);
}

/**
 * Resolve product price from the database.
 * Falls back to a default if not found.
 */
async function resolveProductPrice(
  storeId: string,
  productId: string
): Promise<number> {
  try {
    const { StoreProduct } = await import("../models/index.js");
    const product = await StoreProduct.findOne({
      storeId,
      _id: productId,
    });
    if (product?.price) {
      return typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price;
    }
  } catch {
    // Model may not exist in test environments
  }
  // Fallback price
  return 1.0;
}

/**
 * Resolve products from an AP2 IntentMandate.
 * Matches by SKU if provided, otherwise keyword search in product titles.
 */
async function resolveProductsFromIntent(
  intent: IntentMandate
): Promise<Array<{ label: string; priceUsd: number }>> {
  try {
    const { StoreProduct } = await import("../models/index.js");

    // Try SKU match first
    if (intent.skus && intent.skus.length > 0) {
      const products = await StoreProduct.find({
        $or: [
          { sku: { $in: intent.skus } },
          { _id: { $in: intent.skus } },
        ],
      }).limit(20);

      if (products.length > 0) {
        return products.map((p: any) => ({
          label: p.name || p.title || `Product ${p._id}`,
          priceUsd:
            typeof p.price === "string" ? parseFloat(p.price) : p.price || 1.0,
        }));
      }
    }

    // Keyword search from natural language description
    const keywords = intent.natural_language_description
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (keywords.length > 0) {
      const regexPattern = keywords.join("|");
      const products = await StoreProduct.find({
        $or: [
          { name: { $regex: regexPattern, $options: "i" } },
          { title: { $regex: regexPattern, $options: "i" } },
          { description: { $regex: regexPattern, $options: "i" } },
        ],
      }).limit(10);

      if (products.length > 0) {
        return products.map((p: any) => ({
          label: p.name || p.title || `Product ${p._id}`,
          priceUsd:
            typeof p.price === "string" ? parseFloat(p.price) : p.price || 1.0,
        }));
      }
    }
  } catch {
    // Model may not exist in test environments
  }

  // Fallback: return a single placeholder product
  return [{ label: "Requested Item", priceUsd: 1.0 }];
}

/**
 * Add a PaymentReceipt as an artifact on the task.
 */
function addReceiptArtifact(task: A2ATask, receipt: PaymentReceipt): void {
  const artifact: A2AArtifact = {
    name: "payment-receipt",
    description: "AP2 PaymentReceipt",
    parts: [
      {
        type: "data",
        data: { [AP2_DATA_KEYS.PAYMENT_RECEIPT]: receipt as unknown as Record<string, unknown> },
      },
    ],
    index: task.artifacts ? task.artifacts.length : 0,
  };
  task.artifacts = [...(task.artifacts || []), artifact];
}

/**
 * Resolve actual resource content for completed tasks.
 * Returns null if task is not a resource-access task or content isn't available.
 */
async function resolveResourceContent(
  task: A2ATask
): Promise<Record<string, unknown> | null> {
  const metadata = task.metadata as Record<string, unknown> | undefined;
  if (metadata?.action !== "access-resource" || !metadata?.resourceId) {
    return null;
  }

  try {
    const { Resource } = await import("../models/index.js");
    const rid = metadata.resourceId as string;
    const resource =
      (await Resource.findById(rid).catch(() => null)) ||
      (await Resource.findOne({ slug: rid })) ||
      // Fuzzy fallback: match slug containing the resourceId or vice versa
      (await Resource.findOne({
        slug: { $regex: rid.replace(/[^a-z0-9]/gi, ".*"), $options: "i" },
      }).catch(() => null));

    if (!resource) return null;

    const config = resource.config as Record<string, unknown> | undefined;
    return {
      resourceId: metadata.resourceId,
      type: resource.type,
      name: resource.name,
      description: resource.description || null,
      content: config?.content || null,
      url: (config?.external_url || config?.upstream_url || config?.blog_url || null) as string | null,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve resource price from the database.
 */
async function resolveResourcePrice(resourceId: string): Promise<number> {
  try {
    const { Resource } = await import("../models/index.js");
    // Try by ID first, then by slug
    const resource =
      (await Resource.findById(resourceId).catch(() => null)) ||
      (await Resource.findOne({ slug: resourceId }));
    if (resource?.priceUsdc) {
      return typeof resource.priceUsdc === "string"
        ? parseFloat(resource.priceUsdc)
        : resource.priceUsdc;
    }
  } catch {
    // Model may not exist in test environments
  }
  // Fallback price
  return 0.5;
}

// ============================================================
// Error Classes
// ============================================================

export class TaskNotFoundError extends Error {
  constructor(public taskId: string) {
    super(`Task not found: ${taskId}`);
    this.name = "TaskNotFoundError";
  }
}

export class InvalidStateError extends Error {
  constructor(
    public taskId: string,
    public currentState: string,
    public expectedState: string
  ) {
    super(
      `Task ${taskId} is in state '${currentState}', expected '${expectedState}'`
    );
    this.name = "InvalidStateError";
  }
}
