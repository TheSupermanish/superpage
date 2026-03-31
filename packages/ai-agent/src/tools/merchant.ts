/**
 * Merchant/Creator tools for the AI agent.
 * Enables the agent to authenticate, manage a profile, and CRUD resources.
 */
import { tool } from "ai";
import { z } from "zod";
import type { Wallet } from "../wallet.js";
import type { AgentConfig } from "../config.js";
import * as ui from "../ui.js";

export interface MerchantState {
  authToken?: string;
  tokenExpiresAt?: number;
}

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** Safely extract an error message from a parsed JSON error body. */
function extractErrorMsg(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "error" in err) {
    return String((err as Record<string, unknown>).error);
  }
  return fallback;
}

/** Decode JWT payload without verification (tokens are already trusted from our own server). */
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function requireAuth(state: MerchantState): string | null {
  if (!state.authToken) {
    return "Not authenticated. Call merchant_login first.";
  }
  // Check token expiration
  if (state.tokenExpiresAt && Date.now() >= state.tokenExpiresAt) {
    state.authToken = undefined;
    state.tokenExpiresAt = undefined;
    return "Auth token has expired. Call merchant_login again.";
  }
  return null;
}

export function createMerchantTools(
  wallet: Wallet,
  config: AgentConfig,
  state: MerchantState
) {
  const baseUrl = config.merchantUrl;

  const merchant_login = tool({
    description:
      "Authenticate with the backend as a merchant/creator using your wallet. Signs a nonce message to prove wallet ownership and receives a JWT token. Must be called before other merchant tools.",
    parameters: z.object({}),
    execute: async () => {
      try {
        ui.hint("Authenticating with backend...");

        // Step 1: Get nonce
        const nonceRes = await fetch(`${baseUrl}/api/auth/nonce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: wallet.address }),
        });
        if (!nonceRes.ok) {
          const err = await nonceRes.json().catch(() => ({}));
          const errMsg = err && typeof err === "object" && "error" in err ? (err as Record<string, unknown>).error : nonceRes.statusText;
          return { success: false, error: `Nonce request failed: ${errMsg}` };
        }
        const { nonce, message } = (await nonceRes.json()) as {
          nonce: string;
          message: string;
        };

        // Step 2: Sign the message
        const signature = await wallet.signMessage(message);

        // Step 3: Verify signature
        const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: wallet.address,
            signature,
            nonce,
          }),
        });
        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({}));
          const errMsg = err && typeof err === "object" && "error" in err ? (err as Record<string, unknown>).error : verifyRes.statusText;
          return { success: false, error: `Verification failed: ${errMsg}` };
        }
        const { token, creator } = (await verifyRes.json()) as {
          token: string;
          creator: Record<string, unknown>;
        };

        // Store token and its expiration time
        state.authToken = token;
        const exp = decodeJwtExp(token);
        state.tokenExpiresAt = exp ? exp * 1000 : undefined; // convert seconds to ms
        ui.hint(`Authenticated as ${creator.username || creator.walletAddress}`);

        // Mark as AI agent in the database
        if (!creator.isAgent) {
          try {
            await fetch(`${baseUrl}/api/auth/me`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ isAgent: true }),
            });
          } catch {}
        }

        // Detect incomplete profile
        const missingFields: string[] = [];
        if (!creator.username) missingFields.push("username");
        if (!creator.displayName) missingFields.push("displayName");
        if (!creator.bio) missingFields.push("bio");

        return {
          success: true,
          walletAddress: wallet.address,
          creator,
          profileIncomplete: missingFields.length > 0,
          missingFields: missingFields.length > 0 ? missingFields : undefined,
          setupHint: missingFields.length > 0
            ? `Profile is incomplete — missing: ${missingFields.join(", ")}. Ask the user what they'd like for these fields, then call update_my_profile.`
            : undefined,
        };
      } catch (err: any) {
        return { success: false, error: `Login failed: ${err.message}` };
      }
    },
  });

  const view_my_profile = tool({
    description:
      "Get your current creator profile from the backend. Requires authentication (call merchant_login first).",
    parameters: z.object({}),
    execute: async () => {
      const authErr = requireAuth(state);
      if (authErr) return { success: false, error: authErr };

      try {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          headers: authHeaders(state.authToken!),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: extractErrorMsg(err, res.statusText) };
        }
        const { creator } = (await res.json()) as {
          creator: Record<string, unknown>;
        };
        return { success: true, creator };
      } catch (err: any) {
        return { success: false, error: `Failed to get profile: ${err.message}` };
      }
    },
  });

  const update_my_profile = tool({
    description:
      "Update your creator profile. Set username, display name, bio, website, social links, and visibility. Requires authentication.",
    parameters: z.object({
      username: z
        .string()
        .optional()
        .describe(
          "Unique URL-safe username (lowercase, 3-30 chars, alphanumeric + hyphens)"
        ),
      displayName: z
        .string()
        .optional()
        .describe("Display name shown on profile"),
      name: z.string().optional().describe("Full name"),
      bio: z.string().optional().describe("Short bio (max 500 chars)"),
      website: z.string().optional().describe("Website URL"),
      avatarUrl: z.string().optional().describe("Avatar image URL"),
      socialLinks: z
        .object({
          twitter: z.string().optional(),
          github: z.string().optional(),
          discord: z.string().optional(),
          youtube: z.string().optional(),
          linkedin: z.string().optional(),
          instagram: z.string().optional(),
          telegram: z.string().optional(),
        })
        .optional()
        .describe("Social media links"),
      isPublic: z
        .boolean()
        .optional()
        .describe("Whether profile is publicly visible"),
      showStats: z
        .boolean()
        .optional()
        .describe("Whether to show sales stats on profile"),
    }),
    execute: async (fields) => {
      const authErr = requireAuth(state);
      if (authErr) return { success: false, error: authErr };

      try {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          method: "PUT",
          headers: authHeaders(state.authToken!),
          body: JSON.stringify(fields),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: extractErrorMsg(err, res.statusText) };
        }
        const { creator } = (await res.json()) as {
          creator: Record<string, unknown>;
        };
        return { success: true, creator };
      } catch (err: any) {
        return {
          success: false,
          error: `Failed to update profile: ${err.message}`,
        };
      }
    },
  });

  const create_resource = tool({
    description:
      "Create a new paywalled resource. Types: 'article' (markdown content), 'api' (proxy to upstream URL), 'file' (downloadable file). Requires authentication.",
    parameters: z.object({
      type: z
        .enum(["api", "file", "article"])
        .describe("Resource type"),
      name: z
        .string()
        .describe("Resource name (URL slug auto-generated from this)"),
      description: z.string().optional().describe("Resource description"),
      priceUsdc: z
        .number()
        .describe("Price in USDC (e.g. 0.50 for 50 cents, 1.00 for $1)"),
      config: z
        .object({
          upstream_url: z
            .string()
            .optional()
            .describe("For API type: the upstream URL to proxy requests to"),
          method: z
            .string()
            .optional()
            .describe("For API type: HTTP method (default GET)"),
          headers: z
            .record(z.string())
            .optional()
            .describe("For API type: custom headers to forward"),
          content: z
            .string()
            .optional()
            .describe("For article type: markdown content"),
          external_url: z
            .string()
            .optional()
            .describe("For file type: URL to the file"),
          mode: z
            .string()
            .optional()
            .describe("For file type: 'external' for external URLs"),
        })
        .optional()
        .describe("Type-specific configuration"),
      isPublic: z
        .boolean()
        .optional()
        .describe("Whether resource is publicly listed (default true)"),
    }),
    execute: async (params) => {
      const authErr = requireAuth(state);
      if (authErr) return { success: false, error: authErr };

      try {
        ui.hint(`Creating ${params.type} resource: ${params.name}...`);
        const res = await fetch(`${baseUrl}/api/resources`, {
          method: "POST",
          headers: authHeaders(state.authToken!),
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: extractErrorMsg(err, res.statusText) };
        }
        const { resource } = (await res.json()) as {
          resource: Record<string, unknown>;
        };
        ui.hint(`Created: ${resource.name} (slug: ${resource.slug})`);
        return { success: true, resource };
      } catch (err: any) {
        return {
          success: false,
          error: `Failed to create resource: ${err.message}`,
        };
      }
    },
  });

  const list_my_resources = tool({
    description:
      "List all resources you've created. Optionally filter by type. Requires authentication.",
    parameters: z.object({
      type: z
        .enum(["api", "file", "article"])
        .optional()
        .describe("Filter by resource type"),
    }),
    execute: async ({ type }) => {
      const authErr = requireAuth(state);
      if (authErr) return { success: false, error: authErr };

      try {
        const url = type
          ? `${baseUrl}/api/resources?type=${type}`
          : `${baseUrl}/api/resources`;
        const res = await fetch(url, {
          headers: authHeaders(state.authToken!),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: extractErrorMsg(err, res.statusText) };
        }
        const { resources } = (await res.json()) as {
          resources: Record<string, unknown>[];
        };
        return { success: true, count: resources.length, resources };
      } catch (err: any) {
        return {
          success: false,
          error: `Failed to list resources: ${err.message}`,
        };
      }
    },
  });

  const update_resource = tool({
    description:
      "Update an existing resource by ID. Can change name, description, price, config, or visibility. Requires authentication.",
    parameters: z.object({
      resourceId: z.string().describe("The resource ID to update"),
      name: z.string().optional().describe("New resource name"),
      description: z.string().optional().describe("New description"),
      priceUsdc: z.number().optional().describe("New price in USDC"),
      config: z
        .record(z.unknown())
        .optional()
        .describe("Updated type-specific configuration"),
      isPublic: z.boolean().optional().describe("Update visibility"),
    }),
    execute: async ({ resourceId, ...updates }) => {
      const authErr = requireAuth(state);
      if (authErr) return { success: false, error: authErr };

      try {
        const res = await fetch(`${baseUrl}/api/resources/${resourceId}`, {
          method: "PUT",
          headers: authHeaders(state.authToken!),
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: extractErrorMsg(err, res.statusText) };
        }
        const { resource } = (await res.json()) as {
          resource: Record<string, unknown>;
        };
        return { success: true, resource };
      } catch (err: any) {
        return {
          success: false,
          error: `Failed to update resource: ${err.message}`,
        };
      }
    },
  });

  const delete_resource = tool({
    description:
      "Delete a resource by ID. This is permanent. Requires authentication.",
    parameters: z.object({
      resourceId: z.string().describe("The resource ID to delete"),
    }),
    execute: async ({ resourceId }) => {
      const authErr = requireAuth(state);
      if (authErr) return { success: false, error: authErr };

      try {
        const res = await fetch(`${baseUrl}/api/resources/${resourceId}`, {
          method: "DELETE",
          headers: authHeaders(state.authToken!),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: extractErrorMsg(err, res.statusText) };
        }
        return { success: true, message: `Resource ${resourceId} deleted` };
      } catch (err: any) {
        return {
          success: false,
          error: `Failed to delete resource: ${err.message}`,
        };
      }
    },
  });

  return {
    merchant_login,
    view_my_profile,
    update_my_profile,
    create_resource,
    list_my_resources,
    update_resource,
    delete_resource,
  };
}
