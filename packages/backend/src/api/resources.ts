/**
 * Resource CRUD API
 * 
 * Endpoints for creators to manage their paywalled resources
 */

import { Response } from "express";
import crypto from "crypto";
import { Resource } from "../models/index.js";
import { AuthenticatedRequest } from "./wallet-auth";

// Types
export type ResourceType = "api" | "file" | "article" | "shopify";

export interface ResourceConfig {
  // API type
  upstream_url?: string;
  method?: string;
  headers?: Record<string, string>;
  
  // File type
  storage_key?: string;
  mime_type?: string;
  filename?: string;
  size_bytes?: number;
  
  // Article type
  content?: string;
  
  // Shopify type
  store_id?: string;
}

export interface CreateResourceInput {
  type: ResourceType;
  name: string;
  description?: string;
  priceUsdc: number;
  config: ResourceConfig;
  isPublic?: boolean;
}

/**
 * List creator's resources
 * GET /api/resources
 */
export async function handleListResources(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { type, isActive } = req.query;

    const filter: any = { creatorId: req.creator.id };
    
    if (type) {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ resources: resources.map(formatResource) });
  } catch (err: any) {
    console.error("List resources error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Get a single resource
 * GET /api/resources/:id
 */
export async function handleGetResource(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const resource = await Resource.findOne({
      _id: id,
      creatorId: req.creator.id,
    }).lean();

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json({ resource: formatResource(resource) });
  } catch (err: any) {
    console.error("Get resource error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Create a new resource
 * POST /api/resources
 */
export async function handleCreateResource(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { type, name, description, priceUsdc, config, isPublic } = req.body as CreateResourceInput;

    // Validate required fields
    if (!type || !name || priceUsdc === undefined) {
      return res.status(400).json({
        error: "type, name, and priceUsdc are required",
      });
    }

    // Validate type
    if (!["api", "file", "article", "shopify"].includes(type)) {
      return res.status(400).json({
        error: "type must be one of: api, file, article, shopify",
      });
    }

    // Validate price
    if (typeof priceUsdc !== "number" || priceUsdc < 0) {
      return res.status(400).json({ error: "priceUsdc must be a positive number" });
    }

    // Type-specific validation
    const validationError = validateResourceConfig(type, config || {});
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Generate slug
    const slug = generateSlug(name);

    try {
      const resource = await Resource.create({
        creatorId: req.creator.id,
        slug,
        type,
        name,
        description: description || undefined,
        priceUsdc,
        config: config || {},
        isActive: isPublic !== false,
      });

      return res.status(201).json({ resource: formatResource(resource.toObject()) });
    } catch (error: any) {
      // Handle duplicate slug
      if (error.code === 11000 && error.keyPattern?.slug) {
        // Try with random suffix
        const uniqueSlug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
        
        const resource = await Resource.create({
          creatorId: req.creator.id,
          slug: uniqueSlug,
          type,
          name,
          description: description || undefined,
          priceUsdc,
          config: config || {},
          isActive: isPublic !== false,
        });

        return res.status(201).json({ resource: formatResource(resource.toObject()) });
      }

      throw error;
    }
  } catch (err: any) {
    console.error("Create resource error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Update a resource
 * PUT /api/resources/:id
 */
export async function handleUpdateResource(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const { name, description, priceUsdc, config, isActive, isPublic } = req.body;

    // Build update object
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (priceUsdc !== undefined) {
      if (typeof priceUsdc !== "number" || priceUsdc < 0) {
        return res.status(400).json({ error: "priceUsdc must be a positive number" });
      }
      updates.priceUsdc = priceUsdc;
    }
    if (config !== undefined) updates.config = config;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isPublic !== undefined) updates.isActive = isPublic; // isPublic maps to isActive

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const resource = await Resource.findOneAndUpdate(
      { _id: id, creatorId: req.creator.id },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json({ resource: formatResource(resource) });
  } catch (err: any) {
    console.error("Update resource error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Delete a resource
 * DELETE /api/resources/:id
 */
export async function handleDeleteResource(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // First check if resource exists and belongs to creator
    const resource = await Resource.findOne({
      _id: id,
      creatorId: req.creator.id,
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // TODO: If it's a file, delete from storage

    // Delete the resource
    await Resource.deleteOne({ _id: id, creatorId: req.creator.id });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Delete resource error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * List public resources (for discovery)
 * GET /api/resources/public
 */
export async function handleListPublicResources(req: AuthenticatedRequest, res: Response) {
  try {
    const { type, limit, offset, search } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const filter: any = {
      isActive: true,
    };

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const resources = await Resource.find(filter)
      .populate('creatorId', 'walletAddress name avatarUrl username')
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
      accessCount: r.accessCount,
      createdAt: r.createdAt,
      creator: {
        id: r.creatorId._id.toString(),
        walletAddress: r.creatorId.walletAddress,
        name: r.creatorId.name,
        username: r.creatorId.username,
        avatarUrl: r.creatorId.avatarUrl,
      },
    }));

    return res.json({
      resources: formatted,
      nextOffset: formatted.length === limitNum ? offsetNum + limitNum : null,
    });
  } catch (err: any) {
    console.error("List public resources error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

// Helper functions

function formatResource(data: any) {
  // Safely parse numeric values, handling null, undefined, and NaN
  const safeNumber = (val: any, defaultValue = 0) => {
    const num = val ?? defaultValue;
    return isNaN(num) ? defaultValue : num;
  };

  return {
    id: data._id?.toString() || data.id,
    slug: data.slug,
    type: data.type,
    name: data.name,
    description: data.description,
    priceUsdc: safeNumber(data.priceUsdc, 0),
    config: data.config,
    isActive: data.isActive,
    isPublic: data.isActive, // map isActive to isPublic for compatibility
    accessCount: safeNumber(data.accessCount, 0),
    totalEarnings: safeNumber(data.totalRevenue, 0), // Map totalRevenue to totalEarnings for frontend
    totalRevenue: safeNumber(data.totalRevenue, 0), // Keep for backward compatibility
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

function validateResourceConfig(type: ResourceType, config: ResourceConfig): string | null {
  switch (type) {
    case "api":
      if (!config.upstream_url) {
        return "config.upstream_url is required for API resources";
      }
      try {
        new URL(config.upstream_url);
      } catch {
        return "config.upstream_url must be a valid URL";
      }
      break;

    case "file":
      // Storage key will be set after upload
      break;

    case "article":
      // Content can be empty initially
      break;

    case "shopify":
      if (!config.store_id) {
        return "config.store_id is required for Shopify resources";
      }
      break;
  }

  return null;
}
