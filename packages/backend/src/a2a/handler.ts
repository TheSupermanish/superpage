/**
 * A2A JSON-RPC 2.0 Handler
 *
 * Dispatches A2A protocol methods:
 *  - message/send   → create task or process payment
 *  - tasks/get      → get task by ID
 *  - tasks/cancel   → cancel a task
 */

import { Request, Response } from "express";
import type {
  A2AJsonRpcRequest,
  A2AJsonRpcResponse,
  A2AAction,
  PurchaseAction,
  ResourceAccessAction,
  PaymentSubmitAction,
  IntentMandateAction,
  PaymentMandateAction,
  AP2PaymentPayload,
  Part,
} from "./types.js";
import { A2A_ERRORS, AP2_DATA_KEYS } from "./types.js";
import {
  createPurchaseTask,
  createResourceTask,
  processPayment,
  createCartFromIntent,
  processPaymentMandate,
  getTask,
  cancelTask,
  TaskNotFoundError,
  InvalidStateError,
} from "./task-manager.js";

/**
 * Main A2A request handler
 * POST /a2a
 */
export async function handleA2ARequest(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    const body: A2AJsonRpcRequest = req.body;
    const { method, params = {}, id } = body;

    console.log(`[A2A] ${method} (id: ${id})`);

    let response: A2AJsonRpcResponse;

    switch (method) {
      case "message/send":
        response = await handleMessageSend(id, params);
        break;

      case "tasks/get":
        response = handleTasksGet(id, params);
        break;

      case "tasks/cancel":
        response = handleTasksCancel(id, params);
        break;

      default:
        response = errorResponse(id, A2A_ERRORS.METHOD_NOT_FOUND.code, `Method not found: ${method}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[A2A] ${method} completed in ${duration}ms`);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("[A2A] Unhandled error:", error.message);

    return res.status(200).json(
      errorResponse(
        req.body?.id || null,
        A2A_ERRORS.INTERNAL.code,
        "Internal server error",
        error.message
      )
    );
  }
}

// ============================================================
// Method Handlers
// ============================================================

/**
 * Handle message/send
 *
 * Inspects the message parts for a structured action:
 *  - purchase → create purchase task with payment requirements
 *  - access-resource → create resource task with payment requirements
 *  - submit-payment → verify payment for existing task
 */
async function handleMessageSend(
  id: string | number | null,
  params: Record<string, unknown>
): Promise<A2AJsonRpcResponse> {
  const message = params.message as { role?: string; parts?: Part[] } | undefined;
  if (!message?.parts || !Array.isArray(message.parts)) {
    return errorResponse(id, A2A_ERRORS.INVALID_PARAMS.code, "Missing message.parts");
  }

  // Extract action from data parts (simple actions or AP2 mandates)
  const action = extractAction(message.parts) || extractAP2Action(message.parts);
  if (!action) {
    return errorResponse(
      id,
      A2A_ERRORS.INVALID_ACTION.code,
      "No valid action found in message. Expected a data part with {action: ...} or an AP2 mandate data key."
    );
  }

  switch (action.action) {
    case "purchase": {
      const result = await createPurchaseTask(action as PurchaseAction);
      return successResponse(id, result.task);
    }

    case "access-resource": {
      console.log(`[A2A] access-resource action:`, JSON.stringify(action));
      const result = await createResourceTask(action as ResourceAccessAction);
      return successResponse(id, result.task);
    }

    case "submit-payment": {
      const submitAction = action as PaymentSubmitAction;
      if (!submitAction.taskId || !submitAction.payment) {
        return errorResponse(
          id,
          A2A_ERRORS.INVALID_PARAMS.code,
          "submit-payment requires taskId and payment object"
        );
      }

      try {
        const result = await processPayment(
          submitAction.taskId,
          submitAction.payment as AP2PaymentPayload
        );
        return successResponse(id, result.task);
      } catch (err: any) {
        if (err instanceof TaskNotFoundError) {
          return errorResponse(id, A2A_ERRORS.TASK_NOT_FOUND.code, err.message);
        }
        if (err instanceof InvalidStateError) {
          return errorResponse(id, A2A_ERRORS.INVALID_ACTION.code, err.message);
        }
        return errorResponse(id, A2A_ERRORS.PAYMENT_FAILED.code, err.message);
      }
    }

    case "ap2:intent-mandate": {
      const intentAction = action as IntentMandateAction;
      try {
        const result = await createCartFromIntent(intentAction.mandate);
        return successResponse(id, result.task);
      } catch (err: any) {
        return errorResponse(id, A2A_ERRORS.INTERNAL.code, err.message);
      }
    }

    case "ap2:payment-mandate": {
      const pmAction = action as PaymentMandateAction;
      if (!pmAction.taskId || !pmAction.mandate) {
        return errorResponse(
          id,
          A2A_ERRORS.INVALID_PARAMS.code,
          "ap2:payment-mandate requires taskId and mandate object"
        );
      }
      try {
        const result = await processPaymentMandate(
          pmAction.taskId,
          pmAction.mandate
        );
        return successResponse(id, result.task);
      } catch (err: any) {
        if (err instanceof TaskNotFoundError) {
          return errorResponse(id, A2A_ERRORS.TASK_NOT_FOUND.code, err.message);
        }
        if (err instanceof InvalidStateError) {
          return errorResponse(id, A2A_ERRORS.INVALID_ACTION.code, err.message);
        }
        return errorResponse(id, A2A_ERRORS.PAYMENT_FAILED.code, err.message);
      }
    }

    default:
      return errorResponse(
        id,
        A2A_ERRORS.INVALID_ACTION.code,
        `Unknown action: ${(action as any).action}`
      );
  }
}

