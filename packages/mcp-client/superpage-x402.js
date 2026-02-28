#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                           SUPERPAGE x402                                    ║
 * ║                                                                            ║
 * ║  MCP Client for AI Agents - Shop & Pay with configurable currency         ║
 * ║                                                                            ║
 * ║  Add to claude_desktop_config.json:                                        ║
 * ║  {                                                                         ║
 * ║    "mcpServers": {                                                         ║
 * ║      "superpage-x402": {                                                    ║
 * ║        "command": "node",                                                  ║
 * ║        "args": ["/path/to/superpage-x402.js"],                             ║
 * ║        "env": {                                                            ║
 * ║          "SUPERPAGE_SERVER": "http://localhost:3001",                       ║
 * ║          "WALLET_PRIVATE_KEY": "your-ethereum-private-key",               ║
 * ║          "ETH_NETWORK": "mainnet"                                          ║
 * ║        }                                                                   ║
 * ║      }                                                                     ║
 * ║    }                                                                       ║
 * ║  }                                                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { createInterface } from "readline";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { 
  mainnet, 
  sepolia,
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
} from "viem/chains";

// Define Mantle chains
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
});

const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle',
  network: 'mantle',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
    public: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://mantlescan.xyz' },
  },
});

// Define Cronos chains
const cronosTestnet = defineChain({
  id: 338,
  name: 'Cronos Testnet',
  network: 'cronos-testnet',
  nativeCurrency: { name: 'TCRO', symbol: 'TCRO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://cronos-testnet.drpc.org'] },
    public: { http: ['https://cronos-testnet.drpc.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronos Testnet Explorer', url: 'https://explorer.cronos.org/testnet' },
  },
  testnet: true,
});

const cronosMainnet = defineChain({
  id: 25,
  name: 'Cronos',
  network: 'cronos',
  nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.cronos.org'] },
    public: { http: ['https://evm.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronos Explorer', url: 'https://explorer.cronos.org' },
  },
});

const biteV2Sandbox = defineChain({
  id: 103698795,
  name: 'BITE V2 Sandbox',
  network: 'bite-v2-sandbox',
  nativeCurrency: { name: 'sFUEL', symbol: 'sFUEL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox'] },
    public: { http: ['https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox'] },
  },
  blockExplorers: {
    default: { name: 'BITE V2 Explorer', url: 'https://base-sepolia-testnet.explorer.skalenodes.com' },
  },
  testnet: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SERVER_URL = process.env.SUPERPAGE_SERVER || "http://localhost:3001";
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const NETWORK = process.env.X402_CHAIN || process.env.ETH_NETWORK || "base-sepolia";
const CURRENCY = process.env.X402_CURRENCY || "USDC";
const TOKEN_ADDRESS = process.env.X402_TOKEN_ADDRESS || "";
const TOKEN_DECIMALS = process.env.X402_TOKEN_DECIMALS 
  ? parseInt(process.env.X402_TOKEN_DECIMALS, 10)
  : (CURRENCY === "USDC" || CURRENCY === "USDT" || CURRENCY === "devUSDC.e" ? 6 : 18);
const MAX_AUTO_PAYMENT = parseFloat(process.env.MAX_AUTO_PAYMENT || "10.00");

const CHAINS = {
  mainnet: mainnet,
  sepolia: sepolia,
  base: base,
  "base-sepolia": baseSepolia,
  polygon: polygon,
  "polygon-amoy": polygonAmoy,
  arbitrum: arbitrum,
  "arbitrum-sepolia": arbitrumSepolia,
  optimism: optimism,
  "optimism-sepolia": optimismSepolia,
  "mantle-sepolia": mantleSepolia,
  "mantle": mantleMainnet,
  "cronos-testnet": cronosTestnet,
  "cronos": cronosMainnet,
  "bite-v2-sandbox": biteV2Sandbox,
};

