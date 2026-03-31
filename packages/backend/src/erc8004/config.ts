/**
 * ERC-8004 Configuration
 *
 * Contract addresses and chain config for the ERC-8004 Trustless Agents
 * registries deployed on Flow EVM Testnet (chainId: 545).
 */

export const ERC8004_CHAIN_ID = 545;
export const ERC8004_NETWORK = "flow-testnet" as const;
export const ERC8004_RPC_URL = "https://testnet.evm.nodes.onflow.org";
export const ERC8004_EXPLORER_URL = "https://evm-testnet.flowscan.io";

export const ERC8004_CONTRACTS = {
  identityRegistry: "0xbdf0ae617ac3570795b9b18ece6fd85444c6a918" as `0x${string}`,
  reputationRegistry: "0xf0aab3cfc4dc5e335faeb0b95a934af994073b95" as `0x${string}`,
  validationRegistry: "0x0bfff9626f409639c8501c14813ddba6f30d5a99" as `0x${string}`,
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
