/**
 * A2A (Agent-to-Agent) Protocol Types with x402 Payment Extension
 *
 * Based on Google's A2A specification and the a2a-x402 extension
 * for crypto payments within agent-to-agent communication.
 */

// ============================================================
// A2A Core Types
// ============================================================

/** A2A Task States */
export type A2ATaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled";

/** A2A Message roles */
export type A2ARole = "user" | "agent";

/** Content part types */
export interface TextPart {
  type: "text";
  text: string;
}

export interface DataPart {
  type: "data";
  data: Record<string, unknown>;
  mimeType?: string;
}

export interface FilePart {
  type: "file";
  file: {
    name: string;
    mimeType: string;
    bytes?: string; // base64
    uri?: string;
  };
}

export type Part = TextPart | DataPart | FilePart;

/** A2A Message */
export interface A2AMessage {
  role: A2ARole;
  parts: Part[];
  metadata?: Record<string, unknown>;
}

/** A2A Task Status */
export interface A2ATaskStatus {
  state: A2ATaskState;
  message?: A2AMessage;
  timestamp: string;
}

/** A2A Task Artifact — output produced by the agent */
export interface A2AArtifact {
  name?: string;
  description?: string;
  parts: Part[];
  index: number;
}

/** A2A Task */
export interface A2ATask {
  id: string;
  status: A2ATaskStatus;
  artifacts?: A2AArtifact[];
  history?: A2AMessage[];
  metadata?: Record<string, unknown>;
}

// ============================================================
// A2A JSON-RPC 2.0
// ============================================================

export interface A2AJsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface A2AJsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ============================================================
// A2A x402 Payment Extension Types
// ============================================================

/** Payment status within the A2A flow */
export type AP2PaymentStatus =
  | "payment-required"
  | "payment-submitted"
  | "payment-verified"
  | "payment-completed"
  | "payment-failed";

/** Payment requirements sent by merchant agent (maps from x402 PaymentRequirements) */
export interface AP2PaymentRequirements {
  /** x402 extension identifier */
  extensionUri: string;
  /** Supported blockchain networks */
  networks: AP2NetworkInfo[];
  /** Payment details */
  asset: string;        // Token symbol (USDC, CREDIT, etc.)
  amount: string;       // Amount in base units
  payTo: string;        // Recipient address
  /** Payment scheme */
  scheme: string;       // "spay", "exact", or "upto"
  /** Order reference */
  requestId?: string;
  /** Expiry as ISO string */
  expiresAt?: string;
  /** Additional context */
  memo?: string;
}

/** Network info for AP2 payment requirements */
export interface AP2NetworkInfo {
  network: string;      // e.g. "bite-v2-sandbox"
  chainId: number;
  rpcUrl?: string;
}

/** Payment payload sent by buyer agent */
export interface AP2PaymentPayload {
  transactionHash: string;
  network: string;
  chainId: number;
  timestamp: number;
  requestId?: string;
}

/** Settlement response from merchant agent */
export interface AP2SettleResponse {
  success: boolean;
  transactionHash: string;
  network: string;
  chainId: number;
  payer?: string;
  blockNumber?: string;
  explorerUrl?: string;
}

// ============================================================
// AgentCard (Agent Discovery)
// ============================================================

/** Skill advertised by the agent */
export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
}

/** Agent capabilities */
export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

/** Extension declaration */
export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  config?: Record<string, unknown>;
}

/** AgentCard — served at /.well-known/agent.json */
export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapabilities;
  skills: AgentSkill[];
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  extensions?: AgentExtension[];
  provider?: {
    organization: string;
    url?: string;
  };
}

// ============================================================
// Task Action Types (structured data in message parts)
// ============================================================

/** Purchase action from buyer agent */
export interface PurchaseAction {
  action: "purchase";
  storeId: string;
  productId: string;
  quantity?: number;
}

/** Resource access action */
export interface ResourceAccessAction {
  action: "access-resource";
  resourceId: string;
}

/** Payment submission action */
export interface PaymentSubmitAction {
  action: "submit-payment";
  taskId: string;
  payment: AP2PaymentPayload;
}

// ============================================================
// W3C Payment Request API Types (AP2)
// ============================================================

export interface PaymentCurrencyAmount {
  currency: string; // ISO 4217 e.g. "USD"
  value: number;
}

export interface PaymentItem {
  label: string;
  amount: PaymentCurrencyAmount;
  pending?: boolean;
  refund_period?: number; // days
}

export interface PaymentShippingOption {
  id: string;
  label: string;
  amount: PaymentCurrencyAmount;
  selected?: boolean;
}

export interface PaymentOptions {
  request_payer_name?: boolean;
  request_payer_email?: boolean;
  request_shipping?: boolean;
  shipping_type?: "shipping" | "delivery" | "pickup";
}

export interface PaymentMethodData {
  supported_methods: string; // "CARD" | "https://www.x402.org/"
  data?: Record<string, unknown>;
}

export interface PaymentDetailsModifier {
  supported_methods: string;
  total?: PaymentItem;
  additional_display_items?: PaymentItem[];
  data?: Record<string, unknown>;
}

