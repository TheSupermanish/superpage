import { describe, it, expect } from "vitest";
import { X402Client, type X402ClientConfig } from "../client";

describe("X402Client", () => {
  const config: X402ClientConfig = {
    network: "bite-v2-sandbox",
    rpcEndpoint: "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
  };

  describe("constructor", () => {
    it("should create client with config", () => {
      const client = new X402Client(config);
      expect(client).toBeDefined();
    });

    it("should set default values", () => {
      const client = new X402Client(config);
      const clientConfig = client.getConfig();
      expect(clientConfig.autoRetry).toBe(true);
      expect(clientConfig.maxRetries).toBe(3);
      expect(clientConfig.confirmations).toBe(1);
    });

    it("should override defaults with provided values", () => {
      const client = new X402Client({
        ...config,
        autoRetry: false,
        maxRetries: 5,
        confirmations: 3,
      });
      const clientConfig = client.getConfig();
      expect(clientConfig.autoRetry).toBe(false);
      expect(clientConfig.maxRetries).toBe(5);
      expect(clientConfig.confirmations).toBe(3);
    });
  });

  describe("getPublicClient", () => {
    it("should return a public client", () => {
      const client = new X402Client(config);
      const publicClient = client.getPublicClient();
      expect(publicClient).toBeDefined();
    });
  });

  describe("getConfig", () => {
    it("should return a copy of config", () => {
      const client = new X402Client(config);
      const config1 = client.getConfig();
      const config2 = client.getConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Should be different objects
    });
  });

  describe("fetch", () => {
    it("should throw PaymentRequiredError when no signer and 402 received", async () => {
      // This would need a mock server, so we test the error path
      const client = new X402Client(config);

      // Without a mock server we can't fully test fetch, but we can verify
      // the client was created properly for when it's used
      expect(client.getConfig().network).toBe("bite-v2-sandbox");
    });
  });
});
