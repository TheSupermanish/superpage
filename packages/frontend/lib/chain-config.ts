/**
 * Frontend chain and currency configuration
 * Simplified registry for frontend use
 */

// Chain metadata for frontend display
const CHAIN_DEFAULTS: Record<string, { defaultCurrency: string; displayCurrency?: string }> = {
  // Mainnets
  "mainnet": { defaultCurrency: "USDC" },
  "base": { defaultCurrency: "USDC" },
  "polygon": { defaultCurrency: "USDC" },
  "arbitrum": { defaultCurrency: "USDC" },
  "optimism": { defaultCurrency: "USDC" },
  "cronos": { defaultCurrency: "USDC" },
  
  // Testnets
  "sepolia": { defaultCurrency: "ETH" },
  "base-sepolia": { defaultCurrency: "USDC" },
  "polygon-amoy": { defaultCurrency: "USDC" },
  "arbitrum-sepolia": { defaultCurrency: "USDC" },
  "optimism-sepolia": { defaultCurrency: "USDC" },
  "mantle-sepolia": { defaultCurrency: "MNT" },
  "cronos-testnet": { defaultCurrency: "USDC", displayCurrency: "devUSDC.e" },
  "bite-v2-sandbox": { defaultCurrency: "USDC", displayCurrency: "USDC" },
};

// Native token symbols per chain
const NATIVE_TOKENS: Record<string, string> = {
  "mainnet": "ETH",
  "sepolia": "ETH",
  "base": "ETH",
  "base-sepolia": "ETH",
  "polygon": "MATIC",
  "polygon-amoy": "MATIC",
  "arbitrum": "ETH",
  "arbitrum-sepolia": "ETH",
  "optimism": "ETH",
  "optimism-sepolia": "ETH",
  "mantle-sepolia": "MNT",
  "cronos": "CRO",
  "cronos-testnet": "TCRO",
  "bite-v2-sandbox": "sFUEL",
};

// Chain IDs for reference
export const CHAIN_IDS: Record<string, number> = {
  "mainnet": 1,
  "sepolia": 11155111,
  "base": 8453,
  "base-sepolia": 84532,
  "polygon": 137,
  "polygon-amoy": 80002,
  "arbitrum": 42161,
  "arbitrum-sepolia": 421614,
  "optimism": 10,
  "optimism-sepolia": 11155420,
  "mantle-sepolia": 5003,
  "cronos": 25,
  "cronos-testnet": 338,
  "bite-v2-sandbox": 103698795,
};

// Block explorer URLs
export const EXPLORER_URLS: Record<string, string> = {
  "mainnet": "https://etherscan.io",
  "sepolia": "https://sepolia.etherscan.io",
  "base": "https://basescan.org",
  "base-sepolia": "https://sepolia.basescan.org",
  "polygon": "https://polygonscan.com",
  "polygon-amoy": "https://amoy.polygonscan.com",
  "arbitrum": "https://arbiscan.io",
  "arbitrum-sepolia": "https://sepolia.arbiscan.io",
  "optimism": "https://optimistic.etherscan.io",
  "optimism-sepolia": "https://sepolia-optimism.etherscan.io",
  "mantle-sepolia": "https://sepolia.mantlescan.xyz",
  "cronos": "https://explorer.cronos.org",
  "cronos-testnet": "https://explorer.cronos.org/testnet",
  "bite-v2-sandbox": "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
};

// USDC contract addresses per network
export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  "base-sepolia": "0xa059e27967e5a573a14a62c706ebd1be75333f9a",
  "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "mainnet": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "polygon": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  "arbitrum": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "optimism": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  "sepolia": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "bite-v2-sandbox": "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8",
};

/**
 * Get the configured network
 */
export function getNetwork(): string {
  return process.env.NEXT_PUBLIC_X402_CHAIN || "base-sepolia";
}

/**
 * Get the configured currency
 */
export function getCurrency(): string {
  const network = getNetwork();
  const envCurrency = process.env.NEXT_PUBLIC_X402_CURRENCY;
  if (envCurrency) return envCurrency;
  
  const chainConfig = CHAIN_DEFAULTS[network];
  return chainConfig?.defaultCurrency || "USDC";
}

/**
 * Get display name for the currency
 */
export function getCurrencyDisplay(): string {
  const currency = getCurrency();
  const network = getNetwork();
  
  // Check for custom display name
  const chainConfig = CHAIN_DEFAULTS[network];
  if (chainConfig?.displayCurrency && currency === "USDC") {
    return chainConfig.displayCurrency;
  }
  
  // Show native token symbol for native currencies
  if (currency === "ETH" || currency === "MNT" || currency === "CRO" || currency === "sFUEL") {
    return NATIVE_TOKENS[network] || currency;
  }
  
  return currency;
}

/**
 * Get chain ID for the current network
 */
export function getChainId(): number {
  const network = getNetwork();
  return CHAIN_IDS[network] || 84532; // Default to Base Sepolia
}

/**
 * Get native token symbol for current network
 */
export function getNativeToken(): string {
  const network = getNetwork();
  return NATIVE_TOKENS[network] || "ETH";
}

/**
 * Check if current network is a testnet
 */
export function isTestnet(): boolean {
  const network = getNetwork();
  return network.includes("sepolia") || network.includes("testnet") || network.includes("amoy") || network.includes("sandbox");
}

/**
 * Get list of all supported networks
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(CHAIN_DEFAULTS);
}

/**
 * Get block explorer URL for current network
 */
export function getExplorerUrl(): string {
  const network = getNetwork();
  return EXPLORER_URLS[network] || "https://sepolia.basescan.org";
}

/**
 * Get transaction URL in block explorer
 */
export function getTxUrl(txHash: string): string {
  return `${getExplorerUrl()}/tx/${txHash}`;
}

/**
 * Get address URL in block explorer
 */
export function getAddressUrl(address: string): string {
  return `${getExplorerUrl()}/address/${address}`;
}

/**
 * Get USDC contract address for the current network
 */
export function getUsdcAddress(): `0x${string}` {
  const network = getNetwork();
  return USDC_ADDRESSES[network] || USDC_ADDRESSES["base-sepolia"];
}
