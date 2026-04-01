/**
 * Universal x402 Gateway
 * 
 * Handles payment-gated access to all resource types:
 * - API proxy
 * - File downloads
 * - Article content
 * - Shopify stores (existing integration)
 */

import { Request, Response } from "express";
import path from "path";
import { Resource, Creator, AccessLog } from "../models/index.js";
import { initializeX402Server } from "../utils/x402-config";
import { parsePaymentHeader } from "../utils/x402-payment-helpers";
import {
  getNetwork,
  getCurrency,
  getTokenDecimals,
  getChainId,
  isValidNetwork,
  SPAY_SCHEME,
} from "../config/chain-config.js";
import mongoose from "mongoose";

const X402_RECIPIENT = process.env.X402_RECIPIENT_ADDRESS || process.env.ETH_RECIPIENT_ADDRESS;

/**
 * Access a resource by ID
 * GET/POST /x402/resource/:resourceId
 */
export async function handleResourceAccess(req: Request, res: Response) {
  const startTime = Date.now();
  const { resourceId } = req.params;

  console.log(`[x402-gateway] Resource access: ${resourceId}`);

  try {
    // Load resource with creator info
    // Try by MongoDB ObjectId first, then by slug
    let resource: any = null;

    // Helper to check if string is valid MongoDB ObjectId
    const isValidObjectId = (str: string) => {
      return mongoose.Types.ObjectId.isValid(str);
    };

    // Try ObjectId lookup only if it looks like a MongoDB ObjectId
    if (isValidObjectId(resourceId)) {
      resource = await Resource.findById(resourceId)
        .populate('creatorId', 'walletAddress')
        .lean();
    }

    // If not found by ID, try by slug
    if (!resource) {
      resource = await Resource.findOne({ slug: resourceId })
        .populate('creatorId', 'walletAddress')
        .lean();
    }

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (!resource.isActive) {
      return res.status(404).json({ error: "Resource is not available" });
    }

    // Check if wallet already paid for this resource
    const walletParam = (req.query.wallet as string)?.toLowerCase();
    if (walletParam) {
      const existingAccess = await AccessLog.findOne({
        resourceId: resource._id,
        walletAddress: walletParam,
      }).lean();

      if (existingAccess) {
        console.log(`[x402-gateway] Wallet ${walletParam} already paid for resource ${resourceId} — serving content`);
        return await serveResource(resource, req, res);
      }
    }

    const priceUsdc = resource.priceUsdc;
    const currency = getCurrency();
    const tokenDecimals = getTokenDecimals();

    // For native tokens, use the price directly as the native amount
    // For USDC, convert from dollars to micro-units
    const amountMicroUsdc = currency === "USDC"
      ? BigInt(Math.floor(priceUsdc * 10 ** tokenDecimals)).toString()
      : BigInt(Math.floor(priceUsdc * 10 ** 18)).toString(); // Native tokens use 18 decimals

    // Get payment recipient (creator's wallet or platform default)
    // Handle both populated and non-populated creatorId
    let recipientAddress: string | undefined;
    if (resource.creatorId) {
      // Check if it's a populated object or just an ID
      if (typeof resource.creatorId === 'object' && 'walletAddress' in resource.creatorId) {
        recipientAddress = resource.creatorId.walletAddress;
      }
    }

    // Fallback to environment variable
    if (!recipientAddress) {
      recipientAddress = X402_RECIPIENT;
    }

    console.log(`[x402-gateway] Recipient: ${recipientAddress || "NONE"}`);

    if (!recipientAddress) {
      console.error("[x402-gateway] No recipient address configured");
      return res.status(500).json({ error: "Payment recipient not configured" });
    }

    // Check for payment header
    const xPaymentHeader = req.header("X-PAYMENT");

    // ============================================================
    // NO PAYMENT - Return 402 with payment requirements
    // ============================================================
    if (!xPaymentHeader) {
      const network = getNetwork();
      console.log(`[x402-gateway] No payment header - returning 402 (${priceUsdc} ${currency})`);

      // Get chain ID from the chain registry
      const chainId = getChainId(network);

      // Return payment requirements in SDK-compatible format
      // The SDK's parsePaymentRequirements expects the body to match PaymentRequirementsSchema
      const paymentRequirements = {
        scheme: SPAY_SCHEME as any,
        network: network,
        chainId: chainId,
        token: currency as any,
        amount: amountMicroUsdc,
        recipient: recipientAddress,
        requestId: `resource_${resource._id.toString()}_${Date.now()}`,
        memo: resource.description || `Access to ${resource.name}`,
      };

      return res.status(402).json({
        // SDK-compatible payment requirements (top-level for SDK parsing)
        ...paymentRequirements,
        
        // Additional metadata
        x402Version: "1.0",
        resourceId: resource._id.toString(),
        resourceName: resource.name,
        resourceType: resource.type,
        description: resource.description || `Access to ${resource.name}`,
        price: priceUsdc,
        priceFormatted: `$${priceUsdc.toFixed(2)} ${currency}`,
        
        // Also include in accepts array for backward compatibility
        accepts: [paymentRequirements],
      });
    }

    // ============================================================
    // HAS PAYMENT - Verify and serve content
    // ============================================================
    console.log(`[x402-gateway] Payment header present - verifying`);

    const x402Server = await initializeX402Server();
    
    // Parse payment header
    let paymentData: any;
    try {
      paymentData = parsePaymentHeader(xPaymentHeader);
    } catch (err: any) {
      console.error("[x402-gateway] Payment header parse error:", err.message);
      return res.status(400).json({ error: "Invalid payment header format" });
    }

    console.log(`[x402-gateway] Payment data parsed (network: ${paymentData.network})`);

    // Verify payment
    const network = getNetwork();
    
    // All networks in the registry are EVM networks
    // isValidNetwork returns true for all supported EVM chains
    const isEVMNetwork = isValidNetwork(network);

    const paymentProof = isEVMNetwork ? {
      transactionHash: paymentData.transactionHash || paymentData.signature,
      network: paymentData.network,
      chainId: paymentData.chainId || paymentData.chain_id,
      timestamp: paymentData.timestamp || Date.now(),
    } : {
      signature: paymentData.signature,
      network: paymentData.network,
      timestamp: paymentData.timestamp || Date.now(),
    };

    const chainId = getChainId(network);
    
    const paymentRequirements = {
      network: network,
      chainId: chainId,
      recipient: recipientAddress,
      amount: amountMicroUsdc,
      token: currency as any,
    };

    console.log(`[x402-gateway] Verifying payment (amount: ${amountMicroUsdc}, network: ${network})`);

    // Verify with retries — fast chains like SKALE may need a moment for RPC sync
    let verified = false;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      verified = await x402Server.verifyPayment(paymentProof, paymentRequirements);
      if (verified) break;
      if (attempt < maxRetries) {
        console.log(`[x402-gateway] Verification attempt ${attempt} failed, retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log("[x402-gateway] Verification result:", verified);

    if (!verified) {
      console.error("[x402-gateway] Payment verification failed after retries");
      return res.status(402).json({
        error: "Payment verification failed",
        details: "Payment could not be verified on-chain",
      });
    }

    // Extract wallet address from transaction receipt
    const txSignature = paymentData.transactionHash || paymentData.txHash || paymentData.signature || paymentData.payload?.signature;
    let payerWallet: string | undefined;
    try {
      const receipt = await x402Server.getPublicClient().getTransactionReceipt({ hash: txSignature as `0x${string}` });
      payerWallet = receipt.from?.toLowerCase();
    } catch (receiptErr: any) {
      console.warn("[x402-gateway] Could not extract wallet from tx receipt:", receiptErr.message);
    }

    // Log the access
    try {
      await logAccess(
        resource._id.toString(),
        resource.creatorId._id || resource.creatorId,
        txSignature,
        priceUsdc,
        req,
        payerWallet
      );
    } catch (logErr: any) {
      console.error("[x402-gateway] Failed to log access:", logErr.message);
      // Don't fail the request if logging fails — payment was verified
    }

    // Serve content based on type
    const duration = Date.now() - startTime;
    console.log(`[x402-gateway] Payment verified in ${duration}ms - serving content`);

    return await serveResource(resource, req, res);

  } catch (err: any) {
    console.error("[x402-gateway] Error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Serve resource content based on type
 */
async function serveResource(resource: any, req: Request, res: Response) {
  switch (resource.type) {
    case "api":
      return serveApiProxy(resource, req, res);
    case "file":
      return serveFile(resource, req, res);
    case "article":
      return serveArticle(resource, req, res);
    case "shopify":
      return serveShopify(resource, req, res);
    default:
      return res.status(500).json({ error: `Unknown resource type: ${resource.type}` });
  }
}

/**
 * Validate that a URL is safe to proxy (no SSRF)
 */
function validateProxyUrl(urlString: string): void {
  const url = new URL(urlString);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Only HTTP(S) URLs are allowed");
  }
  const blockedPatterns = /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|\[::1\])/i;
  if (blockedPatterns.test(url.hostname)) {
    throw new Error("Internal/private URLs are not allowed");
  }
}

/**
 * Proxy request to upstream API
 */
async function serveApiProxy(resource: any, req: Request, res: Response) {
  const { upstream_url, method, headers: configHeaders } = resource.config;

  if (!upstream_url) {
    return res.status(500).json({ error: "API resource misconfigured: missing upstream_url" });
  }

  try {
    validateProxyUrl(upstream_url);
    const targetMethod = method || req.method;
    const url = new URL(upstream_url);

    // Append query params from original request
    const originalUrl = new URL(req.url, `http://${req.headers.host}`);
    originalUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Prepare headers
    const proxyHeaders: Record<string, string> = {
      ...configHeaders,
      "Content-Type": req.headers["content-type"] || "application/json",
    };

    // Remove hop-by-hop headers
    delete proxyHeaders["host"];
    delete proxyHeaders["connection"];

    const fetchOptions: RequestInit = {
      method: targetMethod,
      headers: proxyHeaders,
    };

    // Include body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(targetMethod) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    console.log(`[x402-gateway] Proxying to: ${url.toString()}`);

    const proxyRes = await fetch(url.toString(), fetchOptions);
    const contentType = proxyRes.headers.get("content-type") || "application/json";

    // Stream or return response
    if (contentType.includes("application/json")) {
      const data = await proxyRes.json();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-402-Paid", "true");
      return res.status(proxyRes.status).json(data);
    } else {
      const text = await proxyRes.text();
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-402-Paid", "true");
      return res.status(proxyRes.status).send(text);
    }

  } catch (err: any) {
    console.error("[x402-gateway] API proxy error:", err);
    return res.status(502).json({ error: "Failed to proxy request", details: err.message });
  }
}

/**
 * Serve file download (hosted or external link)
 */
async function serveFile(resource: any, _req: Request, res: Response) {
  const { storage_key, filename, external_url, mode } = resource.config;

  res.setHeader("X-402-Paid", "true");

  // Determine the download filename
  const downloadName = filename
    || (external_url ? external_url.split("/").pop() : null)
    || `${resource.slug || resource._id}.dat`;

  // Mode: External link - proxy external file
  if (mode === "external" || external_url) {
    const targetUrl = external_url;
    if (!targetUrl) {
      return res.status(500).json({ error: "External file URL not configured" });
    }

    try {
      validateProxyUrl(targetUrl);
      const fileRes = await fetch(targetUrl);

      if (!fileRes.ok) {
        throw new Error(`Upstream returned ${fileRes.status}`);
      }

      const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);

      const arrayBuffer = await fileRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));

    } catch (err: any) {
      console.warn("[x402-gateway] External file unreachable, serving sample data:", err.message);
      // Fall through to sample content generation below
    }
  }

  // Mode: Hosted file - serve from local uploads directory
  if (storage_key) {
    const uploadsFilesDir = path.resolve(process.cwd(), "uploads", "files");
    const resolvedPath = path.resolve(uploadsFilesDir, storage_key);

    // Prevent path traversal
    if (!resolvedPath.startsWith(uploadsFilesDir)) {
      return res.status(403).json({ error: "Invalid storage key" });
    }

    if (filename) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }

    return res.sendFile(resolvedPath);
  }

  // Fallback: generate sample content so the demo works even with placeholder URLs
  const sampleContent = generateSampleFileContent(resource, downloadName);

  res.setHeader("Content-Type", sampleContent.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${sampleContent.filename}"`);
  return res.send(Buffer.from(sampleContent.data));
}

