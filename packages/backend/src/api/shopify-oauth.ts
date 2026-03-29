import { Request, Response } from "express";
import { Store, StoreProduct } from "../models/index.js";
import crypto from "crypto";
import { AuthenticatedRequest } from "./wallet-auth";
import { DEFAULT_NETWORK, DEFAULT_ASSET } from "../config/chain-config";

/**
 * Automatically import all products from Shopify store
 */
async function importShopifyProducts(storeId: string, storeUrl: string, accessToken: string) {
  const url = storeUrl.replace(/\/$/, "");
  const apiVersion = "2025-01";
  const graphqlEndpoint = `${url}/admin/api/${apiVersion}/graphql.json`;

  const allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let guard = 0;

  // Fetch all products using GraphQL pagination
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
    };

    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const json = (await response.json()) as any;
    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const productsData = json.data?.products;
    if (!productsData) break;

    for (const edge of productsData.edges as any[]) {
      const node = edge.node;
      const imageUrl =
        node?.featuredImage?.url ??
        node?.images?.edges?.[0]?.node?.url ??
        null;
      
      for (const ve of node?.variants?.edges ?? []) {
        const variant = ve.node;
        allProducts.push({
          id: variant.id,
          name: `${node.title}${variant.title !== "Default Title" ? ` - ${variant.title}` : ""}`,
          description: node.descriptionHtml || null,
          image: variant.image?.url || imageUrl || null,
          price: variant.price,
          currency: "USD",
          inventory: typeof variant.inventoryQuantity === "number" ? variant.inventoryQuantity : null,
          metadata: {
            productId: node.id,
            handle: node.handle || null,
            variantTitle: variant.title,
            sku: variant.sku,
          },
        });
      }
    }

    hasNextPage = Boolean(productsData.pageInfo?.hasNextPage);
    if (hasNextPage) {
      const last = productsData.edges[productsData.edges.length - 1];
      cursor = last?.cursor ?? null;
    }
  }

  // Import all products into database
  if (allProducts.length > 0) {
    console.log(`📦 Importing ${allProducts.length} product variants...`);
    const operations = allProducts.map((p) =>
      StoreProduct.findOneAndUpdate(
        {
          storeId: storeId,
          variantId: p.id,
        },
        {
          storeId: storeId,
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
    console.log(`✅ Successfully imported ${allProducts.length} product variants`);
  } else {
    console.log(`ℹ️ No products found to import`);
  }
}

// TODO: This in-memory Map will not work correctly in multi-instance deployments
// (e.g., behind a load balancer). The OAuth state should be stored in Redis or a
// database so that the callback request can be handled by any server instance.
const oauthStates = new Map<string, { timestamp: number; redirect?: string; creatorId?: string }>();

// Clean up old states (older than 10 minutes)
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (data.timestamp < tenMinutesAgo) {
      oauthStates.delete(state);
    }
  }
}, 60000);

// Verify HMAC signature from Shopify
function verifyHmac(query: any, hmac: string): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET || "";
  const queryString = Object.keys(query)
    .filter(key => key !== "hmac" && key !== "signature")
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join("&");
  
  const hash = crypto
    .createHmac("sha256", secret)
    .update(queryString)
    .digest("hex");
  
  return hash === hmac;
}

