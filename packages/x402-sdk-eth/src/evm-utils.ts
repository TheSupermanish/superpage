import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  Address,
  Hash,
  PublicClient,
  WalletClient,
  Chain,
  Account,
  Transport,
  defineChain,
} from "viem";
import {
  mainnet,
  sepolia,
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
} from "viem/chains";

/**
 * Mantle Sepolia Testnet chain definition
 * Chain ID: 5003
 * RPC: https://rpc.sepolia.mantle.xyz
 */
export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://sepolia.mantlescan.xyz",
    },
  },
  testnet: true,
});

/**
 * Cronos Mainnet chain definition
 * Chain ID: 25
 * RPC: https://evm.cronos.org
 */
export const cronos = defineChain({
  id: 25,
  name: "Cronos",
  network: "cronos",
  nativeCurrency: {
    decimals: 18,
    name: "Cronos",
    symbol: "CRO",
  },
  rpcUrls: {
    default: {
      http: ["https://evm.cronos.org"],
    },
    public: {
      http: ["https://evm.cronos.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Cronos Explorer",
      url: "https://explorer.cronos.org",
    },
  },
  testnet: false,
});

/**
 * Cronos Testnet chain definition
 * Chain ID: 338
 * RPC: https://cronos-testnet.drpc.org
 */
export const cronosTestnet = defineChain({
  id: 338,
  name: "Cronos Testnet",
  network: "cronos-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Test Cronos",
    symbol: "TCRO",
  },
  rpcUrls: {
    default: {
      http: ["https://cronos-testnet.drpc.org"],
    },
    public: {
      http: ["https://cronos-testnet.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Cronos Explorer",
      url: "https://explorer.cronos.org/testnet",
    },
  },
  testnet: true,
});
/**
 * BITE V2 Sandbox 2 chain definition (SKALE)
 * Chain ID: 103698795
 * RPC: https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
 */
export const biteV2Sandbox = defineChain({
  id: 103698795,
  name: "BITE V2 Sandbox 2",
  network: "bite-v2-sandbox",
  nativeCurrency: {
    decimals: 18,
    name: "sFUEL",
    symbol: "sFUEL",
  },
  rpcUrls: {
    default: {
      http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"],
    },
    public: {
      http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"],
    },
  },
  blockExplorers: {
    default: {
      name: "BITE Explorer",
      url: "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
    },
  },
  testnet: true,
});
import {
  Network,
  TokenType,
  PaymentRequirements,
  TransactionFailedError,
  TransactionStatus,
} from "./x402-types";

/**
 * Chain configurations
 */
export const CHAINS: Record<Network, Chain> = {
  mainnet,
  sepolia,
  base,
  "base-sepolia": baseSepolia,
  polygon,
  "polygon-amoy": polygonAmoy,
  arbitrum,
  "arbitrum-sepolia": arbitrumSepolia,
  optimism,
  "optimism-sepolia": optimismSepolia,
  "mantle-sepolia": mantleSepolia,
  cronos,
  "cronos-testnet": cronosTestnet,
  "bite-v2-sandbox": biteV2Sandbox,
};

/**
 * Chain IDs
 */
export const CHAIN_IDS: Record<Network, number> = {
  mainnet: 1,
  sepolia: 11155111,
  base: 8453,
  "base-sepolia": 84532,
  polygon: 137,
  "polygon-amoy": 80002,
  arbitrum: 42161,
  "arbitrum-sepolia": 421614,
  optimism: 10,
  "optimism-sepolia": 11155420,
  "mantle-sepolia": 5003,
  cronos: 25,
  "cronos-testnet": 338,
  "bite-v2-sandbox": 103698795,
};

/**
 * Token contract addresses for EVM networks
 * Using official USDC addresses from Circle and other verified contracts
 * Note: ETH, CRO, and MNT are native tokens, not ERC20, so they're excluded
 */
export const TOKEN_ADDRESSES: Record<Network, Record<Exclude<TokenType, "ETH" | "CRO" | "MNT" | "sFUEL">, Address>> = {
  mainnet: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EescdeCB5f6243C" as Address,
  },
  sepolia: {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Circle USDC on Sepolia
    USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06" as Address,
    DAI: "0x68194a729C2450ad26072b3D33ADaCbcef39D574" as Address,
  },
  base: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Native USDC on Base
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as Address,
    DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" as Address,
  },
  "base-sepolia": {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Circle USDC on Base Sepolia
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
  polygon: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native USDC on Polygon
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" as Address,
  },
  "polygon-amoy": {
    USDC: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" as Address,
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
  arbitrum: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Native USDC on Arbitrum
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address,
  },
  "arbitrum-sepolia": {
    USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address,
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
  optimism: {
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Native USDC on Optimism
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address,
  },
  "optimism-sepolia": {
    USDC: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" as Address,
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
  "mantle-sepolia": {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, // Circle USDC (same as Base Sepolia)
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
  cronos: {
    USDC: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59" as Address, // USDC on Cronos
    USDT: "0x66e428c3f67a68878562e79A0234c1F83c208770" as Address, // USDT on Cronos
    DAI: "0xF2001B145b43032AAF5Ee2884e456CCd805F677D" as Address, // DAI on Cronos
  },
  "cronos-testnet": {
    USDC: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" as Address, // devUSDC.e (Bridged USDC Stargate)
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
  "bite-v2-sandbox": {
    USDC: "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8" as Address,
    USDT: "0x0000000000000000000000000000000000000000" as Address,
    DAI: "0x0000000000000000000000000000000000000000" as Address,
  },
};

/**
 * Token decimals
 */
export const TOKEN_DECIMALS: Record<TokenType, number> = {
  ETH: 18,
  CRO: 18, // Cronos native token
  MNT: 18, // Mantle native token
  sFUEL: 18, // SKALE native token (zero gas fees)
  USDC: 6,
  USDT: 6,
  DAI: 18,
};

/**
 * ERC20 ABI for transfer function
 */
export const ERC20_ABI = [
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
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Get RPC endpoint for network
 */
export function getRpcEndpoint(network: Network, customEndpoint?: string): string {
  if (customEndpoint) return customEndpoint;
  
  // Default public RPCs (recommend using your own in production)
  const publicRpcs: Record<Network, string> = {
    mainnet: "https://eth.llamarpc.com",
    sepolia: "https://rpc.sepolia.org",
    base: "https://mainnet.base.org",
    "base-sepolia": "https://sepolia.base.org",
    polygon: "https://polygon-rpc.com",
    "polygon-amoy": "https://rpc-amoy.polygon.technology",
    arbitrum: "https://arb1.arbitrum.io/rpc",
    "arbitrum-sepolia": "https://sepolia-rollup.arbitrum.io/rpc",
    optimism: "https://mainnet.optimism.io",
    "optimism-sepolia": "https://sepolia.optimism.io",
    "mantle-sepolia": "https://rpc.sepolia.mantle.xyz",
    cronos: "https://evm.cronos.org",
    "cronos-testnet": "https://cronos-testnet.drpc.org",
    "bite-v2-sandbox": "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
  };
  
  return publicRpcs[network];
}

/**
 * Get chain ID for network
 */
export function getChainId(network: Network): number {
  return CHAIN_IDS[network];
}

/**
 * Create a public client for reading blockchain data
 * Matches Solana SDK's createConnection
 */
export function createConnection(
  network: Network,
  customEndpoint?: string
): PublicClient {
  const endpoint = getRpcEndpoint(network, customEndpoint);
  const chain = CHAINS[network];
  
  return createPublicClient({
    chain,
    transport: http(endpoint),
  });
}

/**
 * Alias for createConnection (for those familiar with viem)
 */
export const createPublicClientForNetwork = createConnection;

/**
 * Create a wallet client for signing transactions
 */
export function createWalletClientForNetwork(
  network: Network,
  account: Account,
  customEndpoint?: string
): WalletClient<Transport, Chain, Account> {
  const endpoint = getRpcEndpoint(network, customEndpoint);
  const chain = CHAINS[network];
  
  return createWalletClient({
    account,
    chain,
    transport: http(endpoint),
  });
}

/**
 * Convert amount string to base units (wei or token base units)
 */
export function amountToBaseUnits(amount: string, token: TokenType): bigint {
  const decimals = TOKEN_DECIMALS[token];
  return parseUnits(amount, decimals);
}

/**
 * Convert base units to display amount
 */
export function baseUnitsToAmount(baseUnits: bigint, token: TokenType): string {
  const decimals = TOKEN_DECIMALS[token];
  return formatUnits(baseUnits, decimals);
}

/**
 * Transaction request type for ETH payments
 */
export interface ETHTransactionRequest {
  to: Address;
  value: bigint;
  data?: `0x${string}`;
}

/**
 * Transaction request type for ERC20 payments
 */
export interface TokenTransactionRequest {
  to: Address; // Token contract address
  data: `0x${string}`; // Encoded transfer call
  value?: bigint;
}

/**
 * Create ETH payment transaction (unsigned)
 * Matches Solana SDK's createSOLPaymentTransaction
 */
export function createETHPaymentTransaction(
  recipient: Address,
  amount: bigint
): ETHTransactionRequest {
  return {
    to: recipient,
    value: amount,
  };
}

/**
 * Create ERC20 token payment transaction (unsigned)
 * Matches Solana SDK's createTokenPaymentTransaction
 */
export function createTokenPaymentTransaction(
  tokenAddress: Address,
  recipient: Address,
  amount: bigint
): TokenTransactionRequest {
  // Encode ERC20 transfer function call
  // transfer(address,uint256) selector: 0xa9059cbb
  const selector = "0xa9059cbb";
  const paddedRecipient = recipient.slice(2).padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  const data = `${selector}${paddedRecipient}${paddedAmount}` as `0x${string}`;
  
  return {
    to: tokenAddress,
    data,
    value: 0n,
  };
}

/**
 * Create payment transaction based on requirements (unsigned)
 * Matches Solana SDK's createPaymentTransaction
 */
export function createPaymentTransaction(
  requirements: PaymentRequirements
): ETHTransactionRequest | TokenTransactionRequest {
  const recipient = requirements.recipient as Address;
  const amount = BigInt(requirements.amount);
  
  // Native tokens (ETH on Ethereum, CRO on Cronos, MNT on Mantle, sFUEL on SKALE, etc.)
  if (requirements.token === "ETH" || requirements.token === "CRO" || requirements.token === "MNT" || requirements.token === "sFUEL") {
    return createETHPaymentTransaction(recipient, amount);
  } else {
    const tokenAddress = TOKEN_ADDRESSES[requirements.network][requirements.token as Exclude<TokenType, "ETH" | "CRO" | "MNT" | "sFUEL">];
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      throw new TransactionFailedError(
        `Token ${requirements.token} is not supported on ${requirements.network}`
      );
    }
    return createTokenPaymentTransaction(tokenAddress, recipient, amount);
  }
}

/**
 * Sign and send a transaction
 * Matches Solana SDK's signAndSendTransaction
 */
export async function signAndSendTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  transaction: ETHTransactionRequest | TokenTransactionRequest
): Promise<Hash> {
  try {
    const hash = await walletClient.sendTransaction({
      to: transaction.to,
      value: transaction.value || 0n,
      data: 'data' in transaction ? transaction.data : undefined,
    });
    
    return hash;
  } catch (error) {
    throw new TransactionFailedError(
      `Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

/**
 * Confirm transaction (wait for receipt)
 * Matches Solana SDK's confirmTransaction
 */
export async function confirmTransaction(
  publicClient: PublicClient,
  hash: Hash,
  confirmations: number = 1
): Promise<boolean> {
  return waitForTransaction(publicClient, hash, confirmations);
}

/**
 * Send ETH payment
 */
export async function sendETHPayment(
  walletClient: WalletClient<Transport, Chain, Account>,
  recipient: Address,
  amount: bigint
): Promise<Hash> {
  const tx = createETHPaymentTransaction(recipient, amount);
  return signAndSendTransaction(walletClient, tx);
}

/**
 * Send ERC20 token payment (with simulation)
 */
export async function sendTokenPayment(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient,
  tokenAddress: Address,
  recipient: Address,
  amount: bigint
): Promise<Hash> {
  try {
    // Simulate the transaction first for better error messages
    const { request } = await publicClient.simulateContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, amount],
      account: walletClient.account,
    });
    
    // Send the transaction
    const hash = await walletClient.writeContract(request);
    
    return hash;
  } catch (error) {
    throw new TransactionFailedError(
      `Failed to send token: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

/**
 * Send ERC20 token payment (raw, without simulation)
 * Uses pre-built transaction request
 */
export async function sendTokenPaymentRaw(
  walletClient: WalletClient<Transport, Chain, Account>,
  tokenAddress: Address,
  recipient: Address,
  amount: bigint
): Promise<Hash> {
  const tx = createTokenPaymentTransaction(tokenAddress, recipient, amount);
  return signAndSendTransaction(walletClient, tx);
}

/**
 * Create and send payment transaction based on requirements
 * High-level helper that combines transaction creation and sending
 */
export async function sendPaymentTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient,
  requirements: PaymentRequirements
): Promise<Hash> {
  const recipient = requirements.recipient as Address;
  const amount = BigInt(requirements.amount);
  
  // Native tokens (ETH on Ethereum, CRO on Cronos, MNT on Mantle, sFUEL on SKALE, etc.)
  if (requirements.token === "ETH" || requirements.token === "CRO" || requirements.token === "MNT" || requirements.token === "sFUEL") {
    return sendETHPayment(walletClient, recipient, amount);
  } else {
    const tokenAddress = TOKEN_ADDRESSES[requirements.network][requirements.token as Exclude<TokenType, "ETH" | "CRO" | "MNT" | "sFUEL">];
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      throw new TransactionFailedError(
        `Token ${requirements.token} is not supported on ${requirements.network}`
      );
    }
    return sendTokenPayment(walletClient, publicClient, tokenAddress, recipient, amount);
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  publicClient: PublicClient,
  hash: Hash,
  confirmations: number = 1
): Promise<boolean> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
    });
    
    return receipt.status === "success";
  } catch (error) {
    throw new TransactionFailedError(
      `Failed to confirm transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(
  publicClient: PublicClient,
  hash: Hash
): Promise<TransactionStatus> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    
    if (!receipt) {
      return "pending";
    }
    
    if (receipt.status === "reverted") {
      return "failed";
    }
    
    // Check confirmations
    const currentBlock = await publicClient.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    
    if (confirmations >= 12) {
      return "finalized";
    } else if (confirmations >= 1) {
      return "confirmed";
    }
    
    return "pending";
  } catch (error) {
    // Transaction not found yet
    return "pending";
  }
}

/**
 * Verify a payment transaction exists and matches requirements
 * SECURITY CRITICAL: This function validates on-chain payments
 */
export async function verifyPaymentTransaction(
  publicClient: PublicClient,
  hash: Hash,
  requirements: PaymentRequirements,
  confirmations: number = 1
): Promise<boolean> {
  try {
    // Get transaction receipt - retry up to 3 times with delay for pending transactions
    let receipt = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!receipt && attempts < maxAttempts) {
      attempts++;
      try {
        receipt = await publicClient.getTransactionReceipt({ hash });
      } catch (e) {
        console.log(`[verifyPayment] Attempt ${attempts}/${maxAttempts}: Transaction receipt not available yet`);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }
    }
    
    if (!receipt) {
      console.error("Transaction not found after retries:", hash);
      return false;
    }
    
    // Check transaction succeeded
    if (receipt.status === "reverted") {
      console.error("Transaction reverted:", hash);
      return false;
    }
    
    // Check confirmations
    const currentBlock = await publicClient.getBlockNumber();
    const txConfirmations = Number(currentBlock) - Number(receipt.blockNumber);
    
    // Handle 0 or negative confirmations — if receipt exists with success status,
    // the transaction was included in a block. On fast chains (SKALE, etc.) or due to
    // RPC sync timing, confirmations may be 0 or negative even though the tx is valid.
    if (txConfirmations < 0) {
      console.warn(`[verifyPayment] Negative confirmations (${txConfirmations}) - RPC sync issue. Transaction has valid receipt, allowing.`);
    } else if (txConfirmations === 0 && receipt.status === "success") {
      console.log(`[verifyPayment] Transaction in current block (0 confirmations) with success status, allowing.`);
    } else if (txConfirmations < confirmations) {
      console.warn(`Transaction has ${txConfirmations} confirmations, need ${confirmations}`);
      return false;
    }
    
    // Get the original transaction
    const tx = await publicClient.getTransaction({ hash });
    
    if (!tx) {
      console.error("Could not fetch transaction details:", hash);
      return false;
    }
    
    const recipient = requirements.recipient.toLowerCase() as Address;
    const expectedAmount = BigInt(requirements.amount);
    
    // Verify native token transfers (ETH, MNT, CRO, etc.)
    if (requirements.token === "ETH" || requirements.token === "MNT" || requirements.token === "CRO" || requirements.token === "sFUEL") {
      console.log(`[verifyPaymentTransaction] Verifying native ${requirements.token} transfer`);
      console.log(`[verifyPaymentTransaction] tx.to: ${tx.to}, expected: ${recipient}`);
      console.log(`[verifyPaymentTransaction] tx.value: ${tx.value}, expected: ${expectedAmount}`);
      
      if (!tx.to) {
        console.error("Transaction 'to' field is null - invalid transaction format");
        return false;
      }
      
      if (tx.to.toLowerCase() !== recipient) {
        console.error(`Recipient mismatch: got ${tx.to.toLowerCase()}, expected ${recipient}`);
        return false;
      }
      
      if (tx.value < expectedAmount) {
        console.error(`Insufficient payment: expected ${expectedAmount}, got ${tx.value}`);
        return false;
      }
      
      console.log(`[verifyPaymentTransaction] ✓ Payment verified successfully`);
      return true;
    }
    
    // Verify ERC20 token transfers
    const tokenAddress = TOKEN_ADDRESSES[requirements.network][requirements.token];
    
    if (tx.to?.toLowerCase() !== tokenAddress.toLowerCase()) {
      console.error("Transaction not to token contract");
      return false;
    }
    
    // Parse transfer logs
    const transferLogs = receipt.logs.filter(
      (log) =>
        log.address.toLowerCase() === tokenAddress.toLowerCase() &&
        log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // Transfer event signature
    );
    
    for (const log of transferLogs) {
      // Decode log data
      const to = `0x${log.topics[2]?.slice(26)}`.toLowerCase();
      const amount = BigInt(log.data);
      
      if (to === recipient && amount >= expectedAmount) {
        return true;
      }
    }
    
    console.error("No matching transfer found in transaction logs");
    return false;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}
