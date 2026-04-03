/**
 * ERC-8004 Registration File Builder & Handler
 *
 * Builds and serves the agent registration file at
 * /.well-known/agent-registration.json per the ERC-8004 spec.
 */

import { Request, Response } from "express";
import { ERC8004_CONTRACTS, ERC8004_CHAIN_ID, getERC8004Config } from "./config.js";
import type { RegistrationFile } from "./types.js";

/**
 * Build the ERC-8004 registration file for this agent.
 */
export function buildRegistrationFile(baseUrl: string): RegistrationFile {
  const config = getERC8004Config();

  const registrations = config.agentId !== null
    ? [{
        agentId: Number(config.agentId),
        agentRegistry: `eip155:${ERC8004_CHAIN_ID}:${ERC8004_CONTRACTS.identityRegistry}`,
      }]
    : [];

  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "Airaa Merchant Agent",
    description:
      "Merchant agent for Airaa x402 — supports crypto payments for digital products and resource access via A2A and MCP protocols.",
    services: [
      {
        name: "A2A",
        endpoint: `${baseUrl}/.well-known/agent.json`,
        version: "0.3.0",
      },
      {
        name: "MCP",
        endpoint: `${baseUrl}/mcp/universal`,
        version: "2025-06-18",
      },
      {
        name: "web",
        endpoint: process.env.FRONTEND_URL || "http://localhost:3000",
      },
    ],
    x402Support: true,
    active: true,
    registrations,
    supportedTrust: ["reputation"],
  };
}

/**
 * Express handler for GET /.well-known/agent-registration.json
 */
export function handleRegistrationFile(req: Request, res: Response) {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const registrationFile = buildRegistrationFile(baseUrl);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(JSON.stringify(registrationFile, null, 2));
}
