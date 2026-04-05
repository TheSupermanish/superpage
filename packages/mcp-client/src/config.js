/**
 * Configuration and chain definitions for Airaa x402.
 */

import {
  parseUnits,
  formatUnits,
  defineChain,
} from "viem";
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
  flowMainnet,
  flowTestnet,
} from "viem/chains";

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM CHAIN DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

// Define Mantle chains
export const mantleSepolia = defineChain({
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

export const mantleMainnet = defineChain({
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
export const cronosTestnet = defineChain({
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

export const cronosMainnet = defineChain({
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

export const biteV2Sandbox = defineChain({
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

export const SERVER_URL = process.env.SUPERPAGE_SERVER || "http://localhost:3001";
export const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
export const NETWORK = process.env.X402_CHAIN || process.env.ETH_NETWORK || "initia-testnet";
export const CURRENCY = process.env.X402_CURRENCY || "USDC";
export const TOKEN_ADDRESS = process.env.X402_TOKEN_ADDRESS || "";
export const TOKEN_DECIMALS = (() => {
  if (process.env.X402_TOKEN_DECIMALS) {
    const parsed = parseInt(process.env.X402_TOKEN_DECIMALS, 10);
    if (isNaN(parsed)) {
      console.warn(`Invalid X402_TOKEN_DECIMALS "${process.env.X402_TOKEN_DECIMALS}", falling back to default`);
      return CURRENCY === "USDC" || CURRENCY === "USDT" || CURRENCY === "devUSDC.e" ? 6 : 18;
    }
    return parsed;
  }
  return CURRENCY === "USDC" || CURRENCY === "USDT" || CURRENCY === "devUSDC.e" ? 6 : 18;
})();
export const MAX_AUTO_PAYMENT = parseFloat(process.env.MAX_AUTO_PAYMENT || "10.00");

export const CHAINS = {
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
  "flow": flowMainnet,
  "flow-testnet": flowTestnet,
  "initia-testnet": defineChain({
    id: 3120269331257541,
    name: "Airaa Rollup (Initia MiniEVM)",
    nativeCurrency: { decimals: 18, name: "GAS", symbol: "GAS" },
    rpcUrls: {
      default: { http: [process.env.INITIA_RPC_URL || "http://0.0.0.0:8545"] },
    },
    testnet: true,
  }),
};

// Token contract addresses (will be resolved from network and currency if not set)
export const TOKEN_ADDRESSES = {
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
  flow: {
    USDC: "0xF1815bd50389c46847f0Bda824eC8da914045D14",
    USDT: "0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8",
  },
  "flow-testnet": {
    USDC: "0x291b030d596cf505f774426d8de7c946ce5af7a5",
  },
  "initia-testnet": {
    USDC: "0x06d1a12b351cab22727515c1f4fec2544f42d751",
  },
};

// Resolve token contract address
export function getTokenContract() {
  if (TOKEN_ADDRESS) return TOKEN_ADDRESS;
  const networkTokens = TOKEN_ADDRESSES[NETWORK];
  if (networkTokens && networkTokens[CURRENCY]) {
    return networkTokens[CURRENCY];
  }
  return "0x0000000000000000000000000000000000000000";
}

export const TOKEN_CONTRACT = getTokenContract();

// ERC20 Transfer ABI
export const ERC20_ABI = [
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

// Re-export viem utilities needed by other modules
export { parseUnits, formatUnits };