// This handles the initial OAuth redirect - initiates the OAuth flow
export async function handleShopifyAuth(req: AuthenticatedRequest, res: Response) {
  const { shop, redirect } = req.query;
  
  if (!shop || typeof shop !== "string") {
    return res.status(400).json({ error: "Missing shop parameter" });
  }

  // Validate shop domain
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).json({ error: "Invalid shop domain" });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Shopify API key not configured" });
  }

  const scopes = "read_products,write_orders";
  
  // Try to get creator ID from authenticated request (if user is logged in)
  let creatorId: string | undefined;
  if ((req as any).creator) {
    creatorId = (req as any).creator.id;
    console.log(`👤 OAuth initiated by authenticated creator: ${creatorId}`);
  }
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");
  oauthStates.set(state, { 
    timestamp: Date.now(),
    redirect: redirect as string | undefined,
    creatorId
  });
  
  // Build callback URL
  const redirectUri = `${process.env.APP_URL}/api/shopify/callback`;
  
  // Build Shopify OAuth URL according to official docs
  const authUrl = `https://${shop}/admin/oauth/authorize?` + 
    `client_id=${encodeURIComponent(apiKey)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;
  
  console.log(`🔐 Initiating OAuth for shop: ${shop}`);
  
  // Redirect to Shopify OAuth
  return res.redirect(authUrl);
}

export async function handleShopifyCallback(req: Request, res: Response) {
  const { shop, code, state, hmac } = req.query;
  
  console.log(`📩 OAuth callback received for shop: ${shop}`);
  
  // Validate required parameters
  if (!shop || !code || !state || !hmac) {
    console.error("❌ Missing OAuth parameters:", { shop: !!shop, code: !!code, state: !!state, hmac: !!hmac });
    const errorUrl = `${process.env.FRONTEND_URL}/dashboard/stores?error=${encodeURIComponent("Missing OAuth parameters")}`;
    return res.redirect(errorUrl);
  }

  // Verify state (CSRF protection)
  const stateData = oauthStates.get(state as string);
  if (!stateData) {
    console.error("❌ Invalid OAuth state");
    const errorUrl = `${process.env.FRONTEND_URL}/dashboard/stores?error=${encodeURIComponent("Invalid state parameter")}`;
    return res.redirect(errorUrl);
  }
  
  // Clean up used state
  oauthStates.delete(state as string);

  // Verify HMAC signature
  if (!verifyHmac(req.query, hmac as string)) {
    console.error("❌ HMAC verification failed");
    const errorUrl = `${process.env.FRONTEND_URL}/dashboard/stores?error=${encodeURIComponent("HMAC verification failed")}`;
    return res.redirect(errorUrl);
  }

  try {
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("Shopify API credentials not configured");
    }

    console.log(`🔄 Exchanging code for access token...`);

    // Exchange code for access token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Token exchange failed:", errorText);
      throw new Error(`Failed to exchange OAuth code for token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string; scope: string };
    const accessToken = tokenData.access_token;

    console.log(`✅ Access token received`);

    // Fetch shop details from Shopify to get the actual shop name and custom domain
    const shopDetailsUrl = `https://${shop}/admin/api/2025-01/shop.json`;
    const shopDetailsResponse = await fetch(shopDetailsUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    let actualShopName = (shop as string).replace(".myshopify.com", "");
    let primaryDomain = shop as string;
    let customDomain = null;
    
    if (shopDetailsResponse.ok) {
      const shopData = await shopDetailsResponse.json() as any;
      actualShopName = shopData.shop?.name || actualShopName;
      
      // Get the custom domain if available, otherwise use myshopify domain
      customDomain = shopData.shop?.domain; // This is the custom domain (e.g., x402-shop.myshopify.com)
      primaryDomain = customDomain || shopData.shop?.myshopify_domain || (shop as string);
      
      console.log(`📋 Shop details: ${actualShopName}`);
      console.log(`   Primary domain: ${primaryDomain}`);
      console.log(`   Custom domain: ${customDomain || 'None'}`);
    }

    // Save or update store in database
    const shopUsername = (shop as string).replace(".myshopify.com", "");
    const storeUrl = `https://${shop}`;

    let store = await Store.findOne({ shopDomain: shop as string });
    const creatorIdFromState = stateData.creatorId;

    if (store) {
      // Update existing store
      store.adminAccessToken = accessToken;
      store.url = storeUrl;
      store.name = actualShopName;
      store.shopDomain = primaryDomain; // Use the primary/custom domain
      
      // Link to creator if provided and not already linked
      if (creatorIdFromState && !store.creatorId) {
        store.creatorId = creatorIdFromState as any;
        console.log(`🔗 Linking store to creator: ${creatorIdFromState}`);
      }
      
      await store.save();
      console.log(`✅ Updated existing store: ${actualShopName} (${store._id})`);
    } else {
      // Create new store with shopify username as ID
      const storeId = `shopify/${shopUsername}`;
      store = await Store.create({
        id: storeId,
        name: actualShopName,
        url: storeUrl,
        shopDomain: primaryDomain, // Use the primary/custom domain
        adminAccessToken: accessToken,
        currency: "USD",
        networks: [DEFAULT_NETWORK],
        asset: DEFAULT_ASSET,
        creatorId: creatorIdFromState ? (creatorIdFromState as any) : undefined,
      });
      console.log(`✅ Created new store: ${actualShopName} (ID: ${storeId})${creatorIdFromState ? ` linked to creator: ${creatorIdFromState}` : ''}`);
    }

    // Automatically import products after store connection/update
    console.log(`📦 Starting automatic product import...`);
    try {
      await importShopifyProducts(store.id, storeUrl, accessToken);
      console.log(`✅ Product import completed`);
    } catch (importError: any) {
      console.error(`⚠️ Product import failed (non-blocking):`, importError.message);
      // Don't fail OAuth if product import fails - user can import manually later
    }

    // Redirect to stores dashboard (or product selection if coming from resources)
    const redirectPath = stateData.redirect || '/dashboard/stores';
    const frontendCallbackUrl = `${process.env.FRONTEND_URL}${redirectPath}?connected=true&store_id=${store._id.toString()}`;
    console.log(`✅ Redirecting to: ${frontendCallbackUrl}`);
    
    return res.redirect(frontendCallbackUrl);

  } catch (error: any) {
    console.error("❌ OAuth callback error:", error);
    const errorUrl = `${process.env.FRONTEND_URL}/dashboard/stores?error=${encodeURIComponent(error.message || "OAuth failed")}`;
    return res.redirect(errorUrl);
  }
}

// Legacy endpoint for getting install URL (not used in new flow)
export async function handleGetInstallUrl(req: Request | AuthenticatedRequest, res: Response) {
  const { shop, redirect } = req.query;
  
  if (!shop || typeof shop !== "string") {
    return res.status(400).json({ error: "Missing shop parameter" });
  }

  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const scopes = "read_products,write_orders";
  const redirectUri = `${process.env.APP_URL}/api/shopify/callback`;
  
  // Generate state for OAuth security
  const state = crypto.randomBytes(32).toString("hex");
  const stateData: any = { timestamp: Date.now() };
  
  // If authenticated, include creator ID to link store
  const authReq = req as AuthenticatedRequest;
  if (authReq.creator?.id) {
    stateData.creatorId = authReq.creator.id;
    console.log(`👤 Install URL requested by authenticated creator: ${authReq.creator.id}`);
  }
  
  if (redirect && typeof redirect === "string") {
    stateData.redirect = redirect;
  }
  
  oauthStates.set(state, stateData);
  
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  return res.json({ installUrl });
}
