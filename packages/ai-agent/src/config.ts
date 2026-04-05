/**
 * Agent Configuration
 *
 * Loads and validates environment variables for the AI agent.
 */
import "dotenv/config";

export interface AgentConfig {
  // LLM
  llmProvider: "anthropic" | "openai" | "google";
  llmModel: string;
  llmApiKey: string;

  // Merchant
  merchantUrl: string;

  // Wallet
  walletPrivateKey: `0x${string}`;

  // Chain
  network: string;
  chainId: number;
  rpcUrl: string;
  usdcAddress: `0x${string}`;

  // ERC-8004 Trustless Identity
  erc8004AgentId?: string;

  // Behavior
  maxSteps: number;
  autoApprovePayments: boolean;
  verbose: boolean;
}

export function loadConfig(): AgentConfig {
  const provider = (process.env.LLM_PROVIDER || "anthropic") as
    | "anthropic"
    | "openai"
    | "google";

  const apiKeyMap: Record<string, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
  };
  const envVarMap: Record<string, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    google: "GOOGLE_GENERATIVE_AI_API_KEY",
  };

  const llmApiKey = apiKeyMap[provider];
  if (!llmApiKey) {
    throw new Error(`Missing API key: set ${envVarMap[provider]}`);
  }

  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
  if (!walletPrivateKey?.startsWith("0x")) {
    throw new Error("WALLET_PRIVATE_KEY must be set (0x-prefixed hex)");
  }

  return {
    llmProvider: provider,
    llmModel:
      process.env.LLM_MODEL ||
      ({ anthropic: "claude-sonnet-4-20250514", openai: "gpt-4o", google: "gemini-2.5-flash-lite" }[provider] ?? "claude-sonnet-4-20250514"),
    llmApiKey,
    merchantUrl: process.env.MERCHANT_URL || "http://localhost:1337",
    walletPrivateKey: walletPrivateKey as `0x${string}`,
    network: process.env.X402_CHAIN || "initia-testnet",
    chainId: parseInt(process.env.CHAIN_ID || "3981013683081008", 10),
    rpcUrl:
      process.env.RPC_URL || "http://0.0.0.0:8545",
    usdcAddress:
      (process.env.USDC_ADDRESS || "0x06d1a12b351cab22727515c1f4fec2544f42d751") as `0x${string}`,
    erc8004AgentId: process.env.ERC8004_AGENT_ID || undefined,
    maxSteps: parseInt(process.env.MAX_STEPS || "20", 10),
    autoApprovePayments: process.env.AUTO_APPROVE_PAYMENTS === "true",
    verbose: process.env.VERBOSE !== "false",
  };
}
