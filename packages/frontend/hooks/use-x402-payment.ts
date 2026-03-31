"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEnsureNetwork } from "./use-network-switch";
import { createPublicClient, http, parseAbi } from "viem";
import { getDefaultChain, getDefaultChainId, CHAIN_BY_NAME } from "@/lib/chains";
import { getNetwork, getUsdcAddress, USDC_ADDRESSES } from "@/lib/chain-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Resolve current chain config
const CURRENT_NETWORK = getNetwork();
const CURRENT_CHAIN_ID = getDefaultChainId();
const CURRENT_CHAIN = getDefaultChain();
const USDC_ADDRESS = getUsdcAddress();

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

// Standalone viem client for tx receipt polling
const paymentClient = createPublicClient({
  chain: CURRENT_CHAIN,
  transport: http(),
});

export type PaymentStatus =
  | "idle"
  | "fetching-requirements"
  | "switching-network"
  | "awaiting-approval"
  | "confirming-tx"
  | "verifying-payment"
  | "success"
  | "error";

interface PaymentRequirements {
  scheme: string;
  network: string;
  chainId: number;
  token: string;
  amount: string;
  recipient: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutRequest {
  storeId: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    name: string;
    address1: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  email: string;
  orderIntentId?: string;
}

export interface ResourceResult {
  content: unknown;
  contentType: string;
  /** Set when the resource was a file download */
  downloaded?: { filename: string; url: string };
}

export interface CheckoutResult {
  orderId: string;
  orderIntentId: string;
  shopifyOrderId: string | null;
  txHash: string;
  amounts: {
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
    currency: string;
  };
}

function buildPaymentHeader(txHash: string) {
  return JSON.stringify({
    transactionHash: txHash,
    network: CURRENT_NETWORK,
    chainId: CURRENT_CHAIN_ID,
    timestamp: Date.now(),
  });
}

/** Try to handle the response as a file download. Returns ResourceResult if it was a file, null otherwise. */
function tryFileDownload(res: Response): ResourceResult | null {
  const cd = res.headers.get("content-disposition");
  if (!cd || !cd.includes("attachment")) return null;

  const filename = cd.match(/filename="(.+?)"/)?.[1] || "download";
  // Return a marker — caller will handle the blob
  return {
    content: { downloaded: true, filename },
    contentType: res.headers.get("content-type") || "application/octet-stream",
    downloaded: { filename, url: "" }, // url filled in after blob
  };
}

/** Create a blob URL from a Response (does NOT auto-download — modal shows download button) */
async function prepareBlobUrl(res: Response): Promise<string> {
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** Read response body safely based on content-type (avoids body-already-read errors) */
async function readResponseBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

/** Map raw errors to user-friendly messages */
function friendlyError(err: any): string {
  // User rejected in wallet
  if (err.code === 4001 || err.code === "ACTION_REJECTED")
    return "You rejected the transaction in your wallet.";

  // Chain not added to wallet
  if (err.code === 4902)
    return `${CURRENT_CHAIN.name} network not found in your wallet. Please add it and try again.`;

  // Explicit message we threw (reverted, network switch, etc.)
  if (err.message?.startsWith("Transaction reverted"))
    return err.message;
  if (err.message?.startsWith("Please switch"))
    return err.message;

  // Wagmi / viem short messages
  const short: string = err.shortMessage || "";
  if (/insufficient funds/i.test(short) || /insufficient funds/i.test(err.message || ""))
    return `Insufficient USDC balance. Make sure you have enough tokens on ${CURRENT_CHAIN.name}.`;
  if (/user rejected/i.test(short))
    return "You rejected the transaction in your wallet.";
  if (/connector not connected/i.test(short))
    return "Wallet disconnected. Please reconnect and try again.";

  // Network / fetch errors
  if (err.name === "TypeError" && /fetch/i.test(err.message || ""))
    return "Cannot reach the server. Check your connection and try again.";

  // Backend JSON error bodies we parsed
  if (err.message?.includes("Payment verification failed"))
    return "Payment could not be verified on-chain. The transaction may have failed or not yet confirmed.";
  if (err.message?.includes("Resource not found"))
    return "This resource no longer exists or has been removed.";
  if (err.message?.includes("not available"))
    return "This resource is currently unavailable.";
  if (err.message?.includes("Order intent expired"))
    return "Your checkout session expired. Please try again.";
  if (err.message?.includes("already processed"))
    return "This order was already processed.";
  if (err.message?.includes("Unknown storeId") || err.message?.includes("Product not found"))
    return "This product is no longer available.";
  if (err.message?.includes("recipient not configured"))
    return "The seller hasn't configured their wallet yet. Contact the creator.";

  // Fallback
  return err.shortMessage || err.message || "Something went wrong. Please try again.";
}

export function useX402Payment() {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { ensureCorrectNetwork } = useEnsureNetwork(CURRENT_CHAIN_ID);
  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  const sendPayment = useCallback(
    async (requirements: PaymentRequirements): Promise<string> => {
      // Switch to the correct network
      setStatus("switching-network");
      const switched = await ensureCorrectNetwork();
      if (!switched) throw new Error(`Please switch to ${CURRENT_CHAIN.name} network`);

      // Determine USDC address — use from requirements chain or current default
      const reqNetwork = requirements.network || CURRENT_NETWORK;
      const usdcAddr = USDC_ADDRESSES[reqNetwork] || USDC_ADDRESS;

      // Send ERC-20 transfer
      setStatus("awaiting-approval");
      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: usdcAddr,
        functionName: "transfer",
        args: [requirements.recipient as `0x${string}`, BigInt(requirements.amount)],
        chainId: requirements.chainId || CURRENT_CHAIN_ID,
      });

      setTxHash(hash);
      setStatus("confirming-tx");

      // Wait for confirmation and check status
      const receipt = await paymentClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      if (receipt.status === "reverted") {
        throw new Error(
          "Transaction reverted — you may not have enough USDC. " +
          "Get test tokens from the faucet."
        );
      }

      return hash;
    },
    [ensureCorrectNetwork, writeContractAsync],
  );

