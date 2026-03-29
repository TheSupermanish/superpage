"use client";

import { useCallback, useEffect, useState } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { 
  CHAIN_BY_ID, 
  SUPPORTED_CHAINS,
  getDefaultChainId,
  switchNetwork as switchNetworkDirect,
  addNetwork,
  type AddChainParameters,
} from "@/lib/chains";

export interface UseNetworkSwitchResult {
  /** Current chain ID */
  chainId: number | undefined;
  /** Current chain name */
  chainName: string | undefined;
  /** Whether on a supported network */
  isSupported: boolean;
  /** Whether on a testnet */
  isTestnet: boolean;
  /** Switch to a specific chain */
  switchToChain: (chainId: number) => Promise<boolean>;
  /** Switch to the default chain (Cronos Testnet) */
  switchToDefault: () => Promise<boolean>;
  /** List of all supported chains */
  supportedChains: typeof SUPPORTED_CHAINS;
  /** Whether currently switching */
  isSwitching: boolean;
  /** Error message if switch failed */
  error: string | null;
}

/**
 * Hook for managing network switching with automatic chain addition
 */
export function useNetworkSwitch(): UseNetworkSwitchResult {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current chain info
  const chain = chainId ? CHAIN_BY_ID[chainId] : undefined;
  const isSupported = chainId ? chainId in CHAIN_BY_ID : false;
  const isTestnet = chain?.testnet ?? false;

  // Switch to a specific chain
  const switchToChain = useCallback(async (targetChainId: number, depth = 0): Promise<boolean> => {
    if (chainId === targetChainId) {
      return true; // Already on the correct chain
    }

    // Prevent infinite recursion when addNetwork succeeds but switch keeps failing
    if (depth > 1) {
      setError("Failed to switch network after adding chain");
      return false;
    }

    setIsSwitching(true);
    setError(null);

    try {
      // Try wagmi's switchChain first (works with RainbowKit)
      if (switchChain) {
        await switchChain({ chainId: targetChainId });
        setIsSwitching(false);
        return true;
      }

      // Fallback to direct MetaMask call
      const success = await switchNetworkDirect(targetChainId);
      setIsSwitching(false);

      if (!success) {
        setError("Failed to switch network");
      }

      return success;
    } catch (err: any) {
      setIsSwitching(false);

      // User rejected
      if (err.code === 4001) {
        setError("User rejected network switch");
        return false;
      }

      // Chain not added - try to add it
      if (err.code === 4902) {
        const added = await addNetwork(targetChainId);
        if (added) {
          // Try switching again with incremented depth
          return await switchToChain(targetChainId, depth + 1);
        }
        setError("Failed to add network");
        return false;
      }

      setError(err.message || "Failed to switch network");
      return false;
    }
  }, [chainId, switchChain]);

  // Switch to default chain
  const switchToDefault = useCallback(async (): Promise<boolean> => {
    const defaultChainId = getDefaultChainId();
    return await switchToChain(defaultChainId);
  }, [switchToChain]);

  // Auto-switch to default on unsupported network (optional)
  // Uncomment if you want automatic switching
  // useEffect(() => {
  //   if (chainId && !isSupported) {
  //     switchToDefault();
  //   }
  // }, [chainId, isSupported, switchToDefault]);

  return {
    chainId,
    chainName: chain?.name,
    isSupported,
    isTestnet,
    switchToChain,
    switchToDefault,
    supportedChains: SUPPORTED_CHAINS,
    isSwitching,
    error,
  };
}

/**
 * Hook to ensure we're on the correct network before an action
 */
export function useEnsureNetwork(requiredChainId?: number) {
  const { chainId, switchToChain, switchToDefault, isSwitching, error } = useNetworkSwitch();
  
  const targetChainId = requiredChainId ?? getDefaultChainId();
  const isCorrectNetwork = chainId === targetChainId;

  const ensureCorrectNetwork = useCallback(async (): Promise<boolean> => {
    if (isCorrectNetwork) return true;
    return await switchToChain(targetChainId);
  }, [isCorrectNetwork, switchToChain, targetChainId]);

  return {
    isCorrectNetwork,
    ensureCorrectNetwork,
    targetChainId,
    currentChainId: chainId,
    isSwitching,
    error,
  };
}
