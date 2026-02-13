import { describe, it, expect } from "vitest";
import {
  X402_EXTENSION_URI,
  AP2_EXTENSION_URI,
  X402_PAYMENT_METHOD,
  AP2_DATA_KEYS,
  A2A_PROTOCOL_VERSION,
  A2A_ERRORS,
} from "../../a2a/types.js";

describe("A2A Constants", () => {
  it("should have correct extension URIs", () => {
    expect(X402_EXTENSION_URI).toBe("urn:x-a2a:extension:x402-payment");
    expect(AP2_EXTENSION_URI).toBe(
      "https://github.com/google-agentic-commerce/ap2/v1"
    );
  });

  it("should have correct payment method", () => {
    expect(X402_PAYMENT_METHOD).toBe("https://www.x402.org/");
  });

  it("should have correct AP2 data keys", () => {
    expect(AP2_DATA_KEYS.INTENT_MANDATE).toBe(
      "ap2.mandates.IntentMandate"
    );
    expect(AP2_DATA_KEYS.CART_MANDATE).toBe("ap2.mandates.CartMandate");
    expect(AP2_DATA_KEYS.PAYMENT_MANDATE).toBe(
      "ap2.mandates.PaymentMandate"
    );
    expect(AP2_DATA_KEYS.PAYMENT_RECEIPT).toBe("ap2.PaymentReceipt");
  });

  it("should have correct protocol version", () => {
    expect(A2A_PROTOCOL_VERSION).toBe("0.2.1");
  });

  it("should have correct error codes", () => {
    expect(A2A_ERRORS.TASK_NOT_FOUND.code).toBe(-32001);
    expect(A2A_ERRORS.INVALID_ACTION.code).toBe(-32002);
    expect(A2A_ERRORS.PAYMENT_FAILED.code).toBe(-32003);
    expect(A2A_ERRORS.INTERNAL.code).toBe(-32603);
    expect(A2A_ERRORS.METHOD_NOT_FOUND.code).toBe(-32601);
    expect(A2A_ERRORS.INVALID_PARAMS.code).toBe(-32602);
  });

  it("should have error messages", () => {
    expect(A2A_ERRORS.TASK_NOT_FOUND.message).toBe("Task not found");
    expect(A2A_ERRORS.METHOD_NOT_FOUND.message).toBe("Method not found");
  });
});
