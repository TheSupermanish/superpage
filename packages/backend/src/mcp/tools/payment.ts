/**
 * Payment MCP Tools
 * 
 * Tools for EVM blockchain payments: transfers, balances, config
 */

import { z } from "zod";
import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  encodeFunctionData,
  type Hash,
} from "viem";
import { toolRegistry, defineTool } from "../tool-registry.js";
import {
  getChainConfig,
  getChainMetadata,
  isValidNetwork,
  getTokenAddress,
  getAvailableTokens,
  isNativeToken,
  getSupportedNetworks,
  type NetworkId,
  type TokenSymbol,
} from "../../config/chain-config.js";

// ERC20 ABI
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
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

// ============================================================
// Tool Definitions
// ============================================================

const makePaymentTool = defineTool({
  name: "make_payment",
  description: "Make a payment on EVM chains. Supports native tokens and ERC20 tokens (USDC, USDT, etc).",
  inputSchema: z.object({
    recipientAddress: z.string().describe("EVM wallet address to send tokens to (0x...)"),
    amount: z.string().describe("Amount in base units (e.g., 10000 for 0.01 USDC with 6 decimals)"),
    network: z.string().optional().describe("Network ID (e.g. base-sepolia, bite-v2-sandbox, base, mainnet). Defaults to configured network."),
    token: z.string().optional().describe("Token symbol: USDC, ETH, etc. Defaults to configured currency."),
  }),
  handler: async ({ recipientAddress, amount, network: networkArg, token: tokenArg }) => {
    console.log(`[make_payment] 💳 Starting EVM payment...`);

    const chainConfig = getChainConfig();
    const network = networkArg || chainConfig.network;
    const token = tokenArg || chainConfig.currency;

    if (!recipientAddress) {
      return { success: false, error: "Missing required parameter: recipientAddress" };
    }
    if (!amount) {
      return { success: false, error: "Missing required parameter: amount" };
    }

    const privateKey = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
    if (!privateKey) {
      return { success: false, error: "WALLET_PRIVATE_KEY not configured on server" };
    }

    try {
      if (!isValidNetwork(network)) {
        return { success: false, error: `Unsupported network: ${network}. Supported: ${getSupportedNetworks().join(", ")}` };
      }

      const chainMeta = getChainMetadata(network as NetworkId);

      console.log(`[make_payment] 🌐 Network: ${network} (Chain ID: ${chainMeta.chainId})`);
      console.log(`[make_payment] 💰 Token: ${token}`);
      console.log(`[make_payment] 📍 Recipient: ${recipientAddress}`);
      console.log(`[make_payment] 💵 Amount: ${amount} base units`);

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      console.log(`[make_payment] 🔑 Wallet: ${account.address}`);

      const publicClient = createPublicClient({
        transport: http(chainMeta.rpcUrl),
      });

      const walletClient = createWalletClient({
        account,
        chain: {
          id: chainMeta.chainId,
          name: chainMeta.name,
          nativeCurrency: {
            name: chainMeta.nativeToken.symbol,
            symbol: chainMeta.nativeToken.symbol,
            decimals: chainMeta.nativeToken.decimals,
          },
          rpcUrls: {
            default: { http: [chainMeta.rpcUrl] },
          },
        },
        transport: http(chainMeta.rpcUrl),
      });

      let txHash: Hash;
      const amountBigInt = BigInt(amount);

      // Native token transfer
      if (isNativeToken(token as TokenSymbol) || token === "NATIVE") {
        console.log(`[make_payment] 📤 Sending native token (${chainMeta.nativeToken.symbol})...`);

        txHash = await walletClient.sendTransaction({
          to: recipientAddress as `0x${string}`,
          value: amountBigInt,
        });
      } else {
        // ERC20 token transfer
        const tokenAddress = getTokenAddress(network as NetworkId, token as TokenSymbol);
        if (!tokenAddress) {
          return { 
            success: false, 
            error: `Token ${token} not available on ${network}. Available: ${getAvailableTokens(network as NetworkId).join(", ")}` 
          };
        }

        console.log(`[make_payment] 📤 Sending ERC20 token...`);
        console.log(`[make_payment] 📜 Token contract: ${tokenAddress}`);

        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipientAddress as `0x${string}`, amountBigInt],
        });

        txHash = await walletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data,
          value: 0n,
        });
      }

      console.log(`[make_payment] ✅ Transaction sent: ${txHash}`);

      // Wait for confirmation
      console.log(`[make_payment] ⏳ Waiting for confirmation...`);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        return {
          success: false,
          error: "Transaction reverted on-chain",
          transactionHash: txHash,
        };
      }

      console.log(`[make_payment] ✅ Confirmed in block ${receipt.blockNumber}`);

      // Create payment proof
      const paymentProof = {
        transactionHash: txHash,
        network,
        chainId: chainMeta.chainId,
        timestamp: Date.now(),
      };

      const decimals = token === "USDC" || token === "USDT" ? 6 : 18;
      const amountFormatted = formatUnits(amountBigInt, decimals);

      return {
        success: true,
        paymentProof,
        details: {
          transactionHash: txHash,
          blockNumber: receipt.blockNumber.toString(),
          recipientAddress,
          amount,
          amountFormatted: `${amountFormatted} ${token}`,
          network,
          chainId: chainMeta.chainId,
          token,
          confirmedAt: new Date().toISOString(),
          explorerUrl: `${chainMeta.explorerUrl}/tx/${txHash}`,
        },
        message: `Payment of ${amountFormatted} ${token} sent successfully. Use paymentProof to finalize checkout.`,
      };
    } catch (err: any) {
      console.error(`[make_payment] ❌ Payment failed:`, err.message);
      return {
        success: false,
        error: err.message,
        hint: "Check wallet balance and gas. Make sure network RPC is accessible.",
      };
    }
  },
});

