/**
 * AgentCard Builder & Route Handler
 *
 * Builds and serves the AgentCard at /.well-known/agent.json
 * for A2A agent discovery.
 */

import { Request, Response } from "express";
import type { AgentCard } from "./types.js";
import {
  X402_EXTENSION_URI,
  AP2_EXTENSION_URI,
  ERC8004_EXTENSION_URI,
  X402_PAYMENT_METHOD,
  A2A_PROTOCOL_VERSION,
} from "./types.js";
import {
  getChainConfig,
  getChainMetadata,
  getAvailableTokens,
} from "../config/chain-config.js";
import { ERC8004_CONTRACTS, ERC8004_CHAIN_ID, getERC8004Config } from "../erc8004/config.js";

/**
 * Build the AgentCard for this server
 */
export function buildAgentCard(baseUrl: string): AgentCard {
  const chainConfig = getChainConfig();
  const chainMeta = getChainMetadata(chainConfig.network);
  const tokens = getAvailableTokens(chainConfig.network);
  const erc8004Config = getERC8004Config();

  return {
    name: "x402-merchant-agent",
    description:
      "Merchant agent for x402 Everything — supports crypto payments for digital products and resource access via the A2A x402 extension.",
    url: `${baseUrl}/a2a`,
    version: A2A_PROTOCOL_VERSION,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    skills: [
      {
        id: "purchase",
        name: "Product Purchase",
        description:
          "Purchase digital products from stores using on-chain crypto payments.",
        tags: ["shopping", "e-commerce", "payment"],
        examples: [
          "Buy product X from store Y",
          "Purchase item with crypto payment",
        ],
      },
      {
        id: "resource-access",
        name: "Resource Access",
        description:
          "Access payment-gated resources (APIs, files, content) with crypto micro-payments.",
        tags: ["resources", "api-access", "pay-per-use"],
        examples: [
          "Access premium content behind a paywall",
          "Unlock a resource with a micro-payment",
        ],
      },
      {
        id: "ap2-shopping",
        name: "AP2 Shopping Flow",
        description:
          "Full AP2 mandate-based shopping: receive IntentMandate, return CartMandate with W3C PaymentRequest, verify PaymentMandate with x402 proof, issue PaymentReceipt.",
        tags: ["ap2", "shopping", "mandates", "w3c-payment"],
        examples: [
          "Send IntentMandate with natural language description",
          "Submit PaymentMandate with on-chain transaction hash",
        ],
      },
      {
        id: "erc8004-trust",
        name: "On-Chain Trust & Reputation",
        description:
          "Verify agent identity and query on-chain reputation scores via ERC-8004 Trustless Agents registries on BITE V2 (zero gas).",
        tags: ["erc8004", "trust", "reputation", "identity"],
        examples: [
          "Check reputation of agent #42",
          "Submit feedback after successful payment",
        ],
      },
    ],
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    extensions: [
      {
        uri: X402_EXTENSION_URI,
        description:
          "x402 crypto payment extension — supports EVM on-chain payments",
        required: true,
        config: {
          supportedNetworks: [
            {
              network: chainConfig.network,
              chainId: chainConfig.chainId,
              name: chainMeta.name,
              rpcUrl: chainMeta.rpcUrl,
              isTestnet: chainConfig.isTestnet,
            },
          ],
          supportedTokens: tokens,
          defaultToken: chainConfig.currency,
          recipientAddress:
            process.env.X402_RECIPIENT_ADDRESS ||
            process.env.ETH_RECIPIENT_ADDRESS,
        },
      },
      {
        uri: AP2_EXTENSION_URI,
        description:
          "AP2 (Agent Payments Protocol) — supports mandate-based shopping with x402 as payment method",
        required: false,
        config: {
          roles: ["merchant"],
          supported_payment_methods: [X402_PAYMENT_METHOD],
          mandate_flow: [
            "IntentMandate → CartMandate",
            "PaymentMandate → PaymentReceipt",
          ],
        },
      },
      {
        uri: ERC8004_EXTENSION_URI,
        description:
          "ERC-8004 Trustless Agents — on-chain identity, reputation, and validation on BITE V2 (zero gas)",
        required: false,
        config: {
          chain: `eip155:${ERC8004_CHAIN_ID}`,
          identityRegistry: ERC8004_CONTRACTS.identityRegistry,
          reputationRegistry: ERC8004_CONTRACTS.reputationRegistry,
          validationRegistry: ERC8004_CONTRACTS.validationRegistry,
          agentId: erc8004Config.agentId?.toString() ?? null,
          registrationFile: `${baseUrl}/.well-known/agent-registration.json`,
          supportedTrust: ["reputation"],
        },
      },
    ],
    provider: {
      organization: "x402 Everything",
      url: process.env.FRONTEND_URL || "http://localhost:3000",
    },
  };
}

/**
 * Express handler for GET /.well-known/agent.json
 */
export function handleAgentCard(req: Request, res: Response) {
  const baseUrl =
    process.env.APP_URL ||
    `${req.protocol}://${req.get("host")}`;

  const card = buildAgentCard(baseUrl);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache
  return res.json(card);
}
