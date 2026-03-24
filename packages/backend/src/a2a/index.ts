/**
 * A2A Module — Agent-to-Agent Protocol with x402 Payment Extension
 *
 * Exports the A2A handler, AgentCard builder, and task manager
 * for integration into the Express server.
 */

// Route handlers
export { handleA2ARequest } from "./handler.js";
export { handleAgentCard, buildAgentCard } from "./agent-card.js";

// Task management
export {
  createPurchaseTask,
  createResourceTask,
  processPayment,
  createCartFromIntent,
  processPaymentMandate,
  getTask,
  cancelTask,
  listTasks,
  TaskNotFoundError,
  InvalidStateError,
} from "./task-manager.js";

// Converters
export {
  toAP2Requirements,
  fromAP2Payload,
  toAP2Receipt,
  fromAP2Requirements,
  buildPaymentRequest,
  buildCartMandate,
  buildPaymentReceipt,
  extractX402ProofFromPaymentResponse,
} from "./converters.js";

// Types
export type {
  A2ATask,
  A2ATaskState,
  A2AMessage,
  A2AArtifact,
  A2ATaskStatus,
  A2AJsonRpcRequest,
  A2AJsonRpcResponse,
  AP2PaymentRequirements,
  AP2PaymentPayload,
  AP2SettleResponse,
  AgentCard,
  AgentSkill,
  AgentCapabilities,
  AgentExtension,
  A2AAction,
  PurchaseAction,
  ResourceAccessAction,
  PaymentSubmitAction,
  IntentMandateAction,
  PaymentMandateAction,
  Part,
  TextPart,
  DataPart,
  FilePart,
  A2ARole,
  AP2PaymentStatus,
  AP2NetworkInfo,
  // W3C Payment Request types
  PaymentCurrencyAmount,
  PaymentItem,
  PaymentMethodData,
  PaymentDetailsInit,
  AP2PaymentRequest,
  AP2PaymentResponse,
  // AP2 Mandate types
  IntentMandate,
  CartMandate,
  CartContents,
  PaymentMandate,
  PaymentMandateContents,
  PaymentReceipt,
  PaymentReceiptStatus,
} from "./types.js";

export {
  X402_EXTENSION_URI,
  AP2_EXTENSION_URI,
  X402_PAYMENT_METHOD,
  AP2_DATA_KEYS,
  A2A_PROTOCOL_VERSION,
  A2A_ERRORS,
} from "./types.js";
