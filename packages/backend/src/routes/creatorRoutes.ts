import { Router, type Router as ExpressRouter } from "express";
import { listCreators, getCreator } from "../controllers/creatorsController.js";

const router: ExpressRouter = Router();

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
