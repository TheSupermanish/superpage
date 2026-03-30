import { Router, type Router as ExpressRouter } from "express";
import {
  handleGetNonce,
  handleVerifySignature,
  handleGetMe,
  handleUpdateMe,
  authMiddleware,
} from "../api/wallet-auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router: ExpressRouter = Router();

/**
 * @route   POST /api/auth/nonce
 * @desc    Request a nonce for wallet authentication
 * @access  Public (rate limited)
 */
router.post("/nonce", authLimiter, handleGetNonce);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify wallet signature and return JWT
 * @access  Public (rate limited)
 */
router.post("/verify", authLimiter, handleVerifySignature);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get("/me", authMiddleware, handleGetMe);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current authenticated user
 * @access  Protected
 */
router.put("/me", authMiddleware, handleUpdateMe);

export default router;
