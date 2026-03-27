/**
 * Comprehensive Test Script for All Purchase Types
 * 
 * Tests:
 * 1. Resource Purchase (API)
 * 2. Resource Purchase (File/Article)
 * 3. Shopify Store Purchase
 * 
 * Run: npx tsx src/test-all-purchases.ts
 * 
 * Requirements:
 * - Backend running on http://localhost:3001
 * - WALLET_PRIVATE_KEY in .env (with USDC on Mantle)
 * - X402_CHAIN=mantle-mainnet or mantle-sepolia
 * - X402_CURRENCY=USDC
 */

import { configDotenv } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, formatEther, defineChain } from "viem";
import { mainnet, sepolia, baseSepolia } from "viem/chains";
import { getChainConfig, getTokenAddress, getTokenDecimals } from "./config/chain-config.js";

configDotenv();

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;

// Get chain config from environment
const chainConfig = getChainConfig();
const NETWORK = chainConfig.network;
const CURRENCY = chainConfig.currency;
const TOKEN_ADDRESS = chainConfig.tokenAddress;
const TOKEN_DECIMALS = chainConfig.tokenDecimals;

// Define custom chains
const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
  },
});

const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
});

const biteV2Sandbox = defineChain({
  id: 103698795,
  name: 'BITE V2 Sandbox 2',
  nativeCurrency: { name: 'sFUEL', symbol: 'sFUEL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox'] },
  },
  blockExplorers: {
    default: { name: 'BITE Explorer', url: 'https://base-sepolia-testnet-explorer.skalenodes.com:10032' },
  },
  testnet: true,
});

// Map network names to viem chains
const CHAIN_MAP: Record<string, any> = {
  "mantle-mainnet": mantleMainnet,
  "mantle-sepolia": mantleSepolia,
  "mainnet": mainnet,
  "sepolia": sepolia,
  "base-sepolia": baseSepolia,
  "bite-v2-sandbox": biteV2Sandbox,
};

const chain = CHAIN_MAP[NETWORK];
if (!chain) {
  console.error(`❌ Unsupported network: ${NETWORK}`);
  console.error(`   Supported: ${Object.keys(CHAIN_MAP).join(", ")}`);
  process.exit(1);
}

// ERC20 ABI
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

// Setup wallet and clients
if (!PRIVATE_KEY) {
  console.error("❌ WALLET_PRIVATE_KEY not set in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}`);

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain,
  transport: http(),
});

console.log("\n" + "=".repeat(70));
console.log("🧪 x402 COMPREHENSIVE PURCHASE TEST");
console.log("=".repeat(70));
console.log(`Network: ${NETWORK}`);
console.log(`Currency: ${CURRENCY}`);
console.log(`Wallet: ${account.address}`);
console.log(`Token Address: ${TOKEN_ADDRESS}`);
console.log(`Token Decimals: ${TOKEN_DECIMALS}`);
console.log("=".repeat(70) + "\n");

// Helper: Check wallet balance
async function checkBalance() {
  try {
    if (CURRENCY === "ETH" || TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
      // Native token (ETH/MNT)
      const balance = await publicClient.getBalance({ address: account.address });
      const formatted = formatEther(balance);
      console.log(`💰 Wallet Balance: ${formatted} ${CURRENCY} (native)\n`);
      return balance;
    } else {
      // ERC20 token (USDC, etc.)
      const balance = await publicClient.readContract({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });
      const formatted = formatUnits(balance, TOKEN_DECIMALS);
      console.log(`💰 Wallet Balance: ${formatted} ${CURRENCY}\n`);
      return balance;
    }
  } catch (err: any) {
    console.error(`❌ Failed to check balance: ${err.message}\n`);
    return 0n;
  }
}