export interface PaymentDetailsInit {
  id: string;
  display_items: PaymentItem[];
  shipping_options?: PaymentShippingOption[];
  modifiers?: PaymentDetailsModifier[];
  total: PaymentItem;
}

export interface AP2PaymentRequest {
  method_data: PaymentMethodData[];
  details: PaymentDetailsInit;
  options?: PaymentOptions;
  shipping_address?: ContactAddress;
}

export interface AP2PaymentResponse {
  request_id: string;
  method_name: string; // "https://www.x402.org/"
  details?: Record<string, unknown>; // x402 proof goes here
  shipping_address?: ContactAddress;
  payer_name?: string;
  payer_email?: string;
}

export interface ContactAddress {
  city?: string;
  country?: string;
  phone_number?: string;
  postal_code?: string;
  recipient?: string;
  region?: string;
  address_line?: string[];
}

// ============================================================
// AP2 Mandate Types
// ============================================================

/** IntentMandate — sent by Shopping Agent to Merchant Agent */
export interface IntentMandate {
  natural_language_description: string;
  user_cart_confirmation_required: boolean;
  merchants?: string[];
  skus?: string[];
  requires_refundability?: boolean;
  intent_expiry: string; // ISO 8601
}

/** CartContents — inner contents of a CartMandate */
export interface CartContents {
  id: string;
  user_cart_confirmation_required: boolean;
  payment_request: AP2PaymentRequest;
  cart_expiry: string; // ISO 8601
  merchant_name: string;
}

/** CartMandate — built by Merchant Agent, returned as artifact */
export interface CartMandate {
  contents: CartContents;
  merchant_authorization?: string; // JWT
}

/** PaymentMandateContents — inner contents of PaymentMandate */
export interface PaymentMandateContents {
  payment_mandate_id: string;
  payment_details_id: string;
  payment_details_total: PaymentItem;
  payment_response: AP2PaymentResponse;
  merchant_agent: string; // URL
  timestamp: string; // ISO 8601
}

/** PaymentMandate — sent by Shopping Agent with payment proof */
export interface PaymentMandate {
  payment_mandate_contents: PaymentMandateContents;
  user_authorization?: string;
}

// ============================================================
// AP2 Payment Receipt
// ============================================================

export interface PaymentReceiptSuccess {
  merchant_confirmation_id: string;
  psp_confirmation_id?: string;
  network_confirmation_id?: string;
}

export interface PaymentReceiptError {
  error_message: string;
}

export interface PaymentReceiptFailure {
  failure_message: string;
}

export type PaymentReceiptStatus =
  | { status: "Success"; details: PaymentReceiptSuccess }
  | { status: "Error"; details: PaymentReceiptError }
  | { status: "Failure"; details: PaymentReceiptFailure };

export interface PaymentReceipt {
  payment_mandate_id: string;
  timestamp: string;
  payment_id: string;
  amount: PaymentCurrencyAmount;
  payment_status: PaymentReceiptStatus;
  payment_method_details?: Record<string, unknown>;
}

// ============================================================
// AP2 Action Types
// ============================================================

/** IntentMandate action from shopping agent */
export interface IntentMandateAction {
  action: "ap2:intent-mandate";
  mandate: IntentMandate;
}

/** PaymentMandate action from shopping agent */
export interface PaymentMandateAction {
  action: "ap2:payment-mandate";
  taskId: string;
  mandate: PaymentMandate;
}

/** Union of all supported actions */
export type A2AAction =
  | PurchaseAction
  | ResourceAccessAction
  | PaymentSubmitAction
  | IntentMandateAction
  | PaymentMandateAction;

// ============================================================
// Constants
// ============================================================

/** x402 A2A extension URI */
export const X402_EXTENSION_URI = "urn:x-a2a:extension:x402-payment";

/** AP2 extension URI */
export const AP2_EXTENSION_URI = "https://github.com/google-agentic-commerce/ap2/v1";

/** x402 as AP2 payment method identifier */
export const X402_PAYMENT_METHOD = "https://www.x402.org/";

/** AP2 data part keys for mandate transport */
export const AP2_DATA_KEYS = {
  INTENT_MANDATE: "ap2.mandates.IntentMandate",
  CART_MANDATE: "ap2.mandates.CartMandate",
  PAYMENT_MANDATE: "ap2.mandates.PaymentMandate",
  PAYMENT_RECEIPT: "ap2.PaymentReceipt",
} as const;

/** A2A protocol version */
export const ERC8004_EXTENSION_URI = "urn:eip:8004:trustless-agents";

export const A2A_PROTOCOL_VERSION = "0.2.1";

/** JSON-RPC error codes */
export const A2A_ERRORS = {
  TASK_NOT_FOUND: { code: -32001, message: "Task not found" },
  INVALID_ACTION: { code: -32002, message: "Invalid or missing action" },
  PAYMENT_FAILED: { code: -32003, message: "Payment verification failed" },
  INTERNAL: { code: -32603, message: "Internal server error" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
  INVALID_PARAMS: { code: -32602, message: "Invalid params" },
} as const;
