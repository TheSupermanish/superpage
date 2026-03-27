import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";

// MVC Routes
import exploreRoutes from "./routes/exploreRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import creatorRoutes from "./routes/creatorRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";

// Error handling
import { errorHandler } from "./middleware/errorHandler.js";

// Existing Shopify imports
import { handleShopifyProducts } from "./api/shopify-products.js";
import { handleCreateStore } from "./api/create-store.js";
import { handleUpsertStoreProducts } from "./api/upsert-store-products.js";
import { handleDeleteStoreProduct } from "./api/delete-store-product.js";
import { handleGetOrderIntents } from "./api/x402-order-intents.js";
import { handleGetOrders, handleGetMyOrders, handleGetStoreOrdersProtected } from "./api/x402-orders.js";
import { handleListStoreProducts } from "./api/x402-store-products.js";
import { handleCheckout } from "./api/x402-checkout.js";
import { handleGetOrderDetails } from "./api/x402-order-details.js";
// Legacy MCP handlers (will be replaced by modular system)
import { handleMCPRequest } from "./api/mcp-handler.js";
import { handleMCPPaymentRequest } from "./api/mcp-payment-handler.js";
// New modular MCP system
import { initializeMCPTools, createMCPServers } from "./mcp/index.js";
// A2A (Agent-to-Agent) protocol
import { handleA2ARequest, handleAgentCard } from "./a2a/index.js";
// ERC-8004 Trustless Agents
import { handleRegistrationFile } from "./erc8004/registration-file.js";
import { handleShopifyAuth, handleShopifyCallback, handleGetInstallUrl } from "./api/shopify-oauth.js";
import { handleLinkStore } from "./api/link-store.js";
import { handleProductUpdate, handleProductDelete } from "./api/shopify-webhooks.js";
import { handleGetPublicProfile, handleGetStorefront } from "./api/public-profile.js";
import { handleFileUpload, upload } from "./api/file-upload.js";
import { handleCheckUsernameExists, handleCheckUsernameAvailability } from "./api/check-username.js";

// x402 Everything imports
import {
  handleGetNonce,
  handleVerifySignature,
  handleGetMe,
  handleUpdateMe,
  authMiddleware,
  optionalAuthMiddleware,
} from "./api/wallet-auth.js";
import {
  handleListResources,
  handleGetResource,
  handleCreateResource,
  handleUpdateResource,
  handleDeleteResource,
} from "./api/resources.js";
import { handleResourceAccess } from "./api/x402-gateway.js";
import { handleEthStoreProductAccess, handleEthTest, handleEthCheckout } from "./api/x402-eth-gateway.js";
import {
  handleGetEarnings,
  handleGetAccessLogs,
  handleGetChartData,
  handleGetOverview,
} from "./api/analytics.js";
import {
  handleGetCreatorResources,
  handleGetCreatorStats,
  handleSearchCreators,
  handleCheckUsername,
  handleUpdateUsername,
} from "./api/creators.js";

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    process.env.FRONTEND_URL,
    process.env.APP_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-PAYMENT", "X-A2A-Extensions", "X-A2A-Task-Id"],
  exposedHeaders: ["Content-Disposition", "Content-Type", "X-402-Paid"],
};

// Security middleware
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for API server
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // stricter for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Middleware
app.use(cors(corsOptions as any));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (sample data files for file-type resources)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/files", express.static(path.join(__dirname, "../public/files")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0", name: "x402-everything" });
});

// ============================================================
// WALLET AUTHENTICATION
// ============================================================
app.post("/api/auth/nonce", authLimiter, handleGetNonce);
app.post("/api/auth/verify", authLimiter, handleVerifySignature);
app.get("/api/auth/me", authMiddleware, handleGetMe);
app.put("/api/auth/me", authMiddleware, handleUpdateMe);
app.get("/api/creators/:username/exists", handleCheckUsernameExists);
app.get("/api/creators/check-username/:username", authMiddleware, handleCheckUsernameAvailability);

