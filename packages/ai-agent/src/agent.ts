/**
 * Core agent — multi-turn with tool-call display and final response.
 */
import {
  generateText,
  type CoreMessage,
  type CoreTool,
} from "ai";
import type { AgentConfig } from "./config.js";
import { A2AClient } from "./a2a-client.js";
import { Wallet } from "./wallet.js";
import { createAllTools, type PurchaseCache, type MerchantState } from "./tools/index.js";
import * as ui from "./ui.js";

async function getModel(config: AgentConfig) {
  if (config.llmProvider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    return createAnthropic({ apiKey: config.llmApiKey })(config.llmModel);
  }
  if (config.llmProvider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    return createOpenAI({ apiKey: config.llmApiKey })(config.llmModel);
  }
  if (config.llmProvider === "google") {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    return createGoogleGenerativeAI({ apiKey: config.llmApiKey })(
      config.llmModel,
      { structuredOutputs: false }
    );
  }
  throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
}

const SYSTEM_PROMPT = `You are Superio — an autonomous AI agent on InitPage, the AI-native commerce platform on Initia. You can BUY and SELL digital resources, shop for physical products, and build on-chain reputation — all with USDC payments on the InitPage appchain.

InitPage is a marketplace where humans and AI agents coexist as buyers AND sellers. Every payment is on-chain (Initia MiniEVM), every agent has an ERC-8004 identity, and every interaction is verifiable.

## What You Can Do

### 1. BUY — Access paid resources and products
- list_resources — browse all APIs, articles, files for sale
- access_resource — buy access to a resource (auto-pays if 402)
- list_stores / list_products — browse Shopify stores
- purchase_product — buy a physical product with shipping
- make_onchain_payment — send USDC on-chain
- submit_payment_proof — complete a purchase with tx hash
- fetch_url — fetch data from a URL after purchase
- discover_merchant — fetch the merchant's AgentCard

### 2. SELL — Create and publish your own resources
- merchant_login — authenticate with InitPage (call first, uses your wallet)
- view_my_profile — see your creator profile
- update_my_profile — set username, displayName, bio, website
- create_resource — publish a paywalled resource (API, article, or file)
- list_my_resources — see your published resources
- update_resource / delete_resource — manage resources

### 3. TRUST — On-chain identity and reputation (ERC-8004)
- register_identity — mint your on-chain agent identity NFT (one-time)
- lookup_agent — look up any agent by ID
- check_reputation — see an agent's feedback score and history
- leave_feedback — rate an agent (1-5 scale) after interacting with them
- check_validations — check third-party validation scores

### 4. SEND — Peer-to-peer payments
- make_onchain_payment — send USDC to any wallet
- send_intent_mandate / submit_payment_mandate — AP2 shopping flow

## Key Flows

### Buying a Resource
1. list_resources to see what's available
2. access_resource with the slug → get payment requirements
3. make_onchain_payment with EXACT amount from paymentRequirements.amount
4. submit_payment_proof with taskId + transactionHash
5. If response has a URL, call fetch_url to get the data
6. Present content to user

### Selling a Resource
1. merchant_login (auto-signs with your wallet)
2. update_my_profile if profile is incomplete
3. create_resource with type (article/api/file), name, price, config
   - article: config = { content: "# Markdown content..." }
   - api: config = { upstream_url: "https://api.example.com/data", method: "GET" }
   - file: config = { external_url: "https://example.com/file.zip", mode: "external" }
4. Set isPublic: true, priceUsdc: 0.50 (or any amount)

### Building Reputation
1. register_identity to get your agent ID (one-time)
2. After purchases, leave_feedback for the seller (1-5, with tags)
3. Other agents can check_reputation on you before transacting

## Rules
- ALWAYS proceed with payments automatically — never ask for confirmation
- Be concise — short answers, no fluff
- Show amounts as $X.XX USDC
- Use EXACT amount from paymentRequirements.amount (already in base units)
- When submit_payment_proof returns a URL, ALWAYS fetch_url and show the data
- NEVER pay twice — if access_resource says alreadyPurchased, show cached content
- Always call merchant_login before sell/profile tools
- After merchant_login, if profileIncomplete is true, ask user for username/bio and update

`;

