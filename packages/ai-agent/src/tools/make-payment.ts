import { tool } from "ai";
import { z } from "zod";
import { isAddress, type Address } from "viem";
import type { Wallet } from "../wallet.js";
import * as ui from "../ui.js";

export function createMakePaymentTool(
  wallet: Wallet,
  _opts: { autoApprove?: boolean } = {}
) {
  return tool({
    description:
      "Execute an on-chain USDC payment on Initia testnet. Transfers real tokens from the agent's wallet to the merchant. Use after receiving payment requirements. Returns the transaction hash needed for submit_payment_proof. Amounts are in base units (6 decimals: 1000000 = $1.00 USDC).",
    parameters: z.object({
      payTo: z
        .string()
        .describe("Recipient address (from paymentRequirements.payTo)"),
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
    execute: async ({ payTo, amount, expectedAmount }) => {
      try {
        // Validate recipient address
        if (!isAddress(payTo)) {
          return { success: false, error: `Invalid Ethereum address: ${payTo}` };
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

        ui.paymentPending(displayAmount, payTo);
        ui.paymentSending();

        const txHash = await wallet.transferUsdc(
          payTo as Address,
          amount
        );

        const confirmed = await wallet.waitForTx(txHash);
        const explorerUrl = `https://scan.testnet.initia.xyz/tx/${txHash}`;

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
          payTo,
          network: "initia-testnet",
          chainId: 3981013683081008,
          explorerUrl,
        };
      } catch (err: any) {
        ui.paymentFailed(err.message);
        return { success: false, error: `Payment failed: ${err.message}` };
      }
    },
  });
}
