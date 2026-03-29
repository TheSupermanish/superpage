/**
 * Sign-in-with-Wallet Authentication (Ethereum only)
 *
 * Flow:
 * 1. Client requests a nonce for their wallet address
 * 2. Client signs the nonce with their wallet
 * 3. Server verifies signature and returns JWT
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { recoverMessageAddress, isAddress } from "viem";
import { Creator, AuthNonce } from "../models/index.js";

// JWT secret - MUST be set in environment
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";
const NONCE_EXPIRY_MINUTES = 10;

// Types
export interface AuthenticatedRequest extends Request {
  creator?: {
    id: string;
    walletAddress: string;
  };
}

export interface JWTPayload {
  creatorId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

/**
 * Generate a nonce for wallet to sign
 * POST /api/auth/nonce
 * Body: { walletAddress: string }
 */
export async function handleGetNonce(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum wallet address" });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Generate random nonce
    const nonce = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

    // Store nonce in database
    try {
      await AuthNonce.create({
        walletAddress: normalizedAddress,
        nonce,
        expiresAt,
      });
    } catch (error) {
      console.error("Failed to store nonce:", error);
      return res.status(500).json({ error: "Failed to generate nonce" });
    }

    // Create the message to sign
    const message = createSignMessage(normalizedAddress, nonce);

    return res.json({
      nonce,
      message,
      expiresAt: expiresAt.toISOString(),
      walletType: "ethereum",
    });
  } catch (err: any) {
    console.error("Nonce generation error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Verify signature and return JWT
 * POST /api/auth/verify
 * Body: { walletAddress: string, signature: string, nonce: string }
 */
export async function handleVerifySignature(req: Request, res: Response) {
  try {
    const { walletAddress, signature, nonce } = req.body;

    if (!walletAddress || !signature || !nonce) {
      return res.status(400).json({
        error: "walletAddress, signature, and nonce are required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Verify nonce exists and is valid
    const nonceData = await AuthNonce.findOne({
      walletAddress: normalizedAddress,
      nonce,
      expiresAt: { $gt: new Date() },
    });

    if (!nonceData) {
      return res.status(401).json({ error: "Invalid or expired nonce" });
    }

    // Delete the nonce immediately (one-time use) to prevent replay attempts
    // This happens before verification so the nonce is consumed regardless of outcome
    try {
      await AuthNonce.deleteOne({ _id: nonceData._id });
    } catch (deleteErr) {
      console.error("[Auth] Failed to delete nonce:", deleteErr);
    }

    const message = createSignMessage(normalizedAddress, nonce);

    // Ethereum signature verification
    let isValid = false;
    try {
      const ethSignature = signature.startsWith("0x") ? signature : `0x${signature}`;

      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: ethSignature as `0x${string}`,
      });

      isValid = recoveredAddress.toLowerCase() === normalizedAddress;
    } catch (err: any) {
      console.error("[Auth] Signature verification error:", err.message);
      isValid = false;
    }

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Get or create creator
    let creator = await Creator.findOne({ walletAddress: normalizedAddress });

    // Create new creator if doesn't exist
    if (!creator) {
      try {
        creator = await Creator.create({
          walletAddress: normalizedAddress,
          name: `Creator ${normalizedAddress.slice(0, 6)}...`,
        });
      } catch (error) {
        console.error("Creator creation error:", error);
        return res.status(500).json({ error: "Failed to create account" });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        creatorId: creator._id.toString(),
        walletAddress: creator.walletAddress,
      } as Partial<JWTPayload>,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.json({
      token,
      creator: {
        id: creator._id.toString(),
        walletAddress: creator.walletAddress,
        username: creator.username,
        displayName: creator.displayName,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        bio: creator.bio,
        website: creator.website,
        socialLinks: creator.socialLinks,
        isPublic: creator.isPublic,
        showStats: creator.showStats,
      },
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get current authenticated creator
 * GET /api/auth/me
 */
export async function handleGetMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const creator = await Creator.findById(req.creator.id);

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    return res.json({
      creator: {
        id: creator._id.toString(),
        walletAddress: creator.walletAddress,
        username: creator.username,
        displayName: creator.displayName,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        bio: creator.bio,
        website: creator.website,
        socialLinks: creator.socialLinks,
        isPublic: creator.isPublic,
        showStats: creator.showStats,
        createdAt: creator.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Get me error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Update creator profile
 * PUT /api/auth/me
 */
export async function handleUpdateMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const {
      name,
      bio,
      website,
      avatarUrl,
      username,
      displayName,
      socialLinks,
      isPublic,
      showStats
    } = req.body;

    // Validate URL fields start with http:// or https://
    const isValidUrl = (url: string) => /^https?:\/\//.test(url);

    if (website !== undefined && website !== "" && !isValidUrl(website)) {
      return res.status(400).json({ error: "website must start with http:// or https://" });
    }

    if (avatarUrl !== undefined && avatarUrl !== "" && !isValidUrl(avatarUrl)) {
      return res.status(400).json({ error: "avatarUrl must start with http:// or https://" });
    }

    if (socialLinks !== undefined && socialLinks !== null && typeof socialLinks === "object") {
      for (const [key, value] of Object.entries(socialLinks)) {
        if (typeof value === "string" && value !== "" && !isValidUrl(value)) {
          return res.status(400).json({ error: `socialLinks.${key} must start with http:// or https://` });
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (username !== undefined) updateData.username = username;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (showStats !== undefined) updateData.showStats = showStats;

    const creator = await Creator.findByIdAndUpdate(
      req.creator.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    return res.json({
      creator: {
        id: creator._id.toString(),
        walletAddress: creator.walletAddress,
        username: creator.username,
        displayName: creator.displayName,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        bio: creator.bio,
        website: creator.website,
        socialLinks: creator.socialLinks,
        isPublic: creator.isPublic,
        showStats: creator.showStats,
      },
    });
  } catch (err: any) {
    console.error("Update me error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Middleware to authenticate requests via JWT
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.creator = {
      id: payload.creatorId,
      walletAddress: payload.walletAddress,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

      req.creator = {
        id: payload.creatorId,
        walletAddress: payload.walletAddress,
      };
    } catch {
      // Ignore invalid token in optional auth
    }
  }

  return next();
}

/**
 * Create the message that wallet will sign
 */
function createSignMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to authenticate with x402 Everything.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis signature does not cost any ETH and does not authorize any transactions.`;
}
