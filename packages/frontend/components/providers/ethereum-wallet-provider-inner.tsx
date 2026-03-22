"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, base, baseSepolia, polygon, arbitrum, optimism } from "wagmi/chains";
import { cronos, cronosTestnet, mantleSepolia, biteV2Sandbox } from "@/lib/chains";
import "@rainbow-me/rainbowkit/styles.css";

// Create query client
const queryClient = new QueryClient();

// All supported chains - Cronos first since it's the default
const supportedChains = [
  biteV2Sandbox,    // x402 payment chain
  cronosTestnet,    // Default testnet
  cronos,           // Cronos mainnet
  mainnet,          // Ethereum mainnet
  base,             // Base mainnet
  sepolia,          // Ethereum testnet
  baseSepolia,      // Base testnet
  polygon,          // Polygon mainnet
  arbitrum,         // Arbitrum mainnet
  optimism,         // Optimism mainnet
  mantleSepolia,    // Mantle testnet
] as const;

// Configure wagmi with RainbowKit
const config = getDefaultConfig({
  appName: "x402 Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: supportedChains,
  ssr: false,
});

interface EthereumWalletProviderInnerProps {
  children: ReactNode;
}

export function EthereumWalletProviderInner({ children }: EthereumWalletProviderInnerProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7c3aed", // Purple accent
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
          initialChain={cronosTestnet}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
