#!/usr/bin/env tsx

/**
 * Test script to verify orders API endpoints
 */

import "dotenv/config";

const API_URL = "http://localhost:3001";

async function testOrdersAPI() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TESTING ORDERS API ENDPOINTS");
  console.log("=".repeat(70) + "\n");

  // Test 1: Get stores
  console.log("1️⃣  Fetching stores...");
  const storesRes = await fetch(`${API_URL}/x402/stores`);
  const storesData = await storesRes.json();
  const stores = storesData.data?.stores || storesData.stores || [];
  
  console.log(`   ✅ Found ${stores.length} store(s)`);
  if (stores.length === 0) {
    console.log("   ⚠️  No stores found!\n");
    return;
  }
  
  const store = stores[0];
  console.log(`   Store: ${store.name} (${store.id})\n`);

  // Test 2: Get orders for store
  console.log("2️⃣  Fetching orders for store...");
  const encodedStoreId = encodeURIComponent(store.id);
  const ordersRes = await fetch(`${API_URL}/x402/stores/${encodedStoreId}/orders`);
  
  if (!ordersRes.ok) {
    console.error(`   ❌ Failed: ${ordersRes.status} ${ordersRes.statusText}`);
    const text = await ordersRes.text();
    console.error(`   Response: ${text}\n`);
    return;
  }
  
  const orders = await ordersRes.json();
  console.log(`   ✅ Found ${orders.length} order(s)`);
  
  if (orders.length === 0) {
    console.log("   ℹ️  No orders yet. Complete a purchase to see orders.\n");
    return;
  }

  // Display each order
  orders.forEach((order: any, idx: number) => {
    console.log(`\n   Order ${idx + 1}:`);
    console.log(`     ID: ${order.id}`);
    console.log(`     Email: ${order.email}`);
    console.log(`     Status: ${order.status}`);
    console.log(`     Total: $${order.total_amount} ${order.currency}`);
    console.log(`     Items: ${order.items.length}`);
    console.log(`     Shopify: ${order.shopify_order_id || "N/A"}`);
    console.log(`     Created: ${new Date(order.created_at).toLocaleString()}`);
  });

  // Test 3: Get order details
  if (orders.length > 0) {
    console.log(`\n3️⃣  Fetching order details for ${orders[0].id}...`);
    const orderDetailsRes = await fetch(`${API_URL}/x402/orders/${orders[0].id}`);
    
    if (!orderDetailsRes.ok) {
      console.error(`   ❌ Failed: ${orderDetailsRes.status}`);
      const text = await orderDetailsRes.text();
      console.error(`   Response: ${text}\n`);
      return;
    }
    
    const orderDetails = await orderDetailsRes.json();
    console.log(`   ✅ Order details retrieved`);
    console.log(`\n   Details:`);
    console.log(`     Order ID: ${orderDetails.orderId}`);
    console.log(`     Status: ${orderDetails.status}`);
    console.log(`     Email: ${orderDetails.email}`);
    console.log(`     Store: ${orderDetails.store?.name || "N/A"}`);
    console.log(`     Total: $${orderDetails.amounts.total} ${orderDetails.amounts.currency}`);
    console.log(`     Items: ${orderDetails.items.length}`);
    orderDetails.items.forEach((item: any, idx: number) => {
      console.log(`       ${idx + 1}. ${item.product?.name || item.productId} x${item.quantity}`);
      if (item.product) {
        console.log(`          Price: $${item.product.price} ${item.product.currency}`);
      }
    });
    console.log(`     Shopify Order: ${orderDetails.shopifyOrderId || "N/A"}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(70) + "\n");
  
  console.log("📊 Summary:");
  console.log(`   Stores: ${stores.length}`);
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Total Revenue: $${orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0).toFixed(2)}`);
  console.log("\n");
}

testOrdersAPI().catch((err) => {
  console.error("\n❌ Test failed:", err.message);
  process.exit(1);
});
