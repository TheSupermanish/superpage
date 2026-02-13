import { createWalletClient, createPublicClient, http, defineChain, formatUnits } from "viem";
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

// BITE V2 Sandbox (SKALE) - zero gas
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

// Load compiled artifact
const artifactPath = resolve(__dirname, "../artifacts/contracts/MockUSDC.sol/MockUSDC.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

async function main() {
  console.log("=== Deploying MockUSDC (mUSDC) to BITE V2 Sandbox ===\n");

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

  // Deploy
  console.log("\nDeploying MockUSDC contract...");
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
  });

  console.log("Deploy tx:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress!;

  console.log("\nmUSDC deployed to:", contractAddress);
  console.log("Explorer:", `https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/${contractAddress}`);

  // Mint 1,000,000 mUSDC to deployer
  const mintAmount = BigInt(1_000_000) * BigInt(10 ** 6); // 1M with 6 decimals
  console.log("\nMinting 1,000,000 mUSDC to deployer...");
  const mintHash = await walletClient.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "mint",
    args: [account.address, mintAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });

  // Also mint to recipient if configured
  const recipientAddress = process.env.X402_RECIPIENT_ADDRESS || process.env.ETH_RECIPIENT_ADDRESS;
  if (recipientAddress && recipientAddress.toLowerCase() !== account.address.toLowerCase()) {
    console.log(`Minting 1,000,000 mUSDC to recipient ${recipientAddress}...`);
    const mintHash2 = await walletClient.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: "mint",
      args: [recipientAddress as `0x${string}`, mintAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash2 });
  }

  // Verify
  const balance = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "balanceOf",
    args: [account.address],
  }) as bigint;

  const name = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "name",
  });

  const symbol = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "symbol",
  });

  const decimals = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "decimals",
  });

  console.log(`\n=== Deployed ===`);
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Deployer balance: ${formatUnits(balance, 6)} mUSDC`);
  console.log(`\nContract address: ${contractAddress}`);
  console.log(`\nUpdate this address in your chain configs!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
