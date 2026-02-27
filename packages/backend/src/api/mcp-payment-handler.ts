/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  encodeFunctionData,
  type Hash,
} from "viem";
import { z } from "zod";
import { 
  getChainConfig, 
  getChainMetadata, 
  isValidNetwork,
  getTokenAddress,
  getAvailableTokens,
  isNativeToken,
  type NetworkId,
  type TokenSymbol,
} from "../config/chain-config.js";

/**
 * MCP Payment Handler for x402 EVM Payments
 * Supports payments on Cronos, Ethereum, and other EVM chains
 * Provides tools for devUSDC.e and other token payments
 */

let mcpPaymentInstance: any = null;

// ERC20 ABI for transfer
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

/**
 * Initialize MCP Payment Server with EVM tools
 */
async function initializeMCPPaymentServer(): Promise<any> {
  if (mcpPaymentInstance) {
    return mcpPaymentInstance;
  }

  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");

  const server = new McpServer({
    name: "x402-evm-payment-agent",
    version: "2.0.0",
  });

  // Register make_payment tool (EVM)
  server.tool(
    "make_payment",
    "Make a payment on EVM chains (Cronos, Ethereum, etc). Supports native tokens and ERC20 (USDC, devUSDC.e)",
    {
      recipientAddress: z
        .string()
        .describe("EVM wallet address to send tokens to (0x...)"),
      amount: z
        .string()
        .describe("Amount in base units (e.g., 10000 for 0.01 USDC with 6 decimals)"),
      network: z
        .string()
        .optional()
        .describe("Network ID (e.g. base-sepolia, bite-v2-sandbox, base, mainnet). Defaults to configured network."),
      token: z
        .string()
        .optional()
        .describe("Token type: USDC, ETH, CRO, etc. Defaults to configured currency."),
    },
    async (args) => {
      return await handleMakePayment(args as any);
    }
  );

  // Register get_balance tool
  server.tool(
    "get_balance",
    "Check wallet balance for native tokens or ERC20 tokens",
    {
      address: z
        .string()
        .optional()
        .describe("Wallet address to check. Defaults to configured wallet."),
      token: z
        .string()
        .optional()
        .describe("Token type: USDC, ETH, CRO, NATIVE. Defaults to USDC."),
      network: z
        .string()
        .optional()
        .describe("Network to check balance on. Defaults to configured network."),
    },
    async (args) => {
      return await handleGetBalance(args as any);
    }
  );

  // Register get_config tool
  server.tool(
    "get_config",
    "Get current chain and payment configuration",
    {},
    async () => {
      return await handleGetConfig();
    }
  );

  mcpPaymentInstance = server;
  return server;
}

/**
 * Handle MCP requests via HTTP using JSON-RPC 2.0 protocol
 */
