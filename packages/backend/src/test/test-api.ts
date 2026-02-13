/**
 * x402 API Resource Test Script (Mantle Sepolia / MNT)
 * 
 * This script tests API resource access with x402 payments on Mantle Sepolia:
 * 1. Create or find an API resource
 * 2. Access API without payment (HTTP 402)
 * 3. Make MNT payment (native token)
 * 4. Access API with payment (get API response)
 * 
 * Run: npx tsx src/test/test-api.ts [resourceId]
 * 
 * Requirements:
 * - WALLET_PRIVATE_KEY in .env (Ethereum private key with MNT on Mantle Sepolia)
 * - X402_CHAIN=mantle-sepolia in .env
 * - X402_CURRENCY=ETH in .env (represents native MNT)
 * - Backend running on port 3001
 */

import { configDotenv } from "dotenv";
configDotenv();

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const BACKEND_URL = process.env.BACKEND_URL || API_URL;

interface Resource {
  id: string;
  slug: string;
  type: "api" | "file" | "article" | "shopify";
  name: string;
  description: string | null;
  priceUsdc: number;
  isActive: boolean;
  endpoint?: string;
  apiUrl?: string;
  apiMethod?: string;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 x402 API RESOURCE TEST (Mantle Sepolia / MNT)");
  console.log("=".repeat(70) + "\n");

  // Get resource ID from args or find/create API resource
  const resourceId = process.argv[2];

  try {
    // ============================================================
    // STEP 1: Find or Create API Resource
    // ============================================================
    console.log("📋 STEP 1: Finding API resource...\n");

    let resource: Resource | null = null;

    if (resourceId) {
      // Get specific resource
      const res = await fetch(`${API_URL}/x402/resources`);
      if (!res.ok) {
        throw new Error(`Failed to list resources: ${res.statusText}`);
      }
      const data = await res.json() as { resources?: Resource[] } | Resource[];
      const resources = Array.isArray(data) ? data : (data.resources || []);
      resource = resources.find(r => (r.id === resourceId || r.slug === resourceId) && r.type === "api") || null;
      
      if (!resource) {
        console.error(`❌ API resource not found: ${resourceId}`);
        console.log("\nAvailable API resources:");
        resources.filter(r => r.type === "api").forEach(r => {
          console.log(`   - ${r.id} (${r.type}): ${r.name} - $${r.priceUsdc}`);
        });
        process.exit(1);
      }
    } else {
      // List all resources and find API type
      const res = await fetch(`${API_URL}/x402/resources`);
      if (!res.ok) {
        throw new Error(`Failed to list resources: ${res.statusText}`);
      }
      const data = await res.json() as { resources?: Resource[] } | Resource[];
      const resources = Array.isArray(data) ? data : (data.resources || []);
      
      // Find API resources (all resources from /x402/resources are already active)
      const apiResources = resources.filter(r => r.type === "api");
      
      if (apiResources.length === 0) {
        console.log("⚠️  No API resources found. Creating a test API resource...\n");
        
        // Check if we have auth token to create resource
        if (!process.env.TEST_AUTH_TOKEN) {
          console.error("❌ No API resources found and TEST_AUTH_TOKEN not set!");
          console.log("   Please either:");
          console.log("   1. Create an API resource via dashboard:");
          console.log("      http://localhost:3000/dashboard/resources/new");
          console.log("      - Type: API");
          console.log("      - Price: 0.001");
          console.log("      - API URL: https://api.github.com/users/octocat");
          console.log("      - Method: GET");
          console.log("   2. Or set TEST_AUTH_TOKEN in .env to auto-create\n");
          process.exit(1);
        }

        // Create test API resource
        console.log("   Creating test API resource...");
        const createRes = await fetch(`${BACKEND_URL}/api/resources`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.TEST_AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            type: "api",
            name: "Test API - GitHub User",
            description: "Test API resource for x402 payments",
            priceUsdc: 0.001,
            apiUrl: "https://api.github.com/users/octocat",
            apiMethod: "GET",
            isActive: true,
          }),
        });

        if (!createRes.ok) {
          const error = await createRes.text();
          throw new Error(`Failed to create resource: ${error}`);
        }

        const newResource = await createRes.json() as { resource?: Resource } | Resource;
        let createdResource: Resource;
        if ('resource' in newResource) {
          if (!newResource.resource) {
            throw new Error("Failed to create resource: no resource returned");
          }
          createdResource = newResource.resource;
        } else {
          // TypeScript narrows: if 'resource' is not in newResource, it must be Resource
          createdResource = newResource as Resource;
        }
        resource = createdResource;
        console.log(`✅ Created test API resource: ${resource.name} (${resource.id})\n`);
      } else {
        resource = apiResources[0];
        console.log(`✅ Found ${apiResources.length} API resource(s)`);
        console.log(`   Using: ${resource.name} (${resource.id})`);
        console.log(`   Price: $${resource.priceUsdc}\n`);
      }
    }

    if (!resource || resource.type !== "api") {
      throw new Error("No API resource available");
    }

    // ============================================================
    // STEP 2: Access API Without Payment (Get 402)
    // ============================================================
    console.log("🔒 STEP 2: Accessing API without payment...\n");
    const resourceEndpoint = resource.endpoint || `/x402/resource/${resource.id}`;
    console.log(`   URL: ${API_URL}${resourceEndpoint}\n`);

    const firstRequest = await fetch(`${API_URL}${resourceEndpoint}`, {
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
      console.log(`   5. Then retry: GET ${API_URL}${resourceEndpoint}`);
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
        `${API_URL}${resourceEndpoint}`,
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
      // STEP 5: Verify API Response
      // ============================================================
      console.log("✅ Payment successful!");
      console.log(`   Status: ${paidRequest.status} ${paidRequest.statusText}`);
      console.log(`   X-402-Paid: ${paidRequest.headers.get("X-402-Paid")}\n`);

      console.log("📦 STEP 5: Retrieving API response...\n");

      const contentType = paidRequest.headers.get("content-type") || "application/json";
      console.log(`   Content-Type: ${contentType}`);

      let apiResponse: any;
      if (contentType.includes("application/json")) {
        apiResponse = await paidRequest.json();
      } else {
        apiResponse = await paidRequest.text();
      }

      console.log("✅ API Response received:");
      console.log(JSON.stringify(apiResponse, null, 2).substring(0, 800));
      if (JSON.stringify(apiResponse).length > 800) {
        console.log("   ... (truncated)");
      }

      console.log("\n" + "=".repeat(70));
      console.log("📊 TEST SUMMARY");
      console.log("=".repeat(70));
      console.log("✅ Step 1: Find/Create API Resource - PASSED");
      console.log("✅ Step 2: Get 402 Payment Required - PASSED");
      console.log("✅ Step 3: Check Wallet - PASSED");
      console.log("✅ Step 4: Make MNT Payment - PASSED");
      console.log("✅ Step 5: Get API Response - PASSED");
      console.log("\n🎉 All tests passed! API resource access working correctly.\n");
      console.log(`📍 View resource: http://localhost:3000/dashboard/resources\n`);

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
