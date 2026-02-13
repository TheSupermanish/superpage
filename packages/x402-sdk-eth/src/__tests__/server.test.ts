import { describe, it, expect, vi } from "vitest";
import { X402Server, createX402Server, type X402ServerConfig } from "../server";

describe("X402Server", () => {
  const config: X402ServerConfig = {
    network: "bite-v2-sandbox",
    recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
    confirmations: 1,
  };

  describe("constructor", () => {
    it("should create server with config", () => {
      const server = new X402Server(config);
      expect(server).toBeDefined();
      expect(server.getPublicClient()).toBeDefined();
    });

    it("should enable cache when configured", () => {
      const server = new X402Server({
        ...config,
        enableCache: true,
        cacheTTL: 60,
      });
      expect(server).toBeDefined();
    });
  });

  describe("createPaymentRequirements", () => {
    it("should create correct USDC requirements", () => {
      const server = new X402Server(config);
      const reqs = server.createPaymentRequirements({
        amount: "1.50",
        token: "USDC",
      });

      expect(reqs.scheme).toBe("exact");
      expect(reqs.network).toBe("bite-v2-sandbox");
      expect(reqs.chainId).toBe(103698795);
      expect(reqs.amount).toBe("1500000"); // 1.50 * 1e6
      expect(reqs.token).toBe("USDC");
      expect(reqs.recipient).toBe(
        "0x1234567890abcdef1234567890abcdef12345678"
      );
      expect(reqs.requestId).toBeTruthy();
    });

    it("should create correct ETH requirements", () => {
      const server = new X402Server({
        ...config,
        network: "mainnet",
      });
      const reqs = server.createPaymentRequirements({
        amount: "0.001",
        token: "ETH",
      });

      expect(reqs.amount).toBe("1000000000000000"); // 0.001 * 1e18
      expect(reqs.token).toBe("ETH");
    });

    it("should include optional fields", () => {
      const server = new X402Server(config);
      const reqs = server.createPaymentRequirements({
        amount: "5.00",
        token: "USDC",
        memo: "Test payment",
        deadline: 1700000000,
        requestId: "custom-req-id",
      });

      expect(reqs.memo).toBe("Test payment");
      expect(reqs.deadline).toBe(1700000000);
      expect(reqs.requestId).toBe("custom-req-id");
    });

    it("should generate requestId when not provided", () => {
      const server = new X402Server(config);
      const reqs1 = server.createPaymentRequirements({
        amount: "1.00",
        token: "USDC",
      });
      const reqs2 = server.createPaymentRequirements({
        amount: "1.00",
        token: "USDC",
      });

      expect(reqs1.requestId).toBeTruthy();
      expect(reqs2.requestId).toBeTruthy();
      expect(reqs1.requestId).not.toBe(reqs2.requestId);
    });
  });

  describe("verifyPayment", () => {
    it("should reject mismatched network", async () => {
      const server = new X402Server(config);
      const requirements = server.createPaymentRequirements({
        amount: "1.00",
        token: "USDC",
      });

      const proof = {
        transactionHash: "0xabc",
        network: "mainnet" as const,
        chainId: 1,
        timestamp: Date.now(),
      };

      const result = await server.verifyPayment(proof, requirements);
      expect(result).toBe(false);
    });

    it("should reject mismatched chainId", async () => {
      const server = new X402Server(config);
      const requirements = server.createPaymentRequirements({
        amount: "1.00",
        token: "USDC",
      });

      const proof = {
        transactionHash: "0xabc",
        network: "bite-v2-sandbox" as const,
        chainId: 9999,
        timestamp: Date.now(),
      };

      const result = await server.verifyPayment(proof, requirements);
      expect(result).toBe(false);
    });

    it("should reject expired deadline", async () => {
      const server = new X402Server(config);
      const requirements = server.createPaymentRequirements({
        amount: "1.00",
        token: "USDC",
        deadline: 1000000000, // Way in the past
      });

      const proof = {
        transactionHash: "0xabc",
        network: "bite-v2-sandbox" as const,
        chainId: 103698795,
        timestamp: Date.now(), // After deadline
      };

      const result = await server.verifyPayment(proof, requirements);
      expect(result).toBe(false);
    });
  });

  describe("requirePayment middleware", () => {
    it("should return 402 when no X-Payment header", async () => {
      const server = new X402Server(config);
      const middleware = server.requirePayment({
        amount: "1.00",
        token: "USDC",
      });

      const req = { headers: {} } as any;
      const res = {
        statusCode: 0,
        body: null as any,
        status(code: number) {
          res.statusCode = code;
          return res;
        },
        json(data: any) {
          res.body = data;
          return res;
        },
      } as any;
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(402);
      expect(res.body).toBeDefined();
      expect(res.body.scheme).toBe("exact");
      expect(res.body.amount).toBe("1000000");
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 500 for invalid payment proof format", async () => {
      const server = new X402Server(config);
      const middleware = server.requirePayment({
        amount: "1.00",
        token: "USDC",
      });

      const req = { headers: { "x-payment": "not-valid-json" } } as any;
      const res = {
        statusCode: 0,
        body: null as any,
        status(code: number) {
          res.statusCode = code;
          return res;
        },
        json(data: any) {
          res.body = data;
          return res;
        },
      } as any;
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe("createX402Server", () => {
  it("should create X402Server instance", () => {
    const server = createX402Server({
      network: "base-sepolia",
      recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect(server).toBeInstanceOf(X402Server);
  });
});
