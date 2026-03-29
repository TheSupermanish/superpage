import { Request, Response } from "express";
import { Store } from "../models/index.js";
import { deriveNameFromUrl } from "../utils/utils";
import { StoreInput } from "../types";
import { DEFAULT_NETWORK, DEFAULT_ASSET } from "../config/chain-config";

export async function handleCreateStore(req: Request, res: Response) {
  try {
    const body = req.body as StoreInput;

    const { url, adminAccessToken } = body;
    if (!url || !adminAccessToken) {
      return res.status(400).json({
        error: "Missing required fields: url, adminAccessToken",
      });
    }

    const name = body.name?.trim() || deriveNameFromUrl(url);
    const description = body.description?.trim() || undefined;
    const currency = body.currency || "USD";
    const networks = body.networks || [DEFAULT_NETWORK];
    const asset = body.asset || DEFAULT_ASSET;
    const agentMetadata =
      body.agentMetadata || {
        minOrder: "5.00",
        supportsPhysical: true,
        supportsDigital: false,
      };

    const shopDomain = (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return undefined;
      }
    })();

    const store = await Store.create({
      name,
      url,
      shopDomain: shopDomain || undefined,
      adminAccessToken,
      description: description || undefined,
      currency,
      networks,
      asset,
      agentMetadata,
    });

    console.log(`[CreateStore] Created store: ${store.id} (${name}, ${currency})`);

    return res.status(200).json({
      id: store.id,
      name: store.name,
      description: store.description,
      currency: store.currency,
      networks: store.networks,
      asset: store.asset,
      agentMetadata: store.agentMetadata,
    });
  } catch (e: any) {
    console.error("[CreateStore] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
