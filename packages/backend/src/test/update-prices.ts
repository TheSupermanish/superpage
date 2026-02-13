/**
 * Update Resource Prices Script
 * 
 * Updates all active resources to 0.0001 price for testing
 * 
 * Run: npx tsx src/test/update-prices.ts
 * 
 * Requirements:
 * - TEST_AUTH_TOKEN in .env (JWT token from wallet auth)
 */

import { configDotenv } from "dotenv";
configDotenv();

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("💰 UPDATE RESOURCE PRICES TO 0.0001");
  console.log("=".repeat(70) + "\n");

  if (!AUTH_TOKEN) {
    console.error("❌ TEST_AUTH_TOKEN not set in .env!");
    console.log("   Please add your JWT token to .env");
    console.log("   Get token by signing in via wallet at http://localhost:3000\n");
    process.exit(1);
  }

  try {
    // Get all resources
    console.log("📋 Fetching resources...\n");
    const res = await fetch(`${API_URL}/api/resources`, {
      headers: {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch resources: ${res.statusText}`);
    }

    const data = await res.json() as { resources?: any[]; data?: { resources?: any[] } } | any[];
    const resources = Array.isArray(data) ? data : (data.resources || (data.data?.resources || []));

    if (resources.length === 0) {
      console.log("⚠️  No resources found. Create some resources first.\n");
      process.exit(0);
    }

    console.log(`✅ Found ${resources.length} resource(s)\n`);

    // Update each resource
    let updated = 0;
    let failed = 0;

    for (const resource of resources) {
      try {
        console.log(`   Updating: ${resource.name} (${resource.id})...`);
        console.log(`     Current price: $${resource.priceUsdc}`);
        
        const updateRes = await fetch(`${API_URL}/api/resources/${resource.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            ...resource,
            priceUsdc: 0.0001,
          }),
        });

        if (!updateRes.ok) {
          const error = await updateRes.text();
          console.error(`     ❌ Failed: ${error}`);
          failed++;
        } else {
          console.log(`     ✅ Updated to $0.0001`);
          updated++;
        }
      } catch (err: any) {
        console.error(`     ❌ Error: ${err.message}`);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📦 Total: ${resources.length}\n`);

  } catch (err: any) {
    console.error("\n❌ Update failed!");
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }
}

main();
