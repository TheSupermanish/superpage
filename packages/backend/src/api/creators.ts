/**
 * Creator API Endpoints
 * 
 * Public creator profiles, discovery, and username management
 */

import { Request, Response } from "express";
import { Creator, Resource } from "../models/index.js";
import { AuthenticatedRequest } from "./wallet-auth";

/**
 * Get creator by username or ID
 * GET /api/creators/:username
 */
export async function handleGetCreator(req: Request, res: Response) {
  try {
    const { username } = req.params;

    // Try to find by username first, then by ID
    let creator;
    
    if (username.match(/^[0-9a-f]{24}$/i)) {
      // Looks like a MongoDB ObjectId
      creator = await Creator.findById(username).lean();
    } else {
      // Search by username
      creator = await Creator.findOne({ username: username.toLowerCase() }).lean();
    }

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    // Only return public profiles or if authenticated
    if (!creator.isPublic) {
      return res.status(404).json({ error: "Creator profile is private" });
    }

    // Format response
    const response: any = {
      id: creator._id.toString(),
      username: creator.username,
      displayName: creator.displayName,
      name: creator.name,
      avatarUrl: creator.avatarUrl,
      bio: creator.bio,
      website: creator.website,
      socialLinks: creator.socialLinks,
      isPublic: creator.isPublic,
      createdAt: creator.createdAt,
    };

    // Include stats if public
    if (creator.showStats) {
      response.stats = {
        totalSales: creator.totalSales,
        totalRevenue: creator.totalRevenueUsdc,
      };
    }

    return res.json({ creator: response });
  } catch (err: any) {
    console.error("Get creator error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get creator's resources
 * GET /api/creators/:username/resources
 */
export async function handleGetCreatorResources(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { limit, offset, type } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Find creator
    const creator = await Creator.findOne({ 
      username: username.toLowerCase(),
      isPublic: true 
    });

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    // Build filter
    const filter: any = {
      creatorId: creator._id,
      isActive: true,
    };

    if (type) {
      filter.type = type;
    }

    // Get resources
    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
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
      accessCount: r.accessCount,
      createdAt: r.createdAt,
    }));

    return res.json({
      resources: formatted,
      count: formatted.length,
      nextOffset: formatted.length === limitNum ? offsetNum + limitNum : null,
    });
  } catch (err: any) {
    console.error("Get creator resources error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get creator stats
 * GET /api/creators/:username/stats
 */
export async function handleGetCreatorStats(req: Request, res: Response) {
  try {
    const { username } = req.params;

    const creator = await Creator.findOne({ 
      username: username.toLowerCase(),
      isPublic: true,
      showStats: true,
    }).lean();

    if (!creator) {
      return res.status(404).json({ error: "Creator not found or stats not public" });
    }

    // Get resource count
    const resourceCount = await Resource.countDocuments({
      creatorId: creator._id,
      isActive: true,
    });

    return res.json({
      stats: {
        totalSales: creator.totalSales,
        totalRevenue: creator.totalRevenueUsdc,
        resourceCount,
      },
    });
  } catch (err: any) {
    console.error("Get creator stats error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Search creators
 * GET /api/creators/search?q=...
 */
export async function handleSearchCreators(req: Request, res: Response) {
  try {
    const { q, limit, offset } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const searchRegex = new RegExp(q, 'i');

    const creators = await Creator.find({
      isPublic: true,
      $or: [
        { username: searchRegex },
        { displayName: searchRegex },
        { name: searchRegex },
        { bio: searchRegex },
      ],
    })
      .select('username displayName name avatarUrl bio totalSales')
      .sort({ totalSales: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .lean();

    const formatted = creators.map((c: any) => ({
      id: c._id.toString(),
      username: c.username,
      displayName: c.displayName,
      name: c.name,
      avatarUrl: c.avatarUrl,
      bio: c.bio,
      totalSales: c.totalSales,
    }));

    return res.json({
      creators: formatted,
      count: formatted.length,
      nextOffset: formatted.length === limitNum ? offsetNum + limitNum : null,
    });
  } catch (err: any) {
    console.error("Search creators error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * List all public creators
 * GET /api/creators
 */
export async function handleListCreators(req: Request, res: Response) {
  try {
    const { limit, offset, sortBy } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Determine sort order
    let sort: any = { createdAt: -1 }; // Default: newest first
    
    if (sortBy === 'sales') {
      sort = { totalSales: -1 };
    } else if (sortBy === 'revenue') {
      sort = { totalRevenueUsdc: -1 };
    }

    const creators = await Creator.find({ isPublic: true })
      .select('username displayName name avatarUrl bio totalSales')
      .sort(sort)
      .skip(offsetNum)
      .limit(limitNum)
      .lean();

    // Get resource count for each creator
    const creatorsWithCounts = await Promise.all(
      creators.map(async (c: any) => {
        const resourceCount = await Resource.countDocuments({
          creatorId: c._id,
          isActive: true,
        });

        return {
          id: c._id.toString(),
          username: c.username,
          displayName: c.displayName,
          name: c.name,
          avatarUrl: c.avatarUrl,
          bio: c.bio,
          totalSales: c.totalSales,
          resourceCount,
        };
      })
    );

    return res.json({
      creators: creatorsWithCounts,
      count: creatorsWithCounts.length,
      nextOffset: creatorsWithCounts.length === limitNum ? offsetNum + limitNum : null,
    });
  } catch (err: any) {
    console.error("List creators error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Check username availability
 * GET /api/creators/check-username/:username
 */
export async function handleCheckUsername(req: Request, res: Response) {
  try {
    const { username } = req.params;

    // Validate username format
    if (!username || username.length < 3 || username.length > 30) {
      return res.json({
        available: false,
        error: "Username must be between 3 and 30 characters",
      });
    }

    if (!/^[a-z0-9-]+$/.test(username)) {
      return res.json({
        available: false,
        error: "Username can only contain lowercase letters, numbers, and hyphens",
      });
    }

    // Check if username exists
    const existing = await Creator.findOne({ username: username.toLowerCase() });

    return res.json({
      available: !existing,
      username: username.toLowerCase(),
    });
  } catch (err: any) {
    console.error("Check username error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Update creator username (authenticated)
 * PUT /api/creators/me/username
 */
export async function handleUpdateUsername(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Validate format
    const lowerUsername = username.toLowerCase();
    
    if (lowerUsername.length < 3 || lowerUsername.length > 30) {
      return res.status(400).json({ 
        error: "Username must be between 3 and 30 characters" 
      });
    }

    if (!/^[a-z0-9-]+$/.test(lowerUsername)) {
      return res.status(400).json({ 
        error: "Username can only contain lowercase letters, numbers, and hyphens" 
      });
    }

    // Check if username is already taken
    const existing = await Creator.findOne({ 
      username: lowerUsername,
      _id: { $ne: req.creator.id },
    });

    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Update username
    const creator = await Creator.findByIdAndUpdate(
      req.creator.id,
      { username: lowerUsername },
      { new: true, runValidators: true }
    );

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    return res.json({
      success: true,
      username: creator.username,
    });
  } catch (err: any) {
    console.error("Update username error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
