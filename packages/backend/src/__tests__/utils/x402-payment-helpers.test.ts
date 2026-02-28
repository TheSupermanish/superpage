import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createPaymentRequirements,
  deepSortObject,
  validateOrderIntentMatch,
  isOrderIntentExpired,
  parsePaymentHeader,
  extractTxHashFromVerification,
} from "../../utils/x402-payment-helpers.js";
import crypto from "crypto";

describe("createPaymentRequirements", () => {
  const amounts = {
    subtotal: "10.00",
    shipping: "2.00",
    tax: "1.00",
    total: "13.00",
    currency: "USD",
  };
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  it("should create stablecoin requirements by default", () => {
    const reqs = createPaymentRequirements("order-1", amounts, expiresAt);
    expect(reqs).toHaveLength(1);
    const req = reqs[0] as Record<string, any>;
    expect(req.token).toBe("USDC");
    // 13.00 * 1_000_000 = 13000000
    expect(req.amount).toBe("13000000");
    expect(req.scheme).toBe("spay");
    expect(req.chainId).toBeTypeOf("number");
    expect(req).toHaveProperty("recipient");
    expect(req.metadata.orderIntentId).toBe("order-1");
    expect(req.metadata.amounts).toEqual(amounts);
  });

  it("should create native token requirements when specified", () => {
    const reqs = createPaymentRequirements(
      "order-2",
      amounts,
      expiresAt,
      undefined,
      "ETH"
    );
    expect(reqs).toHaveLength(1);
    expect(reqs[0].token).toBe("ETH");
    // 13.00 * 1e18 = 13000000000000000000
    expect(reqs[0].amount).toBe("13000000000000000000");
    expect(reqs[0].scheme).toBe("spay");
  });

  it("should create other native token requirements (MNT)", () => {
    const reqs = createPaymentRequirements(
      "order-3",
      amounts,
      expiresAt,
      undefined,
      "MNT"
    );
    expect(reqs[0].token).toBe("MNT");
    expect(reqs[0].scheme).toBe("spay");
  });

  it("should include expiresAt", () => {
    const reqs = createPaymentRequirements("order-4", amounts, expiresAt);
    expect(reqs[0].expiresAt).toBe(expiresAt.toISOString());
  });

  it("should use custom network when provided", () => {
    const reqs = createPaymentRequirements(
      "order-5",
      amounts,
      expiresAt,
      "base-sepolia"
    );
    expect(reqs[0].network).toBe("base-sepolia");
  });
});

describe("deepSortObject", () => {
  it("should sort object keys alphabetically", () => {
    const input = { c: 3, a: 1, b: 2 };
    const sorted = deepSortObject(input);
    expect(Object.keys(sorted)).toEqual(["a", "b", "c"]);
  });

  it("should sort nested objects", () => {
    const input = { b: { z: 1, a: 2 }, a: 1 };
    const sorted = deepSortObject(input);
    expect(Object.keys(sorted)).toEqual(["a", "b"]);
    expect(Object.keys(sorted.b)).toEqual(["a", "z"]);
  });

  it("should handle arrays", () => {
    const input = [{ b: 1, a: 2 }, { d: 3, c: 4 }];
    const sorted = deepSortObject(input);
    expect(Object.keys(sorted[0])).toEqual(["a", "b"]);
    expect(Object.keys(sorted[1])).toEqual(["c", "d"]);
  });

  it("should handle primitives", () => {
    expect(deepSortObject(42)).toBe(42);
    expect(deepSortObject("hello")).toBe("hello");
    expect(deepSortObject(null)).toBeNull();
  });
});

