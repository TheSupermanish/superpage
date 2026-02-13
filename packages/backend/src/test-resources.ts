#!/usr/bin/env bun
import { configDotenv } from "dotenv";
configDotenv();

const API_URL = "http://localhost:3001";

async function testResourceFlow() {
  console.log("🧪 Testing x402 Resource Flow\n");

  // 1. Test public resources listing
  console.log("1️⃣  Fetching public resources...");
  const resourcesRes = await fetch(`${API_URL}/x402/resources`);
  if (!resourcesRes.ok) {
    console.error(`❌ Failed to fetch resources: ${resourcesRes.status}`);
    return;
  }
  
  const resourcesData = (await resourcesRes.json()) as { count: number; resources: Array<{ id?: string; type: string; name: string; slug: string; priceFormatted: string; endpoint: string; creator: { name?: string; walletAddress: string } }> };
  console.log(`✅ Found ${resourcesData.count} public resources`);
  
  if (resourcesData.resources.length === 0) {
    console.log("\n⚠️  No public resources found!");
    console.log("   Create some resources first via the dashboard:");
    console.log("   http://localhost:3000/dashboard/resources\n");
    return;
  }

  // Display resources
  console.log("\n📦 Available Resources:");
  for (const resource of resourcesData.resources) {
    console.log(`\n   ${resource.type.toUpperCase()}: ${resource.name}`);
    console.log(`   Slug: ${resource.slug}`);
    console.log(`   Price: ${resource.priceFormatted}`);
    console.log(`   Endpoint: ${API_URL}${resource.endpoint}`);
    console.log(`   Creator: ${resource.creator.name || resource.creator.walletAddress.slice(0, 8)}`);
  }

  // 2. Test accessing a resource without payment (should get 402)
  const testResource = resourcesData.resources[0];
  console.log(`\n2️⃣  Testing resource access without payment: ${testResource.slug}`);
  
  const accessRes = await fetch(`${API_URL}/x402/resource/${testResource.slug}`);
  
  if (accessRes.status === 402) {
    console.log("✅ Correctly returned 402 Payment Required");
    const paymentReq = (await accessRes.json()) as { priceFormatted?: string; amount?: string; network: string; payTo: string };
    console.log(`   Amount: ${paymentReq.priceFormatted || paymentReq.amount} USDC`);
    console.log(`   Network: ${paymentReq.network}`);
    console.log(`   Pay To: ${paymentReq.payTo}`);
  } else {
    console.log(`❌ Expected 402, got ${accessRes.status}`);
  }

  // 3. Test with UUID (if different from slug)
  if (testResource.id !== testResource.slug) {
    console.log(`\n3️⃣  Testing resource access by UUID: ${testResource.id}`);
    const uuidRes = await fetch(`${API_URL}/x402/resource/${testResource.id}`);
    
    if (uuidRes.status === 402) {
      console.log("✅ UUID lookup works correctly");
    } else {
      console.log(`❌ Expected 402, got ${uuidRes.status}`);
    }
  }

  console.log("\n✅ Resource flow test complete!\n");
}

testResourceFlow().catch(console.error);