// ============================================================
// RESOURCE MANAGEMENT (Protected)
// ============================================================
app.get("/api/resources", authMiddleware, handleListResources);
app.get("/api/resources/:id", authMiddleware, handleGetResource);
app.post("/api/resources", authMiddleware, handleCreateResource);
app.put("/api/resources/:id", authMiddleware, handleUpdateResource);
app.delete("/api/resources/:id", authMiddleware, handleDeleteResource);

// ============================================================
// FILE UPLOAD (Protected)
// ============================================================
app.post("/api/upload", authMiddleware, upload.single("file"), handleFileUpload);

// ============================================================
// ANALYTICS (Protected)
// ============================================================
app.get("/api/analytics/overview", authMiddleware, handleGetOverview);
app.get("/api/analytics/earnings", authMiddleware, handleGetEarnings);
app.get("/api/analytics/access", authMiddleware, handleGetAccessLogs);
app.get("/api/analytics/chart", authMiddleware, handleGetChartData);

// ============================================================
// EXPLORE API (Public) - Combined endpoint for explore page
// ============================================================
app.use("/api/explore", exploreRoutes);

// ============================================================
// RESOURCE API (Public)
// ============================================================
app.use("/api/resources", resourceRoutes);
// x402 resources endpoint (for backward compatibility)
app.get("/x402/resources", async (req, res, next) => {
  const { listX402Resources } = await import("./controllers/resourcesController.js");
  return listX402Resources(req, res, next);
});

// ============================================================
// CREATOR API (Public)
// ============================================================
// Specific routes must come before parameterized routes
app.get("/api/creators/search", handleSearchCreators);
app.get("/api/creators/check-username/:username", handleCheckUsername);
app.put("/api/creators/me/username", authMiddleware, handleUpdateUsername);
app.get("/api/creators/:username/resources", handleGetCreatorResources);
app.get("/api/creators/:username/stats", handleGetCreatorStats);
app.use("/api/creators", creatorRoutes);

// ============================================================
// PUBLIC PROFILES (New in v3.0)
// ============================================================
app.get("/@:username", handleGetPublicProfile);
app.get("/@:username/store/:storeSlug", handleGetStorefront);

// ============================================================
// x402 UNIVERSAL GATEWAY (Public - payment protected)
// ============================================================
app.get("/x402/resource/:resourceId", handleResourceAccess);
app.post("/x402/resource/:resourceId", handleResourceAccess);

// ============================================================
// x402 ETHEREUM GATEWAY (EVM payments)
// ============================================================
app.get("/x402/eth/test", handleEthTest);
app.get("/x402/eth/store/:storeId/product/:productId", handleEthStoreProductAccess);
app.post("/x402/eth/store/:storeId/checkout", handleEthCheckout);

// ============================================================
// SHOPIFY OAUTH (for app installation)
// ============================================================
app.get("/api/shopify/auth", optionalAuthMiddleware, handleShopifyAuth);
app.get("/api/shopify/callback", handleShopifyCallback);
app.get("/api/shopify/install-url", optionalAuthMiddleware, handleGetInstallUrl);
app.post("/api/shopify/install-url", optionalAuthMiddleware, handleGetInstallUrl);

// SHOPIFY WEBHOOKS (for auto-sync)
// ============================================================
app.post("/api/webhooks/shopify/products/update", handleProductUpdate);
app.post("/api/webhooks/shopify/products/delete", handleProductDelete);

// ============================================================
// SHOPIFY INTEGRATION (Legacy)
// ============================================================
// SHOPIFY ROUTES
// ============================================================
app.post("/api/shopify/products", handleShopifyProducts);
app.post("/api/stores", handleCreateStore);
app.get("/api/stores", authMiddleware, async (req, res, next) => {
  const { listMyStores } = await import("./controllers/storesController.js");
  return listMyStores(req, res, next);
});
app.post("/api/stores/:storeId/products", handleUpsertStoreProducts);
app.post("/api/stores/:storeId/link", authMiddleware, handleLinkStore);
app.delete("/api/store-products/:productId", handleDeleteStoreProduct);
app.delete("/api/stores/:storeId", authMiddleware, async (req, res, next) => {
  const { deleteStore } = await import("./controllers/storesController.js");
  return deleteStore(req, res, next);
});

