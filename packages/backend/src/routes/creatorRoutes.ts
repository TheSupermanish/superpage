import { Router, type Router as ExpressRouter } from "express";
import { listCreators, getCreator } from "../controllers/creatorsController.js";
import {
  handleGetCreatorResources,
  handleGetCreatorStats,
  handleSearchCreators,
  handleUpdateUsername,
} from "../api/creators.js";
import { handleCheckUsernameExists, handleCheckUsernameAvailability } from "../api/check-username.js";
import { authMiddleware } from "../api/wallet-auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /api/creators/search
 * @desc    Search creators
 * @access  Public
 */
router.get("/search", handleSearchCreators);

/**
 * @route   GET /api/creators/check-username/:username
 * @desc    Check if a username is available (for authenticated user)
 * @access  Protected (rate limited)
 */
router.get("/check-username/:username", authLimiter, authMiddleware, handleCheckUsernameAvailability);

/**
 * @route   PUT /api/creators/me/username
 * @desc    Update authenticated user's username
 * @access  Protected
 */
router.put("/me/username", authMiddleware, handleUpdateUsername);

/**
 * @route   GET /api/creators/:username/exists
 * @desc    Check if a username exists
 * @access  Public
 */
router.get("/:username/exists", handleCheckUsernameExists);

/**
 * @route   GET /api/creators/:username/resources
 * @desc    Get resources for a creator
 * @access  Public
 */
router.get("/:username/resources", handleGetCreatorResources);

/**
 * @route   GET /api/creators/:username/stats
 * @desc    Get stats for a creator
 * @access  Public
 */
router.get("/:username/stats", handleGetCreatorStats);

/**
 * @route   GET /api/creators
 * @desc    List all public creators
 * @access  Public
 */
router.get("/", listCreators);

/**
 * @route   GET /api/creators/:username
 * @desc    Get creator by username
 * @access  Public
 */
router.get("/:username", getCreator);

export default router;
