/**
 * Public Profile API
 * 
 * Handles public creator profiles at /@username
 */

import { Request, Response } from "express";
import { Creator, Store, StoreProduct, Resource } from "../models/index.js";

/**
 * GET /@:username
 * Get creator's public profile with all content
 */
export async function handleGetPublicProfile(req: Request, res: Response) {
  try {
    const { username } = req.params;

    // Find creator
    const creator = await Creator.findOne({
      username: username.toLowerCase(),
      isPublic: true,
    }).lean();

    if (!creator) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Fetch all content types in parallel
    const [stores, resources] = await Promise.all([
      // Shopify stores
      Store.find({ creatorId: creator._id }).lean(),

      // Digital resources
      Resource.find({
        creatorId: creator._id,
        isPublic: true,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    // Aggregate store products
    const storeIds = stores.map((s) => s.id);
    const storeProducts = await StoreProduct.find({
      storeId: { $in: storeIds },
    })
      .limit(100)
      .lean();

    // Format response
    return res.json({
      profile: {
        username: creator.username,
        displayName: creator.displayName || creator.name,
        avatarUrl: creator.avatarUrl,
        bio: creator.bio,
        website: creator.website,
        walletAddress: creator.walletAddress,
        socialLinks: creator.socialLinks,
        stats: creator.showStats
          ? {
              totalSales: creator.totalSales,
              totalRevenue: creator.totalRevenueUsdc,
            }
          : null,
      },
      content: {
        stores: stores.map((s) => ({
          id: s.id,
          name: s.name,
          shopDomain: s.shopDomain,
          description: s.description,
          productCount: storeProducts.filter((p) => p.storeId === s.id).length,
        })),
        products: storeProducts.map((p) => ({
          _id: p._id.toString(),
          id: p.variantId,
          storeId: p.storeId,
          name: p.name,
          description: p.description,
          image: p.image,
          price: p.price,
          currency: p.currency,
          inventory: p.inventory,
          metadata: p.metadata,
        })),
        resources: resources.map((r) => ({
          id: r._id.toString(),
          slug: r.slug,
          type: r.type,
          name: r.name,
          description: r.description,
          price: r.priceUsdc,
          accessCount: r.accessCount,
        })),
      },
    });
  } catch (err: any) {
    console.error("Get public profile error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * GET /@:username/store/:storeSlug
 * Get storefront for a specific store
 */
export async function handleGetStorefront(req: Request, res: Response) {
  try {
    const { username, storeSlug } = req.params;

    // Find creator
    const creator = await Creator.findOne({
      username: username.toLowerCase(),
      isPublic: true,
    }).lean();

    if (!creator) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Find store (storeSlug could be the store ID or a slug derived from name)
    const store = await Store.findOne({
      creatorId: creator._id,
      $or: [
        { id: storeSlug },
        { id: `shopify/${storeSlug}` },
      ],
    }).lean();

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Get all products for this store
    const products = await StoreProduct.find({
      storeId: store.id,
    })
      .sort({ name: 1 })
      .lean();

    return res.json({
      store: {
        id: store.id,
        name: store.name,
        shopDomain: store.shopDomain,
        description: store.description,
      },
      products: products.map((p) => ({
        _id: p._id.toString(),
        id: p.variantId,
        name: p.name,
        description: p.description,
        image: p.image,
        price: p.price,
        currency: p.currency,
        inventory: p.inventory,
        metadata: p.metadata,
      })),
      creator: {
        username: creator.username,
        displayName: creator.displayName || creator.name,
        avatarUrl: creator.avatarUrl,
      },
    });
  } catch (err: any) {
    console.error("Get storefront error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
