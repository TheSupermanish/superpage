import { Router, type Router as ExpressRouter } from "express";
import { handleMCPRequest } from "../api/mcp-handler.js";
import { handleMCPPaymentRequest } from "../api/mcp-payment-handler.js";
import { initializeMCPTools, createMCPServers } from "../mcp/index.js";

const router: ExpressRouter = Router();

// Initialize all MCP tools at module load
initializeMCPTools();
const mcpHandlers = createMCPServers();

// ============================================================
// MODULAR MCP ENDPOINTS
// ============================================================

/**
 * @route   POST /mcp/shopping
 * @desc    Shopping tools only
 * @access  Public
 */
router.post("/shopping", mcpHandlers.shopping);

/**
 * @route   POST /mcp/payment
 * @desc    Payment tools only
 * @access  Public
 */
router.post("/payment", mcpHandlers.payment);

/**
 * @route   POST /mcp/resources
 * @desc    Resource access tools only
 * @access  Public
 */
router.post("/resources", mcpHandlers.resources);

/**
 * @route   POST /mcp/a2a
 * @desc    A2A protocol tools
 * @access  Public
 */
router.post("/a2a", mcpHandlers.a2a);

/**
 * @route   POST /mcp/erc8004
 * @desc    ERC-8004 trustless agent tools
 * @access  Public
 */
router.post("/erc8004", mcpHandlers.erc8004);

/**
 * @route   POST /mcp/universal
 * @desc    All tools combined
 * @access  Public
 */
router.post("/universal", mcpHandlers.universal);

// ============================================================
// LEGACY ENDPOINTS (backward compatibility)
// ============================================================

/**
 * @route   POST /mcp
 * @desc    Legacy MCP handler (all tools)
 * @access  Public
 */
router.post("/", handleMCPRequest);

export default router;

// Export legacy payment handler separately (mounted at /mcp-payment)
export { handleMCPPaymentRequest };
