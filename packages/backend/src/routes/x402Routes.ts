import { Router, type Router as ExpressRouter, Request, Response, NextFunction } from "express";
import { handleResourceAccess } from "../api/x402-gateway.js";
import { handleEthStoreProductAccess, handleEthTest, handleEthCheckout } from "../api/x402-eth-gateway.js";

const router: ExpressRouter = Router();

// ============================================================
// x402 RESOURCE DISCOVERY (backward compatibility)
// ============================================================

/**
 * @route   GET /x402/resources
 * @desc    List x402 resources (backward compatibility)
 * @access  Public
 */
router.get("/resources", async (req: Request, res: Response, next: NextFunction) => {
  const { listX402Resources } = await import("../controllers/resourcesController.js");
  return listX402Resources(req, res, next);
});

// ============================================================
// x402 UNIVERSAL GATEWAY (Public - payment protected)
// ============================================================

/**
 * @route   GET /x402/resource/:resourceId
 * @desc    Access a payment-gated resource (GET)
 * @access  Public (payment protected)
 */
router.get("/resource/:resourceId", handleResourceAccess);

/**
 * @route   POST /x402/resource/:resourceId
 * @desc    Access a payment-gated resource (POST)
 * @access  Public (payment protected)
 */
router.post("/resource/:resourceId", handleResourceAccess);

// ============================================================
// x402 ETHEREUM GATEWAY (EVM payments)
// ============================================================

/**
 * @route   GET /x402/eth/test
 * @desc    Test Ethereum gateway
 * @access  Public
 */
router.get("/eth/test", handleEthTest);

/**
 * @route   GET /x402/eth/store/:storeId/product/:productId
 * @desc    Access store product via Ethereum payment
 * @access  Public (payment protected)
 */
router.get("/eth/store/:storeId/product/:productId", handleEthStoreProductAccess);

/**
 * @route   POST /x402/eth/store/:storeId/checkout
 * @desc    Checkout via Ethereum payment
 * @access  Public
 */
router.post("/eth/store/:storeId/checkout", handleEthCheckout);

export default router;
