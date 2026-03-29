import { Request, Response } from "express";
import { Store, StoreProduct, OrderIntent, Order } from "../models/index.js";
import { toCentsStr } from "../utils/utils";
import { Amounts, CheckoutRequest } from "../types";
import crypto from "crypto";
import {
  createPaymentRequirements,
  isOrderIntentExpired,
  parsePaymentHeader,
  extractTxHashFromVerification,
  deepSortObject,
} from "../utils/x402-payment-helpers";
import { initializeX402Server } from "../utils/x402-config";
import { isValidNetwork, getChainMetadata, type NetworkId } from "../config/chain-config";

export async function handleCheckout(req: Request, res: Response) {
  const startTime = Date.now();
  const requestId = `checkout_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log(`[${requestId}] Checkout request: ${req.method} ${req.url}`);

  const x402Server = await initializeX402Server();
  try {
    const body = req.body as CheckoutRequest;
    const { storeId, items, shippingAddress, email, orderIntentId } =
      body || {};
    const xPaymentHeader = req.header("X-PAYMENT");

    console.log(`[${requestId}] storeId=${storeId}, items=${items?.length || 0}, hasPayment=${!!xPaymentHeader}`);

    // Validate required fields
    if (
      !storeId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !shippingAddress ||
      !email
    ) {
      console.error(`[${requestId}] Missing required fields (storeId=${!!storeId}, items=${Array.isArray(items) && items.length}, email=${!!email}, address=${!!shippingAddress})`);
      return res.status(400).json({
        error:
          "Missing required fields: storeId, items[], shippingAddress, email",
      });
    }

    // Validate email format
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.error(`[${requestId}] Invalid email format`);
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Normalize: accept productId, variantId, or id
    for (const it of items) {
      if (!it.productId && (it.variantId || it.id)) {
        it.productId = (it.variantId || it.id)!;
      }
      if (!it.productId) {
        console.error(`[${requestId}] Missing productId in item`);
        return res.status(400).json({
          error:
            "Each item must include a productId (variant ID). Use browse-products to find product IDs first.",
        });
      }
    }

    // MongoDB - using models directly

    // Load store for currency and basic validation
    let store;
    try {
      store = await Store.findOne({ id: storeId }).lean();
      if (!store) {
        console.error(`[${requestId}] ❌ Store not found: ${storeId}`);
        return res.status(404).json({ error: "Unknown storeId" });
      }
    } catch (storeErr: any) {
      console.error(`[${requestId}] Failed to load store:`, storeErr.message);
      return res.status(500).json({
        error: "Failed to load store",
        details: storeErr.message,
      });
    }
    console.log(`[${requestId}] Store loaded: ${store.id} (${store.currency})`);

    // ============================================================
    // PHASE 1: No X-PAYMENT header → Create intent & return 402
    // ============================================================
    if (!xPaymentHeader) {
      console.log(`[${requestId}] Phase 1: creating order intent`);
      // If orderIntentId is provided, this is a retry - load existing intent
      if (orderIntentId) {
        let intent;
        try {
          intent = await OrderIntent.findOne({ id: orderIntentId }).lean();
          if (!intent) {
            return res.status(404).json({ error: "Unknown orderIntentId" });
          }
        } catch (intentErr: any) {
          return res.status(500).json({
            error: "Failed to load order intent",
            details: intentErr.message,
          });
        }

        // Check if expired
        const expiresAtStr = intent.expiresAt instanceof Date ? intent.expiresAt.toISOString() : (intent.expiresAt as any)?.toString() || null;
        if (isOrderIntentExpired(expiresAtStr)) {
          return res.status(400).json({ error: "Order intent expired" });
        }

        // Check if already paid
        if (intent.status === "paid") {
          return res.status(400).json({
            error: "Order intent already processed",
          });
        }

        // Return the existing 402 response
        return res.status(402).json({
          orderIntentId: intent.id,
          amounts: {
            subtotal: intent.subtotalAmount,
            shipping: intent.shippingAmount,
            tax: intent.taxAmount,
            total: intent.totalAmount,
            currency: intent.currency,
          },
          paymentRequirements: intent.x402Requirements || [],
        });
      }

      // Create new order intent
      // Fetch prices for variants in this store
      const variantIds = items.map((i) => i.productId);

      let rows;
      try {
        rows = await StoreProduct.find({
          storeId,
          variantId: { $in: variantIds },
        }).lean();
      } catch (priceErr: any) {
        console.error(`[${requestId}] ❌ Failed to fetch product prices:`, priceErr.message);
        return res.status(500).json({
          error: "Failed to read product prices",
          details: priceErr.message,
        });
      }

      console.log(`[${requestId}] Found ${rows?.length || 0} products`);

      const priceMap = new Map<string, { price: number; currency: string }>();
      for (const r of rows || []) {
        const pNum = typeof r.price === "string" ? parseFloat(r.price) : Number(r.price);
        priceMap.set(r.variantId, {
          price: pNum,
          currency: r.currency || store.currency || "USD",
        });
      }

      // Validate all items present
      for (const it of items) {
        if (!priceMap.has(it.productId)) {
          console.error(`[${requestId}] Product not found: ${it.productId}`);
          return res.status(400).json({
            error: `Product not found for store: ${it.productId}`,
          });
        }
        if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) {
          console.error(`[${requestId}] Invalid quantity for ${it.productId}: ${it.quantity}`);
          return res.status(400).json({
            error: `Invalid quantity for ${it.productId}`,
          });
        }
      }

      // Compute totals
      let subtotalNum = 0;
      for (const it of items) {
        const { price } = priceMap.get(it.productId)!;
        const itemTotal = price * Number(it.quantity);
        subtotalNum += itemTotal;
      }
      const shippingNum = 0; // placeholder
      const taxNum = 0; // placeholder
      let totalNum = subtotalNum + shippingNum + taxNum;

      const currency = store.currency || (rows?.[0]?.currency ?? "USD");
      const amounts: Amounts = {
        subtotal: toCentsStr(subtotalNum),
        shipping: toCentsStr(shippingNum),
        tax: toCentsStr(taxNum),
        total: toCentsStr(totalNum),
        currency,
      };

      // Create orderIntent with 15-minute expiry
      const id = `oi_${crypto.randomUUID().slice(0, 8)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Create x402 payment requirements
      const storeNetwork = store.networks?.[0] || "devnet";
      const storeAsset = store.asset || "USDC";
      const paymentRequirements = createPaymentRequirements(
        id,
        amounts,
        expiresAt,
        storeNetwork,
        storeAsset
      );
      // Create body hash for request validation
      // Normalize the body by sorting properties to ensure consistent hashing
      const normalizedBody = deepSortObject(body);
      const bodyHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(normalizedBody))
        .digest("hex");
      try {
        await OrderIntent.create({
          id,
          storeId,
          items,
          shippingAddress,
          email,
          subtotalAmount: amounts.subtotal,
          shippingAmount: amounts.shipping,
          taxAmount: amounts.tax,
          totalAmount: amounts.total,
          currency,
          status: "pending",
          expiresAt,
          bodyHash,
          x402Requirements: paymentRequirements,
        });
      } catch (insertErr: any) {
        console.error(`[${requestId}] ❌ Failed to insert order intent:`, insertErr.message);
        return res.status(500).json({
          error: "Failed to create order intent",
          details: insertErr.message,
        });
      }

      console.log(`[${requestId}] Order intent created: ${id}, total=${amounts.total} ${currency} (${Date.now() - startTime}ms)`);

      // Return 402 with payment requirements
      return res.status(402).json({
        orderIntentId: id,
        amounts,
        paymentRequirements,
      });
    }

    // ============================================================
    // PHASE 2: Has X-PAYMENT header → Verify & Create Order
    // ============================================================
    console.log(`[${requestId}] Phase 2: verifying payment for intent ${orderIntentId}`);

    if (!orderIntentId) {
      console.error(`[${requestId}] Missing orderIntentId with X-PAYMENT header`);
      return res.status(400).json({
        error: "Missing orderIntentId when X-PAYMENT header is present",
      });
    }

    // Load order intent
    let intent;
    try {
      intent = await OrderIntent.findOne({ id: orderIntentId }).lean();
      if (!intent) {
        console.error(`[${requestId}] Order intent not found: ${orderIntentId}`);
        return res.status(404).json({ error: "Unknown orderIntentId" });
      }
    } catch (intentErr: any) {
      console.error(`[${requestId}] Failed to load order intent:`, intentErr.message);
      return res.status(500).json({
        error: "Failed to load order intent",
        details: intentErr.message,
      });
    }

    // Check if expired
    const expiresAtStr2 = intent.expiresAt instanceof Date ? intent.expiresAt.toISOString() : (intent.expiresAt as any)?.toString() || null;
    if (isOrderIntentExpired(expiresAtStr2)) {
      return res.status(400).json({ error: "Order intent expired" });
    }

    // Check if already paid
    if (intent.status === "paid") {
      return res.status(400).json({
        error: "Order intent already processed",
      });
    }

    // Validate that items match intent (prevent cart tampering)
    // Simple items validation - check that product IDs and quantities match
    const intentItems = (intent.items || []) as Array<{ productId: string; quantity: number }>;
    const bodyItems = items || [];

    if (intentItems.length !== bodyItems.length) {
      return res.status(400).json({
        error: "Item count does not match original order intent",
      });
    }

    // Check each item matches
    for (let i = 0; i < intentItems.length; i++) {
      if (intentItems[i].productId !== bodyItems[i].productId ||
          intentItems[i].quantity !== bodyItems[i].quantity) {
        console.error(`[${requestId}] Item mismatch at index ${i}`);
        return res.status(400).json({
          error: "Items do not match original order intent",
        });
      }
    }

    // ============================================================
    // Verify payment directly using x402 SDK
    // ============================================================
    try {
      // Parse payment proof from header
      const paymentData = parsePaymentHeader(xPaymentHeader);

      // Create payment requirements for verification
      // Use the store's configured network and asset
      const storeNetwork = store.networks?.[0] || "devnet";
      const storeAsset = store.asset || "USDC";

      const paymentRequirements = x402Server.createPaymentRequirements({
        amount: String(intent.totalAmount),
        token: storeAsset,
        requestId: orderIntentId,
      });
      
      // Verify payment on-chain
      const verified = await x402Server.verifyPayment(paymentData, paymentRequirements);
      
      if (!verified) {
        console.error(`[${requestId}] Payment verification failed`);
        throw new Error("Payment verification failed");
      }

      console.log(`[${requestId}] Payment verified on-chain`);

      // Extract transaction hash from payment proof
      const txHash = paymentData.transactionHash || paymentData.txHash || paymentData.signature || extractTxHashFromVerification(paymentData);

      // Create Shopify order
      try {
        const nameParts = (shippingAddress.name || "").trim().split(/\s+/);
        const firstName = nameParts.shift() || "";
        const lastName = nameParts.join(" ");

        const shopUrl = (store.url as string).replace(/\/$/, "");
        const apiVersion = "2025-10";
        const endpoint = `${shopUrl}/admin/api/${apiVersion}/orders.json`;

        const lineItems = items.map((it) => {
          const match = String(it.productId).match(/(\d+)$/);
          const variantIdNum = match ? Number(match[1]) : undefined;
          const li: any = { quantity: Number(it.quantity) };
          if (variantIdNum) li.variant_id = variantIdNum;
          return li;
        });


        // Get network display name from the chain registry
        const networkName = isValidNetwork(storeNetwork)
          ? getChainMetadata(storeNetwork as NetworkId).name
          : storeNetwork;
        
        const orderPayload = {
          order: {
            email,
            financial_status: "paid",
            currency: intent.currency || store.currency || "USD",
            line_items: lineItems,
            shipping_address: {
              first_name: firstName,
              last_name: lastName,
              address1: shippingAddress.address1,
              city: shippingAddress.city,
              province: shippingAddress.state || undefined,
              zip: shippingAddress.postalCode,
              country: shippingAddress.country,
            },
            transactions: [
              {
                kind: "sale",
                status: "success",
                amount: String(intent.totalAmount ?? "0.00"),
                currency: intent.currency || store.currency || "USD",
              },
            ],
            tags: "x402",
            note: `Paid via x402 on ${networkName}\nTransaction: ${txHash || "unknown"}\nOrder Intent: ${orderIntentId}`,
          },
        };

        console.log(`[${requestId}] Sending order to Shopify`);
        const shopifyRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": String(store.adminAccessToken),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        const shopifyText = await shopifyRes.text();
        if (!shopifyRes.ok) {
          console.error(`[${requestId}] Shopify order creation failed: ${shopifyRes.status}`);
          return res.status(502).json({
            error: "Failed to create Shopify order",
            status: shopifyRes.status,
            details: shopifyText,
          });
        }

        let shopifyJson: any;
        try {
          shopifyJson = JSON.parse(shopifyText);
        } catch {
          console.warn(`[${requestId}] Non-JSON response from Shopify`);
          shopifyJson = { order: null };
        }

        const shopifyOrderId: string | null =
          shopifyJson?.order?.admin_graphql_api_id ||
          String(shopifyJson?.order?.id || "");

        // Mark intent as paid with verification details

        try {
          await OrderIntent.updateOne(
            { id: orderIntentId },
            {
              status: "paid",
              verifiedAt: new Date(),
              verificationStatus: "verified",
              paymentTxHash: txHash,
              paymentHeaderB64: xPaymentHeader,
            }
          );
        } catch (updErr: any) {
          console.error(`[${requestId}] Failed to mark order intent as paid:`, updErr.message);
          return res.status(500).json({
            error: "Failed to mark order intent paid",
            details: updErr.message,
          });
        }

        // Create local order row with Shopify linkage
        const orderId = `ord_${crypto.randomUUID().slice(0, 8)}`;

        try {
          await Order.create({
            id: orderId,
            storeId,
            orderIntentId,
            email,
            items,
            subtotalAmount: intent.subtotalAmount,
            shippingAmount: intent.shippingAmount,
            taxAmount: intent.taxAmount,
            totalAmount: intent.totalAmount,
            currency: intent.currency,
            status: "confirmed",
            shopifyOrderId: shopifyOrderId || undefined,
          });
        } catch (ordErr: any) {
          console.error(`[${requestId}] Failed to create local order:`, ordErr.message);
          return res.status(500).json({
            error: "Failed to create local order",
            details: ordErr.message,
          });
        }

        console.log(`[${requestId}] Order confirmed: ${orderId} (shopify=${shopifyOrderId}, ${intent.totalAmount} ${intent.currency}, ${Date.now() - startTime}ms)`);

        return res.status(200).json({
          orderId,
          orderIntentId,
          storeId,
          status: "confirmed",
          shopifyOrderId: shopifyOrderId || null,
          amounts: {
            subtotal: intent.subtotalAmount,
            shipping: intent.shippingAmount,
            tax: intent.taxAmount,
            total: intent.totalAmount,
            currency: intent.currency,
          },
          payment: {
            verified: true,
            txHash: txHash || "unknown",
          },
          delivery: {
            estimatedTime: "expected in 7 days",
          },
        });
      } catch (shopifyErr: any) {
        console.error(`[${requestId}] Shopify integration error:`, shopifyErr?.message || String(shopifyErr));
        return res.status(502).json({
          error: "Shopify integration error",
          details: shopifyErr?.message || String(shopifyErr),
        });
      }
    } catch (verificationErr: any) {
      console.error(`[${requestId}] Payment verification error:`, verificationErr?.message);
      return res.status(402).json({
        orderIntentId,
        amounts: {
          subtotal: intent.subtotalAmount,
          shipping: intent.shippingAmount,
          tax: intent.taxAmount,
          total: intent.totalAmount,
          currency: intent.currency,
        },
        paymentRequirements: intent.x402Requirements || [],
        error: "Payment verification failed",
        details: verificationErr.message,
      });
    }
  } catch (e: any) {
    console.error(`[${requestId}] Unexpected checkout error:`, e?.message);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
