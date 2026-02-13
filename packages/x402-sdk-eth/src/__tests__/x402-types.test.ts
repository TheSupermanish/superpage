import { describe, it, expect } from "vitest";
import {
  PaymentSchemeSchema,
  NetworkSchema,
  TokenTypeSchema,
  PaymentRequirementsSchema,
  PaymentProofSchema,
  TransactionStatusSchema,
  SDKConfigSchema,
  X402Error,
  PaymentRequiredError,
  TransactionFailedError,
  InvalidPaymentProofError,
} from "../x402-types";

describe("Zod Schemas", () => {
  describe("PaymentSchemeSchema", () => {
    it("should accept valid schemes", () => {
      expect(PaymentSchemeSchema.parse("exact")).toBe("exact");
      expect(PaymentSchemeSchema.parse("upto")).toBe("upto");
    });

    it("should reject invalid schemes", () => {
      expect(() => PaymentSchemeSchema.parse("invalid")).toThrow();
    });
  });

  describe("NetworkSchema", () => {
    it("should accept all supported networks", () => {
      const networks = [
        "mainnet", "sepolia", "base", "base-sepolia",
        "polygon", "polygon-amoy", "arbitrum", "arbitrum-sepolia",
        "optimism", "optimism-sepolia", "mantle-sepolia",
        "cronos", "cronos-testnet", "bite-v2-sandbox",
      ];
      for (const net of networks) {
        expect(NetworkSchema.parse(net)).toBe(net);
      }
    });

    it("should reject invalid networks", () => {
      expect(() => NetworkSchema.parse("invalid")).toThrow();
    });
  });

  describe("TokenTypeSchema", () => {
    it("should accept all token types", () => {
      const tokens = ["ETH", "USDC", "USDT", "DAI", "CRO", "MNT", "sFUEL"];
      for (const token of tokens) {
        expect(TokenTypeSchema.parse(token)).toBe(token);
      }
    });

    it("should reject invalid tokens", () => {
      expect(() => TokenTypeSchema.parse("WBTC")).toThrow();
    });
  });

  describe("PaymentRequirementsSchema", () => {
    const validRequirements = {
      scheme: "exact",
      network: "base-sepolia",
      chainId: 84532,
      amount: "1000000",
      token: "USDC",
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
    };

    it("should parse valid payment requirements", () => {
      const result = PaymentRequirementsSchema.parse(validRequirements);
      expect(result.scheme).toBe("exact");
      expect(result.network).toBe("base-sepolia");
      expect(result.chainId).toBe(84532);
      expect(result.amount).toBe("1000000");
      expect(result.token).toBe("USDC");
    });

    it("should accept optional fields", () => {
      const withOptionals = {
        ...validRequirements,
        memo: "Test payment",
        deadline: 1700000000,
        requestId: "req_123",
      };
      const result = PaymentRequirementsSchema.parse(withOptionals);
      expect(result.memo).toBe("Test payment");
      expect(result.deadline).toBe(1700000000);
      expect(result.requestId).toBe("req_123");
    });

    it("should reject missing required fields", () => {
      expect(() => PaymentRequirementsSchema.parse({})).toThrow();
      expect(() =>
        PaymentRequirementsSchema.parse({ scheme: "exact" })
      ).toThrow();
    });
  });

  describe("PaymentProofSchema", () => {
    const validProof = {
      transactionHash: "0xabc123",
      network: "base-sepolia",
      chainId: 84532,
      timestamp: 1700000000,
    };

    it("should parse valid payment proof", () => {
      const result = PaymentProofSchema.parse(validProof);
      expect(result.transactionHash).toBe("0xabc123");
      expect(result.network).toBe("base-sepolia");
    });

    it("should accept optional requestId", () => {
      const withRequestId = { ...validProof, requestId: "req_123" };
      const result = PaymentProofSchema.parse(withRequestId);
      expect(result.requestId).toBe("req_123");
    });
  });

  describe("TransactionStatusSchema", () => {
    it("should accept all statuses", () => {
      for (const status of ["pending", "confirmed", "finalized", "failed"]) {
        expect(TransactionStatusSchema.parse(status)).toBe(status);
      }
    });
  });

  describe("SDKConfigSchema", () => {
    it("should parse valid config", () => {
      const config = { network: "base-sepolia" };
      const result = SDKConfigSchema.parse(config);
      expect(result.network).toBe("base-sepolia");
    });

    it("should accept optional fields", () => {
      const config = {
        network: "mainnet",
        rpcEndpoint: "https://custom-rpc.com",
        confirmations: 3,
      };
      const result = SDKConfigSchema.parse(config);
      expect(result.rpcEndpoint).toBe("https://custom-rpc.com");
      expect(result.confirmations).toBe(3);
    });

    it("should reject confirmations < 1", () => {
      expect(() =>
        SDKConfigSchema.parse({ network: "mainnet", confirmations: 0 })
      ).toThrow();
    });
  });
});

describe("Error Classes", () => {
  describe("X402Error", () => {
    it("should have correct properties", () => {
      const err = new X402Error("test", "TEST_CODE", { extra: true });
      expect(err.message).toBe("test");
      expect(err.code).toBe("TEST_CODE");
      expect(err.details).toEqual({ extra: true });
      expect(err.name).toBe("X402Error");
      expect(err instanceof Error).toBe(true);
    });
  });

  describe("PaymentRequiredError", () => {
    it("should carry payment requirements", () => {
      const reqs = {
        scheme: "exact" as const,
        network: "base-sepolia" as const,
        chainId: 84532,
        amount: "1000000",
        token: "USDC" as const,
        recipient: "0x123",
      };
      const err = new PaymentRequiredError(reqs);
      expect(err.paymentRequirements).toBe(reqs);
      expect(err.code).toBe("PAYMENT_REQUIRED");
      expect(err.name).toBe("PaymentRequiredError");
      expect(err instanceof X402Error).toBe(true);
    });
  });

  describe("TransactionFailedError", () => {
    it("should have correct code", () => {
      const err = new TransactionFailedError("tx failed");
      expect(err.code).toBe("TRANSACTION_FAILED");
      expect(err.name).toBe("TransactionFailedError");
    });
  });

  describe("InvalidPaymentProofError", () => {
    it("should have correct code", () => {
      const err = new InvalidPaymentProofError("bad proof");
      expect(err.code).toBe("INVALID_PAYMENT_PROOF");
      expect(err.name).toBe("InvalidPaymentProofError");
    });
  });
});
