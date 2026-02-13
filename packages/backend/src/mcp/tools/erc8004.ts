/**
 * ERC-8004 MCP Tools
 *
 * MCP tools that expose ERC-8004 Trustless Agents functionality:
 * identity registration, reputation management, and validation queries.
 */

import { z } from "zod";
import { toolRegistry, defineTool } from "../tool-registry.js";
import { getERC8004Config, ERC8004_CONTRACTS, ERC8004_CHAIN_ID, ERC8004_EXPLORER_URL } from "../../erc8004/config.js";
import {
  registerAgent,
  getAgentInfo,
  setAgentMetadata,
  isAgentRegistered,
} from "../../erc8004/identity.js";
import {
  giveFeedback,
  getReputationSummary,
  readFeedback,
  readAllFeedback,
  revokeFeedback,
  getClients,
} from "../../erc8004/reputation.js";
import {
  getValidationStatus,
  getValidationSummary,
} from "../../erc8004/validation.js";
import { buildRegistrationFile } from "../../erc8004/registration-file.js";
import type { Address } from "viem";

// ============================================================
// Identity Tools
// ============================================================

const registerAgentTool = defineTool({
  name: "register_agent",
  description:
    "Register a new agent on the ERC-8004 Identity Registry (Base Sepolia). Mints an on-chain identity NFT and returns the agentId.",
  inputSchema: z.object({
    agentURI: z
      .string()
      .optional()
      .describe("URI pointing to the agent's registration file (defaults to /.well-known/agent-registration.json)"),
  }),
  handler: async ({ agentURI }) => {
    try {
      const config = getERC8004Config();
      const uri = agentURI || config.registrationUri;
      const result = await registerAgent(uri);
      return {
        success: true,
        agentId: result.agentId.toString(),
        txHash: result.txHash,
        owner: result.owner,
        explorerUrl: `${ERC8004_EXPLORER_URL}/tx/${result.txHash}`,
        note: `Set ERC8004_AGENT_ID=${result.agentId} in your .env file`,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

const getAgentInfoTool = defineTool({
  name: "get_agent_info",
  description:
    "Look up an agent's on-chain identity on the ERC-8004 Identity Registry. Returns URI, owner, and payment wallet.",
  inputSchema: z.object({
    agentId: z.string().describe("The agent ID (uint256) to look up"),
  }),
  handler: async ({ agentId }) => {
    try {
      const id = BigInt(agentId);
      const exists = await isAgentRegistered(id);
      if (!exists) {
        return { success: false, error: `Agent #${agentId} is not registered` };
      }
      const info = await getAgentInfo(id);
      return {
        success: true,
        agentId: info.agentId.toString(),
        owner: info.owner,
        agentURI: info.agentURI,
        agentWallet: info.agentWallet,
        chain: `eip155:${ERC8004_CHAIN_ID}`,
        identityRegistry: ERC8004_CONTRACTS.identityRegistry,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

const setAgentMetadataTool = defineTool({
  name: "set_agent_metadata",
  description:
    "Set on-chain metadata for this agent on the ERC-8004 Identity Registry.",
  inputSchema: z.object({
    key: z.string().describe("Metadata key (e.g. 'category', 'version')"),
    value: z.string().describe("Metadata value"),
  }),
  handler: async ({ key, value }) => {
    try {
      const config = getERC8004Config();
      if (config.agentId === null) {
        return { success: false, error: "ERC8004_AGENT_ID not configured. Register first." };
      }
      const txHash = await setAgentMetadata(config.agentId, key, value);
      return {
        success: true,
        agentId: config.agentId.toString(),
        key,
        value,
        txHash,
        explorerUrl: `${ERC8004_EXPLORER_URL}/tx/${txHash}`,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

// ============================================================
// Reputation Tools
// ============================================================

const giveFeedbackTool = defineTool({
  name: "give_feedback",
  description:
    "Submit reputation feedback for an agent on the ERC-8004 Reputation Registry. Value is a signed integer (e.g., 95 for a 95/100 score).",
  inputSchema: z.object({
    agentId: z.string().describe("The agent ID to give feedback for"),
    value: z.number().describe("Feedback value (e.g., 95 for 95/100)"),
    valueDecimals: z.number().optional().describe("Decimal precision (default 0)"),
    tag1: z.string().optional().describe("Primary category tag (e.g., 'quality', 'x402')"),
    tag2: z.string().optional().describe("Secondary tag (e.g., 'fast-delivery', 'purchase')"),
    endpoint: z.string().optional().describe("Service endpoint used"),
    feedbackURI: z.string().optional().describe("URI to detailed feedback JSON"),
  }),
  handler: async ({ agentId, value, valueDecimals, tag1, tag2, endpoint, feedbackURI }) => {
    try {
      const txHash = await giveFeedback({
        agentId: BigInt(agentId),
        value,
        valueDecimals,
        tag1,
        tag2,
        endpoint,
        feedbackURI,
      });
      return {
        success: true,
        agentId,
        txHash,
        explorerUrl: `${ERC8004_EXPLORER_URL}/tx/${txHash}`,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

const getReputationTool = defineTool({
  name: "get_reputation",
  description:
    "Get reputation summary for an agent from the ERC-8004 Reputation Registry. Returns feedback count and average score.",
  inputSchema: z.object({
    agentId: z.string().describe("The agent ID to check reputation for"),
    tag1: z.string().optional().describe("Filter by primary tag"),
    tag2: z.string().optional().describe("Filter by secondary tag"),
  }),
  handler: async ({ agentId, tag1, tag2 }) => {
    try {
      const id = BigInt(agentId);
      const clients = await getClients(id);
      const summary = await getReputationSummary(id, clients, tag1, tag2);
      return {
        success: true,
        agentId,
        count: summary.count,
        summaryValue: summary.summaryValue.toString(),
        summaryValueDecimals: summary.summaryValueDecimals,
        totalClients: clients.length,
        chain: `eip155:${ERC8004_CHAIN_ID}`,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

const readFeedbackTool = defineTool({
  name: "read_feedback",
  description:
    "Read detailed feedback entries for an agent from the ERC-8004 Reputation Registry.",
  inputSchema: z.object({
    agentId: z.string().describe("The agent ID"),
    clientAddress: z
      .string()
      .optional()
      .describe("Specific client address to read feedback from"),
    feedbackIndex: z
      .number()
      .optional()
      .describe("Specific feedback index (1-based)"),
    includeRevoked: z
      .boolean()
      .optional()
      .describe("Include revoked feedback (default false)"),
  }),
  handler: async ({ agentId, clientAddress, feedbackIndex, includeRevoked }) => {
    try {
      const id = BigInt(agentId);

      // Single feedback entry
      if (clientAddress && feedbackIndex) {
        const fb = await readFeedback(id, clientAddress as Address, feedbackIndex);
        return {
          success: true,
          feedback: {
            clientAddress,
            feedbackIndex,
            value: fb.value.toString(),
            valueDecimals: fb.valueDecimals,
            tag1: fb.tag1,
            tag2: fb.tag2,
            isRevoked: fb.isRevoked,
          },
        };
      }

      // All feedback entries
      const clients = clientAddress
        ? [clientAddress as Address]
        : await getClients(id);

      if (clients.length === 0) {
        return { success: true, feedback: [], count: 0 };
      }

      const entries = await readAllFeedback(id, clients, "", "", includeRevoked ?? false);
      return {
        success: true,
        feedback: entries.map((e) => ({
          clientAddress: e.clientAddress,
          feedbackIndex: e.feedbackIndex,
          value: e.value.toString(),
          valueDecimals: e.valueDecimals,
          tag1: e.tag1,
          tag2: e.tag2,
          isRevoked: e.isRevoked,
        })),
        count: entries.length,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

const revokeFeedbackTool = defineTool({
  name: "revoke_feedback",
  description:
    "Revoke previously submitted feedback on the ERC-8004 Reputation Registry.",
  inputSchema: z.object({
    agentId: z.string().describe("The agent ID"),
    feedbackIndex: z.number().describe("The feedback index to revoke (1-based)"),
  }),
  handler: async ({ agentId, feedbackIndex }) => {
    try {
      const txHash = await revokeFeedback(BigInt(agentId), feedbackIndex);
      return {
        success: true,
        agentId,
        feedbackIndex,
        txHash,
        explorerUrl: `${ERC8004_EXPLORER_URL}/tx/${txHash}`,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

// ============================================================
// Validation Tools
// ============================================================

const getValidationStatusTool = defineTool({
  name: "get_validation_status",
  description:
    "Check the status of a validation request on the ERC-8004 Validation Registry.",
  inputSchema: z.object({
    requestHash: z.string().describe("The validation request hash (bytes32)"),
  }),
  handler: async ({ requestHash }) => {
    try {
      const status = await getValidationStatus(requestHash as `0x${string}`);
      return {
        success: true,
        validatorAddress: status.validatorAddress,
        agentId: status.agentId.toString(),
        response: status.response,
        responseHash: status.responseHash,
        tag: status.tag,
        lastUpdate: status.lastUpdate.toString(),
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

const getValidationSummaryTool = defineTool({
  name: "get_validation_summary",
  description:
    "Get validation summary for an agent from the ERC-8004 Validation Registry.",
  inputSchema: z.object({
    agentId: z.string().describe("The agent ID"),
    tag: z.string().optional().describe("Filter by validation tag"),
  }),
  handler: async ({ agentId, tag }) => {
    try {
      const summary = await getValidationSummary(BigInt(agentId), [], tag);
      return {
        success: true,
        agentId,
        count: summary.count,
        avgResponse: summary.avgResponse,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

// ============================================================
// Registration Info Tool
// ============================================================

const getRegistrationInfoTool = defineTool({
  name: "get_registration_info",
  description:
    "Get this agent's ERC-8004 registration file and on-chain status. Shows identity, services, and trust configuration.",
  inputSchema: z.object({}),
  handler: async () => {
    try {
      const config = getERC8004Config();
      const baseUrl = process.env.APP_URL || "http://localhost:3001";
      const registrationFile = buildRegistrationFile(baseUrl);

      let onChainStatus: Record<string, unknown> = { registered: false };
      if (config.agentId !== null) {
        const exists = await isAgentRegistered(config.agentId);
        if (exists) {
          const info = await getAgentInfo(config.agentId);
          onChainStatus = {
            registered: true,
            agentId: info.agentId.toString(),
            owner: info.owner,
            agentURI: info.agentURI,
            agentWallet: info.agentWallet,
          };
        }
      }

      return {
        success: true,
        registrationFile,
        onChainStatus,
        contracts: {
          identityRegistry: ERC8004_CONTRACTS.identityRegistry,
          reputationRegistry: ERC8004_CONTRACTS.reputationRegistry,
          validationRegistry: ERC8004_CONTRACTS.validationRegistry,
        },
        chain: `eip155:${ERC8004_CHAIN_ID}`,
        explorer: ERC8004_EXPLORER_URL,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
});

// ============================================================
// Register all ERC-8004 tools
// ============================================================

export function registerERC8004Tools(): void {
  // Identity (3)
  toolRegistry.register(registerAgentTool, "erc8004");
  toolRegistry.register(getAgentInfoTool, "erc8004");
  toolRegistry.register(setAgentMetadataTool, "erc8004");

  // Reputation (4)
  toolRegistry.register(giveFeedbackTool, "erc8004");
  toolRegistry.register(getReputationTool, "erc8004");
  toolRegistry.register(readFeedbackTool, "erc8004");
  toolRegistry.register(revokeFeedbackTool, "erc8004");

  // Validation (2)
  toolRegistry.register(getValidationStatusTool, "erc8004");
  toolRegistry.register(getValidationSummaryTool, "erc8004");

  // Registration (1)
  toolRegistry.register(getRegistrationInfoTool, "erc8004");

  console.log("[ERC-8004 Tools] Registered 10 tools (3 identity + 4 reputation + 2 validation + 1 registration)");
}
