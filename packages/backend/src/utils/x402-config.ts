/**
 * x402 Server Configuration
 * Uses the centralized chain registry for network validation
 */

import { getNetwork, isValidNetwork } from "../config/chain-config.js";

let x402ServerInstance: any = null;

async function initializeX402Server() {
  if (x402ServerInstance) {
    return x402ServerInstance;
  }

  const network = getNetwork();
  const recipientAddress = process.env.X402_RECIPIENT_ADDRESS || process.env.ETH_RECIPIENT_ADDRESS;

  if (!recipientAddress) {
    throw new Error(
      "X402_RECIPIENT_ADDRESS or ETH_RECIPIENT_ADDRESS environment variable is required for x402 payments"
    );
  }

  if (!isValidNetwork(network)) {
    throw new Error(`[x402-config] Unknown network: ${network}`);
  }

  const { createX402Server } = await import("../../../x402-sdk-eth/src/index.js");
  x402ServerInstance = createX402Server({
    network: network as any,
    recipientAddress: recipientAddress as `0x${string}`,
  });

  return x402ServerInstance;
}

export { initializeX402Server };

export const x402Config = {
  network: (process.env.X402_NETWORK || process.env.X402_CHAIN || "base-sepolia") as string,
  recipientAddress: process.env.X402_RECIPIENT_ADDRESS || process.env.ETH_RECIPIENT_ADDRESS || "",
};
