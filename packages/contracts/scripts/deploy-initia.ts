/**
 * Deploy all contracts to Initia Testnet (MiniEVM):
 *   1. MockUSDC (payment token)
 *   2. IdentityRegistry (ERC-8004)
 *   3. ReputationRegistry (ERC-8004)
 *   4. ValidationRegistry (ERC-8004)
 *
 * Usage: npx tsx scripts/deploy-initia.ts
 *
 * Requires:
 *   - WALLET_PRIVATE_KEY in backend/.env
 *   - INITIA_RPC_URL in backend/.env (defaults to testnet JSON-RPC)
 *   - Wallet funded with INIT tokens for gas
 */
import { createWalletClient, createPublicClient, http, defineChain, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../backend/.env") });

const PRIVATE_KEY = (process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY) as `0x${string}`;
if (!PRIVATE_KEY) {
  console.error("No private key found. Set WALLET_PRIVATE_KEY or ETH_PRIVATE_KEY in backend/.env");
  process.exit(1);
}

const RPC_URL = process.env.INITIA_RPC_URL || "http://0.0.0.0:8545";
const CHAIN_ID = parseInt(process.env.INITIA_CHAIN_ID || "3981013683081008");
const EXPLORER_URL = process.env.INITIA_EXPLORER_URL || "https://scan.testnet.initia.xyz";

// Initia Testnet MiniEVM chain definition
const initiaTestnet = defineChain({
  id: CHAIN_ID,
  name: "Initia Testnet (MiniEVM)",
  nativeCurrency: { decimals: 18, name: "INIT", symbol: "INIT" },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Initia Scan", url: EXPLORER_URL },
  },
  testnet: true,
});

function loadArtifact(contractPath: string) {
  const artifactPath = resolve(__dirname, `../artifacts/contracts/${contractPath}`);
  return JSON.parse(readFileSync(artifactPath, "utf-8"));
}

async function main() {
  console.log("=== Deploying Airaa Contracts to Initia Testnet (MiniEVM) ===\n");
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Chain ID: ${CHAIN_ID}`);

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Deployer: ${account.address}\n`);

  const walletClient = createWalletClient({
    account,
    chain: initiaTestnet,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: initiaTestnet,
    transport: http(),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${formatUnits(balance, 18)} INIT`);
  if (balance === 0n) {
    console.error("\nERROR: Deployer has no INIT. Fund it from https://faucet.testnet.initia.xyz/");
    process.exit(1);
  }

  const deployed: Record<string, string> = {};

  // --- 1. Deploy MockUSDC ---
  console.log("\n[1/4] Deploying MockUSDC...");
  const musdcArtifact = loadArtifact("MockUSDC.sol/MockUSDC.json");
  const musdcHash = await walletClient.deployContract({
    abi: musdcArtifact.abi,
    bytecode: musdcArtifact.bytecode as `0x${string}`,
  });
  console.log(`  tx: ${musdcHash}`);
  const musdcReceipt = await publicClient.waitForTransactionReceipt({ hash: musdcHash });
  deployed.mockUSDC = musdcReceipt.contractAddress!;
  console.log(`  MockUSDC: ${deployed.mockUSDC}`);

  // Mint 1M mUSDC to deployer
  const mintAmount = BigInt(1_000_000) * BigInt(10 ** 6);
  console.log("  Minting 1,000,000 mUSDC to deployer...");
  const mintHash = await walletClient.writeContract({
    address: deployed.mockUSDC as `0x${string}`,
    abi: musdcArtifact.abi,
    functionName: "mint",
    args: [account.address, mintAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });

  // --- 2. Deploy IdentityRegistry ---
  console.log("\n[2/4] Deploying IdentityRegistry (ERC-8004)...");
  const identityArtifact = loadArtifact("erc8004/IdentityRegistry.sol/IdentityRegistry.json");
  const identityHash = await walletClient.deployContract({
    abi: identityArtifact.abi,
    bytecode: identityArtifact.bytecode as `0x${string}`,
  });
  console.log(`  tx: ${identityHash}`);
  const identityReceipt = await publicClient.waitForTransactionReceipt({ hash: identityHash });
  deployed.identityRegistry = identityReceipt.contractAddress!;
  console.log(`  IdentityRegistry: ${deployed.identityRegistry}`);

  // --- 3. Deploy ReputationRegistry ---
  console.log("\n[3/4] Deploying ReputationRegistry (ERC-8004)...");
  const reputationArtifact = loadArtifact("erc8004/ReputationRegistry.sol/ReputationRegistry.json");
  const reputationHash = await walletClient.deployContract({
    abi: reputationArtifact.abi,
    bytecode: reputationArtifact.bytecode as `0x${string}`,
    args: [deployed.identityRegistry as `0x${string}`],
  });
  console.log(`  tx: ${reputationHash}`);
  const reputationReceipt = await publicClient.waitForTransactionReceipt({ hash: reputationHash });
  deployed.reputationRegistry = reputationReceipt.contractAddress!;
  console.log(`  ReputationRegistry: ${deployed.reputationRegistry}`);

  // --- 4. Deploy ValidationRegistry ---
  console.log("\n[4/4] Deploying ValidationRegistry (ERC-8004)...");
  const validationArtifact = loadArtifact("erc8004/ValidationRegistry.sol/ValidationRegistry.json");
  const validationHash = await walletClient.deployContract({
    abi: validationArtifact.abi,
    bytecode: validationArtifact.bytecode as `0x${string}`,
    args: [deployed.identityRegistry as `0x${string}`],
  });
  console.log(`  tx: ${validationHash}`);
  const validationReceipt = await publicClient.waitForTransactionReceipt({ hash: validationHash });
  deployed.validationRegistry = validationReceipt.contractAddress!;
  console.log(`  ValidationRegistry: ${deployed.validationRegistry}`);

  // --- Save deployed addresses ---
  const addressesPath = resolve(__dirname, "../deployed-addresses-initia.json");
  writeFileSync(addressesPath, JSON.stringify({
    network: "initia-testnet",
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    deployer: account.address,
    deployedAt: new Date().toISOString(),
    contracts: deployed,
  }, null, 2));

  // --- Summary ---
  console.log("\n=== ALL CONTRACTS DEPLOYED ===");
  console.log(`  MockUSDC:           ${deployed.mockUSDC}`);
  console.log(`  IdentityRegistry:   ${deployed.identityRegistry}`);
  console.log(`  ReputationRegistry: ${deployed.reputationRegistry}`);
  console.log(`  ValidationRegistry: ${deployed.validationRegistry}`);
  console.log(`\nAddresses saved to: ${addressesPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Update INITIA_USDC_ADDRESS=${deployed.mockUSDC} in backend/.env`);
  console.log(`  2. Update ERC8004 addresses in backend/.env`);
  console.log(`  3. Update frontend chain-config.ts with USDC address`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
