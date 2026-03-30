import { Router, type Router as ExpressRouter } from "express";
import { optionalAuthMiddleware } from "../api/wallet-auth.js";
import { handleShopifyAuth, handleShopifyCallback, handleGetInstallUrl } from "../api/shopify-oauth.js";
import { handleShopifyProducts } from "../api/shopify-products.js";
import { handleProductUpdate, handleProductDelete } from "../api/shopify-webhooks.js";

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
