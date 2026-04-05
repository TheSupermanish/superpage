/**
 * On-chain wallet for making ERC20 payments.
 * Uses viem to interact with BITE V2 Sandbox.
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  defineChain,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { AgentConfig } from "./config.js";

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export class Wallet {
  public address: Address;
  private account;
  private publicClient;
  private walletClient;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.account = privateKeyToAccount(config.walletPrivateKey);
    this.address = this.account.address;

    const chain = defineChain({
      id: config.chainId,
      name: "InitPage Rollup",
      nativeCurrency: { decimals: 18, name: "GAS", symbol: "GAS" },
      rpcUrls: {
        default: { http: [config.rpcUrl] },
      },
      testnet: true,
    });

    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });
    this.walletClient = createWalletClient({
      account: this.account,
      chain,
      transport: http(config.rpcUrl),
    });
  }

  /** Get USDC balance in human-readable format */
  async getUsdcBalance(): Promise<string> {
    const balance = await this.publicClient.readContract({
      address: this.config.usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [this.address],
    });
    return formatUnits(balance as bigint, 6);
  }

  /** Transfer USDC to a recipient. Amount in base units (6 decimals). */
  async transferUsdc(to: Address, amountBaseUnits: string): Promise<Hash> {
    const amount = BigInt(amountBaseUnits);

    return this.walletClient.writeContract({
      address: this.config.usdcAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, amount],
      account: this.account,
      gas: BigInt(500000),
    });
  }

  /** Wait for a transaction to be confirmed */
  async waitForTx(hash: Hash): Promise<boolean> {
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 0,
    });
    return receipt.status === "success";
  }

  /** Format base units to display amount */
  formatUsdc(baseUnits: string): string {
    return formatUnits(BigInt(baseUnits), 6);
  }

  /** Sign an arbitrary message with the wallet's private key (EIP-191) */
  async signMessage(message: string): Promise<`0x${string}`> {
    return this.account.signMessage({ message });
  }
}
