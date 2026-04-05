import { tool } from "ai";
import { z } from "zod";
import { isAddress, type Address } from "viem";
import type { Wallet } from "../wallet.js";
import type { AgentConfig } from "../config.js";
import * as ui from "../ui.js";

export function createMakePaymentTool(
  wallet: Wallet,
  config: AgentConfig,
  _opts: { autoApprove?: boolean } = {}
) {
  return tool({
    description:
      "Execute an on-chain USDC payment on Initia testnet. Transfers real tokens from the agent's wallet to the merchant. Use after receiving payment requirements. Returns the transaction hash needed for submit_payment_proof. Amounts are in base units (6 decimals: 1000000 = $1.00 USDC).",
    parameters: z.object({
      payTo: z
        .string()
        .describe("Recipient wallet address — use the 'payTo' value from paymentRequirements"),
      recipient: z
        .string()
        .optional()
        .describe("Alternative name for payTo — use paymentRequirements.payTo"),
      amount: z
        .string()
        .describe("Amount in base units (from paymentRequirements.amount)"),
      expectedAmount: z
        .string()
        .optional()
        .describe(
          "Expected amount from paymentRequirements.amount — used to verify the payment matches the requirement"
        ),
    }),
    execute: async ({ payTo, recipient, amount, expectedAmount }) => {
      try {
        // Use payTo or recipient (Gemini sometimes maps to either)
        const to = payTo || recipient;
        if (!to || !isAddress(to)) {
          return { success: false, error: `Invalid Ethereum address: ${to}` };
        }

        // Validate amount matches expected payment requirement
        if (expectedAmount && amount !== expectedAmount) {
          return {
            success: false,
            error: `Amount mismatch: sending ${amount} but payment requirement expects ${expectedAmount}`,
          };
        }

        const balance = await wallet.getUsdcBalance();
        const displayAmount = wallet.formatUsdc(amount);

        if (parseFloat(balance) < parseFloat(displayAmount)) {
          ui.paymentFailed(
            `Insufficient balance. Have: ${balance}, Need: ${displayAmount}`
          );
          return {
            success: false,
            error: `Insufficient USDC balance. Have: ${balance} USDC, Need: ${displayAmount} USDC`,
            walletAddress: wallet.address,
            balance,
          };
        }

        ui.paymentPending(displayAmount, to);
        ui.paymentSending();

        const txHash = await wallet.transferUsdc(
          to as Address,
          amount
        );

        const confirmed = await wallet.waitForTx(txHash);
        const explorerUrl = `https://scan.testnet.initia.xyz/initpage/evm-txs/${txHash}`;

        if (confirmed) {
          ui.paymentConfirmed(txHash, explorerUrl);
        } else {
          ui.paymentFailed("Transaction failed on-chain");
        }

        return {
          success: confirmed,
          transactionHash: txHash,
          amount: displayAmount,
          amountBaseUnits: amount,
          payTo: to,
          network: config.network,
          chainId: config.chainId,
          explorerUrl,
        };
      } catch (err: any) {
        ui.paymentFailed(err.message);
        return { success: false, error: `Payment failed: ${err.message}` };
      }
    },
  });
}
