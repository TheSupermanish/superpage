import { Router, type Router as ExpressRouter } from "express";
import { listPublicResources } from "../controllers/resourcesController.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /api/resources/public
 * @desc    List public resources for discovery
 * @access  Public
 */
router.get("/public", listPublicResources);

export default router;
