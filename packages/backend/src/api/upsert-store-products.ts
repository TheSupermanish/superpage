import { Request, Response } from "express";
import { StoreProduct, Store, findStoreById } from "../models/index.js";
import { ProductInput } from "../types";

export async function handleUpsertStoreProducts(req: Request, res: Response) {
  try {
    const { storeId } = req.params;
    const body = req.body as {
      products: ProductInput[];
    };

    if (!storeId || !body?.products?.length) {
      return res.status(400).json({
        error: "Missing storeId or products",
      });
    }

    // Support both store.id and store._id for lookups
    // Get the actual store.id field to ensure consistent product association
    let actualStoreId = storeId;
    try {
      const store = await findStoreById(storeId);
      if (store) {
        actualStoreId = store.id;
      }
    } catch (err) {
      // If lookup fails, use the provided storeId as-is
    }

    const operations = body.products.map((p) =>
      StoreProduct.findOneAndUpdate(
        {
          storeId: actualStoreId,
          variantId: p.id,
        },
        {
          storeId: actualStoreId,
          variantId: p.id,
          name: p.name,
          description: p.description ?? null,
          image: p.image ?? null,
          price: p.price,
          currency: p.currency,
          inventory: p.inventory ?? null,
          metadata: p.metadata ?? null,
        },
        { upsert: true, new: true }
      )
    );

    await Promise.all(operations);

    return res.status(200).json({ ok: true, count: operations.length });
  } catch (e: any) {
    console.error("[UpsertStoreProducts] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
