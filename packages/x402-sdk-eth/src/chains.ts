/**
 * Centralized Chain Registry
 * 
 * Single source of truth for all supported EVM chains.
 * To add a new chain, just add an entry to CHAIN_REGISTRY.
 */

import { defineChain, type Chain } from "viem";
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

// ============================================================
// TYPES
// ============================================================

export type NetworkId =
  | "mainnet" | "sepolia"
  | "base" | "base-sepolia"
  | "polygon" | "polygon-amoy"
  | "arbitrum" | "arbitrum-sepolia"
  | "optimism" | "optimism-sepolia"
  | "mantle-sepolia"
  | "cronos" | "cronos-testnet"
  | "bite-v2-sandbox"
  | "flow" | "flow-testnet"
  | "initia-testnet";

export type TokenSymbol = "ETH" | "USDC" | "USDT" | "DAI" | "CRO" | "MNT" | "sFUEL" | "FLOW" | "INIT";

export type NativeTokenSymbol = "ETH" | "CRO" | "MNT" | "sFUEL" | "FLOW" | "INIT";

export interface TokenConfig {
  symbol: TokenSymbol;
  decimals: number;
  address: `0x${string}` | null; // null for native tokens
}

export interface ChainMetadata {
  id: NetworkId;
  chainId: number;
  name: string;
  shortName: string;
  isTestnet: boolean;
  viemChain: Chain;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: {
    symbol: NativeTokenSymbol;
    name: string;
    decimals: number;
  };
  tokens: Partial<Record<Exclude<TokenSymbol, NativeTokenSymbol>, TokenConfig>>;
  defaultPaymentToken: TokenSymbol;
  // For display purposes
  displayCurrency?: string; // e.g., "devUSDC.e" for cronos-testnet
}

// ============================================================
// CUSTOM CHAIN DEFINITIONS
// ============================================================

export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  network: "mantle-sepolia",
  nativeCurrency: { decimals: 18, name: "Mantle", symbol: "MNT" },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
    public: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
});

export const cronos = defineChain({
  id: 25,
  name: "Cronos",
  network: "cronos",
  nativeCurrency: { decimals: 18, name: "Cronos", symbol: "CRO" },
  rpcUrls: {
    default: { http: ["https://evm.cronos.org"] },
    public: { http: ["https://evm.cronos.org"] },
  },
  blockExplorers: {
    default: { name: "Cronos Explorer", url: "https://explorer.cronos.org" },
  },
  testnet: false,
});