// Helper: Make payment (supports both native ETH/MNT and ERC20 tokens)
async function makePayment(recipient: string, amountBaseUnits: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const amount = BigInt(amountBaseUnits);
    const formatted = CURRENCY === "ETH" 
      ? formatEther(amount)
      : formatUnits(amount, TOKEN_DECIMALS);
    
    console.log(`💸 Sending ${formatted} ${CURRENCY} to ${recipient}...`);
    
    let txHash: `0x${string}`;
    
    if (CURRENCY === "ETH" || TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
      // Native token transfer (ETH/MNT)
      txHash = await walletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: amount,
      });
    } else {
      // ERC20 token transfer (USDC, etc.)
      txHash = await walletClient.writeContract({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amount],
      });
    }

    console.log(`   Transaction sent: ${txHash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      timeout: 60_000, // 60 seconds for Mantle Sepolia
    });

    if (receipt.status === "reverted") {
      return { success: false, error: "Transaction reverted" };
    }

    console.log(`   ✅ Transaction confirmed!\n`);
    return { success: true, txHash };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// TEST 1: API Resource Purchase
// ============================================================
async function testApiResource() {
  console.log("\n" + "=".repeat(70));
  console.log("📡 TEST 1: API RESOURCE PURCHASE");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: List API resources
    console.log("1️⃣  Finding API resource...");
    const listRes = await fetch(`${API_URL}/x402/resources?type=api`);
    const listData = await listRes.json();
    const resources = Array.isArray(listData) ? listData : (listData.resources || []);
    
    if (resources.length === 0) {
      console.log("   ⚠️  No API resources found. Skipping this test.");
      console.log("   💡 Create an API resource at: http://localhost:3000/dashboard/resources/new\n");
      return;
    }

    const resource = resources[0];
    console.log(`   ✅ Found: ${resource.name} (${resource.id})`);
    console.log(`   Price: $${resource.priceUsdc}\n`);

    // Step 2: Access without payment (should get 402)
    console.log("2️⃣  Accessing resource without payment...");
    const accessRes = await fetch(`${API_URL}/x402/resource/${resource.id}`);
    
    if (accessRes.status !== 402) {
      console.log(`   ⚠️  Expected 402, got ${accessRes.status}. Resource may be free or inactive.\n`);
      return;
    }

    const paymentReq = await accessRes.json();
    
    // Debug: Show what we actually got
    console.log(`   📦 Full payment response:`, JSON.stringify(paymentReq, null, 2));
    console.log(`   🔍 Checking fields: recipient=${paymentReq.recipient}, payTo=${paymentReq.payTo}`);
    
    const amountFormatted = CURRENCY === "ETH" 
      ? formatEther(BigInt(paymentReq.amount))
      : formatUnits(BigInt(paymentReq.amount), TOKEN_DECIMALS);
    const recipient = paymentReq.recipient || paymentReq.payTo;
    console.log(`   ✅ Payment required:`);
    console.log(`      Amount: ${paymentReq.amount} (${amountFormatted} ${CURRENCY})`);
    console.log(`      Recipient extracted: ${recipient}\n`);

    // Step 3: Make payment
    console.log("3️⃣  Making payment...");
    const payment = await makePayment(recipient, paymentReq.amount);
    
    if (!payment.success) {
      console.error(`   ❌ Payment failed: ${payment.error}\n`);
      return;
    }

    // Step 4: Access with payment
    console.log("4️⃣  Accessing resource with payment...");
    const paidRes = await fetch(`${API_URL}/x402/resource/${resource.id}`, {
      headers: {
        "X-PAYMENT": JSON.stringify({
          txHash: payment.txHash,
          network: NETWORK,
        }),
      },
    });

    if (paidRes.status === 200) {
      const content = await paidRes.json();
      console.log(`   ✅ Access granted!`);
      console.log(`   Response preview: ${JSON.stringify(content).substring(0, 200)}...\n`);
    } else {
      console.error(`   ❌ Access failed: ${paidRes.status}`);
      const error = await paidRes.json().catch(() => ({}));
      console.error(`   Error: ${JSON.stringify(error)}\n`);
    }
  } catch (err: any) {
    console.error(`❌ Test failed: ${err.message}\n`);
  }
}

// ============================================================
// TEST 2: File/Article Resource Purchase
// ============================================================
async function testFileResource() {
  console.log("\n" + "=".repeat(70));
  console.log("📄 TEST 2: FILE/ARTICLE RESOURCE PURCHASE");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: List file/article resources
    console.log("1️⃣  Finding file or article resource...");
    const listRes = await fetch(`${API_URL}/x402/resources?type=file`);
    let listData = await listRes.json();
    let resources = Array.isArray(listData) ? listData : (listData.resources || []);
    
    // If no files, try articles
    if (resources.length === 0) {
      const articleRes = await fetch(`${API_URL}/x402/resources?type=article`);
      listData = await articleRes.json();
      resources = Array.isArray(listData) ? listData : (listData.resources || []);
    }

    if (resources.length === 0) {
      console.log("   ⚠️  No file/article resources found. Skipping this test.");
      console.log("   💡 Create a file or article resource at: http://localhost:3000/dashboard/resources/new\n");
      return;
    }

    const resource = resources[0];
    console.log(`   ✅ Found: ${resource.name} (${resource.id})`);
    console.log(`   Type: ${resource.type}`);
    console.log(`   Price: $${resource.priceUsdc}\n`);

    // Step 2: Access without payment
    console.log("2️⃣  Accessing resource without payment...");
    const accessRes = await fetch(`${API_URL}/x402/resource/${resource.id}`);
    
    if (accessRes.status !== 402) {
      console.log(`   ⚠️  Expected 402, got ${accessRes.status}. Resource may be free.\n`);
      return;
    }

    const paymentReq = await accessRes.json();
    const recipient = paymentReq.recipient || paymentReq.payTo;
    const amountFormatted = CURRENCY === "ETH" 
      ? formatEther(BigInt(paymentReq.amount))
      : formatUnits(BigInt(paymentReq.amount), TOKEN_DECIMALS);
    console.log(`   ✅ Payment required:`);
    console.log(`      Amount: ${amountFormatted} ${CURRENCY}`);
    console.log(`      Recipient: ${recipient}\n`);

    // Step 3: Make payment
    console.log("3️⃣  Making payment...");
    const payment = await makePayment(recipient, paymentReq.amount);
    
    if (!payment.success) {
      console.error(`   ❌ Payment failed: ${payment.error}\n`);
      return;
    }

    // Step 4: Access with payment
    console.log("4️⃣  Accessing resource with payment...");
    const paidRes = await fetch(`${API_URL}/x402/resource/${resource.id}`, {
      headers: {
        "X-PAYMENT": JSON.stringify({
          txHash: payment.txHash,
          network: NETWORK,
        }),
      },
    });

    if (paidRes.status === 200) {
      const contentType = paidRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const content = await paidRes.json();
        console.log(`   ✅ Access granted!`);
        console.log(`   Content preview: ${JSON.stringify(content).substring(0, 200)}...\n`);
      } else {
        const content = await paidRes.text();
        console.log(`   ✅ Access granted!`);
        console.log(`   Content preview: ${content.substring(0, 200)}...\n`);
      }
    } else {
      console.error(`   ❌ Access failed: ${paidRes.status}\n`);
    }
  } catch (err: any) {
    console.error(`❌ Test failed: ${err.message}\n`);
  }
}

// ============================================================
// TEST 3: Shopify Store Purchase
// ============================================================
async function testShopifyPurchase() {
  console.log("\n" + "=".repeat(70));
  console.log("🛍️  TEST 3: SHOPIFY STORE PURCHASE");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: List stores
    console.log("1️⃣  Finding Shopify store...");
    const storesRes = await fetch(`${API_URL}/x402/stores`);
    const storesData = await storesRes.json();
    const stores = storesData.data?.stores || storesData.stores || (Array.isArray(storesData) ? storesData : []);
    
    if (stores.length === 0) {
      console.log("   ⚠️  No stores found. Skipping this test.");
      console.log("   💡 Connect a Shopify store at: http://localhost:3000/dashboard/stores\n");
      return;
    }

    const store = stores[0];
    console.log(`   ✅ Found store: ${store.name} (${store.id})\n`);

    // Step 2: Get products
    console.log("2️⃣  Fetching products...");
    const productsRes = await fetch(`${API_URL}/x402/stores/${encodeURIComponent(store.id)}/products`);
    const productsData = await productsRes.json();
    const products = productsData.products || [];
    
    if (products.length === 0) {
      console.log("   ⚠️  No products found. Skipping this test.");
      console.log("   💡 Import products from Shopify first.\n");
      return;
    }

    const product = products[0];
    console.log(`   ✅ Found product: ${product.name}`);
    console.log(`   Price: $${product.price} ${product.currency}\n`);

    // Step 3: Initiate checkout (Phase 1)
    console.log("3️⃣  Initiating checkout (Phase 1)...");
    const checkoutBody = {
      storeId: store.id,
      items: [{ productId: product.id || product.variantId, quantity: 1 }],
      email: "test@x402.test",
      shippingAddress: {
        name: "Test User",
        address1: "123 Test St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
      },
    };

    const checkoutRes = await fetch(`${API_URL}/x402/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutBody),
    });

    const checkoutData = await checkoutRes.json();
    
    if (!checkoutData.orderIntentId) {
      console.error(`   ❌ Checkout failed: ${JSON.stringify(checkoutData)}\n`);
      return;
    }
    
    console.log(`   ✅ Checkout initiated`);
    console.log(`      Order Intent ID: ${checkoutData.orderIntentId}`);
    console.log(`      Total: $${checkoutData.amounts?.total || "N/A"}\n`);
    
    // Extract payment requirements
    const paymentReq = checkoutData.paymentRequirements?.[0];
    if (!paymentReq) {
      console.error(`   ❌ No payment requirements returned\n`);
      return;
    }
    
    const amountFormatted = CURRENCY === "ETH" || CURRENCY === "MNT"
      ? formatEther(BigInt(paymentReq.amount))
      : formatUnits(BigInt(paymentReq.amount), TOKEN_DECIMALS);
    const recipient = paymentReq.recipient || paymentReq.payTo;
    const amount = paymentReq.amount;
    
    console.log(`   ✅ Payment required:`);
    console.log(`      Amount: ${amount} (${amountFormatted} ${CURRENCY})`);
    console.log(`      Recipient: ${recipient}\n`);

    // Step 4: Make payment
    console.log("4️⃣  Making payment...");
    const payment = await makePayment(recipient, amount);
    
    if (!payment.success) {
      console.error(`   ❌ Payment failed: ${payment.error}\n`);
      return;
    }

    // Step 5: Finalize checkout (Phase 2)
    console.log("5️⃣  Finalizing checkout (Phase 2)...");
    const finalizeBody = {
      ...checkoutBody,
      orderIntentId: checkoutData.orderIntentId,
    };
    
    const finalizeRes = await fetch(`${API_URL}/x402/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": JSON.stringify({
          txHash: payment.txHash,
          transactionHash: payment.txHash,
          network: NETWORK,
          chainId: chain.id,
          timestamp: Date.now(),
        }),
      },
      body: JSON.stringify(finalizeBody),
    });

    if (finalizeRes.status === 200) {
      const order = await finalizeRes.json();
      console.log(`   ✅ Order confirmed!`);
      console.log(`      Order ID: ${order.orderId}`);
      console.log(`      Shopify Order: ${order.shopifyOrderId || "N/A"}`);
      console.log(`      Status: ${order.status}\n`);
    } else {
      console.error(`   ❌ Order finalization failed: ${finalizeRes.status}`);
      const error = await finalizeRes.json().catch(() => ({}));
      console.error(`   Error: ${JSON.stringify(error)}\n`);
    }
  } catch (err: any) {
    console.error(`❌ Test failed: ${err.message}\n`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  // Check wallet balance first
  await checkBalance();

  // Run all tests
  await testApiResource();
  await testFileResource();
  await testShopifyPurchase();

  console.log("\n" + "=".repeat(70));
  console.log("✅ ALL TESTS COMPLETE!");
  console.log("=".repeat(70) + "\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
