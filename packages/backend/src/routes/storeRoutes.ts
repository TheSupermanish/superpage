import { Router, type Router as ExpressRouter } from "express";
import { listStores, listAllStoreProducts, listMyStores, deleteStore } from "../controllers/storesController.js";
import { authMiddleware } from "../api/wallet-auth.js";
import { handleCreateStore } from "../api/create-store.js";
import { handleUpsertStoreProducts } from "../api/upsert-store-products.js";
import { handleDeleteStoreProduct } from "../api/delete-store-product.js";
import { handleLinkStore } from "../api/link-store.js";
import { handleListStoreProducts } from "../api/x402-store-products.js";
import { handleGetOrderIntents } from "../api/x402-order-intents.js";
import { handleFileUpload, handleAvatarUpload, upload, avatarUpload } from "../api/file-upload.js";

const router: ExpressRouter = Router();

// ============================================================
// FILE UPLOAD (Protected)
// ============================================================

/**
 * @route   POST /api/upload
 * @desc    Upload a file
 * @access  Protected
 */
router.post("/api/upload", authMiddleware, upload.single("file"), handleFileUpload);

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload an avatar image
 * @access  Protected
 */
router.post("/api/upload/avatar", authMiddleware, avatarUpload.single("file"), handleAvatarUpload);

// ============================================================
// STORE MANAGEMENT (Protected)
// ============================================================

/**
 * @route   POST /api/stores
 * @desc    Create a new store
 * @access  Public
 */
router.post("/api/stores", handleCreateStore);

/**
 * @route   GET /api/stores
 * @desc    List authenticated user's stores
 * @access  Protected
 */
router.get("/api/stores", authMiddleware, listMyStores);

/**
 * @route   POST /api/stores/:storeId/products
 * @desc    Upsert products for a store
 * @access  Public
 */
router.post("/api/stores/:storeId/products", handleUpsertStoreProducts);

/**
 * @route   POST /api/stores/:storeId/link
 * @desc    Link a store to authenticated user
 * @access  Protected
 */
router.post("/api/stores/:storeId/link", authMiddleware, handleLinkStore);

/**
 * @route   DELETE /api/stores/:storeId
 * @desc    Delete a store
 * @access  Protected
 */
router.delete("/api/stores/:storeId", authMiddleware, deleteStore);

/**
 * @route   DELETE /api/store-products/:productId
 * @desc    Delete a store product
 * @access  Public
 */
router.delete("/api/store-products/:productId", handleDeleteStoreProduct);

// ============================================================
// STORE API (Public) - x402 routes
// ============================================================

/**
 * @route   GET /x402/stores
 * @desc    List all stores
 * @access  Public
 */
router.get("/x402/stores", listStores);

/**
 * @route   GET /x402/store-products
 * @desc    List all store products
 * @access  Public
 */
router.get("/x402/store-products", listAllStoreProducts);

/**
 * @route   GET /x402/stores/:storeId/products
 * @desc    List products for a store
 * @access  Public
 */
router.get("/x402/stores/:storeId/products", handleListStoreProducts);

/**
 * @route   GET /x402/stores/:storeId/order-intents
 * @desc    Get order intents for a store
 * @access  Public
 */
router.get("/x402/stores/:storeId/order-intents", handleGetOrderIntents);

export default router;
