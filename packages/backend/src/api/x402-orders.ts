import { Request, Response } from "express";
import { Order, Store, findStoreById } from "../models/index.js";
import { AuthenticatedRequest } from "./wallet-auth.js";

export type OrderType = {
  id: string;
  store: string;
  orderIntent: string;
  email: string;
  items: any[];
  subtotalAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: "confirmed" | "fulfilled" | "cancelled";
  shopifyOrderId: string | null;
  createdAt: Date;
};

/**
 * Get orders for a store (public - for MCP agents)
 * Note: This endpoint is public but only returns order summaries
 */
export async function handleGetOrders(req: Request, res: Response) {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        error: "Missing storeId parameter",
      });
    }

    const data = await Order.find({ storeId })
      .sort({ createdAt: -1 })
      .lean();

    const orders = (data || []).map((o: any) => ({
      id: o.id || o._id,
      store_id: o.storeId,
      order_intent_id: o.orderIntentId,
      email: o.email,
      items: o.items,
      subtotal_amount: o.subtotalAmount,
      shipping_amount: o.shippingAmount,
      tax_amount: o.taxAmount,
      total_amount: o.totalAmount,
      currency: o.currency,
      status: o.status,
      shopify_order_id: o.shopifyOrderId,
      created_at: o.createdAt,
    }));

    return res.status(200).json(orders);
  } catch (e: any) {
    console.error("[GetOrders] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}

/**
 * Get orders for the authenticated creator's stores only
 * This is the protected endpoint for the dashboard
 */
export async function handleGetMyOrders(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const creatorId = req.creator.id;

    // Get all stores belonging to this creator
    const stores = await Store.find({ creatorId }).select("id").lean();
    const storeIds = stores.map(s => s.id);

    if (storeIds.length === 0) {
      return res.status(200).json({ orders: [], total: 0 });
    }

    // Get orders for these stores
    const data = await Order.find({ storeId: { $in: storeIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const orders = (data || []).map((o: any) => ({
      id: o.id || o._id,
      storeId: o.storeId,
      orderIntentId: o.orderIntentId,
      email: o.email,
      items: o.items,
      subtotalAmount: o.subtotalAmount,
      shippingAmount: o.shippingAmount,
      taxAmount: o.taxAmount,
      totalAmount: o.totalAmount,
      currency: o.currency,
      status: o.status,
      shopifyOrderId: o.shopifyOrderId,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({ 
      orders, 
      total: orders.length,
      storeCount: storeIds.length,
    });
  } catch (e: any) {
    console.error("[GetMyOrders] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}

/**
 * Get orders for a specific store (protected - must own the store)
 */
export async function handleGetStoreOrdersProtected(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { storeId } = req.params;
    const creatorId = req.creator.id;

    if (!storeId) {
      return res.status(400).json({ error: "Missing storeId parameter" });
    }

    // Verify the store belongs to this creator
    const store = await findStoreById(storeId);
    if (store && store.creatorId?.toString() !== creatorId) {
      return res.status(403).json({ error: "Store not found or you don't have access to it" });
    }

    if (!store) {
      return res.status(403).json({ 
        error: "Store not found or you don't have access to it" 
      });
    }

    // Get orders for this store
    const data = await Order.find({ storeId: store.id })
      .sort({ createdAt: -1 })
      .lean();

    const orders = (data || []).map((o: any) => ({
      id: o.id || o._id,
      storeId: o.storeId,
      orderIntentId: o.orderIntentId,
      email: o.email,
      items: o.items,
      subtotalAmount: o.subtotalAmount,
      shippingAmount: o.shippingAmount,
      taxAmount: o.taxAmount,
      totalAmount: o.totalAmount,
      currency: o.currency,
      status: o.status,
      shopifyOrderId: o.shopifyOrderId,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({ 
      orders, 
      total: orders.length,
      store: {
        id: store.id,
        name: store.name,
      }
    });
  } catch (e: any) {
    console.error("[GetStoreOrdersProtected] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
