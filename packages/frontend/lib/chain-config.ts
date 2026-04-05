/**
 * Frontend chain and currency configuration
 * Initia Testnet (MiniEVM) configuration
 */

// Chain metadata
const CHAIN_DEFAULTS: Record<string, { defaultCurrency: string; displayCurrency?: string }> = {
  "initia-testnet": { defaultCurrency: "USDC", displayCurrency: "USDC" },
};

const NATIVE_TOKENS: Record<string, string> = {
  "initia-testnet": "INIT",
};

export const CHAIN_IDS: Record<string, number> = {
  "initia-testnet": 2314866461475837,
};

export const EXPLORER_URLS: Record<string, string> = {
  "initia-testnet": "https://scan.testnet.initia.xyz",
};

// USDC contract addresses — will be set after contract deployment
export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  "initia-testnet": "0x06d1a12b351cab22727515c1f4fec2544f42d751",
};

export function getNetwork(): string {
  return process.env.NEXT_PUBLIC_X402_CHAIN || "initia-testnet";
}

export function getCurrency(): string {
  const network = getNetwork();
  const envCurrency = process.env.NEXT_PUBLIC_X402_CURRENCY;
  if (envCurrency) return envCurrency;
  return CHAIN_DEFAULTS[network]?.defaultCurrency || "USDC";
}

export function getCurrencyDisplay(): string {
  const network = getNetwork();
  const chainConfig = CHAIN_DEFAULTS[network];
  return chainConfig?.displayCurrency || getCurrency();
}

export function getChainId(): number {
  const network = getNetwork();
  return CHAIN_IDS[network] || CHAIN_IDS["initia-testnet"];
}

export function getNativeToken(): string {
  const network = getNetwork();
  return NATIVE_TOKENS[network] || "INIT";
}

export function isTestnet(): boolean {
  return true; // We're on testnet during hackathon
}

export function getSupportedNetworks(): string[] {
  return Object.keys(CHAIN_DEFAULTS);
}

export function getExplorerUrl(): string {
  const network = getNetwork();
  return EXPLORER_URLS[network] || EXPLORER_URLS["initia-testnet"];
}

export function getTxUrl(txHash: string): string {
  // Custom rollups on Initia Scan use /initpage/txs/ path
  return `${getExplorerUrl()}/initpage/txs/${txHash}`;
}

export function getAddressUrl(address: string): string {
  return `${getExplorerUrl()}/initpage/accounts/${address}`;
}

export function getUsdcAddress(): `0x${string}` {
  const network = getNetwork();
  return USDC_ADDRESSES[network] || USDC_ADDRESSES["initia-testnet"];
}
