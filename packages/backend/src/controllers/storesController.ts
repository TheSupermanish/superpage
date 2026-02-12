import { Request, Response } from "express";
import { Store, StoreProduct } from "../models/index.js";
import { ApiResponse } from "../middleware/response.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { AuthenticatedRequest } from "../api/wallet-auth.js";

/**
 * List all stores (public endpoint)
 * GET /x402/stores
 */
export const listStores = asyncHandler(async (_req: Request, res: Response) => {
  const stores = await Store.find().select("-adminAccessToken").lean();

  const formatted = stores.map((s: any) => ({
    id: s.id || s._id?.toString(), // Use actual id field first, fallback to _id
    _id: s._id?.toString(), // Also include MongoDB _id for reference
    name: s.name,
    description: s.description,
    url: s.url || (s.shopDomain ? `https://${s.shopDomain}` : null),
    shopDomain: s.shopDomain,
    domain: s.domain || s.shopDomain,
    networks: s.networks || [],
    asset: s.asset || "USDC",
    currency: s.currency || "USD",
    createdAt: s.createdAt,
  }));

  return ApiResponse.success(res, { stores: formatted });
});

/**
 * List stores for authenticated creator
 * GET /api/stores
 */
export const listMyStores = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.id;

  if (!creatorId) {
    throw new AppError("Unauthorized", 401);
  }

  const stores = await Store.find({ creatorId })
    .select("-adminAccessToken")
    .lean();

  const formatted = stores.map((s: any) => ({
    id: s.id || s._id?.toString(),
    _id: s._id?.toString(),
    name: s.name,
    description: s.description,
    url: s.url || (s.shopDomain ? `https://${s.shopDomain}` : null),
    shopDomain: s.shopDomain,
    domain: s.domain || s.shopDomain,
    networks: s.networks || [],
    asset: s.asset || "USDC",
    currency: s.currency || "USD",
    createdAt: s.createdAt,
  }));

  return ApiResponse.success(res, { stores: formatted });
});

/**
 * List all store products
 * GET /x402/store-products
 */
export const listAllStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const { limit = "100", cursor, search } = req.query;

  let limitNum = parseInt(limit as string) || 100;
  if (limitNum > 200) limitNum = 200;

  let offsetNum = parseInt(cursor as string) || 0;
  if (offsetNum < 0) offsetNum = 0;

  let query = StoreProduct.find();

  if (search && typeof search === "string" && search.trim()) {
    query = query.where("name").regex(new RegExp(search.trim(), "i"));
  }

  const products = await query.sort({ createdAt: -1 }).skip(offsetNum).limit(limitNum).lean();

  const formatted = products.map((p: any) => ({
    id: p.variantId || p._id.toString(),
    storeId: p.storeId,
    name: p.name,
    description: p.description || null,
    image: p.image || null,
    price: p.price,
    currency: p.currency || "USD",
    inventory: p.inventory ?? null,
  }));

  return res.json({
    products: formatted,
    nextCursor: formatted.length === limitNum ? String(offsetNum + formatted.length) : null,
  });
});

/**
 * Delete a store
 * DELETE /api/stores/:storeId
 */
export const deleteStore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { storeId } = req.params;
  const creatorId = req.creator?.id;

  if (!storeId) {
    throw new AppError("Store ID is required", 400);
  }

  // Find the store
  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError("Store not found", 404);
  }

  // Check if the store belongs to the authenticated creator
  if (store.creatorId && store.creatorId.toString() !== creatorId) {
    throw new AppError("Unauthorized: You can only delete your own stores", 403);
  }

  // Delete all associated store products
  await StoreProduct.deleteMany({ storeId: store.id });

  // Delete the store
  await Store.findByIdAndDelete(storeId);

  console.log(`✅ Deleted store: ${store.name} (${storeId})`);

  return ApiResponse.success(res, { message: "Store deleted successfully", storeId });
});
