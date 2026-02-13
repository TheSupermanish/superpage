#!/usr/bin/env bun
/**
 * Simple Order Creation Test
 * Tests if orders are being created properly in the database
 */

import { configDotenv } from "dotenv";
configDotenv();

const BACKEND_URL = "http://localhost:3001";

async function testOrderCreation() {
  console.log("\n🧪 Testing Order Creation Flow\n");
  console.log("=" .repeat(60));

  try {
    // Step 1: List stores
    console.log("\n1️⃣  Listing stores...");
    const storesRes = await fetch(`${BACKEND_URL}/x402/stores`);
    const stores = (await storesRes.json()) as { stores?: Array<{ id: string; name: string }> };
    
    if (!stores?.stores || stores.stores.length === 0) {
      console.error("❌ No stores found!");
      console.log("   Please create a store first.\n");
      return;
    }
    
    const store = stores.stores![0];
    console.log(`✅ Found store: ${store.name} (${store.id})`);

    // Step 2: Get products
    console.log(`\n2️⃣  Fetching products from store...`);
    const productsRes = await fetch(`${BACKEND_URL}/x402/stores/${store.id}/products`);
    const productsData = (await productsRes.json()) as { products?: Array<{ name: string; price: string; variant_id: string }> };
    
    if (!productsData.products || productsData.products.length === 0) {
      console.error("❌ No products found!");
      console.log("   Please add products to the store first.\n");
      return;
    }
    
    const product = productsData.products[0];
    console.log(`✅ Found product: ${product.name} ($${product.price})`);

    // Step 3: Initiate checkout (Phase 1)
    console.log(`\n3️⃣  Initiating checkout (Phase 1 - HTTP 402)...`);
    const checkoutBody = {
      storeId: store.id,
      items: [{ productId: product.variant_id, quantity: 1 }],
      email: "test@example.com",
      shippingAddress: {
        name: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state: "CA",
        postalCode: "12345",
        country: "US"
      }
    };

    const phase1Res = await fetch(`${BACKEND_URL}/x402/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutBody),
    });

    if (phase1Res.status !== 402) {
      console.error(`❌ Expected HTTP 402, got ${phase1Res.status}`);
      const error = await phase1Res.json();
      console.error("   Error:", error);
      return;
    }

    const phase1Data = (await phase1Res.json()) as { orderIntentId: string; amounts: { total: string } };
    console.log(`✅ Phase 1 successful - HTTP 402 received`);
    console.log(`   Order Intent ID: ${phase1Data.orderIntentId}`);
    console.log(`   Total: $${phase1Data.amounts.total}`);

    // Step 4: Check if payment server is running
    console.log(`\n4️⃣  Checking payment server...`);
    try {
      const paymentHealthRes = await fetch("http://localhost:3002/health");
      if (paymentHealthRes.ok) {
        console.log(`✅ Payment server is running`);
      } else {
        throw new Error("Payment server not responding");
      }
    } catch (err) {
      console.error("❌ Payment server is NOT running!");
      console.log("   Start it with: pnpm run dev:payment");
      console.log("   Or use: pnpm run dev:all");
      console.log("\n   Without payment server, orders cannot be completed.\n");
      return;
    }

    // Step 5: Check for existing orders
    console.log(`\n5️⃣  Checking existing orders...`);
    const ordersRes = await fetch(`${BACKEND_URL}/x402/stores/${store.id}/orders`);
    const orders = (await ordersRes.json()) as Array<{ id: string; status: string; total_amount: string; created_at?: string }>;
    
    console.log(`\n📊 Order Statistics:`);
    console.log(`   Total orders: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log(`\n   Recent orders:`);
      orders.slice(0, 3).forEach((order, i: number) => {
        console.log(`   ${i + 1}. Order ${order.id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Total: $${order.total_amount}`);
        console.log(`      Created: ${order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}`);
      });
    } else {
      console.log(`   ⚠️  No completed orders yet`);
    }

    // Step 6: Check order intents
    console.log(`\n6️⃣  Checking order intents...`);
    const intentsRes = await fetch(`${BACKEND_URL}/x402/stores/${store.id}/order-intents`);
    const intents = (await intentsRes.json()) as Array<{ status: string }>;
    
    console.log(`\n📋 Order Intent Statistics:`);
    console.log(`   Total intents: ${intents.length}`);
    
    const pending = intents.filter((i) => i.status === 'pending').length;
    const paid = intents.filter((i) => i.status === 'paid').length;
    const expired = intents.filter((i) => i.status === 'expired').length;
    
    console.log(`   Pending: ${pending}`);
    console.log(`   Paid: ${paid}`);
    console.log(`   Expired: ${expired}`);

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Test Complete!");
    console.log("\n💡 To create an actual order:");
    console.log("   1. Make sure payment server is running (pnpm run dev:all)");
    console.log("   2. Run: pnpm run test:flow");
    console.log("\n");

  } catch (error: any) {
    console.error("\n❌ Test Failed!");
    console.error("   Error:", error.message);
    if (error.cause) {
      console.error("   Cause:", error.cause);
    }
    console.log("\n");
    process.exit(1);
  }
}

// Run the test
testOrderCreation();
