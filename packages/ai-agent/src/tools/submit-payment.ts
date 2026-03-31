import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";
import type { A2ATask, DataPart, Part } from "../types.js";
import type { PurchaseCache } from "./index.js";

export function createSubmitPaymentTool(
  client: A2AClient,
  cache: PurchaseCache
) {
  return tool({
    description:
      "Submit on-chain payment proof to the merchant agent for verification. Call this after make_onchain_payment succeeds, providing the transaction hash and task ID. The merchant verifies the payment on-chain and completes the task. Returns the resource content if available.",
    parameters: z.object({
      taskId: z
        .string()
        .describe("The A2A task ID from the purchase/access step"),
      transactionHash: z
        .string()
        .describe(
          "The on-chain transaction hash from make_onchain_payment"
        ),
      network: z
        .string()
        .optional()
        .describe("Network (default initia-testnet)"),
      chainId: z
        .number()
        .optional()
        .describe("Chain ID (default 3981013683081008)"),
    }),
    execute: async ({ taskId, transactionHash, network, chainId }) => {
      let response;
      try {
        response = await client.sendMessage({
          action: "submit-payment",
          taskId,
          payment: {
            transactionHash,
            network: network || "initia-testnet",
            chainId: chainId || 3981013683081008,
            timestamp: Date.now(),
          },
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

      // Extract resource content from artifacts
      const resourceArtifact = task.artifacts?.find(
        (a) => a.name === "resource-content"
      );
      const resourceDataPart = resourceArtifact?.parts?.find(
        (p): p is DataPart => p.type === "data"
      );
      const resourceData = resourceDataPart?.data;

      // Cache the resource content for future requests
      if (resourceData?.resourceId) {
        cache.set(String(resourceData.resourceId), {
          content: resourceData,
          taskId: task.id,
          txHash: transactionHash,
        });
      }

      // Extract text and data parts from status message
      const statusParts: Part[] = task.status?.message?.parts || [];
      const resourceContent = statusParts.find(
        (p): p is DataPart => p.type === "data" && !!p.data?.content
      )?.data;
      const textPart = statusParts.find((p) => p.type === "text");

      return {
        success: task.status.state === "completed",
        taskId: task.id,
        state: task.status.state,
        message: textPart?.type === "text" ? textPart.text : undefined,
        resourceContent: resourceContent || resourceData || null,
        artifacts: task.artifacts,
      };
    },
  });
}
