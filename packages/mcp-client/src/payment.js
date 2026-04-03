/**
 * Payment execution logic for Airaa x402.
 * Handles both native token (ETH/MNT) and ERC20 token transfers.
 */

import {
  CURRENCY,
  TOKEN_CONTRACT,
  ERC20_ABI,
} from "./config.js";
// NOTE: We import wallet/publicClient/walletClient lazily to break the
// circular dependency between wallet.js and payment.js.
// wallet.js imports payment.js (for sendToken -> makePayment),
// so payment.js cannot import wallet.js at the top level.

let _walletModule = null;

async function getWalletModule() {
  if (!_walletModule) {
    _walletModule = await import("./wallet.js");
  }
  return _walletModule;
}

// ═══════════════════════════════════════════════════════════════════════════
// ETHEREUM PAYMENT (Token Transfer)
// ═══════════════════════════════════════════════════════════════════════════

export async function makePayment(recipientAddress, amountBaseUnits) {
  const { wallet, publicClient, walletClient, log } = await getWalletModule();

  try {
    let txHash;

    // Ensure recipient is a valid address string
    const recipient = String(recipientAddress).toLowerCase();
    log(`Payment recipient: ${recipient}`);
    log(`Payment amount: ${amountBaseUnits} wei`);

    // Check if we're using native token (ETH/MNT) or ERC20
    if (TOKEN_CONTRACT === "0x0000000000000000000000000000000000000000" ||
        CURRENCY === "ETH" || CURRENCY === "MNT") {
      // Native token transfer
      log(`Sending native ${CURRENCY} transfer...`);
      txHash = await walletClient.sendTransaction({
        to: recipient,
        value: BigInt(amountBaseUnits),
      });
    } else {
      // ERC20 token transfer
      log(`Sending ERC20 ${CURRENCY} transfer...`);
      txHash = await walletClient.writeContract({
        address: TOKEN_CONTRACT,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient, BigInt(amountBaseUnits)],
      });
    }

    log(`Transaction sent: ${txHash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000, // 60 seconds for Mantle
    });

    if (receipt.status === "reverted") {
      return { success: false, error: "Transaction reverted" };
    }

    return { success: true, txHash };
  } catch (err) {
    log(`Payment error: ${err.message}`);
    return { success: false, error: err.message };
  }
}