export const cronosTestnet = defineChain({
  id: 338,
  name: "Cronos Testnet",
  network: "cronos-testnet",
  nativeCurrency: { decimals: 18, name: "Test Cronos", symbol: "TCRO" },
  rpcUrls: {
    default: { http: ["https://cronos-testnet.drpc.org"] },
    public: { http: ["https://cronos-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "Cronos Explorer", url: "https://explorer.cronos.org/testnet" },
  },
  testnet: true,
});

export const biteV2Sandbox = defineChain({
  id: 103698795,
  name: "BITE V2 Sandbox 2",
  network: "bite-v2-sandbox",
  nativeCurrency: { decimals: 18, name: "sFUEL", symbol: "sFUEL" },
  rpcUrls: {
    default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
    public: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
  },
  blockExplorers: {
    default: { name: "BITE Explorer", url: "https://base-sepolia-testnet-explorer.skalenodes.com:10032" },
  },
  testnet: true,
});

// Initia Testnet (MiniEVM rollup)
export const initiaTestnet = defineChain({
  id: 3981013683081008,
  name: "SuperPage Rollup (Initia MiniEVM)",
  nativeCurrency: { decimals: 18, name: "GAS", symbol: "GAS" },
  rpcUrls: {
    default: { http: [process.env.INITIA_RPC_URL || "http://0.0.0.0:8545"] },
  },
  blockExplorers: {
    default: { name: "Initia Scan", url: "https://scan.testnet.initia.xyz" },
  },
  testnet: true,
});

// ============================================================
// CHAIN REGISTRY - Single Source of Truth
// ============================================================

export const CHAIN_REGISTRY: Record<NetworkId, ChainMetadata> = {
  // Ethereum
  mainnet: {
    id: "mainnet",
    chainId: 1,
    name: "Ethereum Mainnet",
    shortName: "ETH",
    isTestnet: false,
    viemChain: mainnet,
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeToken: { symbol: "ETH", name: "Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
      USDT: { symbol: "USDT", decimals: 6, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
      DAI: { symbol: "DAI", decimals: 18, address: "0x6B175474E89094C44Da98b954EescdeCB5f6243C" as `0x${string}` },
    },
    defaultPaymentToken: "USDC",
  },
  sepolia: {
    id: "sepolia",
    chainId: 11155111,
    name: "Ethereum Sepolia",
    shortName: "SEP",
    isTestnet: true,
    viemChain: sepolia,
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeToken: { symbol: "ETH", name: "Sepolia Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" },
    },
    defaultPaymentToken: "ETH",
  },

  // Base
  base: {
    id: "base",
    chainId: 8453,
    name: "Base Mainnet",
    shortName: "BASE",
    isTestnet: false,
    viemChain: base,
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeToken: { symbol: "ETH", name: "Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
      USDT: { symbol: "USDT", decimals: 6, address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" },
      DAI: { symbol: "DAI", decimals: 18, address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
    },
    defaultPaymentToken: "USDC",
  },
  "base-sepolia": {
    id: "base-sepolia",
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "BSEP",
    isTestnet: true,
    viemChain: baseSepolia,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeToken: { symbol: "ETH", name: "Sepolia Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xa059e27967e5a573a14a62c706ebd1be75333f9a" },
    },
    defaultPaymentToken: "USDC",
  },

  // Polygon
  polygon: {
    id: "polygon",
    chainId: 137,
    name: "Polygon Mainnet",
    shortName: "MATIC",
    isTestnet: false,
    viemChain: polygon,
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    nativeToken: { symbol: "ETH", name: "MATIC", decimals: 18 }, // Using ETH as type, but it's MATIC
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
      USDT: { symbol: "USDT", decimals: 6, address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
      DAI: { symbol: "DAI", decimals: 18, address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" },
    },
    defaultPaymentToken: "USDC",
  },
  "polygon-amoy": {
    id: "polygon-amoy",
    chainId: 80002,
    name: "Polygon Amoy",
    shortName: "AMOY",
    isTestnet: true,
    viemChain: polygonAmoy,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    nativeToken: { symbol: "ETH", name: "MATIC", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" },
    },
    defaultPaymentToken: "USDC",
  },

  // Arbitrum
  arbitrum: {
    id: "arbitrum",
    chainId: 42161,
    name: "Arbitrum One",
    shortName: "ARB",
    isTestnet: false,
    viemChain: arbitrum,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeToken: { symbol: "ETH", name: "Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
      USDT: { symbol: "USDT", decimals: 6, address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
      DAI: { symbol: "DAI", decimals: 18, address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
    },
    defaultPaymentToken: "USDC",
  },
  "arbitrum-sepolia": {
    id: "arbitrum-sepolia",
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "ASEP",
    isTestnet: true,
    viemChain: arbitrumSepolia,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeToken: { symbol: "ETH", name: "Sepolia Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" },
    },
    defaultPaymentToken: "USDC",
  },

  // Optimism
  optimism: {
    id: "optimism",
    chainId: 10,
    name: "Optimism Mainnet",
    shortName: "OP",
    isTestnet: false,
    viemChain: optimism,
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeToken: { symbol: "ETH", name: "Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" },
      USDT: { symbol: "USDT", decimals: 6, address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" },
      DAI: { symbol: "DAI", decimals: 18, address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
    },
    defaultPaymentToken: "USDC",
  },
  "optimism-sepolia": {
    id: "optimism-sepolia",
    chainId: 11155420,
    name: "Optimism Sepolia",
    shortName: "OSEP",
    isTestnet: true,
    viemChain: optimismSepolia,
    rpcUrl: "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    nativeToken: { symbol: "ETH", name: "Sepolia Ether", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" },
    },
    defaultPaymentToken: "USDC",
  },

  // Mantle
  "mantle-sepolia": {
    id: "mantle-sepolia",
    chainId: 5003,
    name: "Mantle Sepolia",
    shortName: "MNTL",
    isTestnet: true,
    viemChain: mantleSepolia,
    rpcUrl: "https://rpc.sepolia.mantle.xyz",
    explorerUrl: "https://sepolia.mantlescan.xyz",
    nativeToken: { symbol: "MNT", name: "Mantle", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
    },
    defaultPaymentToken: "MNT",
  },

  // Cronos
  cronos: {
    id: "cronos",
    chainId: 25,
    name: "Cronos Mainnet",
    shortName: "CRO",
    isTestnet: false,
    viemChain: cronos,
    rpcUrl: "https://evm.cronos.org",
    explorerUrl: "https://explorer.cronos.org",
    nativeToken: { symbol: "CRO", name: "Cronos", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59" },
      USDT: { symbol: "USDT", decimals: 6, address: "0x66e428c3f67a68878562e79A0234c1F83c208770" },
      DAI: { symbol: "DAI", decimals: 18, address: "0xF2001B145b43032AAF5Ee2884e456CCd805F677D" },
    },
    defaultPaymentToken: "USDC",
  },
  "cronos-testnet": {
    id: "cronos-testnet",
    chainId: 338,
    name: "Cronos Testnet",
    shortName: "TCRO",
    isTestnet: true,
    viemChain: cronosTestnet,
    rpcUrl: "https://cronos-testnet.drpc.org",
    explorerUrl: "https://explorer.cronos.org/testnet",
    nativeToken: { symbol: "CRO", name: "Test Cronos", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" },
    },
    defaultPaymentToken: "USDC",
    displayCurrency: "devUSDC.e",
  },

  // Flow
  flow: {
    id: "flow",
    chainId: 747,
    name: "Flow EVM Mainnet",
    shortName: "FLOW",
    isTestnet: false,
    viemChain: flowMainnet,
    rpcUrl: "https://mainnet.evm.nodes.onflow.org",
    explorerUrl: "https://evm.flowscan.io",
    nativeToken: { symbol: "FLOW", name: "Flow", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xF1815bd50389c46847f0Bda824eC8da914045D14" },
      USDT: { symbol: "USDT", decimals: 6, address: "0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8" },
    },
    defaultPaymentToken: "USDC",
  },
  "flow-testnet": {
    id: "flow-testnet",
    chainId: 545,
    name: "Flow EVM Testnet",
    shortName: "FLOWT",
    isTestnet: true,
    viemChain: flowTestnet,
    rpcUrl: "https://testnet.evm.nodes.onflow.org",
    explorerUrl: "https://evm-testnet.flowscan.io",
    nativeToken: { symbol: "FLOW", name: "Flow", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x291b030d596cf505f774426d8de7c946ce5af7a5" },
    },
    defaultPaymentToken: "USDC",
  },

  // BITE V2 Sandbox 2 (SKALE)
  "bite-v2-sandbox": {
    id: "bite-v2-sandbox",
    chainId: 103698795,
    name: "BITE V2 Sandbox 2",
    shortName: "BITE",
    isTestnet: true,
    viemChain: biteV2Sandbox,
    rpcUrl: "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
    explorerUrl: "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
    nativeToken: { symbol: "sFUEL", name: "sFUEL", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8" },
    },
    defaultPaymentToken: "USDC",
    displayCurrency: "USDC",
  },

  // Initia Testnet (MiniEVM rollup)
  "initia-testnet": {
    id: "initia-testnet",
    chainId: 3981013683081008,
    name: "SuperPage Rollup (Initia MiniEVM)",
    shortName: "INITIA",
    isTestnet: true,
    viemChain: initiaTestnet,
    rpcUrl: process.env.INITIA_RPC_URL || "http://0.0.0.0:8545",
    explorerUrl: "https://scan.testnet.initia.xyz",
    nativeToken: { symbol: "INIT" as NativeTokenSymbol, name: "GAS", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", decimals: 6, address: "0x06d1a12b351cab22727515c1f4fec2544f42d751" },
    },
    defaultPaymentToken: "USDC",
    displayCurrency: "USDC",
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all supported network IDs
 */
export function getSupportedNetworks(): NetworkId[] {
  return Object.keys(CHAIN_REGISTRY) as NetworkId[];
}

/**
 * Check if a network ID is supported
 */
export function isValidNetwork(networkId: string): networkId is NetworkId {
  return networkId in CHAIN_REGISTRY;
}

/**
 * Get chain metadata by network ID
 */
export function getChainMetadata(networkId: NetworkId): ChainMetadata {
  const chain = CHAIN_REGISTRY[networkId];
  if (!chain) {
    throw new Error(`Unsupported network: ${networkId}`);
  }
  return chain;
}

/**
 * Get chain ID by network ID
 */
export function getChainId(networkId: NetworkId): number {
  return getChainMetadata(networkId).chainId;
}

/**
 * Get viem Chain object by network ID
 */
export function getViemChain(networkId: NetworkId): Chain {
  return getChainMetadata(networkId).viemChain;
}

/**
 * Get RPC URL by network ID
 */
export function getRpcUrl(networkId: NetworkId): string {
  return getChainMetadata(networkId).rpcUrl;
}

/**
 * Get explorer URL by network ID
 */
export function getExplorerUrl(networkId: NetworkId): string {
  return getChainMetadata(networkId).explorerUrl;
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(networkId: NetworkId, txHash: string): string {
  return `${getExplorerUrl(networkId)}/tx/${txHash}`;
}

/**
 * Check if token is a native token (ETH, CRO, MNT)
 */
export function isNativeToken(symbol: TokenSymbol): symbol is NativeTokenSymbol {
  return ["ETH", "CRO", "MNT", "sFUEL", "FLOW", "INIT"].includes(symbol);
}

/**
 * Get token decimals
 */
export function getTokenDecimals(networkId: NetworkId, symbol: TokenSymbol): number {
  const chain = getChainMetadata(networkId);
  
  if (isNativeToken(symbol)) {
    return chain.nativeToken.decimals;
  }
  
  const token = chain.tokens[symbol as Exclude<TokenSymbol, NativeTokenSymbol>];
  return token?.decimals ?? 18;
}

/**
 * Get token address (null for native tokens)
 */
export function getTokenAddress(networkId: NetworkId, symbol: TokenSymbol): `0x${string}` | null {
  const chain = getChainMetadata(networkId);
  
  if (isNativeToken(symbol)) {
    return null;
  }
  
  const token = chain.tokens[symbol as Exclude<TokenSymbol, NativeTokenSymbol>];
  return token?.address ?? null;
}

/**
 * Get available tokens for a network
 */
export function getAvailableTokens(networkId: NetworkId): TokenSymbol[] {
  const chain = getChainMetadata(networkId);
  const tokens: TokenSymbol[] = [chain.nativeToken.symbol];
  
  for (const [symbol, config] of Object.entries(chain.tokens)) {
    if (config?.address) {
      tokens.push(symbol as TokenSymbol);
    }
  }
  
  return tokens;
}

/**
 * Get default payment token for a network
 */
export function getDefaultPaymentToken(networkId: NetworkId): TokenSymbol {
  return getChainMetadata(networkId).defaultPaymentToken;
}

/**
 * Get display name for a currency (e.g., "devUSDC.e" for USDC on cronos-testnet)
 */
export function getCurrencyDisplayName(networkId: NetworkId, symbol: TokenSymbol): string {
  const chain = getChainMetadata(networkId);
  if (chain.displayCurrency && symbol === "USDC") {
    return chain.displayCurrency;
  }
  return symbol;
}

/**
 * Find network ID by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkId | null {
  for (const [networkId, meta] of Object.entries(CHAIN_REGISTRY)) {
    if (meta.chainId === chainId) {
      return networkId as NetworkId;
    }
  }
  return null;
}

/**
 * Get all testnet networks
 */
export function getTestnetNetworks(): NetworkId[] {
  return Object.entries(CHAIN_REGISTRY)
    .filter(([_, meta]) => meta.isTestnet)
    .map(([id]) => id as NetworkId);
}

/**
 * Get all mainnet networks
 */
export function getMainnetNetworks(): NetworkId[] {
  return Object.entries(CHAIN_REGISTRY)
    .filter(([_, meta]) => !meta.isTestnet)
    .map(([id]) => id as NetworkId);
}

// ============================================================
// LEGACY COMPATIBILITY - Build old format from registry
// ============================================================

/**
 * Build CHAINS record (viem Chain objects) from registry
 */
export function buildChainsRecord(): Record<NetworkId, Chain> {
  const chains: Record<string, Chain> = {};
  for (const [id, meta] of Object.entries(CHAIN_REGISTRY)) {
    chains[id] = meta.viemChain;
  }
  return chains as Record<NetworkId, Chain>;
}

/**
 * Build CHAIN_IDS record from registry
 */
export function buildChainIdsRecord(): Record<NetworkId, number> {
  const ids: Record<string, number> = {};
  for (const [id, meta] of Object.entries(CHAIN_REGISTRY)) {
    ids[id] = meta.chainId;
  }
  return ids as Record<NetworkId, number>;
}

/**
 * Build TOKEN_ADDRESSES record from registry
 */
export function buildTokenAddressesRecord(): Record<NetworkId, Record<string, `0x${string}`>> {
  const addresses: Record<string, Record<string, `0x${string}`>> = {};
  for (const [id, meta] of Object.entries(CHAIN_REGISTRY)) {
    addresses[id] = {};
    for (const [symbol, config] of Object.entries(meta.tokens)) {
      if (config?.address) {
        addresses[id][symbol] = config.address;
      }
    }
  }
  return addresses as Record<NetworkId, Record<string, `0x${string}`>>;
}

// Pre-built for backward compatibility
export const CHAINS = buildChainsRecord();
export const CHAIN_IDS = buildChainIdsRecord();
export const TOKEN_ADDRESSES = buildTokenAddressesRecord();

// Token decimals (static, same across all chains)
export const TOKEN_DECIMALS: Record<TokenSymbol, number> = {
  ETH: 18,
  CRO: 18,
  MNT: 18,
  sFUEL: 18,
  FLOW: 18,
  INIT: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
};
