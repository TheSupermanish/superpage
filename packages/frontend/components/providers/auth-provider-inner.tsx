"use client";

import {
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { AuthContext, Creator, AuthContextType } from "./auth-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AuthProviderInnerProps {
  children: ReactNode;
}

export function AuthProviderInner({ children }: AuthProviderInnerProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("x402_token");
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch current user
  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCreator(data.creator);
      } else {
        // Token invalid
        localStorage.removeItem("x402_token");
        setToken(null);
        setCreator(null);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with wallet
  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      // Try to connect if not connected
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);

    try {
      const walletAddress = address;

      // Step 1: Get nonce
      let nonceRes: Response;
      try {
        nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
      } catch {
        throw new Error("Backend server is not running. Please start it first.");
      }

      if (!nonceRes.ok) {
        const error = await nonceRes.json();
        throw new Error(error.error || "Failed to get nonce");
      }

      const { nonce, message } = await nonceRes.json();

      // Step 2: Sign message with Ethereum wallet
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature
      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          signature,
          nonce,
        }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.error || "Verification failed");
      }

      const { token: newToken, creator: newCreator } = await verifyRes.json();

      // Store token
      localStorage.setItem("x402_token", newToken);
      setToken(newToken);
      setCreator(newCreator);

    } catch (err: any) {
      console.error("Sign in error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, signMessageAsync, connect, connectors]);

  // Sign out
  const signOut = useCallback(() => {
    localStorage.removeItem("x402_token");
    setToken(null);
    setCreator(null);
    disconnectWallet();
  }, [disconnectWallet]);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<Creator>) => {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const res = await fetch(`${API_URL}/api/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update profile");
    }

    const { creator: updatedCreator } = await res.json();
    setCreator(updatedCreator);
  }, [token]);

  // Auto sign out if wallet disconnects
  useEffect(() => {
    if (!isConnected && creator) {
      // Wallet disconnected but we have a session
      // Keep the session for now, user can reconnect
    }
  }, [isConnected, creator]);

  // User needs onboarding if they don't have a username
  // BUT: if they're an existing user (created more than 24 hours ago), 
  // they don't need onboarding even without a username
  const isExistingUser = creator?.createdAt 
    ? new Date().getTime() - new Date(creator.createdAt).getTime() > 24 * 60 * 60 * 1000
    : false;
  
  const needsOnboarding = !!creator && !creator.username && !isExistingUser;

  return (
    <AuthContext.Provider
      value={{
        creator,
        isLoading,
        isAuthenticated: !!creator && !!token,
        needsOnboarding,
        signIn,
        signOut,
        updateProfile,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