describe("validateOrderIntentMatch", () => {
  it("should return true for matching requests", () => {
    const requestBody = { product: "item1", quantity: 2 };
    const normalizedBody = deepSortObject(requestBody);
    const bodyHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalizedBody))
      .digest("hex");

    const savedIntent = { body_hash: bodyHash };

    expect(
      validateOrderIntentMatch(savedIntent, {
        ...requestBody,
        orderIntentId: "ignored",
      })
    ).toBe(true);
  });

  it("should return false for mismatched requests", () => {
    const savedIntent = { body_hash: "abc123" };
    expect(
      validateOrderIntentMatch(savedIntent, {
        product: "different",
        orderIntentId: "test",
      })
    ).toBe(false);
  });

  it("should ignore orderIntentId in comparison", () => {
    const requestBody = { product: "item1" };
    const normalizedBody = deepSortObject(requestBody);
    const bodyHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalizedBody))
      .digest("hex");

    const savedIntent = { body_hash: bodyHash };

    // Same body with different orderIntentId should still match
    expect(
      validateOrderIntentMatch(savedIntent, {
        product: "item1",
        orderIntentId: "any-value",
      })
    ).toBe(true);
  });
});

describe("isOrderIntentExpired", () => {
  it("should return false for null expiresAt", () => {
    expect(isOrderIntentExpired(null)).toBe(false);
  });

  it("should return false for future expiry", () => {
    const future = new Date(Date.now() + 60000).toISOString();
    expect(isOrderIntentExpired(future)).toBe(false);
  });

  it("should return true for past expiry", () => {
    const past = new Date(Date.now() - 60000).toISOString();
    expect(isOrderIntentExpired(past)).toBe(true);
  });
});

describe("parsePaymentHeader", () => {
  it("should parse valid JSON header", () => {
    const header = JSON.stringify({
      transactionHash: "0xabc",
      network: "bite-v2-sandbox",
      chainId: 103698795,
    });
    const parsed = parsePaymentHeader(header);
    expect(parsed.transactionHash).toBe("0xabc");
    expect(parsed.network).toBe("bite-v2-sandbox");
    expect(parsed.chainId).toBe(103698795);
  });

  it("should support txHash alias", () => {
    const header = JSON.stringify({ txHash: "0xdef" });
    const parsed = parsePaymentHeader(header);
    expect(parsed.transactionHash).toBe("0xdef");
  });

  it("should support signature alias", () => {
    const header = JSON.stringify({ signature: "0xghi" });
    const parsed = parsePaymentHeader(header);
    expect(parsed.transactionHash).toBe("0xghi");
  });

  it("should add timestamp if missing", () => {
    const header = JSON.stringify({ transactionHash: "0xabc" });
    const before = Date.now();
    const parsed = parsePaymentHeader(header);
    expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
  });

  it("should derive chainId from network", () => {
    const header = JSON.stringify({
      transactionHash: "0xabc",
      network: "mainnet",
    });
    const parsed = parsePaymentHeader(header);
    expect(parsed.chainId).toBe(1);
  });

  it("should fallback chainId to default network for unknown network", () => {
    const header = JSON.stringify({
      transactionHash: "0xabc",
      network: "unknown-net",
    });
    const parsed = parsePaymentHeader(header);
    // Falls back to DEFAULT_NETWORK chain ID (base-sepolia = 84532)
    expect(parsed.chainId).toBe(84532);
  });

  it("should throw for invalid JSON", () => {
    expect(() => parsePaymentHeader("not-json")).toThrow(
      "Invalid X-PAYMENT header format"
    );
  });
});

describe("extractTxHashFromVerification", () => {
  it("should extract txHash", () => {
    expect(extractTxHashFromVerification({ txHash: "0x1" })).toBe("0x1");
  });

  it("should extract transaction_hash", () => {
    expect(
      extractTxHashFromVerification({ transaction_hash: "0x2" })
    ).toBe("0x2");
  });

  it("should extract tx_hash", () => {
    expect(extractTxHashFromVerification({ tx_hash: "0x3" })).toBe("0x3");
  });

  it("should return empty string if no hash found", () => {
    expect(extractTxHashFromVerification({})).toBe("");
  });

  it("should prefer txHash over others", () => {
    expect(
      extractTxHashFromVerification({
        txHash: "0x1",
        transaction_hash: "0x2",
      })
    ).toBe("0x1");
  });
});
