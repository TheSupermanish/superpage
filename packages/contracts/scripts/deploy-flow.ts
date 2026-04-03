/**
 * Deploy all Airaa contracts to Flow EVM Testnet.
 * Deploys: MockUSDC, IdentityRegistry, ReputationRegistry, ValidationRegistry
 *
 * Usage: npx tsx scripts/deploy-flow.ts
 *
 * Prerequisites:
 *   - Get testnet FLOW from https://faucet.flow.com/fund-account
 *   - Set DEPLOY_PRIVATE_KEY in backend/.env (EOA, not COA)
 */
import { createWalletClient, createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { flowTestnet } from "viem/chains";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../../backend/.env") });

const PRIVATE_KEY = (process.env.DEPLOY_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY) as `0x${string}`;
if (!PRIVATE_KEY) {
  console.error("No private key found. Set DEPLOY_PRIVATE_KEY in backend/.env");
  process.exit(1);
}

function loadArtifact(contractPath: string) {
  const artifactPath = resolve(__dirname, `../artifacts/contracts/${contractPath}`);
  return JSON.parse(readFileSync(artifactPath, "utf-8"));
}

async function main() {
  console.log("=== Deploying Airaa Contracts to Flow EVM Testnet (chainId: 545) ===\n");

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Deployer:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: flowTestnet,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: flowTestnet,
    transport: http(),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", formatUnits(balance, 18), "FLOW");

  if (balance === 0n) {
    console.error("\nNo FLOW balance! Get testnet FLOW from:");
    console.error("  https://faucet.flow.com/fund-account");
    process.exit(1);
  }

  // --- 1. Deploy MockUSDC ---
  console.log("\n[1/4] Deploying MockUSDC...");
  const musdcArtifact = loadArtifact("MockUSDC.sol/MockUSDC.json");

  const musdcHash = await walletClient.deployContract({
    abi: musdcArtifact.abi,
    bytecode: musdcArtifact.bytecode as `0x${string}`,
  });
  console.log("  tx:", musdcHash);

  const musdcReceipt = await publicClient.waitForTransactionReceipt({ hash: musdcHash });
  const musdcAddress = musdcReceipt.contractAddress!;
  console.log("  MockUSDC deployed:", musdcAddress);

  // Mint 1M mUSDC to deployer
  const mintAmount = BigInt(1_000_000) * BigInt(10 ** 6);
  console.log("  Minting 1,000,000 mUSDC to deployer...");
  const mintHash = await walletClient.writeContract({
    address: musdcAddress,
    abi: musdcArtifact.abi,
    functionName: "mint",
    args: [account.address, mintAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });

  // --- 2. Deploy IdentityRegistry ---
  console.log("\n[2/4] Deploying IdentityRegistry...");
  const identityArtifact = loadArtifact("erc8004/IdentityRegistry.sol/IdentityRegistry.json");

  const identityHash = await walletClient.deployContract({
    abi: identityArtifact.abi,
    bytecode: identityArtifact.bytecode as `0x${string}`,
  });
  console.log("  tx:", identityHash);

  const identityReceipt = await publicClient.waitForTransactionReceipt({ hash: identityHash });
  const identityAddress = identityReceipt.contractAddress!;
  console.log("  IdentityRegistry deployed:", identityAddress);

  // --- 3. Deploy ReputationRegistry ---
  console.log("\n[3/4] Deploying ReputationRegistry...");
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

  // --- 4. Deploy ValidationRegistry ---
  console.log("\n[4/4] Deploying ValidationRegistry...");
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

  const musdcBalance = await publicClient.readContract({
    address: musdcAddress,
    abi: musdcArtifact.abi,
    functionName: "balanceOf",
    args: [account.address],
  }) as bigint;
  console.log("  MockUSDC deployer balance:", formatUnits(musdcBalance, 6), "mUSDC");

  const repIdentity = await publicClient.readContract({
    address: reputationAddress,
    abi: reputationArtifact.abi,
    functionName: "getIdentityRegistry",
  });
  console.log("  ReputationRegistry -> IdentityRegistry:", repIdentity);

  const valIdentity = await publicClient.readContract({
    address: validationAddress,
    abi: validationArtifact.abi,
    functionName: "getIdentityRegistry",
  });
  console.log("  ValidationRegistry -> IdentityRegistry:", valIdentity);

  // --- Summary ---
  const explorer = "https://evm-testnet.flowscan.io/address";
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYED TO FLOW EVM TESTNET (chainId: 545)");
  console.log("=".repeat(60));
  console.log(`  MockUSDC:           ${musdcAddress}`);
  console.log(`  IdentityRegistry:   ${identityAddress}`);
  console.log(`  ReputationRegistry: ${reputationAddress}`);
  console.log(`  ValidationRegistry: ${validationAddress}`);
  console.log(`\nExplorer:`);
  console.log(`  ${explorer}/${musdcAddress}`);
  console.log(`  ${explorer}/${identityAddress}`);
  console.log(`  ${explorer}/${reputationAddress}`);
  console.log(`  ${explorer}/${validationAddress}`);
  console.log(`\n--- Next steps ---`);
  console.log(`1. Update USDC address in all chain configs for "flow-testnet"`);
  console.log(`2. Set X402_CHAIN=flow-testnet in backend/.env`);
  console.log(`3. Set NEXT_PUBLIC_X402_CHAIN=flow-testnet in frontend/.env`);
  console.log(`4. Update ERC8004 contract addresses if using Flow for identity`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
