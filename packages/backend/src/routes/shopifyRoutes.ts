import { Router, type Router as ExpressRouter } from "express";
import { optionalAuthMiddleware } from "../api/wallet-auth.js";
import { handleShopifyAuth, handleShopifyCallback, handleGetInstallUrl, importShopifyProducts } from "../api/shopify-oauth.js";
import { handleShopifyProducts } from "../api/shopify-products.js";
import { handleProductUpdate, handleProductDelete } from "../api/shopify-webhooks.js";
import { Store } from "../models/index.js";

const router: ExpressRouter = Router();

// ============================================================
// SHOPIFY OAUTH (for app installation)
// ============================================================

/**
 * @route   GET /api/shopify/auth
 * @desc    Start Shopify OAuth flow
 * @access  Public (optional auth)
 */
router.get("/auth", optionalAuthMiddleware, handleShopifyAuth);

/**
 * @route   GET /api/shopify/callback
 * @desc    Shopify OAuth callback
 * @access  Public
 */
router.get("/callback", handleShopifyCallback);

/**
 * @route   GET /api/shopify/install-url
 * @desc    Get Shopify install URL
 * @access  Public (optional auth)
 */
router.get("/install-url", optionalAuthMiddleware, handleGetInstallUrl);

/**
 * @route   POST /api/shopify/install-url
 * @desc    Get Shopify install URL (POST variant)
 * @access  Public (optional auth)
 */
router.post("/install-url", optionalAuthMiddleware, handleGetInstallUrl);

/**
 * @route   POST /api/shopify/products
 * @desc    Fetch products from Shopify store
 * @access  Public
 */
router.post("/products", handleShopifyProducts);

/**
 * @route   POST /api/shopify/sync
 * @desc    Re-sync products from Shopify (re-imports all products for a store)
 * @access  Public
 */
router.post("/sync", async (req, res) => {
  const { storeId } = req.body as { storeId?: string };
  if (!storeId) {
    return res.status(400).json({ error: "Missing storeId" });
  }
  const store = await Store.findOne({ id: storeId });
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }
  if (!store.adminAccessToken) {
    return res.status(400).json({ error: "Store has no access token — reconnect via OAuth" });
  }
  try {
    await importShopifyProducts(store.id, store.url, store.adminAccessToken);
    return res.status(200).json({ success: true, message: `Products synced for ${store.id}` });
  } catch (err: any) {
    return res.status(500).json({ error: "Sync failed", details: err.message });
  }
});

// ============================================================
// SHOPIFY WEBHOOKS (mounted separately at /api/webhooks/shopify)
// ============================================================

export const webhookRouter: ExpressRouter = Router();

/**
 * @route   POST /api/webhooks/shopify/products/update
 * @desc    Handle Shopify product update webhook
 * @access  Shopify webhook
 */
webhookRouter.post("/products/update", handleProductUpdate);

/**
 * @route   POST /api/webhooks/shopify/products/delete
 * @desc    Handle Shopify product delete webhook
 * @access  Shopify webhook
 */
webhookRouter.post("/products/delete", handleProductDelete);

export default router;
