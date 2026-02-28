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

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${requestId}] 🔵 Checkout Request Received`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  console.log(`${'='.repeat(80)}`);

  const x402Server = await initializeX402Server();
  try {
    const body = req.body as CheckoutRequest;
    const { storeId, items, shippingAddress, email, orderIntentId } =
      body || {};
    const xPaymentHeader = req.header("X-PAYMENT");

    console.log(`[${requestId}] Request Body:`, JSON.stringify(body, null, 2));
    console.log(`[${requestId}] X-PAYMENT Header Present:`, !!xPaymentHeader);

    // Validate required fields
    if (
      !storeId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !shippingAddress ||
      !email
    ) {
      console.error(`[${requestId}] ❌ Missing required fields`);
      console.error(`[${requestId}] storeId:`, storeId);
      console.error(`[${requestId}] items:`, items);
      console.error(`[${requestId}] shippingAddress:`, shippingAddress);
      console.error(`[${requestId}] email:`, email);
      return res.status(400).json({
        error:
          "Missing required fields: storeId, items[], shippingAddress, email",
      });
    }

    console.log(`[${requestId}] ✓ Basic validation passed`);

    // Normalize: accept productId, variantId, or id
    for (const it of items) {
      if (!it.productId && (it.variantId || it.id)) {
        it.productId = it.variantId || it.id;
      }
      if (!it.productId) {
        console.error(`[${requestId}] ❌ Missing productId in item:`, it);
        return res.status(400).json({
          error:
            "Each item must include a productId (variant ID). Use browse-products to find product IDs first.",
        });
      }
    }

    // MongoDB - using models directly

    // Load store for currency and basic validation
    console.log(`[${requestId}] 🏪 Loading store: ${storeId}`);
    let store;
    try {
      store = await Store.findOne({ id: storeId }).lean();
      if (!store) {
        console.error(`[${requestId}] ❌ Store not found: ${storeId}`);
        return res.status(404).json({ error: "Unknown storeId" });
      }
    } catch (storeErr: any) {
      console.error(`[${requestId}] ❌ Failed to load store:`, storeErr.message);
      console.error(`[${requestId}] Error details:`, storeErr);
      return res.status(500).json({
        error: "Failed to load store",
        details: storeErr.message,
      });
    }
    console.log(`[${requestId}] ✓ Store loaded:`, {
      id: store.id,
      currency: store.currency,
      url: store.url,
      networks: store.networks,
      asset: store.asset,
    });

    // ============================================================
    // PHASE 1: No X-PAYMENT header → Create intent & return 402
    // ============================================================
    if (!xPaymentHeader) {
      console.log(`[${requestId}] 📋 PHASE 1: Creating order intent (no X-PAYMENT header)`);
      console.log(`[${requestId}] orderIntentId provided:`, orderIntentId);
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
      console.log(`[${requestId}] 📦 Fetching products. Variant IDs:`, variantIds);

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

      console.log(`[${requestId}] ✓ Found ${rows?.length || 0} products`);
      if (rows) {
        rows.forEach((r) => {
          console.log(`[${requestId}]   - ${r.variantId}: $${r.price} ${r.currency}`);
        });
      }

      const priceMap = new Map<string, { price: number; currency: string }>();
      for (const r of rows || []) {
        const pNum = typeof r.price === "string" ? parseFloat(r.price) : Number(r.price);
        priceMap.set(r.variantId, {
          price: pNum,
          currency: r.currency || store.currency || "USD",
        });
      }

      // Validate all items present
      console.log(`[${requestId}] ✓ Validating ${items.length} items in cart`);
      for (const it of items) {
        if (!priceMap.has(it.productId)) {
          console.error(`[${requestId}] ❌ Product not found: ${it.productId}`);
          return res.status(400).json({
            error: `Product not found for store: ${it.productId}`,
          });
        }
        if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) {
          console.error(`[${requestId}] ❌ Invalid quantity for ${it.productId}: ${it.quantity}`);
          return res.status(400).json({
            error: `Invalid quantity for ${it.productId}`,
          });
        }
        console.log(`[${requestId}]   ✓ ${it.productId} x${it.quantity}`);
      }

      // Compute totals
      console.log(`[${requestId}] 💵 Computing totals`);
      let subtotalNum = 0;
      for (const it of items) {
        const { price } = priceMap.get(it.productId)!;
        const itemTotal = price * Number(it.quantity);
        subtotalNum += itemTotal;
        console.log(`[${requestId}]   - ${it.productId}: $${price} x${it.quantity} = $${itemTotal}`);
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

      console.log(`[${requestId}] ✓ Amounts calculated:`, amounts);

      // Create orderIntent with 15-minute expiry
      const id = `oi_${crypto.randomUUID().slice(0, 8)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      console.log(`[${requestId}] 🔑 Creating order intent: ${id}`);
      console.log(`[${requestId}]   Expires at: ${expiresAt.toISOString()}`);

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
      console.log(`[${requestId}] ✓ Payment requirements created:`, {
        scheme: paymentRequirements[0].scheme,
        network: paymentRequirements[0].network,
        token: (paymentRequirements[0] as any).token || (paymentRequirements[0] as any).asset,
        amount: paymentRequirements[0].amount,
      });

      // Create body hash for request validation
      // Normalize the body by sorting properties to ensure consistent hashing
      const normalizedBody = deepSortObject(body);
      const bodyHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(normalizedBody))
        .digest("hex");
      console.log(`[${requestId}] 🔐 Body hash computed: ${bodyHash}`);

      console.log(`[${requestId}] 📝 Inserting into order_intents table...`);
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

      console.log(`[${requestId}] ✅ Order intent created successfully: ${id}`);
      console.log(`[${requestId}] 🔄 Returning 402 Payment Required with payment requirements`);
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️  Phase 1 completed in ${duration}ms\n`);

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
    console.log(`[${requestId}] 💳 PHASE 2: Processing payment and finalizing order`);
    console.log(`[${requestId}] X-PAYMENT header provided (length: ${xPaymentHeader?.length || 0} chars)`);

    if (!orderIntentId) {
      console.error(`[${requestId}] ❌ Missing orderIntentId with X-PAYMENT header`);
      return res.status(400).json({
        error: "Missing orderIntentId when X-PAYMENT header is present",
      });
    }

    console.log(`[${requestId}] 🔍 Loading order intent: ${orderIntentId}`);

    // Load order intent
    let intent;
    try {
      intent = await OrderIntent.findOne({ id: orderIntentId }).lean();
      if (!intent) {
        console.error(`[${requestId}] ❌ Order intent not found: ${orderIntentId}`);
        return res.status(404).json({ error: "Unknown orderIntentId" });
      }
    } catch (intentErr: any) {
      console.error(`[${requestId}] ❌ Failed to load order intent:`, intentErr.message);
      console.error(`[${requestId}] Error details:`, intentErr);
      return res.status(500).json({
        error: "Failed to load order intent",
        details: intentErr.message,
      });
    }

    console.log(`[${requestId}] ✓ Order intent loaded:`, {
      id: intent.id,
      status: intent.status,
      total: intent.totalAmount,
      currency: intent.currency,
      expiresAt: intent.expiresAt,
    });

    // Check if expired
    console.log(`[${requestId}] ⏰ Checking expiry: ${intent.expiresAt}`);
    const expiresAtStr2 = intent.expiresAt instanceof Date ? intent.expiresAt.toISOString() : (intent.expiresAt as any)?.toString() || null;
    if (isOrderIntentExpired(expiresAtStr2)) {
      console.error(`[${requestId}] ❌ Order intent expired`);
      return res.status(400).json({ error: "Order intent expired" });
    }
    console.log(`[${requestId}] ✓ Order intent not expired`);

    // Check if already paid
    console.log(`[${requestId}] 🔐 Checking status: ${intent.status}`);
    if (intent.status === "paid") {
      console.error(`[${requestId}] ❌ Order intent already processed (status: paid)`);
      return res.status(400).json({
        error: "Order intent already processed",
      });
    }
    console.log(`[${requestId}] ✓ Order intent status is valid (pending, not paid)`);

    // Validate that items match intent (prevent cart tampering)
    console.log(`[${requestId}] 🔎 Validating items against intent...`);

    // Simple items validation - check that product IDs and quantities match
    const intentItems = (intent.items || []) as Array<{ productId: string; quantity: number }>;
    const bodyItems = items || [];

    if (intentItems.length !== bodyItems.length) {
      console.error(`[${requestId}] ❌ Item count mismatch. Expected ${intentItems.length}, got ${bodyItems.length}`);
      return res.status(400).json({
        error: "Item count does not match original order intent",
      });
    }

    // Check each item matches
    for (let i = 0; i < intentItems.length; i++) {
      if (intentItems[i].productId !== bodyItems[i].productId ||
          intentItems[i].quantity !== bodyItems[i].quantity) {
        console.error(`[${requestId}] ❌ Item mismatch at index ${i}`);
        console.error(`[${requestId}] Expected:`, intentItems[i]);
        console.error(`[${requestId}] Got:`, bodyItems[i]);
        return res.status(400).json({
          error: "Items do not match original order intent",
        });
      }
    }

    console.log(`[${requestId}] ✓ Items match intent - cart not tampered`);

    // ============================================================
    // Verify payment directly using x402 SDK
    // ============================================================
    console.log(`[${requestId}] 🔐 Initiating x402 payment verification...`);

    try {
      // Parse payment proof from header
      console.log(`[${requestId}] 📦 Parsing payment proof...`);
      const paymentData = parsePaymentHeader(xPaymentHeader);
      console.log(`[${requestId}]   - Signature: ${paymentData.signature?.substring(0, 20)}...`);
      console.log(`[${requestId}]   - Network: ${paymentData.network}`);
      console.log(`[${requestId}]   - Timestamp: ${paymentData.timestamp}`);

      // Create payment requirements for verification
      // Use the store's configured network and asset
      const storeNetwork = store.networks?.[0] || "devnet";
      const storeAsset = store.asset || "USDC";
      
      console.log(`[${requestId}] 🔧 Creating payment requirements for verification...`);
      console.log(`[${requestId}]   - Amount to verify: ${intent.totalAmount}`);
      console.log(`[${requestId}]   - Token: ${storeAsset}`);
      console.log(`[${requestId}]   - Network: ${storeNetwork}`);
      
      const paymentRequirements = x402Server.createPaymentRequirements({
        amount: String(intent.totalAmount),
        token: storeAsset,
        requestId: orderIntentId,
      });
      
      console.log(`[${requestId}]   - Expected amount (base units): ${paymentRequirements.amount}`);
      console.log(`[${requestId}]   - Expected recipient: ${paymentRequirements.recipient}`);

      // Verify payment on-chain
      console.log(`[${requestId}] ⛓️  Verifying payment on blockchain (${storeNetwork})...`);
      const verified = await x402Server.verifyPayment(paymentData, paymentRequirements);
      
      if (!verified) {
        console.error(`[${requestId}] ❌ Payment verification failed`);
        console.error(`[${requestId}]   Payment did not match requirements or transaction not found`);
        throw new Error("Payment verification failed");
      }

      // Payment verified successfully
      console.log(`[${requestId}] ✅ Payment verified on-chain successfully!`);
      console.log(`[${requestId}]   - Transaction confirmed on blockchain`);
      console.log(`[${requestId}]   - Amount matches order total`);
      console.log(`[${requestId}]   - Recipient matches merchant wallet`);

      // Extract transaction hash from payment proof
      console.log(`[${requestId}] 📋 Extracting payment verification details...`);
      const txHash = paymentData.transactionHash || paymentData.txHash || paymentData.signature || extractTxHashFromVerification(paymentData);
      console.log(`[${requestId}] ✓ Transaction hash extracted: ${txHash || "unknown"}`);

      // Create Shopify order
      console.log(`[${requestId}] 🛍️  Creating Shopify order...`);
      try {
        const nameParts = (shippingAddress.name || "").trim().split(/\s+/);
        const firstName = nameParts.shift() || "";
        const lastName = nameParts.join(" ");

        console.log(`[${requestId}]   - Name: ${firstName} ${lastName}`);

        const shopUrl = (store.url as string).replace(/\/$/, "");
        const apiVersion = "2025-10";
        const endpoint = `${shopUrl}/admin/api/${apiVersion}/orders.json`;

        console.log(`[${requestId}]   - Shopify endpoint: ${endpoint}`);

        const lineItems = items.map((it) => {
          const match = String(it.productId).match(/(\d+)$/);
          const variantIdNum = match ? Number(match[1]) : undefined;
          const li: any = { quantity: Number(it.quantity) };
          if (variantIdNum) li.variant_id = variantIdNum;
          return li;
        });

        console.log(`[${requestId}]   - Line items (${lineItems.length}):`, JSON.stringify(lineItems, null, 2));

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

        console.log(`[${requestId}] 📤 Sending order to Shopify...`);
        const shopifyRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": String(store.adminAccessToken),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        console.log(`[${requestId}] 📥 Shopify response status: ${shopifyRes.status} ${shopifyRes.statusText}`);

        const shopifyText = await shopifyRes.text();
        if (!shopifyRes.ok) {
          console.error(`[${requestId}] ❌ Shopify order creation failed`);
          console.error(`[${requestId}] Status: ${shopifyRes.status}`);
          console.error(`[${requestId}] Response body: ${shopifyText}`);
          return res.status(502).json({
            error: "Failed to create Shopify order",
            status: shopifyRes.status,
            details: shopifyText,
          });
        }

        console.log(`[${requestId}] ✓ Shopify returned 200 OK`);

        let shopifyJson: any;
        try {
          shopifyJson = JSON.parse(shopifyText);
          console.log(`[${requestId}] ✓ Shopify response parsed as JSON`);
        } catch {
          console.warn(`[${requestId}] ⚠️  Unexpected non-JSON response from Shopify:`, shopifyText);
          shopifyJson = { order: null };
        }

        const shopifyOrderId: string | null =
          shopifyJson?.order?.admin_graphql_api_id ||
          String(shopifyJson?.order?.id || "");

        console.log(`[${requestId}] ✓ Shopify order created with ID: ${shopifyOrderId}`);

        // Mark intent as paid with verification details
        console.log(`[${requestId}] 💾 Updating order intent status to 'paid'...`);
        console.log(`[${requestId}]   - Verified at: ${new Date().toISOString()}`);
        console.log(`[${requestId}]   - TX hash: ${txHash || "unknown"}`);

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
          console.error(`[${requestId}] ❌ Failed to mark order intent as paid:`, updErr.message);
          console.error(`[${requestId}] Error details:`, updErr);
          return res.status(500).json({
            error: "Failed to mark order intent paid",
            details: updErr.message,
          });
        }

        console.log(`[${requestId}] ✅ Order intent marked as paid: ${orderIntentId}`);

        // Create local order row with Shopify linkage
        const orderId = `ord_${crypto.randomUUID().slice(0, 8)}`;
        console.log(`[${requestId}] 📦 Creating local order record: ${orderId}`);
        console.log(`[${requestId}]   - Order Intent ID: ${orderIntentId}`);
        console.log(`[${requestId}]   - Shopify Order ID: ${shopifyOrderId}`);
        console.log(`[${requestId}]   - Amount: ${intent.totalAmount} ${intent.currency}`);

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
          console.error(`[${requestId}] ❌ Failed to create local order:`, ordErr.message);
          console.error(`[${requestId}] Error details:`, ordErr);
          return res.status(500).json({
            error: "Failed to create local order",
            details: ordErr.message,
          });
        }

        console.log(`[${requestId}] ✅ Local order created: ${orderId}`);

        // Success - return 200 with order confirmation
        console.log(`[${requestId}] 🎉 PHASE 2 Complete - Order finalized successfully`);
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ⏱️  Phase 2 completed in ${duration}ms`);
        console.log(`[${requestId}] 📊 Final order summary:`);
        console.log(`[${requestId}]   - Local Order ID: ${orderId}`);
        console.log(`[${requestId}]   - Shopify Order ID: ${shopifyOrderId}`);
        console.log(`[${requestId}]   - Total: ${intent.totalAmount} ${intent.currency}`);
        console.log(`[${requestId}]   - Status: confirmed`);
        console.log(`[${requestId}] ${'='.repeat(80)}\n`);

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
        console.error(`[${requestId}] ❌ Shopify integration error`);
        console.error(`[${requestId}] Error message:`, shopifyErr?.message || String(shopifyErr));
        console.error(`[${requestId}] Stack trace:`, shopifyErr?.stack);
        console.log(`[${requestId}] ${'='.repeat(80)}\n`);
        return res.status(502).json({
          error: "Shopify integration error",
          details: shopifyErr?.message || String(shopifyErr),
        });
      }
    } catch (verificationErr: any) {
      console.error(`[${requestId}] ❌ Payment verification error occurred`);
      console.error(`[${requestId}] Error type:`, verificationErr?.constructor?.name);
      console.error(`[${requestId}] Error message:`, verificationErr?.message);
      console.error(`[${requestId}] Stack trace:`, verificationErr?.stack);

      // Payment verification failed - return 402 again with same requirements
      console.error(`[${requestId}] 💳 Payment verification failed - returning 402`);
      console.log(`[${requestId}] ${'='.repeat(80)}\n`);
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
    console.error(`[${requestId}] ❌ Unexpected checkout error`);
    console.error(`[${requestId}] Error type:`, e?.constructor?.name);
    console.error(`[${requestId}] Error message:`, e?.message);
    console.error(`[${requestId}] Stack trace:`, e?.stack);
    console.log(`[${requestId}] ${'='.repeat(80)}\n`);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
