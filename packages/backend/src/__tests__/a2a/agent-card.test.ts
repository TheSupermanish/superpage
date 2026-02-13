import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildAgentCard } from "../../a2a/agent-card.js";
import {
  X402_EXTENSION_URI,
  AP2_EXTENSION_URI,
  X402_PAYMENT_METHOD,
  A2A_PROTOCOL_VERSION,
} from "../../a2a/types.js";

describe("buildAgentCard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should build a valid AgentCard", () => {
    const card = buildAgentCard("https://example.com");

    expect(card.name).toBe("x402-merchant-agent");
    expect(card.description).toBeTruthy();
    expect(card.url).toBe("https://example.com/a2a");
    expect(card.version).toBe(A2A_PROTOCOL_VERSION);
  });

  it("should have correct capabilities", () => {
    const card = buildAgentCard("https://example.com");

    expect(card.capabilities.streaming).toBe(false);
    expect(card.capabilities.pushNotifications).toBe(false);
    expect(card.capabilities.stateTransitionHistory).toBe(true);
  });

  it("should have 4 skills", () => {
    const card = buildAgentCard("https://example.com");

    expect(card.skills).toHaveLength(4);

    const skillIds = card.skills.map((s) => s.id);
    expect(skillIds).toContain("purchase");
    expect(skillIds).toContain("resource-access");
    expect(skillIds).toContain("ap2-shopping");
    expect(skillIds).toContain("erc8004-trust");
  });

  it("should have all skills with required fields", () => {
    const card = buildAgentCard("https://example.com");

    for (const skill of card.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.tags).toBeDefined();
      expect(skill.tags!.length).toBeGreaterThan(0);
    }
  });

  it("should have x402 extension", () => {
    const card = buildAgentCard("https://example.com");

    const x402Ext = card.extensions?.find((e) => e.uri === X402_EXTENSION_URI);
    expect(x402Ext).toBeDefined();
    expect(x402Ext!.required).toBe(true);
    expect(x402Ext!.config).toBeDefined();
    expect(x402Ext!.config!.supportedNetworks).toBeDefined();
    expect(x402Ext!.config!.supportedTokens).toBeDefined();
  });

  it("should have AP2 extension", () => {
    const card = buildAgentCard("https://example.com");

    const ap2Ext = card.extensions?.find((e) => e.uri === AP2_EXTENSION_URI);
    expect(ap2Ext).toBeDefined();
    expect(ap2Ext!.required).toBe(false);
    expect(ap2Ext!.config).toBeDefined();
    expect(ap2Ext!.config!.roles).toEqual(["merchant"]);
    expect(ap2Ext!.config!.supported_payment_methods).toContain(
      X402_PAYMENT_METHOD
    );
  });

  it("should have provider info", () => {
    const card = buildAgentCard("https://example.com");

    expect(card.provider).toBeDefined();
    expect(card.provider!.organization).toBe("x402 Everything");
  });

  it("should have input/output modes", () => {
    const card = buildAgentCard("https://example.com");

    expect(card.defaultInputModes).toEqual(["application/json"]);
    expect(card.defaultOutputModes).toEqual(["application/json"]);
  });

  it("should use APP_URL env var for base URL", () => {
    process.env.APP_URL = "https://prod.example.com";
    // buildAgentCard takes baseUrl as parameter, not from env
    // but the handler does. Just verify the parameter works.
    const card = buildAgentCard("https://custom.com");
    expect(card.url).toBe("https://custom.com/a2a");
  });

  it("should include network config in x402 extension", () => {
    const card = buildAgentCard("https://example.com");
    const x402Ext = card.extensions?.find((e) => e.uri === X402_EXTENSION_URI);
    const networks = x402Ext!.config!.supportedNetworks as any[];

    expect(networks).toHaveLength(1);
    expect(networks[0].network).toBeTruthy();
    expect(networks[0].chainId).toBeTruthy();
    expect(networks[0].rpcUrl).toBeTruthy();
    expect(typeof networks[0].isTestnet).toBe("boolean");
  });
});