// Token contract addresses (will be resolved from network and currency if not set)
const TOKEN_ADDRESSES = {
  mainnet: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeCB5f6243C",
  },
  sepolia: {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
    DAI: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
  },
  "cronos-testnet": {
    USDC: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
    "devUSDC.e": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
  },
  cronos: {
    USDC: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
  },
  base: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  "base-sepolia": {
    USDC: "0xa059e27967e5a573a14a62c706ebd1be75333f9a",
  },
  polygon: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  arbitrum: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  optimism: {
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
  "bite-v2-sandbox": {
    USDC: "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8",
  },
};

// Resolve token contract address
function getTokenContract() {
  if (TOKEN_ADDRESS) return TOKEN_ADDRESS;
  const networkTokens = TOKEN_ADDRESSES[NETWORK];
  if (networkTokens && networkTokens[CURRENCY]) {
    return networkTokens[CURRENCY];
  }
  return "0x0000000000000000000000000000000000000000";
}

const TOKEN_CONTRACT = getTokenContract();

// ERC20 Transfer ABI
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
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// WALLET SETUP
// ═══════════════════════════════════════════════════════════════════════════

let wallet = null;
let publicClient = null;
let walletClient = null;

if (WALLET_PRIVATE_KEY) {
  try {
    const chain = CHAINS[NETWORK] || mainnet;
    const privateKey = WALLET_PRIVATE_KEY.startsWith("0x")
      ? WALLET_PRIVATE_KEY
      : `0x${WALLET_PRIVATE_KEY}`;

    wallet = privateKeyToAccount(privateKey);

    publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    walletClient = createWalletClient({
      account: wallet,
      chain,
      transport: http(),
    });

    log(`✓ Wallet loaded: ${wallet.address.slice(0, 10)}...`);
    log(`✓ Network: ${NETWORK}`);
    log(`✓ Token: ${CURRENCY} (${TOKEN_CONTRACT.slice(0, 10)}...)`);
    log(`✓ Server: ${SERVER_URL}`);
  } catch (e) {
    log(`✗ Invalid wallet key: ${e.message}`);
  }
} else {
  log(`⚠ No wallet configured (WALLET_PRIVATE_KEY not set)`);
  log(`  Payment tools will be disabled`);
}

// Simple logging to stderr (stdout is reserved for MCP protocol)
function log(message) {
  console.error(`[superpage-x402] ${message}`);
}

