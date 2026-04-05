import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";
import type { A2ATask, Part } from "../types.js";
import type { PurchaseCache } from "./index.js";

export function createAccessResourceTool(
  client: A2AClient,
  cache: PurchaseCache
) {
  return tool({
    description:
      "Request access to a payment-gated resource (API, file, content) via the A2A protocol. Returns a task with payment requirements. IMPORTANT: Always use the exact 'slug' field returned by list_resources (e.g. 'weather-api', 'exclusive-creator-video'). If the resource was already purchased in this session, returns the cached content instead of paying again.",
    parameters: z.object({
      resourceId: z
        .string()
        .optional()
        .describe("The resource slug from list_resources"),
      slug: z
        .string()
        .optional()
        .describe("Alternative name for resourceId — the 'slug' field from list_resources"),
    }),
    execute: async ({ resourceId, slug }) => {
      // Gemini maps list_resources.slug to either field
      const resolvedId = resourceId || slug;
      if (!resolvedId) {
        return { success: false, error: "Missing resourceId or slug" };
      }
      // Check if already purchased — return cached content
      const cached = cache.get(resolvedId);
      if (cached) {
        return {
          success: true,
          alreadyPurchased: true,
          taskId: cached.taskId,
          txHash: cached.txHash,
          content: cached.content,
          message: `Already purchased. Returning cached content.`,
        };
      }

      let response;
      try {
        console.log(`[access-resource] sending resourceId=${resolvedId}`);
        response = await client.sendMessage({
          action: "access-resource",
          resourceId: resolvedId,
        });
      } catch (err) {
        return { success: false, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
      }

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const result = response.result;
      if (!result || typeof result !== "object") {
        return { success: false, error: "Invalid response from server" };
      }
      const task = result as A2ATask;
      const parts: Part[] = task.status?.message?.parts || [];
      const dataPart = parts.find((p) => p.type === "data");
      const paymentReqs =
        dataPart?.type === "data"
          ? dataPart.data?.paymentRequirements
          : undefined;
      const textPart = parts.find((p) => p.type === "text");

      return {
        success: true,
        taskId: task.id,
        state: task.status.state,
        paymentRequirements: paymentReqs,
        message: textPart?.type === "text" ? textPart.text : undefined,
      };
    },
  });
}
