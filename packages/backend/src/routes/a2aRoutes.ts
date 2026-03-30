import { Router, type Router as ExpressRouter } from "express";
import { handleA2ARequest, handleAgentCard } from "../a2a/index.js";
import { handleRegistrationFile } from "../erc8004/registration-file.js";

const router: ExpressRouter = Router();

/**
 * @route   GET /.well-known/agent.json
 * @desc    A2A agent card discovery
 * @access  Public
 */
router.get("/.well-known/agent.json", handleAgentCard);

/**
 * @route   GET /.well-known/agent-registration.json
 * @desc    ERC-8004 agent registration file
 * @access  Public
 */
router.get("/.well-known/agent-registration.json", handleRegistrationFile);

/**
 * @route   POST /a2a
 * @desc    A2A protocol request handler
 * @access  Public
 */
router.post("/a2a", handleA2ARequest);

export default router;
