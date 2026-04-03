/**
 * Centralized chain and currency configuration
 * Local definitions for backend use
 *
 * This is the single source of truth for all chain/network defaults.
 * To add a new chain: add it to CHAIN_REGISTRY and NetworkId.
 */

// ============================================================
// Defaults — change these to switch the project's active chain
// ============================================================

/** Default network used when none is specified (env override: X402_CHAIN) */
export const DEFAULT_NETWORK: NetworkId = (process.env.X402_CHAIN as NetworkId) || "initia-testnet";

/** Default payment asset */
export const DEFAULT_ASSET = "USDC";

/** SuperPage payment scheme identifier */
export const SPAY_SCHEME = "spay";

// ============================================================
// Type Definitions
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

interface TokenConfig {
  address: string;
  decimals: number;
}

interface ChainMetadata {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  tokens: Record<string, TokenConfig>;
  defaultPaymentToken: string;
  displayCurrency?: string;
  isTestnet: boolean;
}

// Export the interface for use in other files
export type { ChainMetadata };

// ============================================================
// Token Decimals
// ============================================================

export const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
  CRO: 18,
  MNT: 18,
  sFUEL: 18,
  FLOW: 18,
  INIT: 18,
};

// ============================================================
// Chain Registry
// ============================================================

export const CHAIN_REGISTRY: Record<NetworkId, ChainMetadata> = {
  // Ethereum Mainnet
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
      USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
      DAI: { address: "0x6B175474E89094C44Da98b954EescdeCB5BE2AE36", decimals: 18 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  // Sepolia Testnet
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
    },
    defaultPaymentToken: "ETH",
    isTestnet: true,
  },
  // Base
  base: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  "base-sepolia": {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0xa059e27967e5a573a14a62c706ebd1be75333f9a", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: true,
  },
  // Polygon
  polygon: {
    chainId: 137,
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    nativeToken: { symbol: "MATIC", decimals: 18 },
    tokens: {
      USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  "polygon-amoy": {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    nativeToken: { symbol: "MATIC", decimals: 18 },
    tokens: {
      USDC: { address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: true,
  },
  // Arbitrum
  arbitrum: {
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  "arbitrum-sepolia": {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: true,
  },
  // Optimism
  optimism: {
    chainId: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  "optimism-sepolia": {
    chainId: 11155420,
    name: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: true,
  },
  // Mantle
  "mantle-sepolia": {
    chainId: 5003,
    name: "Mantle Sepolia",
    rpcUrl: "https://rpc.sepolia.mantle.xyz",
    explorerUrl: "https://sepolia.mantlescan.xyz",
    nativeToken: { symbol: "MNT", decimals: 18 },
    tokens: {
      USDC: { address: "0x0000000000000000000000000000000000000000", decimals: 6 },
    },
    defaultPaymentToken: "MNT",
    isTestnet: true,
  },
  // Cronos
  cronos: {
    chainId: 25,
    name: "Cronos Mainnet",
    rpcUrl: "https://evm.cronos.org",
    explorerUrl: "https://explorer.cronos.org",
    nativeToken: { symbol: "CRO", decimals: 18 },
    tokens: {
      USDC: { address: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  "cronos-testnet": {
    chainId: 338,
    name: "Cronos Testnet",
    rpcUrl: "https://cronos-testnet.drpc.org",
    explorerUrl: "https://explorer.cronos.org/testnet",
    nativeToken: { symbol: "TCRO", decimals: 18 },
    tokens: {
      USDC: { address: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0", decimals: 6 },
      "devUSDC.e": { address: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0", decimals: 6 },
    },
    defaultPaymentToken: "devUSDC.e",
    displayCurrency: "devUSDC.e",
    isTestnet: true,
  },
  // Flow
  flow: {
    chainId: 747,
    name: "Flow EVM Mainnet",
    rpcUrl: "https://mainnet.evm.nodes.onflow.org",
    explorerUrl: "https://evm.flowscan.io",
    nativeToken: { symbol: "FLOW", decimals: 18 },
    tokens: {
      USDC: { address: "0xF1815bd50389c46847f0Bda824eC8da914045D14", decimals: 6 },
      USDT: { address: "0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: false,
  },
  "flow-testnet": {
    chainId: 545,
    name: "Flow EVM Testnet",
    rpcUrl: "https://testnet.evm.nodes.onflow.org",
    explorerUrl: "https://evm-testnet.flowscan.io",
    nativeToken: { symbol: "FLOW", decimals: 18 },
    tokens: {
      USDC: { address: "0x291b030d596cf505f774426d8de7c946ce5af7a5", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    isTestnet: true,
  },
  // BITE V2 Sandbox 2 (SKALE)
  "bite-v2-sandbox": {
    chainId: 103698795,
    name: "BITE V2 Sandbox 2",
    rpcUrl: "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
    explorerUrl: "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
    nativeToken: { symbol: "sFUEL", decimals: 18 },
    tokens: {
      USDC: { address: "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    displayCurrency: "USDC",
    isTestnet: true,
  },
  // Initia Testnet (MiniEVM)
  "initia-testnet": {
    chainId: 3981013683081008, // local-rollup-1 MiniEVM (0xdfa56fe8bb7e)
    name: "Initia Testnet (MiniEVM)",
    rpcUrl: process.env.INITIA_RPC_URL || "http://0.0.0.0:8545",
    explorerUrl: "https://scan.testnet.initia.xyz",
    nativeToken: { symbol: "INIT", decimals: 18 },
    tokens: {
      USDC: { address: process.env.INITIA_USDC_ADDRESS || "0x06d1a12b351cab22727515c1f4fec2544f42d751", decimals: 6 },
    },
    defaultPaymentToken: "USDC",
    displayCurrency: "USDC",
    isTestnet: true,
  },
};

// ============================================================
// Helper Functions (local implementations)
// ============================================================

/**
 * Check if a network ID is supported
 */
export function isValidNetwork(networkId: string): networkId is NetworkId {
  return networkId in CHAIN_REGISTRY;
}

/**
 * Get chain metadata by network ID
 */
export function getChainMetadata(networkId: NetworkId) {
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
 * Check if token is a native token (not an ERC-20)
 */
export function isNativeToken(symbol: TokenSymbol): symbol is NativeTokenSymbol {
  return ["ETH", "CRO", "MNT", "sFUEL", "FLOW", "INIT"].includes(symbol);
}

/**
 * Get token decimals
 */
export function getTokenDecimalsForNetwork(networkId: NetworkId, symbol: TokenSymbol): number {
  const chain = getChainMetadata(networkId);
  
  if (isNativeToken(symbol)) {
    return chain.nativeToken.decimals;
  }
  
  const token = chain.tokens[symbol as Exclude<TokenSymbol, NativeTokenSymbol>];
  return token?.decimals ?? TOKEN_DECIMALS[symbol] ?? 18;
}

/**
 * Get token address (null for native tokens)
 */
export function getTokenAddressForNetwork(networkId: NetworkId, symbol: TokenSymbol): string | null {
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
  const tokens: TokenSymbol[] = [chain.nativeToken.symbol as TokenSymbol];
  
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
  return getChainMetadata(networkId).defaultPaymentToken as TokenSymbol;
}

/**
 * Get display name for a currency
 */
export function getCurrencyDisplayName(networkId: NetworkId, symbol: TokenSymbol): string {
  const chain = getChainMetadata(networkId);
  if (chain.displayCurrency && symbol === "USDC") {
    return chain.displayCurrency;
  }
  return symbol;
}

/**
 * Get all supported network IDs
 */
export function getSupportedNetworks(): NetworkId[] {
  return Object.keys(CHAIN_REGISTRY) as NetworkId[];
}

// ============================================================
// ChainConfig Interface
// ============================================================

export interface ChainConfig {
  network: NetworkId;
  currency: TokenSymbol;
  tokenAddress: string;
  tokenDecimals: number;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

/**
 * Get chain configuration from environment variables
 */
export function getChainConfig(): ChainConfig {
  const networkEnv = process.env.X402_CHAIN || DEFAULT_NETWORK;

  if (!isValidNetwork(networkEnv)) {
    console.warn(`Unknown network: ${networkEnv}, falling back to ${DEFAULT_NETWORK}`);
  }

  const network = isValidNetwork(networkEnv) ? networkEnv : DEFAULT_NETWORK;
  const chainMeta = getChainMetadata(network);
  
  // Get currency
  const currencyEnv = process.env.X402_CURRENCY;
  const currency = (currencyEnv as TokenSymbol) || getDefaultPaymentToken(network);
  
  // Get token address
  let tokenAddress = process.env.X402_TOKEN_ADDRESS;
  if (!tokenAddress) {
    const addr = getTokenAddressForNetwork(network, currency);
    tokenAddress = addr || "0x0000000000000000000000000000000000000000";
  }
  
  // Get token decimals
  let tokenDecimals: number;
  if (process.env.X402_TOKEN_DECIMALS) {
    tokenDecimals = parseInt(process.env.X402_TOKEN_DECIMALS, 10);
  } else {
    tokenDecimals = getTokenDecimalsForNetwork(network, currency);
  }

  return {
    network,
    currency,
    tokenAddress,
    tokenDecimals,
    chainId: chainMeta.chainId,
    rpcUrl: chainMeta.rpcUrl,
    explorerUrl: chainMeta.explorerUrl,
    isTestnet: chainMeta.isTestnet,
  };
}

// ============================================================
// Convenience Exports
// ============================================================

export function getNetwork(): NetworkId {
  return getChainConfig().network;
}

export function getCurrency(): TokenSymbol {
  return getChainConfig().currency;
}

export function getTokenAddress(): string;
export function getTokenAddress(networkId: NetworkId, symbol: TokenSymbol): string | null;
export function getTokenAddress(networkId?: NetworkId, symbol?: TokenSymbol): string | null {
  if (networkId && symbol) {
    return getTokenAddressForNetwork(networkId, symbol);
  }
  return getChainConfig().tokenAddress;
}

export function getTokenDecimals(): number {
  return getChainConfig().tokenDecimals;
}

export function isTestnet(): boolean {
  return getChainConfig().isTestnet;
}

export function getCurrencyDisplay(): string {
  const config = getChainConfig();
  return getCurrencyDisplayName(config.network, config.currency);
}

export function getTxUrl(txHash: string): string {
  const config = getChainConfig();
  return `${config.explorerUrl}/tx/${txHash}`;
}
