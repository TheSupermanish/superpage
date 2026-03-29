import { Request, Response } from "express";
import { StoreProduct, findStoreById } from "../models/index.js";
import { Product } from "../types";
import { normalizePriceString } from "../utils/utils";

export async function handleListAllStoreProducts(req: Request, res: Response) {
  try {
    const limitParam = req.query.limit as string | undefined;
    const search = req.query.search as string | undefined;
    const cursorParam = req.query.cursor as string | undefined;

    let limit = Number.parseInt(limitParam || "100", 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 100;
    if (limit > 200) limit = 200;

    let offset = Number.parseInt(cursorParam || "0", 10);
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    let query = StoreProduct.find();

    if (search && search.trim()) {
      query = query.where("name").regex(new RegExp(search.trim(), "i"));
    }

    const products = await query
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const productList: Product[] = products.map((row: any) => {
      const priceStr = normalizePriceString(row.price);

      return {
        _id: row._id.toString(), // MongoDB ObjectId for deletion
        id: row.variantId as string,
        storeId: row.storeId as string,
        name: row.name as string,
        description: (row.description ?? null) as string | null,
        image: (row.image ?? null) as string | null,
        price: priceStr,
        currency: (row.currency ?? "USD") as string,
        inventory: (row.inventory ?? null) as number | null,
        metadata: row.metadata ?? null,
      };
    });

    const nextCursor =
      productList.length === limit ? String(offset + productList.length) : null;

    return res.status(200).json({ products: productList, nextCursor });
  } catch (e: any) {
    console.error("[ListAllStoreProducts] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}

export async function handleListStoreProducts(req: Request, res: Response) {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ error: "Missing storeId" });
    }

    const limitParam = req.query.limit as string | undefined;
    const search = req.query.search as string | undefined;
    const cursorParam = req.query.cursor as string | undefined;

    let limit = Number.parseInt(limitParam || "50", 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 100) limit = 100;

    let offset = Number.parseInt(cursorParam || "0", 10);
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    // Support both store.id and store._id for lookups
    // First try to find the actual store to get its id field
    let actualStoreId = storeId;
    try {
      const store = await findStoreById(storeId);
      if (store) {
        actualStoreId = store.id;
      }
    } catch (err) {
      // If lookup fails, use the provided storeId as-is
    }

    let query = StoreProduct.find({ storeId: actualStoreId });

    if (search && search.trim()) {
      query = query.where("name").regex(new RegExp(search.trim(), "i"));
    }

    const products = await query
      .sort({ name: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const productList: Product[] = products.map((row: any) => {
      const priceStr = normalizePriceString(row.price);

      return {
        id: row.variantId as string,
        storeId: row.storeId as string, // Include storeId for frontend filtering
        name: row.name as string,
        description: (row.description ?? null) as string | null,
        image: (row.image ?? null) as string | null,
        price: priceStr,
        currency: (row.currency ?? "USD") as string,
        inventory: (row.inventory ?? null) as number | null,
        metadata: row.metadata ?? null,
      };
    });

    const nextCursor =
      productList.length === limit ? String(offset + productList.length) : null;

    return res.status(200).json({ storeId, products: productList, nextCursor });
  } catch (e: any) {
    console.error("[ListStoreProducts] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