// ============================================================
// STORE API (Public)
// ============================================================
app.use("/x402", storeRoutes);
app.get("/x402/stores/:storeId/products", handleListStoreProducts);
app.get("/x402/stores/:storeId/order-intents", handleGetOrderIntents);
app.get("/x402/stores/:storeId/orders", handleGetOrders);
app.post("/x402/checkout", handleCheckout);

// Protected order endpoints (for dashboard)
app.get("/api/orders", authMiddleware, handleGetMyOrders);
app.get("/api/stores/:storeId/orders", authMiddleware, handleGetStoreOrdersProtected);
app.get("/x402/orders/:orderId", handleGetOrderDetails);

// ============================================================
// MCP AGENT SERVERS (Modular)
// ============================================================
// Initialize all MCP tools at startup
initializeMCPTools();
const mcpHandlers = createMCPServers();

// Modular MCP endpoints
app.post("/mcp/shopping", mcpHandlers.shopping);      // Shopping tools only
app.post("/mcp/payment", mcpHandlers.payment);        // Payment tools only
app.post("/mcp/resources", mcpHandlers.resources);    // Resource access tools only
app.post("/mcp/a2a", mcpHandlers.a2a);                // A2A protocol tools
app.post("/mcp/erc8004", mcpHandlers.erc8004);        // ERC-8004 trustless agent tools
app.post("/mcp/universal", mcpHandlers.universal);    // All tools combined

// Legacy endpoints (backward compatibility)
app.post("/mcp", handleMCPRequest);
app.post("/mcp-payment", handleMCPPaymentRequest);

// ============================================================
// A2A (Agent-to-Agent) PROTOCOL
// ============================================================
app.get("/.well-known/agent.json", handleAgentCard);
app.get("/.well-known/agent-registration.json", handleRegistrationFile);
app.post("/a2a", handleA2ARequest);

// ============================================================
// ERROR HANDLING MIDDLEWARE (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================
function validateEnvironment() {
  const required = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_CLIENT_SECRET',
    'MONGODB_URI',
    'JWT_SECRET',
    'APP_URL',
    'FRONTEND_URL'
  ];
  
  const missing: string[] = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:\n');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n📝 Please add these to packages/backend/.env\n');
    console.error('Example:');
    console.error('  SHOPIFY_API_KEY=your-client-id');
    console.error('  SHOPIFY_CLIENT_SECRET=your-client-secret');
    console.error('  MONGODB_URI=mongodb://localhost:27017/x402');
    console.error('  JWT_SECRET=your-secret-key');
    console.error('  APP_URL=http://localhost:3001');
    console.error('  FRONTEND_URL=http://localhost:3000\n');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set\n');
}

// ============================================================
// START SERVER
// ============================================================
async function startServer() {
  try {
    // Validate environment variables first
    validateEnvironment();
    
    // Connect to MongoDB
    await connectDB();

    // Migrate stale store networks to configured chain
    try {
      const { Store } = await import("./models/Store.js");
      const target = process.env.X402_CHAIN || "base-sepolia";
      const result = await Store.updateMany(
        { networks: { $nin: [target] } },
        { $set: { networks: [target] } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[migration] Updated ${result.modifiedCount} store(s) → network: ${target}`);
      }
    } catch (e) {
      console.warn("[migration] Store network migration skipped:", (e as Error).message);
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`  x402 Everything Server`);
      console.log(`  Port: ${PORT}`);
      console.log(`  Database: MongoDB`);
      console.log(`${"=".repeat(50)}`);
      console.log(`\nEndpoints:`);
      console.log(`  Auth:      POST /api/auth/nonce, /api/auth/verify`);
      console.log(`  Resources: GET/POST /api/resources`);
      console.log(`  Upload:    POST /api/upload`);
      console.log(`  Analytics: GET /api/analytics/*`);
      console.log(`  Gateway:   GET/POST /x402/resource/:id`);
      console.log(`  Discovery: GET /x402/resources`);
      console.log(`  MCP:       POST /mcp`);
      console.log(`  A2A:       POST /a2a`);
      console.log(`  AgentCard: GET  /.well-known/agent.json`);
      console.log(`${"=".repeat(50)}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
