import { describe, it, expect } from "vitest";
import {
  toAP2Requirements,
  fromAP2Payload,
  toAP2Receipt,
  fromAP2Requirements,
  buildPaymentReceipt,
  buildCartMandate,
  extractX402ProofFromPaymentResponse,
} from "../../a2a/converters.js";
import { X402_EXTENSION_URI } from "../../a2a/types.js";
import type {
  AP2PaymentRequirements,
  AP2PaymentPayload,
  AP2PaymentRequest,
  AP2PaymentResponse,
} from "../../a2a/types.js";

describe("toAP2Requirements", () => {
  it("should convert x402 PaymentRequirements to AP2 format", () => {
    const x402Req = {
      scheme: "exact" as const,
      network: "bite-v2-sandbox" as const,
      chainId: 103698795,
      amount: "1000000",
      token: "USDC" as const,
      recipient: "0x1234",
    };

    const result = toAP2Requirements(x402Req, "req-1", "2025-01-01T00:00:00Z");

    expect(result.extensionUri).toBe(X402_EXTENSION_URI);
    expect(result.networks).toHaveLength(1);
    expect(result.networks[0].network).toBe("bite-v2-sandbox");
    expect(result.networks[0].chainId).toBe(103698795);
    expect(result.networks[0].rpcUrl).toBeTruthy(); // should look up from registry
    expect(result.asset).toBe("USDC");
    expect(result.amount).toBe("1000000");
    expect(result.payTo).toBe("0x1234");
    expect(result.scheme).toBe("exact");
    expect(result.requestId).toBe("req-1");
    expect(result.expiresAt).toBe("2025-01-01T00:00:00Z");
  });

  it("should use requestId from x402 if not provided explicitly", () => {
    const x402Req = {
      scheme: "exact" as const,
      network: "mainnet" as const,
      chainId: 1,
      amount: "500",
      token: "ETH" as const,
      recipient: "0xabc",
      requestId: "original-req",
    };

    const result = toAP2Requirements(x402Req);
    expect(result.requestId).toBe("original-req");
  });
});

describe("fromAP2Payload", () => {
  it("should convert AP2PaymentPayload to x402 PaymentProof", () => {
    const payload: AP2PaymentPayload = {
      transactionHash: "0xdeadbeef",
      network: "bite-v2-sandbox",
      chainId: 103698795,
      timestamp: 1700000000,
      requestId: "req-1",
    };

    const proof = fromAP2Payload(payload);

    expect(proof.transactionHash).toBe("0xdeadbeef");
    expect(proof.network).toBe("bite-v2-sandbox");
    expect(proof.chainId).toBe(103698795);
    expect(proof.timestamp).toBe(1700000000);
    expect(proof.requestId).toBe("req-1");
  });
});

describe("toAP2Receipt", () => {
  it("should build receipt with explorer URL for known network", () => {
    const receipt = toAP2Receipt(
      "0xabc",
      "bite-v2-sandbox",
      103698795,
      "0xpayer",
      "12345"
    );

    expect(receipt.success).toBe(true);
    expect(receipt.transactionHash).toBe("0xabc");
    expect(receipt.network).toBe("bite-v2-sandbox");
    expect(receipt.chainId).toBe(103698795);
    expect(receipt.payer).toBe("0xpayer");
    expect(receipt.blockNumber).toBe("12345");
    expect(receipt.explorerUrl).toContain("/tx/0xabc");
  });

  it("should not include explorer URL for unknown network", () => {
    const receipt = toAP2Receipt("0xabc", "unknown-net", 99999);
    expect(receipt.explorerUrl).toBeUndefined();
  });
});

describe("fromAP2Requirements", () => {
  it("should convert AP2 format back to x402", () => {
    const ap2: AP2PaymentRequirements = {
      extensionUri: X402_EXTENSION_URI,
      networks: [{ network: "bite-v2-sandbox", chainId: 103698795 }],
      asset: "USDC",
      amount: "1000000",
      payTo: "0x1234",
      scheme: "exact",
      requestId: "req-1",
      memo: "test",
    };

    const result = fromAP2Requirements(ap2);

    expect(result.scheme).toBe("exact");
    expect(result.network).toBe("bite-v2-sandbox");
    expect(result.chainId).toBe(103698795);
    expect(result.amount).toBe("1000000");
    expect(result.token).toBe("USDC");
    expect(result.recipient).toBe("0x1234");
    expect(result.requestId).toBe("req-1");
    expect(result.memo).toBe("test");
  });

  it("should throw if no networks provided", () => {
    const ap2: AP2PaymentRequirements = {
      extensionUri: X402_EXTENSION_URI,
      networks: [],
      asset: "USDC",
      amount: "1000000",
      payTo: "0x1234",
      scheme: "exact",
    };

    expect(() => fromAP2Requirements(ap2)).toThrow(
      "AP2 requirements must include at least one network"
    );
  });
});

