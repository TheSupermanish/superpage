import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";

// Rate limiters
import { generalLimiter } from "./middleware/rateLimiters.js";

// Route modules
import authRoutes from "./routes/authRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import shopifyRoutes, { webhookRouter as shopifyWebhookRoutes } from "./routes/shopifyRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import mcpRoutes, { handleMCPPaymentRequest } from "./routes/mcpRoutes.js";
import a2aRoutes from "./routes/a2aRoutes.js";
import x402Routes from "./routes/x402Routes.js";
import profileRoutes from "./routes/profileRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import creatorRoutes from "./routes/creatorRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";

// Error handling
import { errorHandler } from "./middleware/errorHandler.js";

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
app.use(generalLimiter);

// Middleware
app.use(cors(corsOptions as any));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (sample data files for file-type resources)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/files", express.static(path.join(__dirname, "../public/files")));

// Serve uploaded files from disk
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0", name: "x402-everything" });
});

// ============================================================
// MOUNT ROUTERS
// ============================================================

// Auth
app.use("/api/auth", authRoutes);

// Analytics
app.use("/api/analytics", analyticsRoutes);

// Explore (public)
app.use("/api/explore", exploreRoutes);

// Resources (public + protected CRUD)
app.use("/api/resources", resourceRoutes);

// Creators
app.use("/api/creators", creatorRoutes);

// Shopify OAuth & integration
app.use("/api/shopify", shopifyRoutes);
app.use("/api/webhooks/shopify", shopifyWebhookRoutes);

// Stores, file upload (mixed /api/* and /x402/* paths, mounted at root)
app.use("/", storeRoutes);

// Orders & checkout (mixed /api/* and /x402/* paths, mounted at root)
app.use("/", orderRoutes);

// x402 gateway
app.use("/x402", x402Routes);

// MCP agent servers
app.use("/mcp", mcpRoutes);

// Legacy MCP payment endpoint (backward compatibility)
app.post("/mcp-payment", handleMCPPaymentRequest);

// A2A protocol & well-known endpoints (mounted at root)
app.use("/", a2aRoutes);

// Public profiles (mounted at root)
app.use("/", profileRoutes);

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
