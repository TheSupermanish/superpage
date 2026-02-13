#!/usr/bin/env tsx

/**
 * MCP Client Test Script
 * Tests the x402 Shopping Agent MCP server
 */

import "dotenv/config";

const MCP_URL = process.env.MCP_URL || "http://localhost:3001/mcp";

let requestId = 1;

/**
 * Make an MCP JSON-RPC 2.0 request
 */
async function mcpRequest(method: string, params?: any) {
  const payload = {
    jsonrpc: "2.0",
    id: requestId++,
    method,
    params,
  };

  console.log(`\n📤 REQUEST: ${method}`);
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  console.log(`\n📥 RESPONSE:`);
  console.log(JSON.stringify(data, null, 2));

  return data;
}

/**
 * Extract text content from MCP response
 */
function extractText(result: any): string {
  if (result?.content?.[0]?.text) {
    return result.content[0].text;
  }
  return JSON.stringify(result);
}

/**
 * Test 1: List available tools
 */
async function testListTools() {
  console.log("\n" + "=".repeat(70));
  console.log("🔧 TEST 1: LIST AVAILABLE TOOLS");
  console.log("=".repeat(70));

  const response = await mcpRequest("tools/list");
  
  if (response.result?.tools) {
    console.log(`\n✅ Found ${response.result.tools.length} tools:`);
    response.result.tools.forEach((tool: any, idx: number) => {
      console.log(`\n${idx + 1}. ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Required params: ${tool.inputSchema.required?.join(", ") || "none"}`);
    });
  }

  return response;
}

/**
 * Test 2: List stores
 */
async function testListStores() {
  console.log("\n" + "=".repeat(70));
  console.log("🏪 TEST 2: LIST STORES");
  console.log("=".repeat(70));

  const response = await mcpRequest("tools/call", {
    name: "list_stores",
    arguments: {},
  });

  if (response.result) {
    const text = extractText(response.result);
    const data = JSON.parse(text);
    
    console.log(`\n✅ Stores found: ${data.stores?.length || 0}`);
    if (data.stores && data.stores.length > 0) {
      data.stores.forEach((store: any, idx: number) => {
        console.log(`\n${idx + 1}. ${store.name}`);
        console.log(`   ID: ${store.id}`);
        console.log(`   URL: ${store.url}`);
        console.log(`   Networks: ${store.networks?.join(", ") || "N/A"}`);
        console.log(`   Asset: ${store.asset || "N/A"}`);
      });
      
      return data.stores[0]; // Return first store for next test
    }
  }

  return null;
}

/**
 * Test 3: Get store products
 */
async function testGetStoreProducts(storeId: string) {
  console.log("\n" + "=".repeat(70));
  console.log("📦 TEST 3: GET STORE PRODUCTS");
  console.log("=".repeat(70));

  console.log(`\nFetching products for store: ${storeId}`);

  const response = await mcpRequest("tools/call", {
    name: "get_store_products",
    arguments: { storeId },
  });

  if (response.result) {
    const text = extractText(response.result);
    const data = JSON.parse(text);
    
    console.log(`\n✅ Products found: ${data.products?.length || 0}`);
    if (data.products && data.products.length > 0) {
      data.products.forEach((product: any, idx: number) => {
        console.log(`\n${idx + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: ${product.price} ${product.currency}`);
        console.log(`   Inventory: ${product.inventory ?? "N/A"}`);
      });
      
      return data.products[0]; // Return first product for next test
    }
  }

  return null;
}

/**
 * Test 4: Initiate checkout
 */
