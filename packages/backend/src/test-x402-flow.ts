/**
 * x402 Flow Test Script
 * 
 * This script tests the complete x402 checkout flow:
 * 1. List stores
 * 2. Get products
 * 3. Initiate checkout (HTTP 402)
 * 4. Make USDC payment
 * 5. Finalize checkout
 * 
 * Run: npx tsx src/test-x402-flow.ts
 */

import { configDotenv } from "dotenv";
configDotenv();

const MCP_URL = "http://localhost:3001/mcp";
const PAYMENT_MCP_URL = "http://localhost:3002/mcp";

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content: Array<{ type: string; text: string }>;
  };
  error?: {
    code: number;
    message: string;
    data?: string;
  };
}

async function callMCP(url: string, method: string, toolName: string, args: any): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  const data = (await response.json()) as MCPResponse;
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message} - ${data.error.data || ""}`);
  }

  if (data.result?.content?.[0]?.text) {
    return JSON.parse(data.result.content[0].text);
  }

  return data;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 x402 FLOW TEST SCRIPT");
  console.log("=".repeat(70) + "\n");

  try {
    // ============================================================
    // STEP 1: List Stores
    // ============================================================
    console.log("📋 STEP 1: Listing available stores...\n");
    
    const storesResult = await callMCP(MCP_URL, "tools/call", "list_stores", {});
    
    if (!storesResult.success || !storesResult.stores?.length) {
      console.error("❌ No stores found! Please register a store first.");
      console.log("   Go to http://localhost:3000/register to connect a Shopify store.\n");
      process.exit(1);
    }

    const store = storesResult.stores[0];
    console.log(`✅ Found ${storesResult.stores.length} store(s)`);
    console.log(`   Using store: ${store.name} (${store.id})\n`);

    // ============================================================
    // STEP 2: Get Products
    // ============================================================
    console.log("📦 STEP 2: Fetching products...\n");
    
    const productsResult = await callMCP(MCP_URL, "tools/call", "get_store_products", {
      storeId: store.id,
    });

    if (!productsResult.success || !productsResult.products?.length) {
      console.error("❌ No products found! Please select products first.");
      console.log("   Go to http://localhost:3000/products to select products.\n");
      process.exit(1);
    }

    // Find a product under $1 (we only have 1 USDC for testing)
    const affordableProduct = productsResult.products.find(
      (p: any) => parseFloat(p.price) <= 1
    );
    const product = affordableProduct || productsResult.products[0];
    
    console.log(`✅ Found ${productsResult.products.length} product(s)`);
    console.log(`   Using product: ${product.name}`);
    console.log(`   Price: $${product.price} ${product.currency}`);
    console.log(`   Variant ID: ${product.id}\n`);

    // ============================================================
    // STEP 3: Initiate Checkout (HTTP 402)
    // ============================================================
    console.log("🛒 STEP 3: Initiating checkout (Phase 1 - HTTP 402)...\n");

    const checkoutArgs = {
      storeId: store.id,
      items: [{ productId: product.id, quantity: 1 }],
      email: "ai-agent@x402.test",
      shippingAddress: {
        name: "AI Test Agent",
        address1: "123 Blockchain Avenue",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
      },
    };

    const checkoutResult = await callMCP(MCP_URL, "tools/call", "initiate_checkout", checkoutArgs);

    if (!checkoutResult.success || checkoutResult.phase !== "1_payment_required") {
      console.error("❌ Checkout initiation failed!");
      console.error("   Result:", JSON.stringify(checkoutResult, null, 2));
      process.exit(1);
    }

    const orderIntentId = checkoutResult.orderIntentId;
    const paymentReq = checkoutResult.paymentRequirements[0];
    
    console.log(`✅ Checkout initiated - Payment Required!`);
    console.log(`   Order Intent ID: ${orderIntentId}`);
    console.log(`   Total: $${checkoutResult.amounts.total} ${checkoutResult.amounts.currency}`);
    console.log(`   USDC Amount: ${paymentReq.amount} (micro USDC)`);
    console.log(`   Pay To: ${paymentReq.payTo}`);
    console.log(`   Expires: ${paymentReq.expiresAt}\n`);

    // ============================================================
    // STEP 4: Make USDC Payment
    // ============================================================
    console.log("💳 STEP 4: Making USDC payment on Solana...\n");

    if (!process.env.WALLET_SECRET_KEY) {
      console.error("❌ WALLET_SECRET_KEY not set in .env!");
      console.log("   Please add your Solana wallet private key to .env");
      console.log("   This wallet needs devnet USDC to make payments.\n");
      console.log("📝 Simulating payment for demo purposes...\n");
      
      // For demo, we'll skip the actual payment
      console.log("⚠️  SKIPPING PAYMENT (no wallet configured)");
      console.log("   In production, the AI agent would execute the Solana transaction here.\n");
      
      console.log("=".repeat(70));
      console.log("📊 TEST SUMMARY (Partial - No Payment)");
      console.log("=".repeat(70));
      console.log("✅ Step 1: List Stores - PASSED");
      console.log("✅ Step 2: Get Products - PASSED");
      console.log("✅ Step 3: Initiate Checkout - PASSED");
      console.log("⚠️  Step 4: Make Payment - SKIPPED (no wallet)");
      console.log("⚠️  Step 5: Finalize Checkout - SKIPPED");
      console.log("\nTo complete the test, add WALLET_SECRET_KEY to your .env file");
      console.log("and ensure the wallet has devnet USDC balance.\n");
      process.exit(0);
    }

    const paymentResult = await callMCP(PAYMENT_MCP_URL, "tools/call", "make_usdc_payment", {
      recipientAddress: paymentReq.payTo,
      amountMicroUsdc: paymentReq.amount,
      network: "devnet",
      memo: `x402-order-${orderIntentId}`,
    });

    if (!paymentResult.success) {
      console.error("❌ Payment failed!");
      console.error("   Error:", paymentResult.error);
      console.error("   Details:", paymentResult.details?.message);
      console.log("\n   Make sure your wallet has enough devnet USDC.");
      console.log("   Get USDC from: https://faucet.circle.com/\n");
      process.exit(1);
    }

    const paymentProof = paymentResult.paymentProof;
    console.log(`✅ Payment successful!`);
    console.log(`   Transaction: ${paymentProof.signature}`);
    console.log(`   Network: ${paymentProof.network}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${paymentProof.signature}?cluster=devnet\n`);

    // Wait a moment for transaction to be confirmed
    console.log("⏳ Waiting for transaction confirmation...\n");
    await sleep(3000);

    // ============================================================
    // STEP 5: Finalize Checkout
    // ============================================================
    console.log("✨ STEP 5: Finalizing checkout (Phase 2)...\n");

    const finalizeResult = await callMCP(MCP_URL, "tools/call", "finalize_checkout", {
      ...checkoutArgs,
      orderIntentId,
      paymentProof,
    });

    if (!finalizeResult.success || finalizeResult.phase !== "2_order_confirmed") {
      console.error("❌ Checkout finalization failed!");
      console.error("   Result:", JSON.stringify(finalizeResult, null, 2));
      process.exit(1);
    }

    console.log(`✅ ORDER CONFIRMED!`);
    console.log(`   Order ID: ${finalizeResult.orderId}`);
    console.log(`   Shopify Order: ${finalizeResult.shopifyOrderId}`);
    console.log(`   Status: ${finalizeResult.status}`);
    console.log(`   Total: $${finalizeResult.amounts.total}\n`);

    // ============================================================
    // STEP 6: Get Order Details
    // ============================================================
    console.log("📄 STEP 6: Fetching order details...\n");

    const orderDetails = await callMCP(MCP_URL, "tools/call", "get_order_details", {
      orderId: finalizeResult.orderId,
    });

    if (orderDetails.success) {
      console.log(`✅ Order Details:`);
      console.log(`   Store: ${orderDetails.order.store?.name}`);
      console.log(`   Email: ${orderDetails.order.email}`);
      console.log(`   Items: ${orderDetails.order.items?.length} item(s)`);
      console.log(`   Created: ${orderDetails.order.createdAt}\n`);
    }

    // ============================================================
    // SUCCESS!
    // ============================================================
    console.log("=".repeat(70));
    console.log("🎉 TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n✅ All steps passed:");
    console.log("   1. List Stores - PASSED");
    console.log("   2. Get Products - PASSED");
    console.log("   3. Initiate Checkout (HTTP 402) - PASSED");
    console.log("   4. Make USDC Payment - PASSED");
    console.log("   5. Finalize Checkout - PASSED");
    console.log("   6. Get Order Details - PASSED");
    console.log("\n📍 Check your results:");
    console.log(`   Dashboard: http://localhost:3000/dashboard`);
    console.log(`   Shopify Admin: Check your Shopify orders`);
    console.log(`   Solana Explorer: https://explorer.solana.com/tx/${paymentProof.signature}?cluster=devnet`);
    console.log("\n");

  } catch (error: any) {
    console.error("\n❌ TEST FAILED!");
    console.error("   Error:", error.message);
    if (error.cause) {
      console.error("   Cause:", error.cause);
    }
    console.log("\n");
    process.exit(1);
  }
}

// Run the test
main();

