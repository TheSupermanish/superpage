/**
 * Resource Purchasing Flow Tests
 *
 * Tests the full x402 payment-gated resource lifecycle:
 *   1. List resources
 *   2. Access without payment → 402
 *   3. Access with payment proof → 200 + content
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally before importing tools
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { toolRegistry } from "../../mcp/tool-registry.js";
import { registerResourceTools } from "../../mcp/tools/resources.js";

// Register tools once
let registered = false;
beforeEach(() => {
  mockFetch.mockReset();
  if (!registered) {
    registerResourceTools();
    registered = true;
  }
});

// ============================================================
// Sample data
// ============================================================

const sampleResources = {
  resources: [
    {
      id: "697268d3adc7e2b9a4ee093c",
      slug: "weather-api",
      type: "api",
      name: "Weather API",
      description: "Get current weather data for any city",
      priceUsdc: 0.01,
      priceFormatted: "$0.01 USDC",
      accessCount: 8,
      endpoint: "/x402/resource/weather-api",
      creator: {
        walletAddress: "0x19eaEBaFA1f54d5100877584782DdcC26EB39D36",
        name: "Open Weather",
      },
    },
    {
      id: "69732c3a1f7b7a7ccfb5c711",
      slug: "exclusive-creator-video",
      type: "file",
      name: "Exclusive Creator Masterclass Video",
      description: "Premium video content",
      priceUsdc: 1.0,
      priceFormatted: "$1.00 USDC",
      accessCount: 6,
      endpoint: "/x402/resource/exclusive-creator-video",
      creator: {
        walletAddress: "0x19eaEBaFA1f54d5100877584782DdcC26EB39D36",
        name: "Creator Pro",
      },
    },
  ],
};

const paymentRequirements402 = {
  scheme: "spay",
  network: "flow-testnet",
  chainId: 545,
  token: "USDC",
  amount: "10000",
  recipient: "0x19eaEBaFA1f54d5100877584782DdcC26EB39D36",
  requestId: "resource_697268d3adc7e2b9a4ee093c_1774932041211",
  memo: "Get current weather data for any city",
  x402Version: "1.0",
  resourceId: "697268d3adc7e2b9a4ee093c",
  resourceName: "Weather API",
  resourceType: "api",
};

const sampleWeatherData = {
  current_condition: [
    {
      temp_C: "2",
      temp_F: "36",
      weatherDesc: [{ value: "Partly cloudy" }],
      humidity: "87",
    },
  ],
};

// ============================================================
// list_resources
// ============================================================

describe("list_resources", () => {
  it("should return all resources", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResources,
    });

    const result = await toolRegistry.execute("list_resources", {});

    expect(result.success).toBe(true);
    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].name).toBe("Weather API");
    expect(result.resources[0].type).toBe("api");
    expect(result.resources[0].priceUsdc).toBe(0.01);
    expect(result.resources[1].name).toBe("Exclusive Creator Masterclass Video");
  });

  it("should filter by type", async () => {
    const apiOnly = {
      resources: [sampleResources.resources[0]],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => apiOnly,
    });

    const result = await toolRegistry.execute("list_resources", { type: "api" });

    expect(result.success).toBe(true);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].type).toBe("api");

    // Verify fetch was called with type query parameter
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("type=api");
  });

  it("should handle empty resource list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ resources: [] }),
    });

    const result = await toolRegistry.execute("list_resources", {});

    expect(result.success).toBe(true);
    expect(result.resources).toHaveLength(0);
  });

  it("should handle server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" }),
    });

    const result = await toolRegistry.execute("list_resources", {});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ============================================================
// access_resource (402 flow)
// ============================================================

describe("access_resource", () => {
  it("should return 402 payment requirements when no payment provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify(paymentRequirements402),
      headers: new Map([["content-type", "application/json"]]),
    });

    const result = await toolRegistry.execute("access_resource", {
      resourceId: "weather-api",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(402);
    expect(result.details).toBeDefined();
    expect(result.details.network).toBe("flow-testnet");
    expect(result.details.chainId).toBe(545);
    expect(result.details.token).toBe("USDC");
    expect(result.details.amount).toBe("10000");
  });

  it("should return resource content with valid payment proof", async () => {
    // Mock the fetch that includes X-PAYMENT header
    const mockHeaders = new Headers();
    mockHeaders.set("content-type", "application/json");
    mockHeaders.set("x-402-paid", "true");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sampleWeatherData),
      headers: mockHeaders,
    });

    const result = await toolRegistry.execute("access_resource", {
      resourceId: "weather-api",
      transactionHash: "0xd53bbe15ae80e0b6476cdbe2ab5b45f7a21a0a2330b406a0531bd65f07dbc531",
      network: "flow-testnet",
      chainId: 545,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.current_condition).toBeDefined();
  });

  it("should handle resource not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: "Resource not found" }),
      headers: new Map(),
    });

    const result = await toolRegistry.execute("access_resource", {
      resourceId: "nonexistent-slug",
    });

    expect(result.success).toBe(false);
  });

  it("should handle payment verification failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify({
        error: "Payment verification failed",
        ...paymentRequirements402,
      }),
      headers: new Map(),
    });

    const result = await toolRegistry.execute("access_resource", {
      resourceId: "weather-api",
      transactionHash: "0xinvalidhash",
      network: "flow-testnet",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(402);
  });

  it("should validate required resourceId", async () => {
    const result = await toolRegistry.execute("access_resource", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation error");
  });
});

// ============================================================
// get_resource_info
// ============================================================

describe("get_resource_info", () => {
  it("should return resource details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify(paymentRequirements402),
      headers: new Map(),
    });

    const result = await toolRegistry.execute("get_resource_info", {
      resourceId: "weather-api",
    });

    // get_resource_info probes the resource endpoint to get its 402 requirements
    expect(result).toBeDefined();
  });
});
