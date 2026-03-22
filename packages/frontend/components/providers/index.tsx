"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { EthereumWalletProvider } from "./ethereum-wallet-provider";
import { AuthProvider } from "./auth-provider";
import { OnboardingGuard } from "./onboarding-guard";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EthereumWalletProvider>
        <AuthProvider>
          <OnboardingGuard>{children}</OnboardingGuard>
        </AuthProvider>
      </EthereumWalletProvider>
    </ThemeProvider>
  );
}








