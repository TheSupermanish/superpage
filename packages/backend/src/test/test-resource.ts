/**
 * x402 Resource Test Script (Mantle Sepolia / MNT)
 * 
 * This script tests the complete x402 resource access flow on Mantle Sepolia:
 * 1. List available resources
 * 2. Access resource without payment (HTTP 402)
 * 3. Make MNT payment (native token)
 * 4. Access resource with payment (get content)
 * 
 * Run: npx tsx src/test/test-resource.ts [resourceId]
 * 
 * Requirements:
 * - WALLET_PRIVATE_KEY in .env (Ethereum private key with MNT on Mantle Sepolia)
 * - X402_CHAIN=mantle-sepolia in .env
 * - X402_CURRENCY=ETH in .env (represents native MNT)
 */

import { configDotenv } from "dotenv";
configDotenv();

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Resource {
  id: string;
  slug: string;
  type: "api" | "file" | "article" | "shopify";
  name: string;
  description: string | null;
  priceUsdc: number;
  isActive: boolean;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 x402 RESOURCE TEST (Mantle Sepolia / MNT)");
  console.log("=".repeat(70) + "\n");

  // Get resource ID from args or list resources
  const resourceId = process.argv[2];

  try {
    // ============================================================
    // STEP 1: List or Get Resource
    // ============================================================
    console.log("📋 STEP 1: Finding resource...\n");

    let resource: Resource | null = null;

    if (resourceId) {
      // Get specific resource
      const res = await fetch(`${API_URL}/x402/resources`);
      if (!res.ok) {
        throw new Error(`Failed to list resources: ${res.statusText}`);
      }
      const data = await res.json() as { resources?: Resource[] } | Resource[];
      const resources = Array.isArray(data) ? data : (data.resources || []);
      resource = resources.find(r => r.id === resourceId || r.slug === resourceId) || null;
      
      if (!resource) {
        console.error(`❌ Resource not found: ${resourceId}`);
        console.log("\nAvailable resources:");
        resources.forEach(r => {
          console.log(`   - ${r.id} (${r.type}): ${r.name} - $${r.priceUsdc}`);
        });
        process.exit(1);
      }
    } else {
      // List all resources
      const res = await fetch(`${API_URL}/x402/resources`);
      if (!res.ok) {
        throw new Error(`Failed to list resources: ${res.statusText}`);
      }
      const data = await res.json() as { resources?: Resource[] } | Resource[];
      const resources = Array.isArray(data) ? data : (data.resources || []);
      
      if (resources.length === 0) {
        console.error("❌ No resources found!");
        console.log("   Please create a resource first:");
        console.log("   1. Go to http://localhost:3000/dashboard/resources/new");
        console.log("   2. Create an API, File, or Article resource");
        console.log("   3. Set price to 0.001");
        console.log("   4. Run this script with the resource ID:\n");
        console.log("      npx tsx src/test/test-resource.ts <resourceId>\n");
        process.exit(1);
      }

      // Use first resource (all resources from /x402/resources are already active)
      resource = resources[0];
      console.log(`✅ Found ${resources.length} resource(s)`);
      console.log(`   Using: ${resource.name} (${resource.id})`);
      console.log(`   Type: ${resource.type}`);
      console.log(`   Price: $${resource.priceUsdc}\n`);
    }

    if (!resource) {
      throw new Error("No resource available");
    }

    // ============================================================
    // STEP 2: Access Resource Without Payment (Get 402)
    // ============================================================
    console.log("🔒 STEP 2: Accessing resource without payment...\n");
    console.log(`   URL: ${API_URL}/x402/resource/${resource.id}\n`);

    const firstRequest = await fetch(`${API_URL}/x402/resource/${resource.id}`, {
      method: "GET",
    });

    console.log(`   Status: ${firstRequest.status} ${firstRequest.statusText}`);

    if (firstRequest.status !== 402) {
      console.error(`❌ Expected 402 Payment Required, got ${firstRequest.status}`);
      const text = await firstRequest.text();
      console.error(`   Response: ${text.substring(0, 200)}`);
      process.exit(1);
    }

    const paymentData = await firstRequest.json() as {
      resourceName?: string;
      resourceType?: string;
      priceFormatted?: string;
      amount?: string;
      network?: string;
      token?: string;
      currency?: string;
      recipient?: string;
    };

    console.log("✅ Received 402 Payment Required");
    console.log(`   Resource: ${paymentData.resourceName || "N/A"}`);
    console.log(`   Type: ${paymentData.resourceType || "N/A"}`);
    console.log(`   Price: ${paymentData.priceFormatted || paymentData.amount || "N/A"}`);
    console.log(`   Network: ${paymentData.network}`);
    console.log(`   Currency: ${paymentData.token || paymentData.currency} (MNT native)`);
    console.log(`   Pay To: ${paymentData.recipient}`);
    console.log(`   Amount (base units): ${paymentData.amount}\n`);

    // ============================================================
    // STEP 3: Check Wallet Configuration
    // ============================================================
    console.log("💳 STEP 3: Checking wallet configuration...\n");

    if (!process.env.WALLET_PRIVATE_KEY) {
      console.error("❌ WALLET_PRIVATE_KEY not set in .env!");
      console.log("   Please add your Ethereum private key to .env");
      console.log("   This wallet needs MNT on Mantle Sepolia to make payments.\n");
      console.log("📝 To test manually:");
      console.log(`   1. Make payment: ${paymentData.amount} base units`);
      console.log(`   2. To: ${paymentData.recipient}`);
      console.log(`   3. Network: ${paymentData.network}`);
      console.log(`   4. Currency: ${paymentData.token || paymentData.currency}`);
      console.log(`   5. Then retry: GET ${API_URL}/x402/resource/${resource.id}`);
      console.log(`      Header: X-PAYMENT: <payment_proof>\n`);
      process.exit(1);
    }

    // Load Ethereum SDK
    const { X402Client } = await import("../../../x402-sdk-eth/dist/index.js");
    const { privateKeyToAccount } = await import("viem/accounts");
    
    const privateKey = process.env.WALLET_PRIVATE_KEY.startsWith("0x")
      ? process.env.WALLET_PRIVATE_KEY
      : `0x${process.env.WALLET_PRIVATE_KEY}`;
    
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`✅ Wallet loaded: ${account.address}\n`);

    // ============================================================
    // STEP 4: Make Payment Using x402 Ethereum Client
    // ============================================================
    console.log("💸 STEP 4: Making MNT payment on Mantle Sepolia...\n");

    const network = paymentData.network || process.env.X402_CHAIN || "mantle-sepolia";

    const x402Client = new X402Client({
      network: network as any,
      signer: account,
    });

    console.log(`   Network: ${network}`);
    console.log(`   Currency: ${paymentData.token || "ETH"} (MNT native)`);
    console.log(`   Amount: ${paymentData.amount} base units`);
    console.log(`   Recipient: ${paymentData.recipient}\n`);

    try {
      // Use x402 client to make the request (it handles payment automatically)
      const paidRequest = await x402Client.fetch(
        `${API_URL}/x402/resource/${resource.id}`,
        {
          method: "GET",
          autoPayment: true,
        }
      );

      if (paidRequest.status === 402) {
        const errorData = (await paidRequest.json()) as { error?: string; details?: string };
        console.error("❌ Payment failed or insufficient funds!");
        console.error(`   Error: ${errorData.error || "Payment verification failed"}`);
        console.error(`   Details: ${errorData.details || "Unknown"}\n`);
        console.log("💡 Make sure your wallet has:");
        console.log("   1. Enough MNT for the payment (0.001+ MNT)");
        console.log("   2. Enough MNT for gas fees");
        console.log(`   Get MNT from: https://faucet.sepolia.mantle.xyz/\n`);
        process.exit(1);
      }

      if (!paidRequest.ok) {
        const errorText = await paidRequest.text();
        console.error(`❌ Request failed with status ${paidRequest.status}`);
        console.error(`   Response: ${errorText.substring(0, 200)}\n`);
        process.exit(1);
      }

      // ============================================================
      // STEP 5: Verify Content Access
      // ============================================================
      console.log("✅ Payment successful!");
      console.log(`   Status: ${paidRequest.status} ${paidRequest.statusText}`);
      console.log(`   X-402-Paid: ${paidRequest.headers.get("X-402-Paid")}\n`);

      console.log("📦 STEP 5: Retrieving resource content...\n");

      const contentType = paidRequest.headers.get("content-type") || "application/json";
      console.log(`   Content-Type: ${contentType}`);

      let content: any;
      if (contentType.includes("application/json")) {
        content = await paidRequest.json();
      } else {
        content = await paidRequest.text();
      }

      // Display content based on type
      switch (resource.type) {
        case "api":
          console.log("✅ API Response:");
          console.log(JSON.stringify(content, null, 2).substring(0, 500));
          if (JSON.stringify(content).length > 500) {
            console.log("   ... (truncated)");
          }
          break;

        case "file":
          console.log("✅ File download successful!");
          console.log(`   Content-Length: ${paidRequest.headers.get("content-length") || "unknown"}`);
          console.log(`   Content-Disposition: ${paidRequest.headers.get("content-disposition") || "unknown"}`);
          if (typeof content === "string" && content.length < 200) {
            console.log(`   Preview: ${content.substring(0, 100)}...`);
          }
          break;

        case "article":
          console.log("✅ Article content:");
          if (content.content) {
            console.log(`   Title: ${content.name}`);
            console.log(`   Content (${content.contentType}):`);
            const preview = typeof content.content === "string" 
              ? content.content.substring(0, 300)
              : JSON.stringify(content.content).substring(0, 300);
            console.log(`   ${preview}...`);
          } else {
            console.log(JSON.stringify(content, null, 2).substring(0, 500));
          }
          break;

        default:
          console.log("✅ Resource content:");
          console.log(JSON.stringify(content, null, 2).substring(0, 500));
      }

      console.log("\n" + "=".repeat(70));
      console.log("📊 TEST SUMMARY");
      console.log("=".repeat(70));
      console.log("✅ Step 1: Find Resource - PASSED");
      console.log("✅ Step 2: Get 402 Payment Required - PASSED");
      console.log("✅ Step 3: Check Wallet - PASSED");
      console.log("✅ Step 4: Make MNT Payment - PASSED");
      console.log("✅ Step 5: Access Content - PASSED");
      console.log("\n🎉 All tests passed! Resource access working correctly.\n");

    } catch (err: any) {
      console.error("\n❌ Payment or access failed!");
      console.error(`   Error: ${err.message}`);
      if (err.stack) {
        console.error(`   Stack: ${err.stack.split("\n").slice(0, 3).join("\n")}`);
      }
      console.log("\n💡 Troubleshooting:");
      console.log("   1. Check wallet has MNT for payment");
      console.log("   2. Check wallet has MNT for gas fees");
      console.log("   3. Verify network matches (mantle-sepolia)");
      console.log("   4. Check backend is running on port 3001");
      console.log("   5. Get MNT from: https://faucet.sepolia.mantle.xyz/\n");
      process.exit(1);
    }

  } catch (err: any) {
    console.error("\n❌ Test failed!");
    console.error(`   Error: ${err.message}`);
    if (err.stack) {
      console.error(`   Stack: ${err.stack.split("\n").slice(0, 5).join("\n")}`);
    }
    process.exit(1);
  }
}

main();
