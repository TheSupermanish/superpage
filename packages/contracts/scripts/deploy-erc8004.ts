/**
 * Deploy ERC-8004 contracts (Identity, Reputation, Validation) to SKALE Base Sepolia.
 *
 * Usage: npx tsx scripts/deploy-erc8004.ts
 */
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load env from backend
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../backend/.env") });

const PRIVATE_KEY = (process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY) as `0x${string}`;
if (!PRIVATE_KEY) {
  console.error("No private key found. Set WALLET_PRIVATE_KEY or ETH_PRIVATE_KEY in backend/.env");
  process.exit(1);
}

// BITE V2 Sandbox (SKALE) - zero gas, EVM Istanbul
const biteV2Sandbox = defineChain({
  id: 103698795,
  name: "BITE V2 Sandbox 2",
  network: "bite-v2-sandbox",
  nativeCurrency: { decimals: 18, name: "sFUEL", symbol: "sFUEL" },
  rpcUrls: {
    default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
  },
  blockExplorers: {
    default: { name: "BITE Explorer", url: "https://base-sepolia-testnet-explorer.skalenodes.com:10032" },
  },
  testnet: true,
  fees: {
    defaultPriorityFee: () => BigInt(0),
  },
});

function loadArtifact(contractPath: string) {
  const artifactPath = resolve(__dirname, `../artifacts/contracts/${contractPath}`);
  return JSON.parse(readFileSync(artifactPath, "utf-8"));
}

async function main() {
  console.log("=== Deploying ERC-8004 Contracts to BITE V2 Sandbox ===\n");

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Deployer:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: biteV2Sandbox,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: biteV2Sandbox,
    transport: http(),
  });

  // --- 1. Deploy IdentityRegistry ---
  console.log("\n[1/3] Deploying IdentityRegistry...");
  const identityArtifact = loadArtifact("erc8004/IdentityRegistry.sol/IdentityRegistry.json");

  const identityHash = await walletClient.deployContract({
    abi: identityArtifact.abi,
    bytecode: identityArtifact.bytecode as `0x${string}`,
  });
  console.log("  tx:", identityHash);

  const identityReceipt = await publicClient.waitForTransactionReceipt({ hash: identityHash });
  const identityAddress = identityReceipt.contractAddress!;
  console.log("  IdentityRegistry deployed:", identityAddress);

  // --- 2. Deploy ReputationRegistry (needs identityRegistry address) ---
  console.log("\n[2/3] Deploying ReputationRegistry...");
  const reputationArtifact = loadArtifact("erc8004/ReputationRegistry.sol/ReputationRegistry.json");

  const reputationHash = await walletClient.deployContract({
    abi: reputationArtifact.abi,
    bytecode: reputationArtifact.bytecode as `0x${string}`,
    args: [identityAddress],
  });
  console.log("  tx:", reputationHash);

  const reputationReceipt = await publicClient.waitForTransactionReceipt({ hash: reputationHash });
  const reputationAddress = reputationReceipt.contractAddress!;
  console.log("  ReputationRegistry deployed:", reputationAddress);

  // --- 3. Deploy ValidationRegistry (needs identityRegistry address) ---
  console.log("\n[3/3] Deploying ValidationRegistry...");
  const validationArtifact = loadArtifact("erc8004/ValidationRegistry.sol/ValidationRegistry.json");

  const validationHash = await walletClient.deployContract({
    abi: validationArtifact.abi,
    bytecode: validationArtifact.bytecode as `0x${string}`,
    args: [identityAddress],
  });
  console.log("  tx:", validationHash);

  const validationReceipt = await publicClient.waitForTransactionReceipt({ hash: validationHash });
  const validationAddress = validationReceipt.contractAddress!;
  console.log("  ValidationRegistry deployed:", validationAddress);

  // --- Verify ---
  console.log("\n=== Verifying deployments ===");

  // Check ReputationRegistry links to IdentityRegistry
  const repIdentity = await publicClient.readContract({
    address: reputationAddress,
    abi: reputationArtifact.abi,
    functionName: "getIdentityRegistry",
  });
  console.log("  ReputationRegistry.getIdentityRegistry():", repIdentity);

  const valIdentity = await publicClient.readContract({
    address: validationAddress,
    abi: validationArtifact.abi,
    functionName: "getIdentityRegistry",
  });
  console.log("  ValidationRegistry.getIdentityRegistry():", valIdentity);

  // --- Summary ---
  const explorer = "https://base-sepolia-testnet-explorer.skalenodes.com:10032/address";
  console.log("\n=== Deployed ERC-8004 on BITE V2 (chainId: 103698795) ===");
  console.log(`  IdentityRegistry:   ${identityAddress}`);
  console.log(`  ReputationRegistry: ${reputationAddress}`);
  console.log(`  ValidationRegistry: ${validationAddress}`);
  console.log(`\nExplorer links:`);
  console.log(`  ${explorer}/${identityAddress}`);
  console.log(`  ${explorer}/${reputationAddress}`);
  console.log(`  ${explorer}/${validationAddress}`);
  console.log(`\nUpdate packages/backend/src/erc8004/config.ts with these addresses!`);
  console.log(`Also update ERC8004_CHAIN_ID to 103698795 and client.ts to use BITE V2 chain.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
