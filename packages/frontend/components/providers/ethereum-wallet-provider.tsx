"use client";

import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, base, baseSepolia, polygon, arbitrum, optimism } from "wagmi/chains";
import { cronos, cronosTestnet, mantleSepolia, biteV2Sandbox } from "@/lib/chains";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// All supported chains - Base first since it's the default
const supportedChains = [
  baseSepolia,      // Default testnet (x402 payment chain)
  base,             // Base mainnet
  mainnet,          // Ethereum mainnet
  sepolia,          // Ethereum testnet
  polygon,          // Polygon mainnet
  arbitrum,         // Arbitrum mainnet
  optimism,         // Optimism mainnet
  biteV2Sandbox,    // SKALE testnet
  cronosTestnet,    // Cronos testnet
  cronos,           // Cronos mainnet
  mantleSepolia,    // Mantle testnet
] as const;

const config = getDefaultConfig({
  appName: "SuperPage",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: supportedChains,
  ssr: true,
});

interface EthereumWalletProviderProps {
  children: ReactNode;
}

export function EthereumWalletProvider({ children }: EthereumWalletProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#5B8FB9", // SuperPage blue from logo
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
          initialChain={baseSepolia}
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
