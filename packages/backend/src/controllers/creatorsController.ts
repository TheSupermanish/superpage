import { Request, Response } from "express";
import { Creator, Resource } from "../models/index.js";
import { ApiResponse } from "../middleware/response.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";

/**
 * List all public creators
 * GET /api/creators
 */
export const listCreators = asyncHandler(async (req: Request, res: Response) => {
  const { limit = "20", offset = "0", sortBy } = req.query;

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  // Determine sort order
  let sort: any = { createdAt: -1 }; // Default: newest first

  if (sortBy === "sales") {
    sort = { totalSales: -1 };
  } else if (sortBy === "revenue") {
    sort = { totalRevenueUsdc: -1 };
  }

  const creators = await Creator.find({ isPublic: true })
    .select("username displayName name avatarUrl bio totalSales")
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
        totalSales: c.totalSales || 0,
        resourceCount,
      };
    })
  );

  return ApiResponse.paginated(res, creatorsWithCounts, {
    limit: limitNum,
    offset: offsetNum,
  });
});

/**
 * Get creator by username
 * GET /api/creators/:username
 */
export const getCreator = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;

  // Try to find by username first, then by ID
  let creator;
  if (username.match(/^[0-9a-f]{24}$/i)) {
    creator = await Creator.findById(username).lean();
  } else {
    creator = await Creator.findOne({ username: username.toLowerCase() }).lean();
  }

  if (!creator) {
    throw new AppError("Creator not found", 404);
  }

  if (!creator.isPublic) {
    throw new AppError("Creator profile is private", 404);
  }

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
      totalSales: creator.totalSales || 0,
      totalRevenue: creator.totalRevenueUsdc || 0,
    };
  }

  return ApiResponse.success(res, { creator: response });
});