/**
 * Handle tasks/get
 */
function handleTasksGet(
  id: string | number | null,
  params: Record<string, unknown>
): A2AJsonRpcResponse {
  const taskId = params.id as string;
  if (!taskId) {
    return errorResponse(id, A2A_ERRORS.INVALID_PARAMS.code, "Missing params.id");
  }

  const task = getTask(taskId);
  if (!task) {
    return errorResponse(id, A2A_ERRORS.TASK_NOT_FOUND.code, `Task not found: ${taskId}`);
  }

  return successResponse(id, task);
}

/**
 * Handle tasks/cancel
 */
function handleTasksCancel(
  id: string | number | null,
  params: Record<string, unknown>
): A2AJsonRpcResponse {
  const taskId = params.id as string;
  if (!taskId) {
    return errorResponse(id, A2A_ERRORS.INVALID_PARAMS.code, "Missing params.id");
  }

  try {
    const task = cancelTask(taskId);
    return successResponse(id, task);
  } catch (err: any) {
    if (err instanceof TaskNotFoundError) {
      return errorResponse(id, A2A_ERRORS.TASK_NOT_FOUND.code, err.message);
    }
    if (err instanceof InvalidStateError) {
      return errorResponse(id, A2A_ERRORS.INVALID_ACTION.code, err.message);
    }
    return errorResponse(id, A2A_ERRORS.INTERNAL.code, err.message);
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extract a structured action from message parts.
 * Looks for a DataPart with an `action` field.
 */
function extractAction(parts: Part[]): A2AAction | null {
  for (const part of parts) {
    if (part.type === "data" && part.data && typeof part.data.action === "string") {
      return part.data as unknown as A2AAction;
    }
  }
  return null;
}

/**
 * Extract an AP2 mandate action from message parts.
 * Looks for DataParts with AP2 data keys (e.g. "ap2.mandates.IntentMandate").
 */
function extractAP2Action(parts: Part[]): A2AAction | null {
  for (const part of parts) {
    if (part.type !== "data" || !part.data) continue;

    // IntentMandate
    if (part.data[AP2_DATA_KEYS.INTENT_MANDATE]) {
      return {
        action: "ap2:intent-mandate",
        mandate: part.data[AP2_DATA_KEYS.INTENT_MANDATE],
      } as unknown as IntentMandateAction;
    }

    // PaymentMandate
    if (part.data[AP2_DATA_KEYS.PAYMENT_MANDATE]) {
      const taskId = (part.data as any).taskId || (part.data as any).task_id;
      return {
        action: "ap2:payment-mandate",
        taskId,
        mandate: part.data[AP2_DATA_KEYS.PAYMENT_MANDATE],
      } as unknown as PaymentMandateAction;
    }
  }
  return null;
}

function successResponse(
  id: string | number | null,
  result: unknown
): A2AJsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): A2AJsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message, data },
  };
}
