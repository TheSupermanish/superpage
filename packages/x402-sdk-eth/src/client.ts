/**
 * x402 Ethereum SDK - Client Module
 * Provides automatic HTTP 402 payment handling for Ethereum and EVM chains
 */

import {
  Account,
  PrivateKeyAccount,
  PublicClient,
  Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  Network,
  PaymentRequirements,
  PaymentRequirementsSchema,
  PaymentProof,
  PaymentRequiredError,
  SDKConfig,
  TransactionFailedError,
} from "./x402-types";
import {
  createConnection,
  createWalletClientForNetwork,
  sendPaymentTransaction,
  waitForTransaction,
  getChainId,
} from "./evm-utils";

/**
 * Wallet adapter interface for browser wallets (MetaMask, WalletConnect, etc.)
 */
export interface WalletAdapter {
  address: `0x${string}`;
  signTransaction(transaction: any): Promise<any>;
  sendTransaction(transaction: any): Promise<Hash>;
}

/**
 * Signer can be a private key, Account, or WalletAdapter
 */
export type Signer = `0x${string}` | PrivateKeyAccount | Account | WalletAdapter;

/**
 * Client configuration options
 */
export interface X402ClientConfig extends SDKConfig {
  // Wallet/account for signing transactions
  signer?: Signer;
  
  // Auto-retry failed transactions
  autoRetry?: boolean;
  maxRetries?: number;
  
  // Number of confirmations to wait for
  confirmations?: number;
  
  // Custom RPC endpoint
  rpcEndpoint?: string;
}

/**
 * Fetch options extended with x402 payment handling
 */
export interface X402FetchOptions extends RequestInit {
  // Enable automatic payment handling
  autoPayment?: boolean;
  
  // Signer for this specific request (overrides client signer)
  signer?: Signer;
  
  // Custom payment handler (advanced use case)
  onPaymentRequired?: (requirements: PaymentRequirements) => Promise<PaymentProof>;
}

/**
 * x402 Client for making payment-enabled HTTP requests
 */
export class X402Client {
  private publicClient: PublicClient;
  private config: X402ClientConfig;

  constructor(config: X402ClientConfig) {
    this.config = {
      autoRetry: true,
      maxRetries: 3,
      confirmations: 1,
      ...config,
    };
    
    this.publicClient = createConnection(
      config.network,
      config.rpcEndpoint
    );
  }

  /**
   * Make an HTTP request with automatic x402 payment handling
   */
  async fetch(
    url: string,
    options: X402FetchOptions = {}
  ): Promise<Response> {
    const { autoPayment = true, signer, onPaymentRequired, ...fetchOptions } = options;
    const requestSigner = signer || this.config.signer;

    // Make initial request
    const response = await fetch(url, fetchOptions);

    // Check if payment is required
    if (response.status === 402 && autoPayment) {
      if (!requestSigner) {
        throw new PaymentRequiredError(
          await this.parsePaymentRequirements(response),
          "Payment required but no signer provided"
        );
      }

      // Parse payment requirements
      const requirements = await this.parsePaymentRequirements(response);

      // Execute payment
      const paymentProof = onPaymentRequired
        ? await onPaymentRequired(requirements)
        : await this.executePayment(requirements, requestSigner);

      // Retry request with payment proof
      return this.retryWithPayment(url, fetchOptions, paymentProof);
    }

    return response;
  }

  /**
   * Parse payment requirements from 402 response
   */
  private async parsePaymentRequirements(
    response: Response
  ): Promise<PaymentRequirements> {
    try {
      const body = await response.json();
      return PaymentRequirementsSchema.parse(body);
    } catch (error) {
      throw new Error(
        `Failed to parse payment requirements: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Execute payment based on requirements
   */
  private async executePayment(
    requirements: PaymentRequirements,
    signer: Signer
  ): Promise<PaymentProof> {
    try {
      // Create account from signer
      const account = this.getAccount(signer);
      
      // Create wallet client
      const walletClient = createWalletClientForNetwork(
        this.config.network,
        account,
        this.config.rpcEndpoint
      );

      // Send payment transaction
      const hash = await sendPaymentTransaction(
        walletClient,
        this.publicClient,
        requirements
      );

      // Wait for confirmation
      const confirmations = this.config.confirmations || 1;
      const confirmed = await waitForTransaction(
        this.publicClient,
        hash,
        confirmations
      );

      if (!confirmed) {
        throw new TransactionFailedError(
          `Transaction failed or reverted`
        );
      }

      // Create payment proof
      const proof: PaymentProof = {
        transactionHash: hash,
        network: requirements.network,
        chainId: getChainId(requirements.network),
        requestId: requirements.requestId,
        timestamp: Date.now(),
      };

      return proof;
    } catch (error) {
      throw new TransactionFailedError(
        `Payment execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  }

  /**
   * Retry request with payment proof in X-Payment header
   */
  private async retryWithPayment(
    url: string,
    options: RequestInit,
    proof: PaymentProof
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set("X-Payment", JSON.stringify(proof));
    headers.set("Content-Type", "application/json");

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * Get account from signer
   */
  private getAccount(signer: Signer): Account {
    // If it's a hex string (private key), create an account
    if (typeof signer === "string") {
      return privateKeyToAccount(signer as `0x${string}`);
    }
    
    // If it's already an account-like object
    if (typeof signer === "object" && "address" in signer) {
      return signer as Account;
    }
    
    throw new Error("Invalid signer type");
  }

  /**
   * Get public client
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * Get current configuration
   */
  getConfig(): X402ClientConfig {
    return { ...this.config };
  }
}

/**
 * Options for x402Fetch wrapper
 */
export interface X402FetchWrapperOptions extends Omit<X402ClientConfig, "network">, Omit<X402FetchOptions, "signer" | "autoPayment"> {
  network: Network;
  autoPayment?: boolean;
}

/**
 * Simple wrapper function for one-line x402 fetch
 * 
 * @example
 * ```typescript
 * const response = await x402Fetch('https://api.example.com/data', {
 *   network: 'base',
 *   signer: '0x...' // your private key
 * });
 * ```
 */
export async function x402Fetch(
  url: string,
  options: X402FetchWrapperOptions
): Promise<Response> {
  const { network, signer, rpcEndpoint, confirmations, autoRetry, maxRetries, autoPayment, ...fetchOptions } = options;
  
  const client = new X402Client({
    network,
    signer,
    rpcEndpoint,
    confirmations,
    autoRetry,
    maxRetries,
  });

  return client.fetch(url, { ...fetchOptions, autoPayment });
}

/**
 * Create payment proof manually (for advanced use cases)
 */
export async function createPaymentProof(
  requirements: PaymentRequirements,
  signer: Signer,
  config: SDKConfig
): Promise<PaymentProof> {
  const client = new X402Client({
    network: config.network,
    rpcEndpoint: config.rpcEndpoint,
    signer,
  });
  
  // Use private method via instance
  return (client as any).executePayment(requirements, signer);
}
