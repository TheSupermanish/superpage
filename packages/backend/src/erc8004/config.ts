/**
 * ERC-8004 Configuration
 *
 * Contract addresses and chain config for the ERC-8004 Trustless Agents
 * registries deployed on Initia Testnet (MiniEVM).
 */

export const ERC8004_CHAIN_ID = 3120269331257541; // local-rollup-1 MiniEVM
export const ERC8004_NETWORK = "initia-testnet" as const;
export const ERC8004_RPC_URL = process.env.INITIA_RPC_URL || "http://0.0.0.0:8545";
export const ERC8004_EXPLORER_URL = "https://scan.testnet.initia.xyz";

// Contract addresses — will be set after deployment to Initia MiniEVM
export const ERC8004_CONTRACTS = {
  identityRegistry: (process.env.ERC8004_IDENTITY_REGISTRY || "0x4c40c94680ad6a137e033356a3fccd6eb1b2d02d") as `0x${string}`,
  reputationRegistry: (process.env.ERC8004_REPUTATION_REGISTRY || "0x0aa5c9ddda3d7d0d3f3415d31fa495a3a1f83847") as `0x${string}`,
  validationRegistry: (process.env.ERC8004_VALIDATION_REGISTRY || "0x1027c50cf44a931c41740fa2114c0c4f9719235e") as `0x${string}`,
} as const;

export const ERC8004_EXTENSION_URI = "urn:eip:8004:trustless-agents";

export interface ERC8004Config {
  agentId: bigint | null;
  registrationUri: string;
  walletPrivateKey: string | undefined;
}

export function getERC8004Config(): ERC8004Config {
  const baseUrl = process.env.APP_URL || "http://localhost:3001";
  return {
    agentId: process.env.ERC8004_AGENT_ID ? BigInt(process.env.ERC8004_AGENT_ID) : null,
    registrationUri: process.env.ERC8004_REGISTRATION_URI || `${baseUrl}/.well-known/agent-registration.json`,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY,
  };
}
