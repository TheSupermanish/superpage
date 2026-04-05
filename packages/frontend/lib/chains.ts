/**
 * Chain Definitions for Frontend
 *
 * Initia Testnet (MiniEVM) chain configuration
 */

import { defineChain, type Chain } from "viem";

// ============================================================
// Initia Testnet (MiniEVM) Chain Definition
// ============================================================

export const initiaTestnet = defineChain({
  id: 3120269331257541, // local-rollup-1 MiniEVM chain ID (0xdfa56fe8bb7e)
  name: "Airaa Rollup (Initia MiniEVM)",
  nativeCurrency: { decimals: 18, name: "GAS", symbol: "GAS" },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_INITIA_RPC_URL || "http://0.0.0.0:8545"] },
  },
  blockExplorers: {
    default: { name: "Initia Scan", url: "https://scan.testnet.initia.xyz" },
  },
  testnet: true,
});

// ============================================================
// Chain Registry
// ============================================================

export const SUPPORTED_CHAINS: Chain[] = [initiaTestnet];

export const CHAIN_BY_ID: Record<number, Chain> = Object.fromEntries(
  SUPPORTED_CHAINS.map(chain => [chain.id, chain])
);

export const CHAIN_BY_NAME: Record<string, Chain> = {
  "initia-testnet": initiaTestnet,
};

// ============================================================
// Default Chain
// ============================================================

export function getDefaultChain(): Chain {
  return initiaTestnet;
}

export function getDefaultChainId(): number {
  return initiaTestnet.id;
}
