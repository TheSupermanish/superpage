import { Request, Response } from "express";
import { ShopifyProduct, ShopifyVariant } from "../types";
import { findStoreById } from "../models/index.js";

export async function handleShopifyProducts(req: Request, res: Response) {
  try {
    const { storeUrl, accessToken, storeId } = req.body as {
      storeUrl?: string;
      accessToken?: string;
      storeId?: string;
    };

    let finalUrl: string;
    let finalToken: string;

    // If storeId is provided, fetch store details from database
    if (storeId) {
      const store = await findStoreById(storeId);

      if (!store) {
        return res.status(404).json({
          error: "Store not found",
        });
      }

      finalUrl = store.url;
      finalToken = store.adminAccessToken;
      console.log(`[Products] Fetching products for store: ${storeId} (${finalUrl})`);
    } else if (storeUrl && accessToken) {
      // Legacy: manual token entry
      finalUrl = storeUrl.trim().replace(/\/$/, "");
      finalToken = accessToken;
      console.log(`[Products] Fetching products with manual token for: ${finalUrl}`);
    } else {
      return res.status(400).json({
        error: "Missing storeId or (storeUrl + accessToken)",
      });
    }

    const url = finalUrl.replace(/\/$/, "");
    const apiVersion = "2025-01"; // Updated to latest stable admin API
    const graphqlEndpoint = `${url}/admin/api/${apiVersion}/graphql.json`;

    const allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let guard = 0; // prevent infinite loops

    while (hasNextPage && guard < 50) {
      guard++;
      const query = /* GraphQL */ `
        query GetProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              cursor
              node {
                id
                title
                handle
                descriptionHtml
                featuredImage { url altText }
                images(first: 1) { edges { node { url altText } } }
                variants(first: 50) {
                  edges {
                    node {
                      id
                      title
                      price
                      sku
                      inventoryQuantity
                      compareAtPrice
                      image { url altText }
                    }
                  }
                }
              }
            }
            pageInfo { hasNextPage }
          }
        }
      `;

      const variables = {
        first: 50,
        after: cursor,
      } as const;

      console.log(`[Products] GraphQL request to: ${graphqlEndpoint}`);
      
      const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": finalToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Products] Shopify error: ${response.status}`, text);
        return res.status(response.status).json({
          error: `Shopify error ${response.status}`,
          details: text,
        });
      }

      const json = (await response.json()) as any;
      if (json.errors) {
        console.error(`[Products] GraphQL errors:`, json.errors);
        return res.status(502).json({
          error: "GraphQL errors",
          details: json.errors,
        });
      }

      const productsData = json.data?.products;
      if (!productsData) break;

      for (const edge of productsData.edges as any[]) {
        const node = edge.node;
        const imageUrl =
          node?.featuredImage?.url ??
          node?.images?.edges?.[0]?.node?.url ??
          null;
        const variants: ShopifyVariant[] = (node?.variants?.edges ?? []).map(
          (ve: any) => ({
            id: ve.node.id,
            title: ve.node.title,
            price: ve.node.price,
            imageUrl: ve.node.image?.url ?? null,
            sku: ve.node.sku ?? null,
            inventoryQuantity:
              typeof ve.node.inventoryQuantity === "number"
                ? ve.node.inventoryQuantity
                : null,
          })
        );
        allProducts.push({
          id: node.id,
          title: node.title,
          handle: node.handle ?? null,
          imageUrl,
          descriptionHtml: node.descriptionHtml ?? null,
          variants,
        });
      }

      hasNextPage = Boolean(productsData.pageInfo?.hasNextPage);
      if (hasNextPage) {
        const last = productsData.edges[productsData.edges.length - 1];
        cursor = last?.cursor ?? null;
      }
    }

    console.log(`[Products] Fetched ${allProducts.length} products`);
    return res.status(200).json({ products: allProducts });
  } catch (e: any) {
    console.error(`[Products] Unexpected error:`, e);
    return res.status(500).json({
      error: "Unexpected error",
      message: e?.message ?? String(e),
    });
  }
}
