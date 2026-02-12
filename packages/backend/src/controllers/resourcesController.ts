import { Request, Response } from "express";
import { Resource } from "../models/index.js";
import { ApiResponse } from "../middleware/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * List public resources for discovery
 * GET /api/resources/public
 */
export const listPublicResources = asyncHandler(async (req: Request, res: Response) => {
  const { type, limit = "50", offset = "0", search } = req.query;

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const filter: any = {
    isActive: true,
  };

  if (type) {
    filter.type = type;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const resources = await Resource.find(filter)
    .populate("creatorId", "walletAddress name avatarUrl username")
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
    accessCount: r.accessCount || 0,
    createdAt: r.createdAt,
    creator: {
      id: r.creatorId?._id?.toString(),
      walletAddress: r.creatorId?.walletAddress,
      name: r.creatorId?.name || "Unknown",
      username: r.creatorId?.username,
      avatarUrl: r.creatorId?.avatarUrl,
    },
  }));

  return ApiResponse.paginated(res, formatted, {
    limit: limitNum,
    offset: offsetNum,
  });
});

/**
 * List x402 resources (for gateway)
 * GET /x402/resources
 */
export const listX402Resources = asyncHandler(async (req: Request, res: Response) => {
  const { type, limit = "50", offset = "0" } = req.query;

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const filter: any = {
    isActive: true,
  };

  if (type) {
    filter.type = type;
  }

  const resources = await Resource.find(filter)
    .populate("creatorId", "walletAddress name username")
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
    priceFormatted: `$${r.priceUsdc.toFixed(2)} USDC`,
    accessCount: r.accessCount || 0,
    createdAt: r.createdAt,
    endpoint: `/x402/resource/${r.slug || r._id}`,
    creator: {
      walletAddress: r.creatorId?.walletAddress,
      name: r.creatorId?.name || "Unknown",
      username: r.creatorId?.username,
    },
  }));

  return res.json({
    resources: formatted,
    count: formatted.length,
    nextOffset: formatted.length === limitNum ? offsetNum + limitNum : null,
  });
});
