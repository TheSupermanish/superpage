/**
 * Chain Definitions for Frontend
 * 
 * Centralized chain configuration for wagmi/viem with network switching support
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
} from "viem/chains";

// ============================================================
// Custom Chain Definitions
// ============================================================

export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { decimals: 18, name: "Mantle", symbol: "MNT" },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
});

export const cronos = defineChain({
  id: 25,
  name: "Cronos",
  nativeCurrency: { decimals: 18, name: "Cronos", symbol: "CRO" },
  rpcUrls: {
    default: { http: ["https://evm.cronos.org"] },
  },
  blockExplorers: {
    default: { name: "Cronos Explorer", url: "https://explorer.cronos.org" },
  },
  testnet: false,
});

export const cronosTestnet = defineChain({
  id: 338,
  name: "Cronos Testnet",
  nativeCurrency: { decimals: 18, name: "Test Cronos", symbol: "TCRO" },
  rpcUrls: {
    default: { http: ["https://cronos-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "Cronos Explorer", url: "https://explorer.cronos.org/testnet" },
  },
  testnet: true,
});

export const biteV2Sandbox = defineChain({
  id: 103698795,
  name: "BITE V2 Sandbox 2",
  nativeCurrency: { decimals: 18, name: "sFUEL", symbol: "sFUEL" },
  rpcUrls: {
    default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
  },
  blockExplorers: {
    default: { name: "BITE Explorer", url: "https://base-sepolia-testnet-explorer.skalenodes.com:10032" },
  },
  testnet: true,
});

// ============================================================
// Chain Registry
// ============================================================

export const SUPPORTED_CHAINS: Chain[] = [
  // Mainnets
  mainnet,
  base,
  polygon,
  arbitrum,
  optimism,
  cronos,
  
  // Testnets
  sepolia,
  baseSepolia,
  polygonAmoy,
  arbitrumSepolia,
  optimismSepolia,
  mantleSepolia,
  cronosTestnet,
  biteV2Sandbox,
];

// Chain ID to Chain mapping
export const CHAIN_BY_ID: Record<number, Chain> = Object.fromEntries(
  SUPPORTED_CHAINS.map(chain => [chain.id, chain])
);

// Network name to Chain mapping
export const CHAIN_BY_NAME: Record<string, Chain> = {
  mainnet,
  sepolia,
  base,
  "base-sepolia": baseSepolia,
  polygon,
  "polygon-amoy": polygonAmoy,
  arbitrum,
  "arbitrum-sepolia": arbitrumSepolia,
  optimism,
  "optimism-sepolia": optimismSepolia,
  "mantle-sepolia": mantleSepolia,
  cronos,
  "cronos-testnet": cronosTestnet,
  "bite-v2-sandbox": biteV2Sandbox,
};

// ============================================================
// MetaMask Network Parameters
// ============================================================

export interface AddChainParameters {
  chainId: string; // hex
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

/**
 * Get MetaMask-compatible chain parameters for adding a network
 */
export function getChainParameters(chain: Chain): AddChainParameters {
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
    },
    rpcUrls: [...chain.rpcUrls.default.http],
    blockExplorerUrls: chain.blockExplorers?.default?.url 
      ? [chain.blockExplorers.default.url] 
      : undefined,
  };
}

// ============================================================
// Network Switching Utilities
// ============================================================

/**
 * Switch MetaMask to a specific network
 * Automatically adds the network if not present
 */
export async function switchNetwork(chainId: number): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    console.error("[switchNetwork] MetaMask not found");
    return false;
  }

  const chain = CHAIN_BY_ID[chainId];
  if (!chain) {
    console.error(`[switchNetwork] Unknown chain ID: ${chainId}`);
    return false;
  }

  const hexChainId = `0x${chainId.toString(16)}`;

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
    console.log(`[switchNetwork] Switched to ${chain.name}`);
    return true;
  } catch (error: any) {
    // Network not added - add it first
    if (error.code === 4902) {
      console.log(`[switchNetwork] Network not found, adding ${chain.name}...`);
      return await addNetwork(chainId);
    }
    
    // User rejected
    if (error.code === 4001) {
      console.log("[switchNetwork] User rejected network switch");
      return false;
    }

    console.error("[switchNetwork] Error:", error);
    return false;
  }
}

/**
 * Add a network to MetaMask
 */
export async function addNetwork(chainId: number): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    console.error("[addNetwork] MetaMask not found");
    return false;
  }

  const chain = CHAIN_BY_ID[chainId];
  if (!chain) {
    console.error(`[addNetwork] Unknown chain ID: ${chainId}`);
    return false;
  }

  const params = getChainParameters(chain);

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [params],
    });
    console.log(`[addNetwork] Added ${chain.name}`);
    return true;
  } catch (error: any) {
    if (error.code === 4001) {
      console.log("[addNetwork] User rejected adding network");
      return false;
    }
    console.error("[addNetwork] Error:", error);
    return false;
  }
}

/**
 * Get current network from MetaMask
 */
export async function getCurrentNetwork(): Promise<number | null> {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return parseInt(chainId, 16);
  } catch {
    return null;
  }
}

/**
 * Check if we're on the expected network, prompt to switch if not
 */
export async function ensureNetwork(expectedChainId: number): Promise<boolean> {
  const currentChainId = await getCurrentNetwork();
  
  if (currentChainId === expectedChainId) {
    return true;
  }

  console.log(`[ensureNetwork] Current: ${currentChainId}, Expected: ${expectedChainId}`);
  return await switchNetwork(expectedChainId);
}

// ============================================================
// Default Chain (from env)
// ============================================================

/**
 * Get the default chain based on environment config
 */
export function getDefaultChain(): Chain {
  const networkName = process.env.NEXT_PUBLIC_X402_CHAIN || "base-sepolia";
  return CHAIN_BY_NAME[networkName] || baseSepolia;
}

/**
 * Get the default chain ID
 */
export function getDefaultChainId(): number {
  return getDefaultChain().id;
}

// TypeScript global augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
  }
}
