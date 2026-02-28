import { createWalletClient, createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
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

// Load compiled artifact
const artifactPath = resolve(__dirname, "../artifacts/contracts/MockUSDC.sol/MockUSDC.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

async function main() {
  console.log("=== Deploying MockUSDC (mUSDC) to Base Sepolia ===\n");

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Deployer:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Check deployer ETH balance (need gas on Base Sepolia)
  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log("ETH balance:", formatUnits(ethBalance, 18), "ETH");
  if (ethBalance === 0n) {
    console.error("\nNo ETH on Base Sepolia! Get some from https://www.alchemy.com/faucets/base-sepolia");
    process.exit(1);
  }

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
  console.log("Explorer:", `https://sepolia.basescan.org/address/${contractAddress}`);

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

  console.log(`\n=== Deployed ===`);
  console.log(`Name: Mock USDC`);
  console.log(`Symbol: mUSDC`);
  console.log(`Decimals: 6`);
  console.log(`Chain: Base Sepolia (84532)`);
  console.log(`Deployer balance: ${formatUnits(balance, 6)} mUSDC`);
  console.log(`\nContract address: ${contractAddress}`);
  console.log(`\nUpdate this address in:`);
  console.log(`  - packages/backend/src/config/chain-config.ts`);
  console.log(`  - packages/frontend/hooks/use-x402-payment.ts`);
  console.log(`  - packages/frontend/app/faucet/page.tsx`);
  console.log(`  - packages/mcp-client/superpage-x402.js`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
