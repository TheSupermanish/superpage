import { Router, type Router as ExpressRouter } from "express";
import { listStores, listAllStoreProducts } from "../controllers/storesController.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /x402/stores
 * @desc    List all stores
 * @access  Public
 */
router.get("/stores", listStores);

/**
 * @route   GET /x402/store-products
 * @desc    List all store products
 * @access  Public
 */
router.get("/store-products", listAllStoreProducts);

export default router;