const getBalanceTool = defineTool({
  name: "get_balance",
  description: "Check wallet balance for native tokens or ERC20 tokens (USDC, etc)",
  inputSchema: z.object({
    address: z.string().optional().describe("Wallet address to check. Defaults to configured wallet."),
    token: z.string().optional().describe("Token symbol: USDC, ETH, NATIVE, etc. Defaults to USDC."),
    network: z.string().optional().describe("Network to check balance on. Defaults to configured network."),
  }),
  handler: async ({ address, token = "USDC", network: networkArg }) => {
    const chainConfig = getChainConfig();
    const network = networkArg || chainConfig.network;

    const privateKey = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
    const walletAddress = address || (privateKey ? privateKeyToAccount(privateKey as `0x${string}`).address : null);

    if (!walletAddress) {
      return { success: false, error: "No wallet address provided or configured" };
    }

    try {
      if (!isValidNetwork(network)) {
        return { success: false, error: `Unsupported network: ${network}` };
      }

      const chainMeta = getChainMetadata(network as NetworkId);

      const publicClient = createPublicClient({
        transport: http(chainMeta.rpcUrl),
      });

      // Native balance
      if (isNativeToken(token as TokenSymbol) || token === "NATIVE") {
        const balance = await publicClient.getBalance({
          address: walletAddress as `0x${string}`,
        });

        return {
          success: true,
          address: walletAddress,
          token: chainMeta.nativeToken.symbol,
          balance: balance.toString(),
          balanceFormatted: `${formatUnits(balance, 18)} ${chainMeta.nativeToken.symbol}`,
          network,
          chainId: chainMeta.chainId,
        };
      }

      // ERC20 balance
      const tokenAddress = getTokenAddress(network as NetworkId, token as TokenSymbol);
      if (!tokenAddress) {
        return { 
          success: false, 
          error: `Token ${token} not available on ${network}`,
          availableTokens: getAvailableTokens(network as NetworkId),
        };
      }

      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });

      const decimals = token === "USDC" || token === "USDT" ? 6 : 18;

      return {
        success: true,
        address: walletAddress,
        token,
        tokenAddress,
        balance: (balance as bigint).toString(),
        balanceFormatted: `${formatUnits(balance as bigint, decimals)} ${token}`,
        network,
        chainId: chainMeta.chainId,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  },
});

const getConfigTool = defineTool({
  name: "get_config",
  description: "Get current chain and payment configuration including supported networks and tokens",
  inputSchema: z.object({}),
  handler: async () => {
    const chainConfig = getChainConfig();

    let chainMeta;
    try {
      chainMeta = getChainMetadata(chainConfig.network);
    } catch {
      chainMeta = null;
    }

    const privateKey = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
    const walletAddress = privateKey ? privateKeyToAccount(privateKey as `0x${string}`).address : null;
    const recipientAddress = process.env.X402_RECIPIENT_ADDRESS || process.env.ETH_RECIPIENT_ADDRESS;

    return {
      success: true,
      config: {
        network: chainConfig.network,
        chainId: chainConfig.chainId,
        currency: chainConfig.currency,
        tokenDecimals: chainConfig.tokenDecimals,
        tokenAddress: chainConfig.tokenAddress,
        walletAddress,
        recipientAddress,
        rpcUrl: chainConfig.rpcUrl,
        explorerUrl: chainConfig.explorerUrl,
        availableTokens: chainMeta ? getAvailableTokens(chainConfig.network) : [],
        isTestnet: chainConfig.isTestnet,
      },
      supportedNetworks: getSupportedNetworks(),
    };
  },
});

const listNetworksTool = defineTool({
  name: "list_networks",
  description: "List all supported blockchain networks and their details",
  inputSchema: z.object({
    testnetsOnly: z.boolean().optional().describe("Only show testnets"),
    mainnetsOnly: z.boolean().optional().describe("Only show mainnets"),
  }),
  handler: async ({ testnetsOnly, mainnetsOnly }) => {
    const allNetworks = getSupportedNetworks();
    
    const networks = allNetworks
      .map(id => {
        try {
          const meta = getChainMetadata(id);
          return {
            id,
            name: meta.name,
            chainId: meta.chainId,
            isTestnet: meta.isTestnet,
            nativeToken: meta.nativeToken.symbol,
            availableTokens: getAvailableTokens(id),
            explorerUrl: meta.explorerUrl,
          };
        } catch {
          return null;
        }
      })
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .filter(n => {
        if (testnetsOnly) return n.isTestnet;
        if (mainnetsOnly) return !n.isTestnet;
        return true;
      });

    return {
      success: true,
      networks,
      count: networks.length,
    };
  },
});

// ============================================================
// Register all payment tools
// ============================================================

export function registerPaymentTools(): void {
  toolRegistry.register(makePaymentTool, "payment");
  toolRegistry.register(getBalanceTool, "payment");
  toolRegistry.register(getConfigTool, "payment");
  toolRegistry.register(listNetworksTool, "payment");
  
  console.log("[Payment Tools] ✅ Registered 4 tools");
}
