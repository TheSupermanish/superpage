import { Router, type Router as ExpressRouter } from "express";
import { getExploreData } from "../controllers/exploreController.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /api/explore
 * @desc    Get all data for explore page (resources, creators, stores, products)
 * @access  Public
 */
router.get("/", getExploreData);

export default router;
