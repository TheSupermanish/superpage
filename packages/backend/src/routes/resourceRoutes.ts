import { Router, type Router as ExpressRouter } from "express";
import { listPublicResources } from "../controllers/resourcesController.js";
import { authMiddleware } from "../api/wallet-auth.js";
import {
  handleListResources,
  handleGetResource,
  handleCreateResource,
  handleUpdateResource,
  handleDeleteResource,
} from "../api/resources.js";

const router: ExpressRouter = Router();

// ============================================================
// PUBLIC RESOURCE ROUTES
// ============================================================

/**
 * @route   GET /api/resources/public
 * @desc    List public resources for discovery
 * @access  Public
 */
router.get("/public", listPublicResources);

// ============================================================
// PROTECTED RESOURCE MANAGEMENT
// ============================================================

/**
 * @route   GET /api/resources
 * @desc    List resources for authenticated user
 * @access  Protected
 */
router.get("/", authMiddleware, handleListResources);

/**
 * @route   POST /api/resources
 * @desc    Create a new resource
 * @access  Protected
 */
router.post("/", authMiddleware, handleCreateResource);

/**
 * @route   GET /api/resources/:id
 * @desc    Get a specific resource
 * @access  Protected
 */
router.get("/:id", authMiddleware, handleGetResource);

/**
 * @route   PUT /api/resources/:id
 * @desc    Update a resource
 * @access  Protected
 */
router.put("/:id", authMiddleware, handleUpdateResource);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete a resource
 * @access  Protected
 */
router.delete("/:id", authMiddleware, handleDeleteResource);

export default router;
