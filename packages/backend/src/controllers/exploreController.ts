import { Request, Response } from "express";
import { Resource, Creator, Store, StoreProduct } from "../models/index.js";
import { ApiResponse } from "../middleware/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Get all data needed for the explore page
 * GET /api/explore
 */
export const getExploreData = asyncHandler(async (req: Request, res: Response) => {
  const { limit = "50", type } = req.query;

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);

  // Fetch all data in parallel
  const [resources, creators, stores, products] = await Promise.all([
    // Resources
    Resource.find({
      isActive: true,
      ...(type && { type }),
    })
      .populate("creatorId", "walletAddress name username avatarUrl")
      .sort({ accessCount: -1 })
      .limit(limitNum)
      .lean(),

    // Creators (top by sales)
    Creator.find({ isPublic: true })
      .select("username displayName name avatarUrl bio totalSales")
      .sort({ totalSales: -1 })
      .limit(20)
      .lean(),

    // Stores (populate creator for profile link)
    Store.find()
      .select("-adminAccessToken")
      .populate("creatorId", "username name displayName avatarUrl")
      .limit(10)
      .lean(),

    // Store Products
    StoreProduct.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  // Format resources
  const formattedResources = resources.map((r: any) => ({
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

  // Format creators with resource counts
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

  // Format stores
  const formattedStores = stores.map((s: any) => ({
    id: s.id || s._id?.toString(),
    _id: s._id?.toString(),
    name: s.name,
    description: s.description,
    domain: s.domain || s.shopDomain,
    createdAt: s.createdAt,
    creator: s.creatorId ? {
      username: s.creatorId.username,
      name: s.creatorId.displayName || s.creatorId.name,
      avatarUrl: s.creatorId.avatarUrl,
    } : null,
  }));

  // Format products
  const formattedProducts = products.map((p: any) => ({
    id: p.variantId || p._id.toString(),
    storeId: p.storeId,
    name: p.name,
    description: p.description || null,
    image: p.image || null,
    price: p.price,
    currency: p.currency || "USD",
    inventory: p.inventory ?? null,
  }));

  return ApiResponse.success(res, {
    resources: formattedResources,
    creators: creatorsWithCounts,
    stores: formattedStores,
    products: formattedProducts,
  });
});
