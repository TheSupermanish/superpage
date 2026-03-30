import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware } from "../api/wallet-auth.js";
import { handleCheckout } from "../api/x402-checkout.js";
import { handleGetOrders, handleGetMyOrders, handleGetStoreOrdersProtected } from "../api/x402-orders.js";
import { handleGetOrderDetails } from "../api/x402-order-details.js";

const router: ExpressRouter = Router();

/**
 * @route   POST /x402/checkout
 * @desc    Process checkout
 * @access  Public
 */
router.post("/x402/checkout", handleCheckout);

/**
 * @route   GET /api/orders
 * @desc    Get authenticated user's orders
 * @access  Protected
 */
router.get("/api/orders", authMiddleware, handleGetMyOrders);

/**
 * @route   GET /x402/orders/:orderId
 * @desc    Get order details by ID
 * @access  Public
 */
router.get("/x402/orders/:orderId", handleGetOrderDetails);

/**
 * @route   GET /x402/stores/:storeId/orders
 * @desc    Get orders for a store (public)
 * @access  Public
 */
router.get("/x402/stores/:storeId/orders", handleGetOrders);

/**
 * @route   GET /api/stores/:storeId/orders
 * @desc    Get orders for a store (protected, for dashboard)
 * @access  Protected
 */
router.get("/api/stores/:storeId/orders", authMiddleware, handleGetStoreOrdersProtected);

export default router;
