import { Router, type Router as ExpressRouter } from "express";
import { handleGetPublicProfile, handleGetStorefront } from "../api/public-profile.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /@:username
 * @desc    Get public profile for a creator
 * @access  Public
 */
router.get("/@:username", handleGetPublicProfile);

/**
 * @route   GET /@:username/store/:storeSlug
 * @desc    Get storefront for a creator
 * @access  Public
 */
router.get("/@:username/store/:storeSlug", handleGetStorefront);

export default router;