describe("buildPaymentReceipt", () => {
  const amount = { currency: "USD", value: 10.0 };

  it("should build success receipt", () => {
    const receipt = buildPaymentReceipt(
      "mandate-1",
      "0xtxhash",
      amount,
      true
    );

    expect(receipt.payment_mandate_id).toBe("mandate-1");
    expect(receipt.payment_id).toBe("0xtxhash");
    expect(receipt.amount).toEqual(amount);
    expect(receipt.payment_status.status).toBe("Success");
    expect(receipt.timestamp).toBeTruthy();
    expect(receipt.payment_method_details).toEqual({
      method: "x402",
      transactionHash: "0xtxhash",
    });
  });

  it("should build failure receipt", () => {
    const receipt = buildPaymentReceipt(
      "mandate-2",
      "",
      amount,
      false,
      "Verification failed"
    );

    expect(receipt.payment_status.status).toBe("Failure");
    if (receipt.payment_status.status === "Failure") {
      expect(receipt.payment_status.details.failure_message).toBe(
        "Verification failed"
      );
    }
  });

  it("should use default failure message", () => {
    const receipt = buildPaymentReceipt("mandate-3", "", amount, false);

    if (receipt.payment_status.status === "Failure") {
      expect(receipt.payment_status.details.failure_message).toBe(
        "Payment verification failed"
      );
    }
  });
});

describe("buildCartMandate", () => {
  it("should build a CartMandate", () => {
    const paymentRequest: AP2PaymentRequest = {
      method_data: [
        {
          supported_methods: "https://www.x402.org/",
          data: {},
        },
      ],
      details: {
        id: "cart-1",
        display_items: [{ label: "Item", amount: { currency: "USD", value: 5 } }],
        total: { label: "Total", amount: { currency: "USD", value: 5 } },
      },
    };

    const expiresAt = new Date("2025-12-31T23:59:59Z");
    const mandate = buildCartMandate(
      "cart-1",
      "Test Store",
      paymentRequest,
      expiresAt,
      true
    );

    expect(mandate.contents.id).toBe("cart-1");
    expect(mandate.contents.merchant_name).toBe("Test Store");
    expect(mandate.contents.user_cart_confirmation_required).toBe(true);
    expect(mandate.contents.cart_expiry).toBe("2025-12-31T23:59:59.000Z");
    expect(mandate.contents.payment_request).toBe(paymentRequest);
  });
});

describe("extractX402ProofFromPaymentResponse", () => {
  it("should extract proof when present", () => {
    const response: AP2PaymentResponse = {
      request_id: "req-1",
      method_name: "https://www.x402.org/",
      details: {
        transactionHash: "0xabc",
        network: "bite-v2-sandbox",
        chainId: 103698795,
        timestamp: 1700000000,
      },
    };

    const proof = extractX402ProofFromPaymentResponse(response);
    expect(proof).not.toBeNull();
    expect(proof!.transactionHash).toBe("0xabc");
    expect(proof!.network).toBe("bite-v2-sandbox");
    expect(proof!.chainId).toBe(103698795);
  });

  it("should return null when no details", () => {
    const response: AP2PaymentResponse = {
      request_id: "req-1",
      method_name: "https://www.x402.org/",
    };

    expect(extractX402ProofFromPaymentResponse(response)).toBeNull();
  });

  it("should return null when no transactionHash", () => {
    const response: AP2PaymentResponse = {
      request_id: "req-1",
      method_name: "https://www.x402.org/",
      details: { someOtherField: "value" },
    };

    expect(extractX402ProofFromPaymentResponse(response)).toBeNull();
  });

  it("should use defaults from chain config when fields missing", () => {
    const response: AP2PaymentResponse = {
      request_id: "req-1",
      method_name: "https://www.x402.org/",
      details: {
        transactionHash: "0xfoo",
      },
    };

    const proof = extractX402ProofFromPaymentResponse(response);
    expect(proof).not.toBeNull();
    expect(proof!.transactionHash).toBe("0xfoo");
    // Should fall back to chain config values
    expect(proof!.network).toBeTruthy();
    expect(proof!.chainId).toBeTruthy();
    expect(proof!.timestamp).toBeGreaterThan(0);
  });
});
