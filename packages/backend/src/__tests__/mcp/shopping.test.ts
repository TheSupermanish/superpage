/**
 * Store/Shopping Flow Tests
 *
 * Tests the Shopify-integrated two-phase checkout:
 *   1. List stores
 *   2. Browse products
 *   3. Initiate checkout → 402 with payment requirements
 *   4. Finalize checkout → 200 with order confirmation
 *   5. Get order details
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally before importing tools
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { toolRegistry } from "../../mcp/tool-registry.js";
import { registerShoppingTools } from "../../mcp/tools/shopping.js";

// Register tools once
let registered = false;
beforeEach(() => {
  mockFetch.mockReset();
  if (!registered) {
    registerShoppingTools();
    registered = true;
  }
});

// ============================================================
// Sample data
// ============================================================

const sampleStores = [
  {
    id: "shopify/test-store",
    name: "Test Store",
    url: "https://test-store.myshopify.com",
    description: "A test Shopify store",
    currency: "USDC",
    networks: ["flow-testnet"],
  },
];

const sampleProducts = {
  products: [
    {
      productId: "gid://shopify/ProductVariant/12345",
      name: "Premium T-Shirt",
      description: "High-quality cotton t-shirt",
      image: "https://cdn.shopify.com/image.jpg",
      price: "2500",
      currency: "USD",
      inventory: 10,
    },
    {
      productId: "gid://shopify/ProductVariant/67890",
      name: "Coffee Mug",
      description: "Ceramic mug, 12oz",
      image: "https://cdn.shopify.com/mug.jpg",
      price: "1500",
      currency: "USD",
      inventory: 25,
    },
  ],
};

const sampleCheckoutPhase1 = {
  orderIntentId: "oi_abc123",
  amounts: {
    subtotal: "25.00",
    shipping: "5.00",
    tax: "2.40",
    total: "32.40",
    currency: "USD",
  },
  paymentRequirements: {
    network: "flow-testnet",
    chainId: 545,
    token: "USDC",
    amount: "32400000",
    recipient: "0x19eaEBaFA1f54d5100877584782DdcC26EB39D36",
    scheme: "spay",
  },
};

const sampleOrderConfirmed = {
  orderId: "ord_xyz789",
  shopifyOrderId: "5678901234",
  status: "confirmed",
  amounts: sampleCheckoutPhase1.amounts,
  message: "Order confirmed! Order ID: ord_xyz789",
};

const samplePaymentProof = {
  transactionHash: "0xd53bbe15ae80e0b6476cdbe2ab5b45f7a21a0a2330b406a0531bd65f07dbc531",
  network: "flow-testnet",
  chainId: 545,
  timestamp: 1774932282423,
};

const sampleShippingAddress = {
  name: "John Doe",
  address1: "123 Main St",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "US",
};

// ============================================================
// list_stores
// ============================================================

describe("list_stores", () => {
  it("should return all stores", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sampleStores),
    });

    const result = await toolRegistry.execute("list_stores", {});

    expect(result.success).toBe(true);
    expect(result.stores).toHaveLength(1);
    expect(result.stores[0].id).toBe("shopify/test-store");
    expect(result.stores[0].name).toBe("Test Store");
    expect(result.count).toBe(1);
  });

  it("should handle empty store list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });

    const result = await toolRegistry.execute("list_stores", {});

    expect(result.success).toBe(true);
    expect(result.stores).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it("should handle server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: "Database error" }),
    });

    const result = await toolRegistry.execute("list_stores", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to fetch stores");
  });
});

// ============================================================
// get_store_products
// ============================================================

describe("get_store_products", () => {
  it("should return products for a store", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sampleProducts),
    });

    const result = await toolRegistry.execute("get_store_products", {
      storeId: "shopify/test-store",
    });

    expect(result.success).toBe(true);
    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toBe("Premium T-Shirt");
    expect(result.products[0].price).toBe("2500");
    expect(result.products[1].name).toBe("Coffee Mug");
    expect(result.storeId).toBe("shopify/test-store");
    expect(result.count).toBe(2);
  });

  it("should handle store with no products", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ products: [] }),
    });

    const result = await toolRegistry.execute("get_store_products", {
      storeId: "shopify/empty-store",
    });

    expect(result.success).toBe(true);
    expect(result.products).toHaveLength(0);
  });

  it("should handle store not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: "Store not found" }),
    });

    const result = await toolRegistry.execute("get_store_products", {
      storeId: "shopify/nonexistent",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to fetch products");
  });

  it("should encode storeId with slashes in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ products: [] }),
    });

    await toolRegistry.execute("get_store_products", {
      storeId: "shopify/my-store",
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("shopify%2Fmy-store");
  });

  it("should require storeId", async () => {
    const result = await toolRegistry.execute("get_store_products", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation error");
  });
});

// ============================================================
// initiate_checkout (Phase 1)
// ============================================================

describe("initiate_checkout", () => {
  const checkoutArgs = {
    storeId: "shopify/test-store",
    items: [
      { productId: "gid://shopify/ProductVariant/12345", quantity: 1 },
    ],
    email: "buyer@example.com",
    shippingAddress: sampleShippingAddress,
  };

  it("should return 402 with payment requirements (Phase 1)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify(sampleCheckoutPhase1),
    });

    const result = await toolRegistry.execute("initiate_checkout", checkoutArgs);

    expect(result.success).toBe(true);
    expect(result.phase).toBe("1_payment_required");
    expect(result.orderIntentId).toBe("oi_abc123");
    expect(result.amounts.total).toBe("32.40");
    expect(result.amounts.currency).toBe("USD");
    expect(result.paymentRequirements.network).toBe("flow-testnet");
    expect(result.paymentRequirements.chainId).toBe(545);
    expect(result.paymentRequirements.token).toBe("USDC");
    expect(result.paymentRequirements.amount).toBe("32400000");
    expect(result.nextStep).toContain("make_payment");
  });

  it("should send correct checkout body to backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify(sampleCheckoutPhase1),
    });

    await toolRegistry.execute("initiate_checkout", checkoutArgs);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/x402/checkout");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.storeId).toBe("shopify/test-store");
    expect(body.items).toHaveLength(1);
    expect(body.items[0].productId).toBe("gid://shopify/ProductVariant/12345");
    expect(body.email).toBe("buyer@example.com");
    expect(body.shippingAddress.name).toBe("John Doe");
    expect(body.shippingAddress.country).toBe("US");
    expect(body.clientReferenceId).toMatch(/^agent_\d+$/);
  });

  it("should handle multi-item checkout", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify(sampleCheckoutPhase1),
    });

    const result = await toolRegistry.execute("initiate_checkout", {
      ...checkoutArgs,
      items: [
        { productId: "gid://shopify/ProductVariant/12345", quantity: 2 },
        { productId: "gid://shopify/ProductVariant/67890", quantity: 1 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.phase).toBe("1_payment_required");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.items).toHaveLength(2);
  });

  it("should handle server error during checkout", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: "Store unavailable" }),
    });

    const result = await toolRegistry.execute("initiate_checkout", checkoutArgs);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unexpected response");
  });

  it("should validate required fields", async () => {
    // Missing email
    const result = await toolRegistry.execute("initiate_checkout", {
      storeId: "shopify/test-store",
      items: [{ productId: "123", quantity: 1 }],
      shippingAddress: sampleShippingAddress,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation error");
  });

  it("should validate shipping address fields", async () => {
    // Missing required address fields
    const result = await toolRegistry.execute("initiate_checkout", {
      storeId: "shopify/test-store",
      items: [{ productId: "123", quantity: 1 }],
      email: "test@test.com",
      shippingAddress: { name: "John" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation error");
  });
});

// ============================================================
// finalize_checkout (Phase 2)
// ============================================================

describe("finalize_checkout", () => {
  const finalizeArgs = {
    storeId: "shopify/test-store",
    orderIntentId: "oi_abc123",
    items: [
      { productId: "gid://shopify/ProductVariant/12345", quantity: 1 },
    ],
    email: "buyer@example.com",
    shippingAddress: sampleShippingAddress,
    paymentProof: samplePaymentProof,
  };

  it("should confirm order with valid payment proof (Phase 2)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sampleOrderConfirmed),
    });

    const result = await toolRegistry.execute("finalize_checkout", finalizeArgs);

    expect(result.success).toBe(true);
    expect(result.phase).toBe("2_order_confirmed");
    expect(result.orderId).toBe("ord_xyz789");
    expect(result.shopifyOrderId).toBe("5678901234");
    expect(result.status).toBe("confirmed");
    expect(result.amounts.total).toBe("32.40");
    expect(result.message).toContain("Order confirmed");
  });

  it("should send X-PAYMENT header with payment proof", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sampleOrderConfirmed),
    });

    await toolRegistry.execute("finalize_checkout", finalizeArgs);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/x402/checkout");
    expect(options.method).toBe("POST");

    // Verify X-PAYMENT header
    const xPayment = JSON.parse(options.headers["X-PAYMENT"]);
    expect(xPayment.transactionHash).toBe(samplePaymentProof.transactionHash);
    expect(xPayment.network).toBe("flow-testnet");
    expect(xPayment.chainId).toBe(545);

    // Verify body includes orderIntentId
    const body = JSON.parse(options.body);
    expect(body.orderIntentId).toBe("oi_abc123");
    expect(body.storeId).toBe("shopify/test-store");
  });

  it("should handle payment verification failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify({
        error: "Payment verification failed",
        details: "Transaction could not be verified on-chain",
      }),
    });

    const result = await toolRegistry.execute("finalize_checkout", finalizeArgs);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Payment verification failed");
    expect(result.status).toBe(402);
  });

  it("should handle expired order intent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        error: "Order intent expired or not found",
      }),
    });

    const result = await toolRegistry.execute("finalize_checkout", finalizeArgs);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Checkout finalization failed");
  });

  it("should validate paymentProof fields", async () => {
    const result = await toolRegistry.execute("finalize_checkout", {
      ...finalizeArgs,
      paymentProof: { network: "flow-testnet" }, // missing transactionHash
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation error");
  });
});

// ============================================================
// get_order_details
// ============================================================

describe("get_order_details", () => {
  it("should return order details", async () => {
    const orderDetails = {
      id: "ord_xyz789",
      storeId: "shopify/test-store",
      shopifyOrderId: "5678901234",
      email: "buyer@example.com",
      items: [{ productId: "12345", quantity: 1 }],
      totalAmount: "32.40",
      currency: "USD",
      status: "confirmed",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(orderDetails),
    });

    const result = await toolRegistry.execute("get_order_details", {
      orderId: "ord_xyz789",
    });

    expect(result.success).toBe(true);
    expect(result.order.id).toBe("ord_xyz789");
    expect(result.order.shopifyOrderId).toBe("5678901234");
    expect(result.order.status).toBe("confirmed");
  });

  it("should handle order not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: "Order not found" }),
    });

    const result = await toolRegistry.execute("get_order_details", {
      orderId: "nonexistent",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to fetch order details");
    expect(result.status).toBe(404);
  });

  it("should require orderId", async () => {
    const result = await toolRegistry.execute("get_order_details", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation error");
  });
});

// ============================================================
// Full checkout flow (integration)
// ============================================================

describe("Full checkout flow", () => {
  it("should complete Phase 1 → Payment → Phase 2 → Order Details", async () => {
    // Phase 1: Initiate checkout → 402
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => JSON.stringify(sampleCheckoutPhase1),
    });

    const phase1 = await toolRegistry.execute("initiate_checkout", {
      storeId: "shopify/test-store",
      items: [{ productId: "gid://shopify/ProductVariant/12345", quantity: 1 }],
      email: "buyer@example.com",
      shippingAddress: sampleShippingAddress,
    });

    expect(phase1.success).toBe(true);
    expect(phase1.phase).toBe("1_payment_required");
    expect(phase1.orderIntentId).toBeDefined();
    expect(phase1.paymentRequirements.amount).toBeDefined();

    // Phase 2: Finalize with payment proof → 200
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(sampleOrderConfirmed),
    });

    const phase2 = await toolRegistry.execute("finalize_checkout", {
      storeId: "shopify/test-store",
      orderIntentId: phase1.orderIntentId,
      items: [{ productId: "gid://shopify/ProductVariant/12345", quantity: 1 }],
      email: "buyer@example.com",
      shippingAddress: sampleShippingAddress,
      paymentProof: samplePaymentProof,
    });

    expect(phase2.success).toBe(true);
    expect(phase2.phase).toBe("2_order_confirmed");
    expect(phase2.orderId).toBeDefined();
    expect(phase2.shopifyOrderId).toBeDefined();

    // Get order details
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        id: phase2.orderId,
        shopifyOrderId: phase2.shopifyOrderId,
        status: "confirmed",
        totalAmount: "32.40",
      }),
    });

    const order = await toolRegistry.execute("get_order_details", {
      orderId: phase2.orderId,
    });

    expect(order.success).toBe(true);
    expect(order.order.status).toBe("confirmed");
  });
});
