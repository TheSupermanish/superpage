/**
 * All AI SDK tools for the A2A buyer agent.
 */
import type { A2AClient } from "../a2a-client.js";
import type { Wallet } from "../wallet.js";
import { createDiscoverTool } from "./discover.js";
import { createBrowseTools } from "./browse.js";
import { createPurchaseTool } from "./purchase.js";
import { createAccessResourceTool } from "./access-resource.js";
import { createMakePaymentTool } from "./make-payment.js";
import { createSubmitPaymentTool } from "./submit-payment.js";
import { createCheckTaskTool } from "./check-task.js";
import { createAP2MandateTools } from "./ap2-mandate.js";
import { createFetchUrlTool } from "./fetch-url.js";
import { createERC8004Tools } from "./erc8004.js";
import { ERC8004Client } from "../erc8004/index.js";
import { createMerchantTools, type MerchantState } from "./merchant.js";
import type { AgentConfig } from "../config.js";

export type { MerchantState } from "./merchant.js";

/** Shared cache for purchased resources — prevents duplicate payments. */
export type PurchaseCache = Map<
  string,
  { content: unknown; taskId: string; txHash?: string }
>;

export function createAllTools(
  client: A2AClient,
  wallet: Wallet,
  opts: {
    autoApprovePayments?: boolean;
    purchaseCache?: PurchaseCache;
    config: AgentConfig;
    merchantState?: MerchantState;
  }
) {
  const cache: PurchaseCache = opts.purchaseCache || new Map();
  const merchantState: MerchantState = opts.merchantState || {};
  const browse = createBrowseTools(client);
  const ap2 = createAP2MandateTools(client, opts.config);
  const erc8004 = new ERC8004Client(opts.config.walletPrivateKey);
  const erc8004Tools = createERC8004Tools(erc8004);
  const merchant = createMerchantTools(wallet, opts.config, merchantState);

  return {
    discover_merchant: createDiscoverTool(client),
    list_stores: browse.listStores,
    list_products: browse.listProducts,
    list_resources: browse.listResources,
    purchase_product: createPurchaseTool(client),
    access_resource: createAccessResourceTool(client, cache),
    make_onchain_payment: createMakePaymentTool(wallet, opts.config, {
      autoApprove: opts.autoApprovePayments,
    }),
    submit_payment_proof: createSubmitPaymentTool(client, cache, opts.config),
    check_task_status: createCheckTaskTool(client),
    send_intent_mandate: ap2.sendIntentMandate,
    submit_payment_mandate: ap2.submitPaymentMandate,
    fetch_url: createFetchUrlTool(),
    // ERC-8004 Trustless Identity
    register_identity: erc8004Tools.register_identity,
    lookup_agent: erc8004Tools.lookup_agent,
    check_reputation: erc8004Tools.check_reputation,
    leave_feedback: erc8004Tools.leave_feedback,
    check_validations: erc8004Tools.check_validations,
    // Merchant / Creator
    merchant_login: merchant.merchant_login,
    view_my_profile: merchant.view_my_profile,
    update_my_profile: merchant.update_my_profile,
    create_resource: merchant.create_resource,
    list_my_resources: merchant.list_my_resources,
    update_resource: merchant.update_resource,
    delete_resource: merchant.delete_resource,
  };
}