// Get blockchain explorer URL based on network
function getExplorerUrl(txHash) {
  const explorers = {
    'mainnet': `https://etherscan.io/tx/${txHash}`,
    'sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
    'base': `https://basescan.org/tx/${txHash}`,
    'base-sepolia': `https://sepolia.basescan.org/tx/${txHash}`,
    'polygon': `https://polygonscan.com/tx/${txHash}`,
    'polygon-amoy': `https://amoy.polygonscan.com/tx/${txHash}`,
    'arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'arbitrum-sepolia': `https://sepolia.arbiscan.io/tx/${txHash}`,
    'optimism': `https://optimistic.etherscan.io/tx/${txHash}`,
    'optimism-sepolia': `https://sepolia-optimism.etherscan.io/tx/${txHash}`,
    'mantle-sepolia': `https://sepolia.mantlescan.xyz/tx/${txHash}`,
    'mantle': `https://mantlescan.xyz/tx/${txHash}`,
    'cronos-testnet': `https://explorer.cronos.org/testnet/tx/${txHash}`,
    'cronos': `https://explorer.cronos.org/tx/${txHash}`,
    'bite-v2-sandbox': `https://base-sepolia-testnet.explorer.skalenodes.com/tx/${txHash}`,
  };
  return explorers[NETWORK] || `https://base-sepolia-testnet.explorer.skalenodes.com/tx/${txHash}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MCP TOOLS DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const TOOLS = [
  // ─────────────────────────────────────────────────────────────────────────
  // DISCOVERY
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "x402_discover",
    description:
      "Probe any URL to check if it supports x402 payments. Returns payment requirements if the resource requires payment.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to check for x402 support (any HTTP endpoint)",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          description: "HTTP method to use (default: GET)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "x402_list_resources",
    description:
      "List all public x402 resources (APIs, files, articles). Returns resource IDs, prices, types, and full URLs. IMPORTANT: Use the 'url' field directly with x402_request - it contains the correct server URL.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["api", "file", "article", "shopify"],
          description: "Filter by resource type (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of resources to return (default: 50)",
        },
      },
      required: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SHOPPING
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "x402_list_stores",
    description:
      "List all available x402-enabled shopping stores. Returns store IDs, names, and product counts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "x402_browse_products",
    description:
      "Browse products in a specific store. Returns product IDs, titles, prices, and availability.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID (e.g., shopify/store-name)",
        },
        search: {
          type: "string",
          description: "Optional search query to filter products",
        },
      },
      required: ["storeId"],
    },
  },
  {
    name: "x402_buy",
    description:
      `Purchase product(s) from a store. Automatically handles the full checkout flow: creates order intent, makes ${CURRENCY} payment on ${NETWORK}, and confirms the order.`,
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID",
        },
        items: {
          type: "array",
          description: "Items to purchase",
          items: {
            type: "object",
            properties: {
              productId: {
                type: "string",
                description: "Product variant ID (from x402_browse_products)",
              },
              quantity: {
                type: "number",
                description: "Quantity to purchase (default: 1)",
              },
            },
            required: ["productId"],
          },
        },
        email: {
          type: "string",
          description: "Customer email for order confirmation",
        },
        shippingAddress: {
          type: "object",
          description: "Shipping address for physical products",
          properties: {
            name: { type: "string", description: "Full name" },
            address1: { type: "string", description: "Street address" },
            city: { type: "string" },
            state: { type: "string", description: "State/Province" },
            postalCode: { type: "string", description: "ZIP/Postal code" },
            country: {
              type: "string",
              description: "2-letter country code (e.g., US, GB, CA)",
            },
          },
          required: [
            "name",
            "address1",
            "city",
            "state",
            "postalCode",
            "country",
          ],
        },
      },
      required: ["storeId", "items", "email", "shippingAddress"],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UNIVERSAL API ACCESS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "x402_request",
    description:
      `Make an HTTP request to any x402-enabled API. If the server returns HTTP 402 Payment Required, automatically pays with ${CURRENCY} on ${NETWORK} and retries. IMPORTANT: Use the 'url' field from x402_list_resources - it contains the correct server URL (${SERVER_URL}).`,
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: `Full URL of the API endpoint. Get this from x402_list_resources 'url' field. Server: ${SERVER_URL}`,
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          description: "HTTP method (default: GET)",
        },
        headers: {
          type: "object",
          description: "Optional request headers",
        },
        body: {
          type: "object",
          description: "Optional request body (for POST/PUT)",
        },
        maxPayment: {
          type: "string",
          description:
            `Maximum ${CURRENCY} willing to pay (e.g., '0.50'). Defaults to MAX_AUTO_PAYMENT env var.`,
        },
      },
      required: ["url"],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WALLET
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "x402_wallet",
    description:
      `Check the agent wallet's ETH and ${CURRENCY} balance. Also shows the wallet address and network.`,
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "x402_send",
    description:
      `Send ${CURRENCY} directly to any wallet address. For peer-to-peer payments.`,
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient Ethereum wallet address (0x...)",
        },
        amount: {
          type: "string",
          description: `Amount in ${CURRENCY} (e.g., '5.00')`,
        },
        memo: {
          type: "string",
          description: "Optional payment memo/note (not stored on-chain)",
        },
      },
      required: ["to", "amount"],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ORDER TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "x402_order_status",
    description: "Get the status and details of an existing order by order ID.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Order ID (returned from x402_buy)",
        },
      },
      required: ["orderId"],
    },
  },
  {
    name: "x402_list_orders",
    description:
      "List all completed orders for a store. Shows order IDs, amounts, status, and payment details.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID (e.g., shopify/store-name). Get from x402_list_stores.",
        },
      },
      required: ["storeId"],
    },
  },
  {
    name: "x402_list_order_intents",
    description:
      "List pending (unpaid) order intents for a store. These are checkouts that were started but not yet paid.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID (e.g., shopify/store-name). Get from x402_list_stores.",
        },
      },
      required: ["storeId"],
    },
  },
  {
    name: "x402_search_resources",
    description:
      "Search resources by keyword across name and description. Filter by type (api, file, article). Returns matching resources with prices and URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword (e.g., 'weather', 'typescript', 'AI')",
        },
        type: {
          type: "string",
          enum: ["api", "file", "article"],
          description: "Filter by resource type (optional)",
        },
      },
      required: ["query"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleTool(name, args) {
  try {
    switch (name) {
      case "x402_discover":
        return await discoverX402(args.url, args.method);
      case "x402_list_resources":
        return await listResources(args.type, args.limit);
      case "x402_list_stores":
        return await listStores();
      case "x402_browse_products":
        return await browseProducts(args.storeId, args.search);
      case "x402_buy":
        return await fullCheckout(args);
      case "x402_request":
        return await x402Request(args);
      case "x402_wallet":
        return await getWalletBalance();
      case "x402_send":
        return await sendToken(args.to, args.amount, args.memo);
      case "x402_order_status":
        return await getOrderStatus(args.orderId);
      case "x402_list_orders":
        return await listOrders(args.storeId);
      case "x402_list_order_intents":
        return await listOrderIntents(args.storeId);
      case "x402_search_resources":
        return await searchResources(args.query, args.type);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    log(`Error in ${name}: ${err.message}`);
    return { error: err.message, tool: name };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY: Check if URL supports x402
// ─────────────────────────────────────────────────────────────────────────────
async function discoverX402(url, method = "GET") {
  try {
    const res = await fetch(url, { method });

    if (res.status === 402) {
      const paymentReq = await res.json();
      return {
        x402Enabled: true,
        status: 402,
        paymentRequired: {
          amountRaw: paymentReq.amount,
          amount:
            paymentReq.amount && !isNaN(paymentReq.amount)
              ? (parseInt(paymentReq.amount) / (10 ** TOKEN_DECIMALS)).toFixed(6)
              : null,
          currency: paymentReq.currency || CURRENCY,
          network: paymentReq.network || "ethereum",
          payTo: paymentReq.payTo,
          description: paymentReq.description,
        },
        message: "This endpoint requires payment. Use x402_request to pay and access.",
      };
    }

    return {
      x402Enabled: false,
      status: res.status,
      message: `Endpoint returned ${res.status} - no payment required`,
    };
  } catch (err) {
    return { error: `Failed to probe ${url}: ${err.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY: List all public resources
// ─────────────────────────────────────────────────────────────────────────────
async function listResources(type, limit = 50) {
  let url = `${SERVER_URL}/x402/resources?limit=${limit}`;
  if (type) {
    url += `&type=${type}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list resources: ${res.status}` };
  }

  const data = await res.json();

  return {
    serverUrl: SERVER_URL,
    resources: (data.resources || []).map((r) => ({
      id: r.id,
      slug: r.slug,
      type: r.type,
      name: r.name,
      description: r.description,
      price: r.priceUsdc,
      priceFormatted: `${r.priceUsdc} ${CURRENCY}`,
      accessCount: r.accessCount,
      endpoint: r.endpoint,
      // Full URL for direct use - always use SERVER_URL
      url: `${SERVER_URL}${r.endpoint}`,
      creator: r.creator,
    })),
    count: data.count || 0,
    currency: CURRENCY,
    network: NETWORK,
    note: `Use the 'url' field directly with x402_request. Base server: ${SERVER_URL}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPPING: List stores
// ─────────────────────────────────────────────────────────────────────────────
async function listStores() {
  const res = await fetch(`${SERVER_URL}/x402/stores`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list stores: ${res.status}` };
  }

  const data = await res.json();

  // API returns {success: true, data: {stores: [...]}}
  const stores = data.data?.stores || data.stores || [];

  return {
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      url: s.url,
      shopDomain: s.shopDomain,
      networks: s.networks || [],
      asset: s.asset || CURRENCY,
      currency: s.currency || "USD",
    })),
    count: stores.length,
    paymentInfo: {
      currency: CURRENCY,
      network: NETWORK,
      contract: TOKEN_CONTRACT,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPPING: Browse products
// ─────────────────────────────────────────────────────────────────────────────
async function browseProducts(storeId, search) {
  // URL encode the storeId to handle slashes
  let url = `${SERVER_URL}/x402/stores/${encodeURIComponent(storeId)}/products`;
  if (search) {
    url += `?search=${encodeURIComponent(search)}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to get products: ${res.status}` };
  }

  const data = await res.json();

  const products = (data.products || []).map((p) => ({
    id: p.id,
    variantId: p.variantId || p.id,
    name: p.name,
    description: p.description,
    image: p.image,
    priceUSD: p.price,
    price: p.price,
    currency: CURRENCY,
    available: p.inventory === null || p.inventory > 0,
    inventory: p.inventory,
  }));

  return {
    storeId,
    products,
    count: products.length,
    paymentInfo: {
      currency: CURRENCY,
      network: "Ethereum",
    },
    nextCursor: data.nextCursor,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPPING: Full checkout flow with configurable currency
// ─────────────────────────────────────────────────────────────────────────────
async function fullCheckout({ storeId, items, email, shippingAddress }) {
  if (!wallet) {
    return {
      error: "No wallet configured. Set WALLET_PRIVATE_KEY environment variable.",
    };
  }

  log(`Starting checkout for ${items.length} item(s) in store ${storeId}`);

  // Build checkout payload
  const checkoutPayload = {
    storeId,
    items: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity || 1,
    })),
    email,
    shippingAddress: {
      name: shippingAddress.name,
      address1: shippingAddress.address1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
    },
  };

  // Step 1: Initiate checkout (expect 402)
  log("Step 1: Initiating checkout...");
  const initRes = await fetch(
    `${SERVER_URL}/x402/checkout`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload),
    }
  );

  if (initRes.status !== 402) {
    const err = await initRes.json().catch(() => ({}));
    return {
      error: err.error || `Checkout failed with status ${initRes.status}`,
    };
  }

  const checkoutData = await initRes.json();
  const paymentReq = checkoutData.paymentRequirements?.[0];
  
  if (!paymentReq) {
    return { error: "No payment requirements returned" };
  }
  
  const amountToken = parseInt(paymentReq.amount) / (10 ** TOKEN_DECIMALS);
  const recipient = paymentReq.recipient || paymentReq.payTo;

  log(`Step 2: Payment required - ${amountToken} ${CURRENCY} to ${recipient}`);

  // Check max payment limit
  if (amountToken > MAX_AUTO_PAYMENT) {
    return {
      error: `Payment of ${amountToken} ${CURRENCY} exceeds max auto-payment limit of ${MAX_AUTO_PAYMENT} ${CURRENCY}`,
      paymentRequired: {
        amount: paymentReq.amount,
        amountFormatted: amountToken,
        currency: CURRENCY,
        payTo: recipient,
      },
    };
  }

  // Step 2: Make payment
  const paymentResult = await makePayment(recipient, paymentReq.amount);

  if (!paymentResult.success) {
    return { error: `Payment failed: ${paymentResult.error}` };
  }

  log(`Step 3: Payment sent - ${paymentResult.txHash}`);

  // Step 3: Finalize with payment proof
  log("Step 4: Finalizing order...");
  const finalizePayload = {
    ...checkoutPayload,
    orderIntentId: checkoutData.orderIntentId,
  };
  
  const finalRes = await fetch(
    `${SERVER_URL}/x402/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": JSON.stringify({
          txHash: paymentResult.txHash,
          transactionHash: paymentResult.txHash,
          network: NETWORK,
          chainId: CHAINS[NETWORK]?.id || 1,
          timestamp: Date.now(),
        }),
      },
      body: JSON.stringify(finalizePayload),
    }
  );

  const orderData = await finalRes.json();

  if (!finalRes.ok) {
    return { error: orderData.error || "Order finalization failed" };
  }

  log(`✓ Order confirmed: ${orderData.orderId}`);

  return {
    success: true,
    order: {
      id: orderData.orderId,
      shopifyOrderId: orderData.shopifyOrderId,
      shopifyOrderNumber: orderData.shopifyOrderNumber,
      total: orderData.total,
      currency: CURRENCY,
      status: "confirmed",
    },
    payment: {
      amount: amountToken,
      currency: CURRENCY,
      txHash: paymentResult.txHash,
      network: NETWORK,
      explorer: getExplorerUrl(paymentResult.txHash),
    },
    shipping: shippingAddress,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL: x402 HTTP Request with configurable currency
// ─────────────────────────────────────────────────────────────────────────────
async function x402Request({ url, method = "GET", headers = {}, body, maxPayment }) {
  const maxPay = parseFloat(maxPayment) || MAX_AUTO_PAYMENT;

  // Append wallet address to URL so backend can check prior payment
  let requestUrl = url;
  if (wallet) {
    const separator = url.includes("?") ? "&" : "?";
    requestUrl = `${url}${separator}wallet=${wallet.address.toLowerCase()}`;
  }

  // First request
  const reqOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body && ["POST", "PUT"].includes(method)) {
    reqOptions.body = JSON.stringify(body);
  }

  log(`Making ${method} request to ${requestUrl}`);
  const res = await fetch(requestUrl, reqOptions);

  // If not 402, return the response
  if (res.status !== 402) {
    const contentType = res.headers.get("content-type") || "";
    let responseData;

    if (contentType.includes("application/json")) {
      responseData = await res.json();
    } else {
      responseData = await res.text();
    }

    return {
      status: res.status,
      paid: false,
      data: responseData,
    };
  }

  // Handle 402 Payment Required
  if (!wallet) {
    return {
      error: "Payment required but no wallet configured",
      status: 402,
      paymentRequired: await res.json().catch(() => ({})),
    };
  }

  const paymentReq = await res.json();
  const amountToken = parseInt(paymentReq.amount) / (10 ** TOKEN_DECIMALS);
  
  // Extract recipient address (try both 'recipient' and 'payTo' for compatibility)
  const recipient = paymentReq.recipient || paymentReq.payTo;

  log(`402 received - ${amountToken} ${CURRENCY} required`);
  log(`Payment recipient: ${recipient}`);

  if (!recipient) {
    return {
      error: "Payment recipient not specified in 402 response",
      status: 402,
      paymentRequired: paymentReq,
    };
  }

  // Check max payment
  if (amountToken > maxPay) {
    return {
      error: `Payment of ${amountToken} ${CURRENCY} exceeds limit of ${maxPay} ${CURRENCY}`,
      status: 402,
      paymentRequired: {
        amount: paymentReq.amount,
        amountFormatted: amountToken,
        currency: CURRENCY,
        recipient: recipient,
      },
    };
  }

  // Make payment
  const paymentResult = await makePayment(recipient, paymentReq.amount);

  if (!paymentResult.success) {
    return { error: `Payment failed: ${paymentResult.error}` };
  }

  log(`Payment sent: ${paymentResult.txHash}`);

  // Retry with payment proof (X-PAYMENT header with JSON)
  const paymentProof = {
    txHash: paymentResult.txHash,
    transactionHash: paymentResult.txHash,
    network: NETWORK,
    chainId: CHAINS[NETWORK]?.id || 1,
    timestamp: Date.now(),
  };

  const retryRes = await fetch(url, {
    ...reqOptions,
    headers: {
      ...reqOptions.headers,
      "X-PAYMENT": JSON.stringify(paymentProof),
    },
  });

  const contentType = retryRes.headers.get("content-type") || "";
  let responseData;

  if (contentType.includes("application/json")) {
    responseData = await retryRes.json();
  } else {
    responseData = await retryRes.text();
  }

  return {
    status: retryRes.status,
    paid: true,
    payment: {
      amount: amountToken,
      currency: CURRENCY,
      txHash: paymentResult.txHash,
      explorer: getExplorerUrl(paymentResult.txHash),
    },
    data: responseData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET: Get balance
// ─────────────────────────────────────────────────────────────────────────────
async function getWalletBalance() {
  if (!wallet) {
    return { error: "No wallet configured. Set WALLET_PRIVATE_KEY environment variable." };
  }

  try {
    // Determine native currency based on network
    const nativeCurrency = NETWORK.includes('mantle') ? 'MNT'
      : NETWORK.includes('bite') ? 'sFUEL'
      : NETWORK.includes('cronos') ? (NETWORK.includes('testnet') ? 'TCRO' : 'CRO')
      : 'ETH';
    
    // Get native token balance (ETH/MNT)
    const nativeBalance = await publicClient.getBalance({ address: wallet.address });

    // Get ERC20 token balance (if using USDC/USDT/DAI)
    let tokenBalance = 0n;
    const isNativeToken = TOKEN_CONTRACT === "0x0000000000000000000000000000000000000000" || 
                          CURRENCY === nativeCurrency;
    
    if (!isNativeToken) {
      try {
        tokenBalance = await publicClient.readContract({
          address: TOKEN_CONTRACT,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wallet.address],
        });
      } catch (e) {
        log(`Could not fetch ${CURRENCY} balance: ${e.message}`);
      }
    }

    // Format balances with proper decimal handling
    const nativeFormatted = formatUnits(nativeBalance, 18);
    const tokenFormatted = formatUnits(tokenBalance, TOKEN_DECIMALS);
    
    // Parse and format with commas and proper decimal places
    const nativeValue = parseFloat(nativeFormatted);
    const tokenValue = parseFloat(tokenFormatted);
    
    // Format native: show up to 6 decimal places
    const nativeDisplay = nativeValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
    
    // Format token: show up to 2 decimal places
    const tokenDisplay = tokenValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Build balances object
    const balances = {
      [nativeCurrency]: nativeDisplay,
    };
    const balancesRaw = {
      [nativeCurrency]: nativeFormatted,
    };
    
    // If using ERC20 token and it's different from native, show both
    if (!isNativeToken && CURRENCY !== nativeCurrency) {
      balances[CURRENCY] = tokenDisplay;
      balancesRaw[CURRENCY] = tokenFormatted;
    }

    return {
      wallet: wallet.address,
      network: NETWORK,
      chain: NETWORK,
      balances,
      balancesRaw,
      maxAutoPayment: MAX_AUTO_PAYMENT,
      tokenContract: TOKEN_CONTRACT,
      paymentCurrency: CURRENCY,
      note: `${nativeCurrency} balance for ${isNativeToken ? 'payments and ' : ''}gas fees.${!isNativeToken ? ` ${CURRENCY} balance for payments.` : ''}`,
    };
  } catch (err) {
    return { error: `Failed to get balance: ${err.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET: Send token
// ─────────────────────────────────────────────────────────────────────────────
async function sendToken(to, amount, memo) {
  if (!wallet) {
    return { error: "No wallet configured" };
  }

  const amountToken = parseFloat(amount);
  if (isNaN(amountToken) || amountToken <= 0) {
    return { error: "Invalid amount" };
  }

  const amountBaseUnits = parseUnits(amount, TOKEN_DECIMALS);

  log(`Sending ${amountToken} ${CURRENCY} to ${to}`);

  const paymentResult = await makePayment(to, amountBaseUnits.toString());

  if (!paymentResult.success) {
    return { error: paymentResult.error };
  }

  return {
    success: true,
    to,
    amount: amountToken,
    currency: CURRENCY,
    memo: memo || null,
    txHash: paymentResult.txHash,
    network: NETWORK,
    explorer: getExplorerUrl(paymentResult.txHash),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER: Get status
// ─────────────────────────────────────────────────────────────────────────────
async function getOrderStatus(orderId) {
  const res = await fetch(`${SERVER_URL}/x402/orders/${orderId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to get order: ${res.status}` };
  }

  return await res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// ETHEREUM PAYMENT (Token Transfer)
// ═══════════════════════════════════════════════════════════════════════════

async function makePayment(recipientAddress, amountBaseUnits) {
  try {
    let txHash;
    
    // Ensure recipient is a valid address string
    const recipient = String(recipientAddress).toLowerCase();
    log(`Payment recipient: ${recipient}`);
    log(`Payment amount: ${amountBaseUnits} wei`);
    
    // Check if we're using native token (ETH/MNT) or ERC20
    if (TOKEN_CONTRACT === "0x0000000000000000000000000000000000000000" || 
        CURRENCY === "ETH" || CURRENCY === "MNT") {
      // Native token transfer
      log(`Sending native ${CURRENCY} transfer...`);
      txHash = await walletClient.sendTransaction({
        to: recipient,
        value: BigInt(amountBaseUnits),
      });
    } else {
      // ERC20 token transfer
      log(`Sending ERC20 ${CURRENCY} transfer...`);
      txHash = await walletClient.writeContract({
        address: TOKEN_CONTRACT,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient, BigInt(amountBaseUnits)],
      });
    }

    log(`Transaction sent: ${txHash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      timeout: 60_000, // 60 seconds for Mantle
    });

    if (receipt.status === "reverted") {
      return { success: false, error: "Transaction reverted" };
    }

    return { success: true, txHash };
  } catch (err) {
    log(`Payment error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS: List completed orders for a store
// ─────────────────────────────────────────────────────────────────────────────
async function listOrders(storeId) {
  const res = await fetch(`${SERVER_URL}/x402/stores/${encodeURIComponent(storeId)}/orders`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list orders: ${res.status}` };
  }

  const data = await res.json();
  const orders = data.orders || data.data?.orders || [];

  return {
    storeId,
    orders: orders.map((o) => ({
      id: o.orderId || o._id,
      shopifyOrderId: o.shopifyOrderId,
      status: o.status,
      total: o.total || o.amounts?.total,
      currency: o.currency || CURRENCY,
      email: o.email,
      txHash: o.transactionHash || o.txHash,
      explorer: o.transactionHash ? getExplorerUrl(o.transactionHash) : null,
      createdAt: o.createdAt,
      items: o.items,
    })),
    count: orders.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS: List pending order intents for a store
// ─────────────────────────────────────────────────────────────────────────────
async function listOrderIntents(storeId) {
  const res = await fetch(`${SERVER_URL}/x402/stores/${encodeURIComponent(storeId)}/order-intents`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list order intents: ${res.status}` };
  }

  const data = await res.json();
  const intents = data.orderIntents || data.data?.orderIntents || [];

  return {
    storeId,
    orderIntents: intents.map((oi) => ({
      id: oi.orderIntentId || oi._id,
      status: oi.status,
      total: oi.total || oi.amounts?.total,
      currency: oi.currency || CURRENCY,
      email: oi.email,
      expiresAt: oi.expiresAt,
      createdAt: oi.createdAt,
      items: oi.items,
    })),
    count: intents.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY: Search resources by keyword
// ─────────────────────────────────────────────────────────────────────────────
async function searchResources(query, type) {
  let url = `${SERVER_URL}/x402/resources?limit=50`;
  if (type) {
    url += `&type=${type}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to search resources: ${res.status}` };
  }

  const data = await res.json();
  const q = query.toLowerCase();

  const matched = (data.resources || []).filter((r) =>
    r.name?.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q) ||
    r.slug?.toLowerCase().includes(q)
  );

  return {
    query,
    type: type || "all",
    resources: matched.map((r) => ({
      id: r.id,
      slug: r.slug,
      type: r.type,
      name: r.name,
      description: r.description,
      price: r.priceUsdc,
      priceFormatted: `${r.priceUsdc} ${CURRENCY}`,
      url: `${SERVER_URL}${r.endpoint}`,
      creator: r.creator,
    })),
    count: matched.length,
    currency: CURRENCY,
    network: NETWORK,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MCP STDIO PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  try {
    const request = JSON.parse(line);
    const { method, params, id } = request;

    let response;

    switch (method) {
      case "initialize":
        response = {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
              name: "superpage-x402",
              version: "2.0.0",
            },
          },
        };
        break;

      case "notifications/initialized":
        // Client acknowledged initialization - no response needed
        return;

      case "tools/list":
        response = {
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS },
        };
        break;

      case "tools/call":
        const result = await handleTool(params.name, params.arguments || {});
        response = {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
        break;

      default:
        response = {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown method: ${method}` },
        };
    }

    console.log(JSON.stringify(response));
  } catch (err) {
    console.log(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      })
    );
  }
});

log("═══════════════════════════════════════");
log("  SUPERPAGE x402 MCP Client Ready ⚡");
log(`  Network: ${NETWORK} | Token: ${CURRENCY}`);
log("═══════════════════════════════════════");
