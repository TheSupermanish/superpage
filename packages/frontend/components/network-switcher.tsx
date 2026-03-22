"use client";

import { useState } from "react";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import { CHAIN_BY_ID, getDefaultChainId } from "@/lib/chains";

interface NetworkSwitcherProps {
  /** Show only if on wrong network */
  showOnlyIfWrong?: boolean;
  /** Required chain ID (defaults to env config) */
  requiredChainId?: number;
  /** Compact mode - just shows a warning banner */
  compact?: boolean;
}

/**
 * Network switcher component with automatic chain addition
 */
export function NetworkSwitcher({ 
  showOnlyIfWrong = false,
  requiredChainId,
  compact = false,
}: NetworkSwitcherProps) {
  const { 
    chainId, 
    chainName, 
    isSupported,
    isTestnet,
    switchToChain,
    isSwitching,
    error,
    supportedChains,
  } = useNetworkSwitch();

  const targetChainId = requiredChainId ?? getDefaultChainId();
  const targetChain = CHAIN_BY_ID[targetChainId];
  const isCorrectNetwork = chainId === targetChainId;

  // Don't show if on correct network and showOnlyIfWrong is true
  if (showOnlyIfWrong && isCorrectNetwork) {
    return null;
  }

  // Compact mode - warning banner
  if (compact && !isCorrectNetwork) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">⚠️</span>
            <span className="text-sm text-yellow-200">
              Please switch to <strong>{targetChain?.name}</strong> to continue
            </span>
          </div>
          <button
            onClick={() => switchToChain(targetChainId)}
            disabled={isSwitching}
            className="px-3 py-1 text-sm bg-yellow-500 text-black rounded hover:bg-yellow-400 disabled:opacity-50 transition-colors"
          >
            {isSwitching ? "Switching..." : "Switch Network"}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Full network selector
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Network</h3>
        {isTestnet && (
          <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
            Testnet
          </span>
        )}
      </div>

      {/* Current network */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isSupported ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-foreground font-medium">
          {chainName || "Not Connected"}
        </span>
        {!isSupported && chainId && (
          <span className="text-xs text-red-400">(Unsupported)</span>
        )}
      </div>

      {/* Switch to required network */}
      {!isCorrectNetwork && targetChain && (
        <button
          onClick={() => switchToChain(targetChainId)}
          disabled={isSwitching}
          className="w-full px-4 py-2 mb-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSwitching ? "Switching..." : `Switch to ${targetChain.name}`}
        </button>
      )}

      {/* Network selector dropdown */}
      <div className="relative">
        <select
          value={chainId || ""}
          onChange={(e) => switchToChain(Number(e.target.value))}
          disabled={isSwitching}
          className="w-full px-3 py-2 bg-muted text-foreground rounded-lg border border-border focus:border-primary focus:outline-none appearance-none cursor-pointer"
        >
          <option value="" disabled>Select Network</option>
          <optgroup label="Mainnets">
            {supportedChains
              .filter(c => !c.testnet)
              .map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))
            }
          </optgroup>
          <optgroup label="Testnets">
            {supportedChains
              .filter(c => c.testnet)
              .map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))
            }
          </optgroup>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}

/**
 * Simple network warning banner
 */
export function NetworkWarningBanner({ requiredChainId }: { requiredChainId?: number }) {
  return <NetworkSwitcher showOnlyIfWrong compact requiredChainId={requiredChainId} />;
}
