import { createWalletClient, createPublicClient, http, defineChain, formatUnits, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
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

const contractAddress = process.env.MUSDC_ADDRESS as `0x${string}`;
if (!contractAddress) {
  console.error("Set MUSDC_ADDRESS env var to the deployed mUSDC contract address");
  process.exit(1);
}

const mintTo = process.env.MINT_TO as `0x${string}`;
if (!mintTo) {
  console.error("Set MINT_TO env var to the recipient address");
  process.exit(1);
}

const amount = process.env.MINT_AMOUNT || "10000"; // Default 10,000 mUSDC

const biteV2Sandbox = defineChain({
  id: 103698795,
  name: "BITE V2 Sandbox 2",
  network: "bite-v2-sandbox",
  nativeCurrency: { decimals: 18, name: "sFUEL", symbol: "sFUEL" },
  rpcUrls: {
    default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
  },
  blockExplorers: {
    default: { name: "BITE Explorer", url: "https://bite-v2-sandbox.explorer.testnet.skalenodes.com:10032" },
  },
  testnet: true,
});

const artifactPath = resolve(__dirname, "../artifacts/contracts/MockUSDC.sol/MockUSDC.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);

  const walletClient = createWalletClient({
    account,
    chain: biteV2Sandbox,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: biteV2Sandbox,
    transport: http(),
  });

  const mintAmount = parseUnits(amount, 6);
  console.log(`Minting ${amount} mUSDC to ${mintTo}...`);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "mint",
    args: [mintTo, mintAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const balance = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "balanceOf",
    args: [mintTo],
  }) as bigint;

  console.log(`Done! Balance: ${formatUnits(balance, 6)} mUSDC`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
