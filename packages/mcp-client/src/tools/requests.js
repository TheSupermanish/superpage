/**
 * Wallet and request tools for SuperPage x402.
 * Handles x402_request (universal paid API access), x402_wallet, and x402_send.
 */

import {
  SERVER_URL,
  NETWORK,
  CURRENCY,
  TOKEN_DECIMALS,
  MAX_AUTO_PAYMENT,
  CHAINS,
} from "../config.js";
import { wallet, log, getExplorerUrl, getWalletBalance, sendToken } from "../wallet.js";
import { makePayment } from "../payment.js";

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLS = [
  {
    name: "x402_request",
    description:
      `ACCESS ANY PAID RESOURCE - This tool has a built-in wallet and AUTOMATICALLY PAYS for resources. When the server returns HTTP 402 Payment Required, this tool pays ${CURRENCY} from the configured wallet on ${NETWORK} and retries the request \u2014 no user action needed. YOU MUST USE THIS TOOL to access any resource that costs money. NEVER tell the user you cannot pay \u2014 this tool handles payments automatically. Use the 'url' field from x402_list_resources which contains the correct server URL (${SERVER_URL}).`,
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: `Full URL of the API endpoint. Get this from x402_list_resources 'url' field. Server: ${SERVER_URL}`,
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          description: "HTTP method (default: GET)",
        },
        headers: {
          type: "object",
          description: "Optional request headers",
        },
        body: {
          type: "object",
          description: "Optional request body (for POST/PUT)",
        },
        maxPayment: {
          type: "string",
          description:
            `Maximum ${CURRENCY} willing to pay (e.g., '0.50'). Defaults to MAX_AUTO_PAYMENT env var.`,
        },
      },
      required: ["url"],
    },
  },
  {
    name: "x402_wallet",
    description:
      `Check the agent wallet's ETH and ${CURRENCY} balance. Also shows the wallet address and network.`,
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "x402_send",
    description:
      `Send ${CURRENCY} directly to any wallet address. For peer-to-peer payments.`,
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient Ethereum wallet address (0x...)",
        },
        amount: {
          type: "string",
          description: `Amount in ${CURRENCY} (e.g., '5.00')`,
        },
        memo: {
          type: "string",
          description: "Optional payment memo/note (not stored on-chain)",
        },
      },
      required: ["to", "amount"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function x402Request({ url, method = "GET", headers = {}, body, maxPayment, preview = false }) {
  const maxPay = parseFloat(maxPayment) || MAX_AUTO_PAYMENT;

  // Append wallet address to URL so backend can check prior payment
  let requestUrl = url;
  if (wallet) {
    const separator = url.includes("?") ? "&" : "?";
    requestUrl = `${url}${separator}wallet=${wallet.address.toLowerCase()}`;
  }

  // First request
  const reqOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body && ["POST", "PUT"].includes(method)) {
    reqOptions.body = JSON.stringify(body);
  }

  log(`Making ${method} request to ${requestUrl}`);
  const res = await fetch(requestUrl, reqOptions);

  // If not 402, return the response
  if (res.status !== 402) {
    const contentType = res.headers.get("content-type") || "";
    let responseData;

    if (contentType.includes("application/json")) {
      responseData = await res.json();
    } else {
      responseData = await res.text();
    }

    return {
      status: res.status,
      paid: false,
      data: responseData,
    };
  }

  // Handle 402 Payment Required
  if (!wallet) {
    return {
      error: "Payment required but no wallet configured",
      status: 402,
      paymentRequired: await res.json().catch(() => ({})),
    };
  }

  const paymentReq = await res.json();
  const rawAmount = paymentReq.amount;
  if (!rawAmount || isNaN(parseInt(rawAmount))) {
    return { error: "Invalid payment amount in 402 response" };
  }
  const amountToken = parseInt(rawAmount) / (10 ** TOKEN_DECIMALS);

  // Extract recipient address (try both 'recipient' and 'payTo' for compatibility)
  const recipient = paymentReq.recipient || paymentReq.payTo;

  log(`402 received - ${amountToken} ${CURRENCY} required`);
  log(`Payment recipient: ${recipient}`);

  if (!recipient) {
    return {
      error: "Payment recipient not specified in 402 response",
      status: 402,
      paymentRequired: paymentReq,
    };
  }

  // Preview mode: return price info without paying
  if (preview) {
    return {
      status: 402,
      preview: true,
      paid: false,
      resource: url,
      price: {
        amount: amountToken,
        currency: CURRENCY,
        raw: paymentReq.amount,
      },
      recipient,
      network: NETWORK,
      message: `This resource costs ${amountToken} ${CURRENCY}. Run 'request' with the same URL to pay and access it.`,
    };
  }

  // Check max payment
  if (amountToken > maxPay) {
    return {
      error: `Payment of ${amountToken} ${CURRENCY} exceeds limit of ${maxPay} ${CURRENCY}`,
      status: 402,
      paymentRequired: {
        amount: paymentReq.amount,
        amountFormatted: amountToken,
        currency: CURRENCY,
        recipient: recipient,
      },
    };
  }

  // Make payment
  const paymentResult = await makePayment(recipient, paymentReq.amount);

  if (!paymentResult.success) {
    return { error: `Payment failed: ${paymentResult.error}` };
  }

  log(`Payment sent: ${paymentResult.txHash}`);

  // Retry with payment proof (X-PAYMENT header with JSON)
  const paymentProof = {
    txHash: paymentResult.txHash,
    transactionHash: paymentResult.txHash,
    network: NETWORK,
    chainId: CHAINS[NETWORK]?.id || 1,
    timestamp: Date.now(),
  };

  let retryRes;
  try {
    retryRes = await fetch(url, {
      ...reqOptions,
      headers: {
        ...reqOptions.headers,
        "X-PAYMENT": JSON.stringify(paymentProof),
      },
    });
  } catch (fetchErr) {
    return { error: `Payment proof request failed: ${fetchErr.message}`, payment: { txHash: paymentResult.txHash } };
  }

  const contentType = retryRes.headers.get("content-type") || "";
  let responseData;

  if (contentType.includes("application/json")) {
    responseData = await retryRes.json();
  } else {
    responseData = await retryRes.text();
  }

  return {
    status: retryRes.status,
    paid: true,
    payment: {
      amount: amountToken,
      currency: CURRENCY,
      txHash: paymentResult.txHash,
      explorer: getExplorerUrl(paymentResult.txHash),
    },
    data: responseData,
  };
}

export const handlers = {
  x402_request: (args) => x402Request(args),
  x402_wallet: () => getWalletBalance(),
  x402_send: (args) => sendToken(args.to, args.amount, args.memo),
};