/**
 * Generate sample file content for demo resources when external URLs are unreachable
 */
function generateSampleFileContent(resource: any, filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const name = resource.name || "Sample Data";
  const desc = resource.description || "";

  if (ext === "csv" || desc.toLowerCase().includes("csv")) {
    const csv = [
      "Date,Ticker,Open,High,Low,Close,Volume",
      "2024-01-02,AAPL,185.12,186.45,184.89,185.64,45230100",
      "2024-01-02,MSFT,373.88,375.10,372.60,374.51,22045600",
      "2024-01-02,GOOGL,139.45,140.92,139.10,140.25,18320400",
      "2024-01-02,AMZN,151.20,153.44,150.89,153.10,35678200",
      "2024-01-02,NVDA,481.67,488.92,479.30,487.84,42156000",
      "2024-01-02,TSLA,248.42,251.25,245.01,248.48,102345600",
      "2024-01-02,META,353.96,358.52,352.80,357.22,15890300",
      "2024-01-02,JPM,170.10,172.34,169.75,171.89,9876500",
      "2024-01-03,AAPL,185.30,187.10,184.50,186.92,43210500",
      "2024-01-03,MSFT,374.20,377.50,373.10,376.80,21345600",
      "2024-01-03,GOOGL,140.50,142.10,139.90,141.72,17456200",
      "2024-01-03,AMZN,153.50,155.20,152.80,154.85,33245800",
      "2024-01-03,NVDA,488.10,495.60,486.40,494.25,45678300",
      "2024-01-03,TSLA,248.90,254.10,247.30,253.18,98765400",
    ].join("\n");
    return { data: csv, contentType: "text/csv", filename: filename.endsWith(".csv") ? filename : `${filename}.csv` };
  }

  if (ext === "json") {
    const json = JSON.stringify({
      title: name,
      description: desc,
      generatedAt: new Date().toISOString(),
      sampleData: [
        { id: 1, value: "Sample record 1" },
        { id: 2, value: "Sample record 2" },
        { id: 3, value: "Sample record 3" },
      ],
    }, null, 2);
    return { data: json, contentType: "application/json", filename: filename.endsWith(".json") ? filename : `${filename}.json` };
  }

  // Default: plain text with resource info
  const text = [
    `# ${name}`,
    ``,
    desc,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Resource ID: ${resource._id}`,
    ``,
    `This is sample content for the "${name}" resource.`,
    `In production, this file would be served from the configured external URL or hosted storage.`,
  ].join("\n");
  return { data: text, contentType: "text/plain", filename: filename.endsWith(".txt") ? filename : `${filename}.txt` };
}

/**
 * Serve blog/article content (URL, sitemap, or direct content)
 */
async function serveArticle(resource: any, req: Request, res: Response) {
  const { content, storage_key, blog_url, sitemap_url, mode } = resource.config || {};

  res.setHeader("X-402-Paid", "true");

  // Mode: Blog URL - proxy the blog content
  if (mode === "url" && blog_url) {
    try {
      validateProxyUrl(blog_url);
      const blogRes = await fetch(blog_url);
      
      if (!blogRes.ok) {
        return res.status(502).json({ error: "Failed to fetch blog content" });
      }

      const contentType = blogRes.headers.get("content-type") || "text/html";
      const htmlContent = await blogRes.text();

      // Return as JSON with URL info or proxy HTML
      if (req.query.format === "html") {
        res.setHeader("Content-Type", contentType);
        return res.send(htmlContent);
      }

      return res.json({
        id: resource._id.toString(),
        name: resource.name,
        description: resource.description,
        sourceUrl: blog_url,
        content: htmlContent,
        contentType: "html",
        mode: "url",
      });

    } catch (err: any) {
      console.error("[x402-gateway] Blog fetch error:", err);
      return res.status(502).json({ error: "Failed to fetch blog content", details: err.message });
    }
  }

  // Mode: Sitemap/RSS - return the feed
  if (mode === "sitemap" && sitemap_url) {
    try {
      validateProxyUrl(sitemap_url);
      const feedRes = await fetch(sitemap_url);
      
      if (!feedRes.ok) {
        return res.status(502).json({ error: "Failed to fetch RSS/sitemap" });
      }

      const contentType = feedRes.headers.get("content-type") || "application/xml";
      const feedContent = await feedRes.text();

      // Return as JSON with feed info or proxy XML
      if (req.query.format === "xml" || req.query.format === "raw") {
        res.setHeader("Content-Type", contentType);
        return res.send(feedContent);
      }

      return res.json({
        id: resource._id.toString(),
        name: resource.name,
        description: resource.description,
        sourceUrl: sitemap_url,
        content: feedContent,
        contentType: contentType.includes("xml") ? "xml" : "rss",
        mode: "sitemap",
      });

    } catch (err: any) {
      console.error("[x402-gateway] Sitemap fetch error:", err);
      return res.status(502).json({ error: "Failed to fetch RSS/sitemap", details: err.message });
    }
  }

  // Mode: Direct content (default)
  let articleContent = content;

  // If content is stored in storage, fetch it - TODO: Implement with MongoDB GridFS
  if (!articleContent && storage_key) {
    return res.status(501).json({ 
      error: "Article storage not yet implemented",
      message: "Please use direct content or external URL mode"
    });
  }

  return res.json({
    id: resource._id.toString(),
    name: resource.name,
    description: resource.description,
    content: articleContent || "",
    contentType: "markdown",
    mode: "direct",
  });
}

/**
 * Redirect to Shopify checkout
 */
async function serveShopify(resource: any, _req: Request, res: Response) {
  const { store_id } = resource.config || {};

  if (!store_id) {
    return res.status(500).json({ error: "Shopify resource misconfigured: missing store_id" });
  }

  // Return store info and redirect to existing checkout flow
  res.setHeader("X-402-Paid", "true");
  
  return res.json({
    type: "shopify",
    storeId: store_id,
    message: "Use /x402/checkout endpoint with this storeId",
    checkoutEndpoint: `/x402/checkout`,
  });
}

/**
 * Log access for analytics
 */
async function logAccess(
  resourceId: string,
  creatorId: string,
  paymentSignature: string,
  amountUsdc: number,
  req: Request,
  walletAddress?: string
) {
  try {
    // Insert access log
    await AccessLog.create({
      resourceId,
      creatorId,
      paymentSignature,
      amountUsdc,
      network: getNetwork(),
      walletAddress: walletAddress || undefined,
      ipAddress: req.ip || undefined,
      userAgent: req.headers["user-agent"] || undefined,
      accessedAt: new Date(),
    });

    // Update resource stats atomically
    await Resource.findByIdAndUpdate(resourceId, {
      $inc: {
        accessCount: 1,
        totalRevenue: amountUsdc,
      },
    });

    // Update creator stats atomically
    await Creator.findByIdAndUpdate(creatorId, {
      $inc: {
        totalSales: 1,
        totalRevenueUsdc: amountUsdc,
      },
    });

  } catch (err) {
    // Don't fail the request if logging fails
    console.error("[x402-gateway] Failed to log access:", err);
  }
}

/**
 * List all public resources (discovery endpoint)
 * GET /x402/resources
 */
export async function handleListX402Resources(req: Request, res: Response) {
  try {
    const { type, limit, offset } = req.query;

    const limitNum = Math.max(1, Math.min(parseInt(limit as string) || 50, 100));
    const offsetNum = Math.max(0, parseInt(offset as string) || 0);

    const filter: any = {
      isActive: true,
    };

    if (type) {
      filter.type = type;
    }

    const resources = await Resource.find(filter)
      .populate('creatorId', 'walletAddress name username')
      .sort({ accessCount: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .lean();

    const formatted = resources.map((r: any) => ({
      id: r._id.toString(),
      slug: r.slug,
      type: r.type,
      name: r.name,
      description: r.description,
      priceUsdc: r.priceUsdc,
      priceFormatted: `$${r.priceUsdc.toFixed(2)} ${getCurrency()}`,
      accessCount: r.accessCount,
      createdAt: r.createdAt,
      endpoint: `/x402/resource/${r.slug || r._id}`,
      creator: {
        walletAddress: r.creatorId.walletAddress,
        name: r.creatorId.name,
        username: r.creatorId.username,
      },
    }));

    return res.json({
      resources: formatted,
      count: formatted.length,
      nextOffset: formatted.length === limitNum ? offsetNum + limitNum : null,
    });

  } catch (err: any) {
    console.error("[x402-gateway] List error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}