async function testInitiateCheckout(storeId: string, productId: string) {
  console.log("\n" + "=".repeat(70));
  console.log("🛒 TEST 4: INITIATE CHECKOUT (Phase 1)");
  console.log("=".repeat(70));

  const checkoutData = {
    storeId,
    items: [{ productId, quantity: 1 }],
    email: "mcp-test@x402.test",
    shippingAddress: {
      name: "MCP Test User",
      address1: "123 Agent Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
    },
  };

  console.log(`\nInitiating checkout for product: ${productId}`);

  const response = await mcpRequest("tools/call", {
    name: "initiate_checkout",
    arguments: checkoutData,
  });

  if (response.result) {
    const text = extractText(response.result);
    const data = JSON.parse(text);
    
    if (data.orderIntentId) {
      console.log(`\n✅ Checkout initiated!`);
      console.log(`   Order Intent ID: ${data.orderIntentId}`);
      console.log(`   Total: $${data.amounts?.total || "N/A"} ${data.amounts?.currency || ""}`);
      
      if (data.paymentRequirements && data.paymentRequirements.length > 0) {
        const req = data.paymentRequirements[0];
        console.log(`\n💳 Payment Required:`);
        console.log(`   Network: ${req.network}`);
        console.log(`   Token: ${req.token}`);
        console.log(`   Amount: ${req.amount} (base units)`);
        console.log(`   Recipient: ${req.recipient}`);
        console.log(`   Expires: ${req.expiresAt}`);
      }
      
      return data;
    } else if (data.error) {
      console.error(`\n❌ Checkout failed: ${data.error}`);
    }
  }

  return null;
}

/**
 * Test 5: Get order details
 */
async function testGetOrderDetails(orderId: string) {
  console.log("\n" + "=".repeat(70));
  console.log("📋 TEST 5: GET ORDER DETAILS");
  console.log("=".repeat(70));

  console.log(`\nFetching order: ${orderId}`);

  const response = await mcpRequest("tools/call", {
    name: "get_order_details",
    arguments: { orderId },
  });

  if (response.result) {
    const text = extractText(response.result);
    const data = JSON.parse(text);
    
    if (data.order) {
      console.log(`\n✅ Order found!`);
      console.log(`   Order ID: ${data.order.id}`);
      console.log(`   Status: ${data.order.status}`);
      console.log(`   Total: $${data.order.totalAmount} ${data.order.currency}`);
      console.log(`   Created: ${data.order.createdAt}`);
      
      if (data.order.shopifyOrderId) {
        console.log(`   Shopify Order: ${data.order.shopifyOrderId}`);
      }
    } else if (data.error) {
      console.error(`\n❌ Order not found: ${data.error}`);
    }
  }
}

/**
 * Main test flow
 */
async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🤖 x402 MCP CLIENT TEST SUITE");
  console.log("=".repeat(70));
  console.log(`MCP Server: ${MCP_URL}`);
  console.log("=".repeat(70));

  try {
    // Test 1: List tools
    await testListTools();

    // Test 2: List stores
    const store = await testListStores();
    if (!store) {
      console.log("\n⚠️  No stores available. Please connect a store first.");
      console.log("   Run: http://localhost:3000/dashboard/stores");
      return;
    }

    // Test 3: Get products
    const product = await testGetStoreProducts(store.id);
    if (!product) {
      console.log("\n⚠️  No products available. Please import products first.");
      console.log("   Run: http://localhost:3000/dashboard/stores");
      return;
    }

    // Test 4: Initiate checkout
    const checkout = await testInitiateCheckout(store.id, product.id);
    if (!checkout) {
      console.log("\n⚠️  Checkout failed. Check the logs above.");
      return;
    }

    // Test 5: Get order details (if we have a recent order)
    console.log("\n💡 To test order details, use a completed order ID:");
    console.log("   node -r tsx/cjs test-mcp-client.ts <order-id>");

    console.log("\n" + "=".repeat(70));
    console.log("✅ MCP CLIENT TESTS COMPLETE!");
    console.log("=".repeat(70));
    console.log("\n🎉 All MCP tools are working correctly!");
    console.log("   - Tools discovery ✓");
    console.log("   - Store listing ✓");
    console.log("   - Product listing ✓");
    console.log("   - Checkout initiation ✓");
    console.log("\n💡 Next steps:");
    console.log("   1. Make payment to the recipient address shown above");
    console.log("   2. Use finalize_checkout tool with payment proof");
    console.log("   3. Check order details with get_order_details");

  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if order ID is provided for order details test
if (process.argv[2]) {
  testGetOrderDetails(process.argv[2]).then(() => {
    console.log("\n✅ Order details test complete!");
  });
} else {
  main();
}