  // Flow A: Pay for a resource (API, file, article)
  const payForResource = useCallback(
    async (resourceIdOrSlug: string): Promise<ResourceResult> => {
      if (!isConnected) {
        openConnectModal?.();
        throw new Error("Please connect your wallet first");
      }

      try {
        // Phase 1: Get payment requirements
        setStatus("fetching-requirements");
        setError(null);
        setTxHash(null);

        const walletQuery = address ? `?wallet=${address.toLowerCase()}` : "";
        const phase1 = await fetch(`${API_URL}/x402/resource/${resourceIdOrSlug}${walletQuery}`);
        if (phase1.status !== 402) {
          if (!phase1.ok) {
            const errBody = await readResponseBody(phase1) as any;
            throw new Error(errBody?.error || `Server error (${phase1.status})`);
          }
          // Resource is free or already accessible (previously paid)
          // Check if it's a file download
          const fileInfo = tryFileDownload(phase1);
          if (fileInfo) {
            const blobUrl = await prepareBlobUrl(phase1);
            setStatus("success");
            return { ...fileInfo, downloaded: { ...fileInfo.downloaded!, url: blobUrl } };
          }
          const content = await readResponseBody(phase1);
          setStatus("success");
          return { content, contentType: phase1.headers.get("content-type") || "application/json" };
        }

        const body = await phase1.json();
        const requirements: PaymentRequirements =
          body.accepts?.[0] || body.paymentRequirements?.[0] || body;

        if (!requirements.recipient || !requirements.amount) {
          throw new Error("Invalid payment requirements from server");
        }

        // Send payment
        const hash = await sendPayment(requirements);

        // Phase 2: Verify payment & get content
        setStatus("verifying-payment");
        const phase2 = await fetch(`${API_URL}/x402/resource/${resourceIdOrSlug}`, {
          headers: { "X-PAYMENT": buildPaymentHeader(hash) },
        });

        if (!phase2.ok) {
          const errBody = await readResponseBody(phase2) as any;
          throw new Error(errBody?.details || errBody?.error || `Verification failed (${phase2.status})`);
        }

        // Check if this is a file download (Content-Disposition: attachment)
        const fileInfo = tryFileDownload(phase2);
        if (fileInfo) {
          const blobUrl = await prepareBlobUrl(phase2);
          setStatus("success");
          return { ...fileInfo, downloaded: { ...fileInfo.downloaded!, url: blobUrl } };
        }

        const content = await readResponseBody(phase2);
        setStatus("success");
        return { content, contentType: phase2.headers.get("content-type") || "application/json" };
      } catch (err: any) {
        setError(friendlyError(err));
        setStatus("error");
        throw err;
      }
    },
    [isConnected, address, openConnectModal, sendPayment],
  );

  // Flow B: Pay for a store product (checkout)
  const payForProduct = useCallback(
    async (checkoutData: CheckoutRequest): Promise<CheckoutResult> => {
      if (!isConnected) {
        openConnectModal?.();
        throw new Error("Please connect your wallet first");
      }

      try {
        setStatus("fetching-requirements");
        setError(null);
        setTxHash(null);

        // Phase 1: Create order intent
        const phase1 = await fetch(`${API_URL}/x402/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkoutData),
        });

        if (phase1.status !== 402) {
          const errBody = await readResponseBody(phase1) as any;
          throw new Error(errBody?.error || `Unexpected server response (${phase1.status})`);
        }

        const { orderIntentId, amounts, paymentRequirements } = await phase1.json();
        const requirements: PaymentRequirements = paymentRequirements[0];

        if (!requirements?.recipient || !requirements?.amount) {
          throw new Error("Invalid payment requirements from server");
        }

        // Send payment
        const hash = await sendPayment(requirements);

        // Phase 2: Verify payment
        setStatus("verifying-payment");
        const phase2 = await fetch(`${API_URL}/x402/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PAYMENT": buildPaymentHeader(hash),
          },
          body: JSON.stringify({ ...checkoutData, orderIntentId }),
        });

        if (!phase2.ok) {
          const errBody = await readResponseBody(phase2) as any;
          throw new Error(errBody?.details || errBody?.error || `Verification failed (${phase2.status})`);
        }

        const result = await phase2.json();
        setStatus("success");
        return {
          orderId: result.orderId,
          orderIntentId: result.orderIntentId,
          shopifyOrderId: result.shopifyOrderId || null,
          txHash: hash,
          amounts: result.amounts || amounts,
        };
      } catch (err: any) {
        setError(friendlyError(err));
        setStatus("error");
        throw err;
      }
    },
    [isConnected, openConnectModal, sendPayment],
  );

  return {
    payForResource,
    payForProduct,
    status,
    error,
    txHash,
    reset,
  };
}
