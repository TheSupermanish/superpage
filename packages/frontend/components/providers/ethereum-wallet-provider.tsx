"use client";

import { ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";

interface EthereumWalletProviderProps {
  children: ReactNode;
}

// Wrapper component that only renders on client
function ClientOnlyProvider({ children }: EthereumWalletProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  // Dynamically import the actual provider only on client
  const WalletProviderInner = dynamic(
    () => import("./ethereum-wallet-provider-inner").then((mod) => mod.EthereumWalletProviderInner),
    { ssr: false }
  );

  return <WalletProviderInner>{children}</WalletProviderInner>;
}

export { ClientOnlyProvider as EthereumWalletProvider };
