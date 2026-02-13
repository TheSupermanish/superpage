/**
 * Test Weather API Access with x402 Payment
 * 
 * Tests the full flow:
 * 1. Attempt to access weather API (get 402)
 * 2. Make payment with MNT on Mantle Sepolia
 * 3. Retry with payment proof
 * 4. Access weather data successfully
 * 
 * Run: pnpm exec tsx src/test-weather-api.ts
 */

import { configDotenv } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { getChainConfig } from "./config/chain-config.js";

configDotenv();

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("❌ WALLET_PRIVATE_KEY not found in .env");
  process.exit(1);
}

// Get chain config
const chainConfig = getChainConfig();
const NETWORK = chainConfig.network;
const CURRENCY = chainConfig.currency;
const TOKEN_DECIMALS = chainConfig.tokenDecimals;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           TEST: Weather API with x402 Payment               ║
╚══════════════════════════════════════════════════════════════╝

Network: ${NETWORK}
Currency: ${CURRENCY}
API: ${API_URL}
`);

// Define Mantle Sepolia chain
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
});

const CHAIN_MAP: Record<string, any> = {
  "mantle-sepolia": mantleSepolia,
};

const chain = CHAIN_MAP[NETWORK];

if (!chain) {
  console.error(`❌ Unsupported network: ${NETWORK}`);
  process.exit(1);
}

// Setup wallet
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
const publicClient = createPublicClient({
  chain,
  transport: http(),
});
const walletClient = createWalletClient({
  account,
  chain,
  transport: http(),
});

console.log(`Wallet: ${account.address}`);

// Helper to make payment
async function makePayment(recipient: string, amount: string) {
  console.log(`\n💸 Making payment...`);
  console.log(`  To: ${recipient}`);
  console.log(`  Amount: ${amount} wei (raw)`);
  
  const amountFormatted = (parseInt(amount) / (10 ** TOKEN_DECIMALS)).toFixed(6);
  console.log(`  Amount: ${amountFormatted} ${CURRENCY}`);

  try {
    // Native MNT transfer
    const txHash = await walletClient.sendTransaction({
      to: recipient as `0x${string}`,
      value: BigInt(amount),
    });

    console.log(`  Tx Hash: ${txHash}`);
    console.log(`  Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      timeout: 60_000, // 60 seconds
    });

    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted");
    }

    console.log(`  ✅ Payment confirmed!`);
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Explorer: https://sepolia.mantlescan.xyz/tx/${txHash}`);
    
    return { success: true, txHash };
  } catch (error: any) {
    console.error(`  ❌ Payment failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testWeatherAPI() {
  const weatherEndpoint = `${API_URL}/x402/resource/weather-data`;
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Step 1: Attempt to access Weather API (expect 402)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`URL: ${weatherEndpoint}`);

  const initialResponse = await fetch(weatherEndpoint);
  
  console.log(`Status: ${initialResponse.status}`);

  if (initialResponse.status !== 402) {
    console.error(`❌ Expected 402, got ${initialResponse.status}`);
    const body = await initialResponse.text();
    console.log(`Response: ${body}`);
    return;
  }

  const paymentReq = await initialResponse.json();
  console.log(`\n💰 Payment Required:`);
  console.log(`  Amount: ${paymentReq.amount} wei`);
  console.log(`  Recipient: ${paymentReq.recipient || paymentReq.payTo}`);
  console.log(`  Currency: ${paymentReq.currency || CURRENCY}`);
  console.log(`  Network: ${paymentReq.network || NETWORK}`);
  console.log(`  Request ID: ${paymentReq.requestId || 'N/A'}`);

  const recipient = paymentReq.recipient || paymentReq.payTo;
  const amountFormatted = (parseInt(paymentReq.amount) / (10 ** TOKEN_DECIMALS)).toFixed(6);
  console.log(`  Amount formatted: ${amountFormatted} ${CURRENCY}`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Step 2: Make Payment`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const paymentResult = await makePayment(recipient, paymentReq.amount);

  if (!paymentResult.success) {
    console.error(`\n❌ Payment failed, cannot continue`);
    return;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Step 3: Retry with Payment Proof`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const paymentProof = {
    txHash: paymentResult.txHash,
    transactionHash: paymentResult.txHash,
    network: NETWORK,
    chainId: chain.id,
    timestamp: Date.now(),
  };

  console.log(`Payment Proof:`, JSON.stringify(paymentProof, null, 2));

  const retryResponse = await fetch(weatherEndpoint, {
    method: 'GET',
    headers: {
      'X-PAYMENT': JSON.stringify(paymentProof),
    },
  });

  console.log(`\nStatus: ${retryResponse.status}`);

  if (retryResponse.status !== 200) {
    console.error(`❌ Expected 200, got ${retryResponse.status}`);
    const errorBody = await retryResponse.text();
    console.log(`Response: ${errorBody}`);
    return;
  }

  const weatherData = await retryResponse.json();
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ SUCCESS! Weather Data Received:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(JSON.stringify(weatherData, null, 2));

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║               ✅ WEATHER API TEST PASSED!                    ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\nPaid: ${amountFormatted} ${CURRENCY}`);
  console.log(`Transaction: https://sepolia.mantlescan.xyz/tx/${paymentResult.txHash}`);
  console.log(`Data: Weather information successfully retrieved!`);
}

// Run test
testWeatherAPI().catch((error) => {
  console.error(`\n❌ Test failed:`, error);
  process.exit(1);
});
