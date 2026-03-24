/**
 * A2A ↔ x402 Format Converters
 *
 * Maps between AP2 payment types and existing x402 SDK types
 * so the A2A layer can reuse the on-chain verification logic.
 */

import type { PaymentRequirements, PaymentProof } from "../../../x402-sdk-eth/src/x402-types.js";
import type {
  AP2PaymentRequirements,
  AP2PaymentPayload,
  AP2SettleResponse,
  AP2NetworkInfo,
  AP2PaymentRequest,
  AP2PaymentResponse,
  PaymentMethodData,
  PaymentItem,
  PaymentCurrencyAmount,
  CartMandate,
  PaymentReceipt,
} from "./types.js";
import { X402_EXTENSION_URI, X402_PAYMENT_METHOD } from "./types.js";
import {
  getChainConfig,
  getChainMetadata,
  isValidNetwork,
  type NetworkId,
} from "../config/chain-config.js";

/**
 * Convert x402 PaymentRequirements → AP2PaymentRequirements
 *
 * Maps the existing SDK format to the A2A x402 extension format.
 */
export function toAP2Requirements(
  req: PaymentRequirements,
  requestId?: string,
  expiresAt?: string
): AP2PaymentRequirements {
  const networkInfo: AP2NetworkInfo = {
    network: req.network,
    chainId: req.chainId,
  };

  // Add RPC URL if we have it
  if (isValidNetwork(req.network)) {
    const meta = getChainMetadata(req.network as NetworkId);
    networkInfo.rpcUrl = meta.rpcUrl;
  }

  return {
    extensionUri: X402_EXTENSION_URI,
    networks: [networkInfo],
    asset: req.token,
    amount: req.amount,
    payTo: req.recipient,
    scheme: req.scheme,
    requestId: requestId || req.requestId,
    expiresAt,
    memo: req.memo,
  };
}

/**
 * Convert AP2PaymentPayload → x402 PaymentProof
 *
 * Maps the A2A payment submission back to the SDK format
 * for on-chain verification via verifyPaymentTransaction().
 */
export function fromAP2Payload(payload: AP2PaymentPayload): PaymentProof {
  return {
    transactionHash: payload.transactionHash,
    network: payload.network as PaymentProof["network"],
    chainId: payload.chainId,
    timestamp: payload.timestamp,
    requestId: payload.requestId,
  };
}

/**
 * Build an AP2SettleResponse from verification results
 */
export function toAP2Receipt(
  transactionHash: string,
  network: string,
  chainId: number,
  payer?: string,
  blockNumber?: string
): AP2SettleResponse {
  let explorerUrl: string | undefined;
  if (isValidNetwork(network)) {
    const meta = getChainMetadata(network as NetworkId);
    explorerUrl = `${meta.explorerUrl}/tx/${transactionHash}`;
  }

  return {
    success: true,
    transactionHash,
    network,
    chainId,
    payer,
    blockNumber,
    explorerUrl,
  };
}

/**
 * Build x402 PaymentRequirements from AP2 format
 * (reverse of toAP2Requirements — used when receiving from external agents)
 */
export function fromAP2Requirements(ap2: AP2PaymentRequirements): PaymentRequirements {
  const net = ap2.networks[0];
  if (!net) {
    throw new Error("AP2 requirements must include at least one network");
  }

  return {
    scheme: ap2.scheme as PaymentRequirements["scheme"],
    network: net.network as PaymentRequirements["network"],
    chainId: net.chainId,
    amount: ap2.amount,
    token: ap2.asset as PaymentRequirements["token"],
    recipient: ap2.payTo,
    memo: ap2.memo,
    requestId: ap2.requestId,
  };
}

// ============================================================
// AP2 Mandate Converters
// ============================================================

/**
 * Build a W3C PaymentRequest for an AP2 CartMandate.
 * Uses x402 as the payment method with chain config.
 */
export function buildPaymentRequest(
  detailsId: string,
  items: Array<{ label: string; priceUsd: number }>,
): AP2PaymentRequest {
  const chainConfig = getChainConfig();
  const chainMeta = getChainMetadata(chainConfig.network);

  const displayItems: PaymentItem[] = items.map((item) => ({
    label: item.label,
    amount: { currency: "USD", value: item.priceUsd },
  }));

  const totalValue = items.reduce((sum, i) => sum + i.priceUsd, 0);

  const x402MethodData: PaymentMethodData = {
    supported_methods: X402_PAYMENT_METHOD,
    data: {
      network: chainConfig.network,
      chainId: chainConfig.chainId,
      token: chainConfig.currency,
      recipient:
        process.env.X402_RECIPIENT_ADDRESS ||
        process.env.ETH_RECIPIENT_ADDRESS,
      rpcUrl: chainMeta.rpcUrl,
    },
  };

  return {
    method_data: [x402MethodData],
    details: {
      id: detailsId,
      display_items: displayItems,
      total: {
        label: "Total",
        amount: { currency: "USD", value: totalValue },
      },
    },
  };
}

/**
 * Build a CartMandate wrapping a PaymentRequest.
 */
export function buildCartMandate(
  cartId: string,
  merchantName: string,
  paymentRequest: AP2PaymentRequest,
  expiresAt: Date,
  userConfirmationRequired: boolean
): CartMandate {
  return {
    contents: {
      id: cartId,
      user_cart_confirmation_required: userConfirmationRequired,
      payment_request: paymentRequest,
      cart_expiry: expiresAt.toISOString(),
      merchant_name: merchantName,
    },
  };
}

/**
 * Build an AP2 PaymentReceipt from verification results.
 */
export function buildPaymentReceipt(
  paymentMandateId: string,
  transactionHash: string,
  amount: PaymentCurrencyAmount,
  success: boolean,
  errorMessage?: string
): PaymentReceipt {
  const base = {
    payment_mandate_id: paymentMandateId,
    timestamp: new Date().toISOString(),
    payment_id: transactionHash,
    amount,
  };

  if (success) {
    return {
      ...base,
      payment_status: {
        status: "Success" as const,
        details: {
          merchant_confirmation_id: transactionHash,
          network_confirmation_id: transactionHash,
        },
      },
      payment_method_details: { method: "x402", transactionHash },
    };
  }

  return {
    ...base,
    payment_status: {
      status: "Failure" as const,
      details: {
        failure_message: errorMessage || "Payment verification failed",
      },
    },
  };
}

/**
 * Extract x402 payment proof from an AP2 PaymentResponse.details.
 * Shopping agents place the tx hash etc. in PaymentResponse.details.
 */
export function extractX402ProofFromPaymentResponse(
  paymentResponse: AP2PaymentResponse
): AP2PaymentPayload | null {
  const d = paymentResponse.details;
  if (!d || !d.transactionHash) return null;

  const chainConfig = getChainConfig();
  return {
    transactionHash: d.transactionHash as string,
    network: (d.network as string) || chainConfig.network,
    chainId: (d.chainId as number) || chainConfig.chainId,
    timestamp: (d.timestamp as number) || Date.now(),
    requestId: d.requestId as string | undefined,
  };
}
