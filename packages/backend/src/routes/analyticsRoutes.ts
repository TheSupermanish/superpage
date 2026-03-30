import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware } from "../api/wallet-auth.js";
import {
  handleGetOverview,
  handleGetEarnings,
  handleGetAccessLogs,
  handleGetChartData,
} from "../api/analytics.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview
 * @access  Protected
 */
router.get("/overview", authMiddleware, handleGetOverview);

/**
 * @route   GET /api/analytics/earnings
 * @desc    Get earnings data
 * @access  Protected
 */
router.get("/earnings", authMiddleware, handleGetEarnings);

/**
 * @route   GET /api/analytics/access
 * @desc    Get access logs
 * @access  Protected
 */
router.get("/access", authMiddleware, handleGetAccessLogs);

/**
 * @route   GET /api/analytics/chart
 * @desc    Get chart data
 * @access  Protected
 */
router.get("/chart", authMiddleware, handleGetChartData);

export default router;