export async function handleMCPPaymentRequest(req: Request, res: Response) {
  const requestId = `mcp_payment_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;
  const startTime = Date.now();

  console.log(`\n${"=".repeat(80)}`);
  console.log(`[${requestId}] 💳 MCP EVM Payment Request (JSON-RPC 2.0)`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`${"=".repeat(80)}`);

  try {
    const body = req.body;
    console.log(`[${requestId}] 📨 Request body:`, JSON.stringify(body, null, 2));

    await initializeMCPPaymentServer();

    const jsonRpcRequest = body;
    const method = jsonRpcRequest.method;
    const params = jsonRpcRequest.params || {};
    const id = jsonRpcRequest.id;

    console.log(`[${requestId}] 🔧 Method: ${method}`);

    let jsonRpcResponse: any;

    if (method === "initialize") {
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: {
            tools: {},
            resources: { subscribe: false },
            prompts: {},
          },
          serverInfo: {
            name: "x402-evm-payment-agent",
            version: "2.0.0",
          },
        },
      };
    } else if (method === "tools/list") {
      const tools = [
        {
          name: "make_payment",
          description:
            "Make a payment on EVM chains (Cronos, Ethereum, etc). Supports native tokens and ERC20 (USDC, devUSDC.e)",
          inputSchema: {
            type: "object",
            properties: {
              recipientAddress: {
                type: "string",
                description: "EVM wallet address to send tokens to (0x...)",
              },
              amount: {
                type: "string",
                description: "Amount in base units (e.g., 10000 for 0.01 USDC with 6 decimals)",
              },
              network: {
                type: "string",
                description: "Network ID (e.g. base-sepolia, bite-v2-sandbox, base, mainnet)",
              },
              token: {
                type: "string",
                description: "Token symbol: USDC, ETH, etc",
              },
            },
            required: ["recipientAddress", "amount"],
          },
        },
        {
          name: "get_balance",
          description: "Check wallet balance for native tokens or ERC20 tokens",
          inputSchema: {
            type: "object",
            properties: {
              address: { type: "string", description: "Wallet address to check" },
              token: { type: "string", description: "Token type: USDC, ETH, CRO, NATIVE" },
              network: { type: "string", description: "Network to check balance on" },
            },
            required: [],
          },
        },
        {
          name: "get_config",
          description: "Get current chain and payment configuration",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      ];

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: { tools },
      };
    } else if (method === "tools/call") {
      const toolName = params.name;
      const toolArgs = params.arguments || {};

      console.log(`[${requestId}] 🔨 Tool: ${toolName}`);
      console.log(`[${requestId}] 📋 Args:`, JSON.stringify(toolArgs, null, 2));

      let toolResult;
      switch (toolName) {
        case "make_payment":
          toolResult = await handleMakePayment(toolArgs);
          break;
        case "get_balance":
          toolResult = await handleGetBalance(toolArgs);
          break;
        case "get_config":
          toolResult = await handleGetConfig();
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      console.log(`[${requestId}] ✅ Tool result:`, JSON.stringify(toolResult, null, 2));

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(toolResult, null, 2),
            },
          ],
        },
      };
    } else {
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ⏱️  Completed in ${duration}ms\n`);

    return res.status(200).json(jsonRpcResponse);
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Error:`, error.message);

    return res.status(200).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal server error",
        data: error.message,
      },
    });
  }
}

/**
 * Handler: Make EVM Payment
 */
async function handleMakePayment(args: any): Promise<any> {
  console.log(`[handleMakePayment] 💳 Starting EVM payment...`);

  const chainConfig = getChainConfig();
  const { 
    recipientAddress, 
    amount,
    network = chainConfig.network,
    token = chainConfig.currency 
  } = args;

  if (!recipientAddress) {
    return { success: false, error: "Missing required parameter: recipientAddress" };
  }
  if (!amount) {
    return { success: false, error: "Missing required parameter: amount" };
  }

  const privateKey = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
  if (!privateKey) {
    return { success: false, error: "WALLET_PRIVATE_KEY not configured" };
  }

  try {
    // Get chain configuration from registry
    if (!isValidNetwork(network)) {
      return { success: false, error: `Unsupported network: ${network}` };
    }
    
    const chainMeta = getChainMetadata(network as NetworkId);

    console.log(`[handleMakePayment] 🌐 Network: ${network} (Chain ID: ${chainMeta.chainId})`);
    console.log(`[handleMakePayment] 💰 Token: ${token}`);
    console.log(`[handleMakePayment] 📍 Recipient: ${recipientAddress}`);
    console.log(`[handleMakePayment] 💵 Amount: ${amount} base units`);

    // Setup wallet
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`[handleMakePayment] 🔑 Wallet: ${account.address}`);

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
      console.log(`[handleMakePayment] 📤 Sending native token...`);
      
      txHash = await walletClient.sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: amountBigInt,
      });
    } else {
      // ERC20 token transfer (USDC, etc.)
      const tokenAddress = getTokenAddress(network as NetworkId, token as TokenSymbol);
      if (!tokenAddress) {
        return { success: false, error: `Token ${token} not available on ${network}` };
      }

      console.log(`[handleMakePayment] 📤 Sending ERC20 token...`);
      console.log(`[handleMakePayment] 📜 Token contract: ${tokenAddress}`);

      // Encode transfer call
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

    console.log(`[handleMakePayment] ✅ Transaction sent: ${txHash}`);

    // Wait for confirmation
    console.log(`[handleMakePayment] ⏳ Waiting for confirmation...`);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    if (receipt.status === "reverted") {
      return {
        success: false,
        error: "Transaction reverted",
        transactionHash: txHash,
      };
    }

    console.log(`[handleMakePayment] ✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Create payment proof for x402
    const paymentProof = {
      transactionHash: txHash,
      network,
      chainId: chainMeta.chainId,
      timestamp: Date.now(),
    };

    // Calculate human-readable amount
    const decimals = token === "USDC" ? 6 : 18;
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
    console.error(`[handleMakePayment] ❌ Payment failed:`, err.message);
    return {
      success: false,
      error: err.message,
      details: {
        message: "Payment failed. Check wallet balance and gas.",
      },
    };
  }
}

/**
 * Handler: Get Balance
 */
async function handleGetBalance(args: any): Promise<any> {
  const chainConfig = getChainConfig();
  const {
    address,
    token = "USDC",
    network = chainConfig.network,
  } = args;

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
      };
    }

    // ERC20 balance
    const tokenAddress = getTokenAddress(network as NetworkId, token as TokenSymbol);
    if (!tokenAddress) {
      return { success: false, error: `Token ${token} not available on ${network}` };
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
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Handler: Get Config
 */
async function handleGetConfig(): Promise<any> {
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
  };
}
