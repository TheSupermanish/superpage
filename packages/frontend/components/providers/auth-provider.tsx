"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import dynamic from "next/dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Creator {
  id: string;
  walletAddress: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  isPublic?: boolean;
  accessCount?: number;
  totalEarnings?: number;
  createdAt?: string;
}

interface AuthContextType {
  creator: Creator | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  updateProfile: (data: Partial<Creator>) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Import the inner auth provider that uses wagmi hooks dynamically
const AuthProviderInner = dynamic(
  () => import("./auth-provider-inner").then((mod) => ({ default: mod.AuthProviderInner })),
  { ssr: false }
);

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export { AuthContext };
export type { Creator, AuthContextType };
