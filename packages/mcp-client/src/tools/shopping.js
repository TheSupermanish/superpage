/**
 * Shopping tools for SuperPage x402.
 */

import {
  SERVER_URL,
  NETWORK,
  CURRENCY,
  TOKEN_CONTRACT,
  TOKEN_DECIMALS,
  MAX_AUTO_PAYMENT,
  CHAINS,
} from "../config.js";
import { wallet, log, getExplorerUrl } from "../wallet.js";
import { makePayment } from "../payment.js";

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const TOOLS = [
  {
    name: "x402_list_stores",
    description:
      "List all available x402-enabled shopping stores. Returns store IDs, names, and product counts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "x402_browse_products",
    description:
      "Browse products in a specific store. Returns product IDs, titles, prices, and availability.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID (e.g., shopify/store-name)",
        },
        search: {
          type: "string",
          description: "Optional search query to filter products",
        },
      },
      required: ["storeId"],
    },
  },
  {
    name: "x402_buy",
    description:
      `Purchase product(s) from a store. Automatically handles the full checkout flow: creates order intent, makes ${CURRENCY} payment on ${NETWORK}, and confirms the order.`,
    inputSchema: {
      type: "object",
      properties: {
        storeId: {
          type: "string",
          description: "Store ID",
        },
        items: {
          type: "array",
          description: "Items to purchase",
          items: {
            type: "object",
            properties: {
              productId: {
                type: "string",
                description: "Product variant ID (the 'id' or 'variantId' field from x402_browse_products, e.g. 'gid://shopify/ProductVariant/12345')",
              },
              variantId: {
                type: "string",
                description: "Alias for productId \u2014 you can use either field",
              },
              quantity: {
                type: "number",
                description: "Quantity to purchase (default: 1)",
              },
            },
          },
        },
        email: {
          type: "string",
          description: "Customer email for order confirmation",
        },
        shippingAddress: {
          type: "object",
          description: "Shipping address for physical products",
          properties: {
            name: { type: "string", description: "Full name" },
            address1: { type: "string", description: "Street address" },
            city: { type: "string" },
            state: { type: "string", description: "State/Province" },
            postalCode: { type: "string", description: "ZIP/Postal code" },
            country: {
              type: "string",
              description: "2-letter country code (e.g., US, GB, CA)",
            },
          },
          required: [
            "name",
            "address1",
            "city",
            "state",
            "postalCode",
            "country",
          ],
        },
      },
      required: ["storeId", "items", "email", "shippingAddress"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function listStores() {
  const res = await fetch(`${SERVER_URL}/x402/stores`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to list stores: ${res.status}` };
  }

  const data = await res.json();

  // API returns {success: true, data: {stores: [...]}}
  const stores = data.data?.stores || data.stores || [];

  return {
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      url: s.url,
      shopDomain: s.shopDomain,
      networks: s.networks || [],
      asset: s.asset || CURRENCY,
      currency: s.currency || "USD",
    })),
    count: stores.length,
    paymentInfo: {
      currency: CURRENCY,
      network: NETWORK,
      contract: TOKEN_CONTRACT,
    },
  };
}

async function browseProducts(storeId, search) {
  // URL encode the storeId to handle slashes
  let url = `${SERVER_URL}/x402/stores/${encodeURIComponent(storeId)}/products`;
  if (search) {
    url += `?search=${encodeURIComponent(search)}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error || `Failed to get products: ${res.status}` };
  }

  const data = await res.json();

  const products = (data.products || []).map((p) => ({
    id: p.id,
    variantId: p.variantId || p.id,
    name: p.name,
    description: p.description,
    image: p.image,
    priceUSD: p.price,
    price: p.price,
    currency: CURRENCY,
    available: p.inventory === null || p.inventory > 0,
    inventory: p.inventory,
  }));

  return {
    storeId,
    products,
    count: products.length,
    paymentInfo: {
      currency: CURRENCY,
      network: "Ethereum",
    },
    nextCursor: data.nextCursor,
  };
}

async function fullCheckout({ storeId, items, email, shippingAddress }) {
  if (!wallet) {
    return {
      error: "No wallet configured. Set WALLET_PRIVATE_KEY environment variable.",
    };
  }

  log(`Starting checkout for ${items.length} item(s) in store ${storeId}`);

  // Build checkout payload
  // Accept productId, variantId, or id -- agents may use any of these
  const checkoutPayload = {
    storeId,
    items: items.map((i) => ({
      productId: i.productId || i.variantId || i.id,
      quantity: i.quantity || 1,
    })),
    email,
    shippingAddress: {
      name: shippingAddress.name,
      address1: shippingAddress.address1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
    },
  };

  // Step 1: Initiate checkout (expect 402)
  log("Step 1: Initiating checkout...");
  let initRes;
  try {
    initRes = await fetch(
      `${SERVER_URL}/x402/checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      }
    );
  } catch (fetchErr) {
    return { error: `Checkout request failed: ${fetchErr.message}` };
  }

  if (initRes.status !== 402) {
    const err = await initRes.json().catch(() => ({}));
    return {
      error: err.error || `Checkout failed with status ${initRes.status}`,
    };
  }

  const checkoutData = await initRes.json();
  const paymentReq = checkoutData.paymentRequirements?.[0];

  if (!paymentReq) {
    return { error: "No payment requirements returned" };
  }

  const rawAmount = paymentReq.amount;
  if (!rawAmount || isNaN(parseInt(rawAmount))) {
    return { error: "Invalid payment amount" };
  }
  const amountToken = parseInt(rawAmount) / (10 ** TOKEN_DECIMALS);
  const recipient = paymentReq.recipient || paymentReq.payTo;

  log(`Step 2: Payment required - ${amountToken} ${CURRENCY} to ${recipient}`);

  // Check max payment limit
  if (amountToken > MAX_AUTO_PAYMENT) {
    return {
      error: `Payment of ${amountToken} ${CURRENCY} exceeds max auto-payment limit of ${MAX_AUTO_PAYMENT} ${CURRENCY}`,
      paymentRequired: {
        amount: paymentReq.amount,
        amountFormatted: amountToken,
        currency: CURRENCY,
        payTo: recipient,
      },
    };
  }

  // Step 2: Make payment
  const paymentResult = await makePayment(recipient, paymentReq.amount);

  if (!paymentResult.success) {
    return { error: `Payment failed: ${paymentResult.error}` };
  }

  log(`Step 3: Payment sent - ${paymentResult.txHash}`);

  // Step 3: Finalize with payment proof
  log("Step 4: Finalizing order...");
  const finalizePayload = {
    ...checkoutPayload,
    orderIntentId: checkoutData.orderIntentId,
  };

  let finalRes;
  try {
    finalRes = await fetch(
      `${SERVER_URL}/x402/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT": JSON.stringify({
            txHash: paymentResult.txHash,
            transactionHash: paymentResult.txHash,
            network: NETWORK,
            chainId: CHAINS[NETWORK]?.id || 1,
            timestamp: Date.now(),
          }),
        },
        body: JSON.stringify(finalizePayload),
      }
    );
  } catch (fetchErr) {
    return { error: `Order finalization request failed: ${fetchErr.message}`, payment: { txHash: paymentResult.txHash } };
  }

  const orderData = await finalRes.json();

  if (!finalRes.ok) {
    return { error: orderData.error || "Order finalization failed" };
  }

  log(`\u2713 Order confirmed: ${orderData.orderId}`);

  return {
    success: true,
    order: {
      id: orderData.orderId,
      shopifyOrderId: orderData.shopifyOrderId,
      shopifyOrderNumber: orderData.shopifyOrderNumber,
      total: orderData.total,
      currency: CURRENCY,
      status: "confirmed",
    },
    payment: {
      amount: amountToken,
      currency: CURRENCY,
      txHash: paymentResult.txHash,
      network: NETWORK,
      explorer: getExplorerUrl(paymentResult.txHash),
    },
    shipping: shippingAddress,
  };
}

export const handlers = {
  x402_list_stores: () => listStores(),
  x402_browse_products: (args) => browseProducts(args.storeId, args.search),
  x402_buy: (args) => fullCheckout(args),
};