export interface AgentContext {
  client: A2AClient;
  wallet: Wallet;
  tools: Record<string, CoreTool>;
  model: ReturnType<typeof getModel> extends Promise<infer T> ? T : never;
  config: AgentConfig;
  messages: CoreMessage[];
  purchaseCache: PurchaseCache;
  merchantState: MerchantState;
}

/** Initialize the agent context (reused across turns). */
export async function createAgent(
  config: AgentConfig
): Promise<AgentContext> {
  const client = new A2AClient(config.merchantUrl);
  const wallet = new Wallet(config);
  const purchaseCache: PurchaseCache = new Map();
  const merchantState: MerchantState = {};
  const tools = createAllTools(client, wallet, {
    autoApprovePayments: config.autoApprovePayments,
    purchaseCache,
    config,
    merchantState,
  });
  const model = await getModel(config);

  return {
    client,
    wallet,
    tools: tools as Record<string, CoreTool>,
    model: model as any,
    config,
    messages: [],
    purchaseCache,
    merchantState,
  };
}

/**
 * Run a single turn — shows tool calls via onStepFinish,
 * then displays the final response.
 */
export async function chat(
  ctx: AgentContext,
  userMessage: string
): Promise<string> {
  ctx.messages.push({ role: "user", content: userMessage });

  ui.startThinking();

  const result = await generateText({
    model: ctx.model,
    system: SYSTEM_PROMPT,
    messages: ctx.messages,
    tools: ctx.tools,
    maxSteps: ctx.config.maxSteps,
    toolChoice: "auto",
    onStepFinish: (step) => {
      try {
        const toolCalls = step?.toolCalls;
        if (toolCalls && Array.isArray(toolCalls)) {
          for (const call of toolCalls) {
            ui.toolCall(
              call.toolName,
              (call.args || {}) as Record<string, unknown>
            );
            ui.startThinkingAfterTool();
          }
        }
      } catch (e) {
        // Ignore step callback errors
      }
    },
  });

  ui.stopThinking();

  // Gemini 2.5 may call tools but not generate summary text
  let assistantText = result.text || "";
  if (!assistantText) {
    // Try to extract tool results from steps
    try {
      const steps = (result as any).steps || [];
      for (const step of steps) {
        const results = step.toolResults || [];
        for (const r of results) {
          const val = r.result;
          if (val) {
            assistantText += (typeof val === 'string' ? val : JSON.stringify(val, null, 2)) + "\n";
          }
        }
      }
    } catch {}
  }
  if (!assistantText) assistantText = "(no response)";

  if (assistantText.trim()) {
    ui.agentResponse(assistantText.trim());
  }

  ctx.messages.push({ role: "assistant", content: assistantText });

  return assistantText;
}

/**
 * Non-streaming chat for programmatic use.
 */
export async function chatSync(
  ctx: AgentContext,
  userMessage: string
): Promise<string> {
  ctx.messages.push({ role: "user", content: userMessage });

  const result = await generateText({
    model: ctx.model,
    system: SYSTEM_PROMPT,
    messages: ctx.messages,
    tools: ctx.tools,
    maxSteps: ctx.config.maxSteps,
  });

  const assistantText = result.text || "(no response)";
  ctx.messages.push({ role: "assistant", content: assistantText });
  return assistantText;
}

/**
 * One-shot mode: run a single message and return the result.
 */
export async function runAgent(
  userMessage: string,
  config: AgentConfig
): Promise<{ text: string; stepCount: number }> {
  const ctx = await createAgent(config);
  const text = await chatSync(ctx, userMessage);
  return { text, stepCount: ctx.messages.length };
}
