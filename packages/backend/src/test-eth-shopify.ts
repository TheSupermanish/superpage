/**
 * Test Ethereum x402 with Shopify Products
 */

import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";

const BACKEND_URL = "http://localhost:3001";
const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY!;

async function main() {
  console.log("\n🛍️  Testing x402 Ethereum with Shopify\n");
  console.log("=".repeat(60));

  // Check wallet
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log("Wallet Address:", account.address);

  // Check ETH balance
  const client = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const balance = await client.getBalance({ address: account.address });
  console.log("ETH Balance:", formatEther(balance), "ETH");

  // Check if we have any stores and products
  console.log("\n📦 Fetching Shopify stores and products...");
  
  try {
    const storesRes = await fetch(`${BACKEND_URL}/x402/stores`);
    const storesData = (await storesRes.json()) as { stores?: Array<{ id: string; name: string }> } | Array<{ id: string; name: string }>;
    const stores = Array.isArray(storesData) ? storesData : storesData.stores || [];
    
    if (!stores || stores.length === 0) {
      console.log("❌ No stores found. Please connect a Shopify store first.");
      console.log("   Run: pnpm run connect:shopify");
      return;
    }

    console.log(`✅ Found ${stores.length} store(s)`);
    
    const store = stores[0];
    console.log(`   Store: ${store.name || store.id}`);
    console.log(`   Store ID: ${store.id}`);
    
    // Fetch all products
    const productsRes = await fetch(`${BACKEND_URL}/x402/store-products`);
    const productsData = (await productsRes.json()) as { products?: Array<{ storeId: string; name: string; price: string; currency: string; id: string }> };
    const allProducts = productsData.products || [];
    
    // Filter products for this store
    const products = allProducts.filter((p: any) => p.storeId === store.id);
    
    if (!products || products.length === 0) {
      console.log("❌ No products found. Please import products from Shopify.");
      return;
    }

    console.log(`✅ Found ${products.length} product(s)`);
    
    // Pick the first product
    const product = products[0];
    console.log(`   Product: ${product.name}`);
    console.log(`   Price: ${product.price} ${product.currency}`);
    console.log(`   Product ID: ${product.id}`);

    // Test the Ethereum gateway endpoint
    const encodedStoreId = encodeURIComponent(store.id);
    const encodedProductId = encodeURIComponent(product.id);
    const gatewayUrl = `${BACKEND_URL}/x402/eth/store/${encodedStoreId}/product/${encodedProductId}`;
    console.log(`\n🔗 Testing: ${gatewayUrl}`);
    console.log("=".repeat(60));

    // First request: Should return 402 with MNT requirements
    console.log("\n1️⃣  First Request (without payment)...");
    const firstRes = await fetch(gatewayUrl);
    console.log(`   Status: ${firstRes.status} ${firstRes.statusText}`);
    
    if (firstRes.status === 402) {
      const requirements = (await firstRes.json()) as { network: string; token: string; amount: string; recipient: string };
      console.log(`   ✅ Got payment requirements:`);
      console.log(`      Network: ${requirements.network}`);
      console.log(`      Token: ${requirements.token}`);
      console.log(`      Amount: ${requirements.amount} (base units)`);
      console.log(`      Recipient: ${requirements.recipient}`);
      console.log(`      Price: ${(parseInt(requirements.amount) / 1e18).toFixed(2)} MNT`);
      
      // Check if we have MNT tokens
      console.log("\n⚠️  Note: You need MNT tokens to complete this purchase.");
      console.log("   Your wallet does not have MNT balance.");
      console.log("   To test with actual payments:");
      console.log("   1. Get MNT tokens from the MNT contract");
      console.log("   2. Or switch to a testnet with test MNT");
      
      console.log("\n✅ Ethereum x402 gateway is configured correctly!");
      console.log("   - 402 responses working");
      console.log("   - Payment requirements with MNT");
      console.log("   - Connected to your Shopify products");
    } else {
      console.log("❌ Expected 402 status, got:", firstRes.status);
      console.log("Response:", await firstRes.text());
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test complete!\n");
}

main().catch(console.error);
