import { Request, Response } from "express";
import crypto from "crypto";
import { Store, StoreProduct } from "../models/index.js";

/**
 * Verify Shopify webhook HMAC signature
 */
function verifyShopifyWebhook(req: Request, secret: string): boolean {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  if (!hmacHeader || typeof hmacHeader !== "string") {
    return false;
  }

  const body = (req as any).rawBody || JSON.stringify(req.body);
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  return hash === hmacHeader;
}

/**
 * Handle product update webhook from Shopify
 * Webhook: products/update
 */
export async function handleProductUpdate(req: Request, res: Response) {
  try {
    const secret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!secret) {
      console.error("❌ SHOPIFY_CLIENT_SECRET not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Verify webhook signature
    if (!verifyShopifyWebhook(req, secret)) {
      console.error("❌ Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const product = req.body;
    const shopDomain = req.headers["x-shopify-shop-domain"] as string;

    console.log(`📦 Product updated webhook from ${shopDomain}: ${product.title}`);

    // Find the store
    const store = await Store.findOne({ shopDomain });
    if (!store) {
      console.log(`⚠️ Store not found: ${shopDomain}`);
      return res.status(404).json({ error: "Store not found", shopDomain });
    }

    // Update all variants of this product (upsert: true to catch newly added variants)
    const updatePromises = product.variants?.map(async (variant: any) => {
      const variantId = `gid://shopify/ProductVariant/${variant.id}`;

      await StoreProduct.findOneAndUpdate(
        { storeId: store.id, variantId },
        {
          storeId: store.id,
          variantId,
          name: `${product.title}${variant.title !== "Default Title" ? ` - ${variant.title}` : ""}`,
          description: product.body_html || null,
          image: variant.image_id ? product.images?.find((img: any) => img.id === variant.image_id)?.src : product.image?.src || null,
          price: variant.price,
          currency: "USD",
          inventory: variant.inventory_quantity ?? null,
          metadata: {
            productId: `gid://shopify/Product/${product.id}`,
            handle: product.handle || null,
            variantTitle: variant.title,
            sku: variant.sku,
          },
        },
        { upsert: true } // Create new variants if they don't exist yet
      );
    }) || [];

    await Promise.all(updatePromises);
    console.log(`✅ Updated ${updatePromises.length} variants for ${product.title}`);

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle product deletion webhook from Shopify
 * Webhook: products/delete
 */
export async function handleProductDelete(req: Request, res: Response) {
  try {
    const secret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!verifyShopifyWebhook(req, secret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const product = req.body;
    const shopDomain = req.headers["x-shopify-shop-domain"] as string;

    console.log(`🗑️ Product deleted webhook from ${shopDomain}: ${product.id}`);

    // Find the store
    const store = await Store.findOne({ shopDomain });
    if (!store) {
      return res.status(200).json({ ok: true, message: "Store not found" });
    }

    // Delete all variants of this product from our database
    const productId = `gid://shopify/Product/${product.id}`;
    const result = await StoreProduct.deleteMany({
      storeId: store.id,
      "metadata.productId": productId,
    });

    console.log(`✅ Deleted ${result.deletedCount} variants`);

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
}
