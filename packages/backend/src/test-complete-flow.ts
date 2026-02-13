#!/usr/bin/env bun
/**
 * Complete test demonstrating:
 * 1. API resource with payment
 * 2. Shopify resource with payment (checkout flow)
 */
import { configDotenv } from "dotenv";
configDotenv();

const API_URL = "http://localhost:3001";
const PAYMENT_MCP_URL = "http://localhost:3002/mcp";

interface MCPResponse {
  jsonrpc: string;
  result?: any;
  error?: { code: number; message: string; data?: any };
  id: string | number;
}

async function callMCP(
  url: string,
  method: string,
  toolName: string,
  params: Record<string, any>
): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params: { name: toolName, arguments: params },
    }),
  });

  const data = (await response.json()) as MCPResponse;
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }
  return data.result?.content?.[0]?.text ? JSON.parse(data.result.content[0].text) : data.result;
}

type PaymentReq = { resourceName: string; resourceType: string; priceFormatted: string; amount: string; payTo: string; network: string; description?: string };

async function testApiResource() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: API Resource with Payment");
  console.log("=".repeat(60));

  // Step 1: Get payment requirements
  console.log("\n1️⃣  Fetching API resource payment requirements...");
  const res = await fetch(`${API_URL}/x402/resource/super-llm`);
  
  if (res.status !== 402) {
    console.error(`❌ Expected 402, got ${res.status}`);
    return;
  }

  const paymentReq = (await res.json()) as PaymentReq;
  console.log(`✅ Resource: ${paymentReq.resourceName}`);
  console.log(`   Type: ${paymentReq.resourceType}`);
  console.log(`   Price: ${paymentReq.priceFormatted}`);
  console.log(`   Amount (micro): ${paymentReq.amount}`);
  console.log(`   Pay to: ${paymentReq.payTo}`);

  // Step 2: Make payment
  console.log("\n2️⃣  Making USDC payment...");
  try {
    const paymentResult = await callMCP(PAYMENT_MCP_URL, "tools/call", "make_usdc_payment", {
      recipientAddress: paymentReq.payTo,
      amountMicroUsdc: paymentReq.amount,
      network: "devnet",
      memo: `x402-api-super-llm`,
    });

    if (!paymentResult.success) {
      console.error(`❌ Payment failed: ${paymentResult.error || 'Unknown error'}`);
      return;
    }

    const signature = paymentResult.paymentProof.signature;
    const amountUsdc = (parseInt(paymentResult.details.amountMicroUsdc) / 1e6).toFixed(2);

    console.log(`✅ Payment successful!`);
    console.log(`   Signature: ${signature}`);
    console.log(`   Amount: ${amountUsdc} USDC`);

    // Step 3: Access resource with payment
    console.log("\n3️⃣  Accessing API resource with payment...");
    const xPaymentHeader = JSON.stringify({
      network: `solana-${paymentReq.network}`,
      signature: signature,
      amount: paymentReq.amount,
    });

    const accessRes = await fetch(`${API_URL}/x402/resource/super-llm`, {
      headers: {
        "X-PAYMENT": xPaymentHeader,
      },
    });

    if (accessRes.status === 200) {
      console.log(`✅ Access granted!`);
      const data = await accessRes.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + "...");
    } else {
      console.log(`❌ Access failed with status: ${accessRes.status}`);
      const error = await accessRes.json();
      console.log(`   Error:`, error);
    }

  } catch (err: any) {
    console.error(`❌ Payment failed: ${err.message}`);
  }
}

async function testShopifyResource() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Shopify Resource (Store)");
  console.log("=".repeat(60));

  // Step 1: Get payment requirements for store
  console.log("\n1️⃣  Fetching Shopify store payment requirements...");
  const res = await fetch(`${API_URL}/x402/resource/x402`);
  
  if (res.status !== 402) {
    console.error(`❌ Expected 402, got ${res.status}`);
    return;
  }

  const paymentReq = (await res.json()) as PaymentReq;
  console.log(`✅ Resource: ${paymentReq.resourceName}`);
  console.log(`   Type: ${paymentReq.resourceType}`);
  console.log(`   Price: ${paymentReq.priceFormatted}`);
  console.log(`   Description: ${paymentReq.description}`);

  // Step 2: Make payment
  console.log("\n2️⃣  Making USDC payment...");
  try {
    const paymentResult = await callMCP(PAYMENT_MCP_URL, "tools/call", "make_usdc_payment", {
      recipientAddress: paymentReq.payTo,
      amountMicroUsdc: paymentReq.amount,
      network: "devnet",
      memo: `x402-store-x402`,
    });

    if (!paymentResult.success) {
      console.error(`❌ Payment failed: ${paymentResult.error || 'Unknown error'}`);
      return;
    }

    const signature = paymentResult.paymentProof.signature;

    console.log(`✅ Payment successful!`);
    console.log(`   Signature: ${signature}`);

    // Step 3: Access store with payment
    console.log("\n3️⃣  Accessing Shopify store with payment...");
    const xPaymentHeader = JSON.stringify({
      network: `solana-${paymentReq.network}`,
      signature: signature,
      amount: paymentReq.amount,
    });

    const accessRes = await fetch(`${API_URL}/x402/resource/x402`, {
      headers: {
        "X-PAYMENT": xPaymentHeader,
      },
    });

    if (accessRes.status === 200) {
      console.log(`✅ Access granted!`);
      const data = (await accessRes.json()) as any;
      console.log(`   Store Info:`, data);
      console.log(`\n   💡 Now you can use the checkout endpoint:`);
      console.log(`      ${data.checkoutEndpoint}`);
    } else {
      console.log(`❌ Access failed with status: ${accessRes.status}`);
    }

  } catch (err: any) {
    console.error(`❌ Payment failed: ${err.message}`);
  }
}

async function main() {
  console.log("🧪 x402 Complete Resource Flow Test");
  console.log("Testing both API and Shopify resources with payments\n");

  // Check payment server
  try {
    const healthCheck = await fetch("http://localhost:3002/health");
    if (!healthCheck.ok) {
      console.error("❌ Payment server not running!");
      console.log("   Start it with: pnpm run dev:payment");
      process.exit(1);
    }
  } catch (e) {
    console.error("❌ Payment server not reachable!");
    console.log("   Start it with: pnpm run dev:payment");
    process.exit(1);
  }

  await testApiResource();
  await testShopifyResource();

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests complete!");
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
