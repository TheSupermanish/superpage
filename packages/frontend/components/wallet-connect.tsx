"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAuth } from "./providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Wallet, LogOut, User, Loader2, AlertCircle } from "lucide-react";

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { creator, isAuthenticated, isLoading, signIn, signOut } = useAuth();

  if (!mounted) {
    return (
      <button className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/10 flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  // Format wallet address
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <button
        onClick={openConnectModal}
        className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/10 flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  // Connected but not authenticated - show connect wallet button
  // This allows user to choose a different wallet or sign in with current one
  if (isConnected && !isAuthenticated) {
    const handleConnect = async () => {
      if (isLoading) return;
      setError(null);

      try {
        await signIn();
      } catch (err: any) {
        const msg = err?.message || "Sign in failed";
        if (msg.includes("Backend server") || msg.includes("Failed to fetch")) {
          setError("Backend offline");
        } else if (msg.includes("User rejected") || msg.includes("denied")) {
          // User cancelled wallet signing — keep wallet connected, just reset
          setError(null);
        } else {
          setError(msg.length > 30 ? msg.slice(0, 30) + "..." : msg);
          disconnect();
          openConnectModal?.();
        }
      }
    };

    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        )}
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>{error ? "Retry" : "Sign In"}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Authenticated - show user menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="gap-2 border-border hover:bg-muted hover:border-border px-4 py-2 rounded-full border transition-all flex items-center">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg shadow-primary/10">
            {creator?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="hidden sm:inline font-medium">
            {creator?.name || formatAddress(address)}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        <div className="px-2 py-2">
          <p className="text-sm font-semibold text-foreground">{creator?.name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {formatAddress(address)}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard" className="cursor-pointer">
            Dashboard
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard/resources" className="cursor-pointer">
            My Resources
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard/settings" className="cursor-pointer">
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
            disconnect();
          }}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
