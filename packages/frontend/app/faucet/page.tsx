"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { getDefaultChain, getDefaultChainId } from "@/lib/chains";
import { useEnsureNetwork } from "@/hooks/use-network-switch";
import { PublicNavbar } from "@/components/public-navbar";
import { Droplets, Wallet, Loader2, CheckCircle2, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { getTxUrl, getUsdcAddress } from "@/lib/chain-config";

const PAYMENT_CHAIN_ID = getDefaultChainId();
const PAYMENT_CHAIN = getDefaultChain();
const USDC_ADDRESS = getUsdcAddress();

const USDC_ABI = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address owner) view returns (uint256)",
]);

const faucetClient = createPublicClient({
  chain: PAYMENT_CHAIN,
  transport: http(),
});

const AMOUNTS = [
  { label: "10", value: BigInt(10_000_000) },
  { label: "50", value: BigInt(50_000_000) },
  { label: "100", value: BigInt(100_000_000) },
  { label: "1,000", value: BigInt(1_000_000_000) },
];

type FaucetStatus = "idle" | "switching" | "minting" | "confirming" | "success" | "error";

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { ensureCorrectNetwork } = useEnsureNetwork(PAYMENT_CHAIN_ID);
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<FaucetStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(1); // index into AMOUNTS (50 USDC)
  const [copied, setCopied] = useState(false);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!address) { setBalance(null); return; }
    try {
      const raw = await faucetClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      setBalance(formatUnits(raw, 6));
    } catch {
      setBalance(null);
    }
  }, [address]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // Mint
  const handleMint = async () => {
    if (!isConnected) { openConnectModal?.(); return; }
    try {
      setStatus("switching");
      setError(null);
      setTxHash(null);

      const switched = await ensureCorrectNetwork();
      if (!switched) throw new Error(`Please switch to ${PAYMENT_CHAIN.name}`);

      setStatus("minting");
      const hash = await writeContractAsync({
        abi: USDC_ABI,
        address: USDC_ADDRESS,
        functionName: "mint",
        args: [address!, AMOUNTS[selectedAmount].value],
        chainId: PAYMENT_CHAIN_ID,
      });

      setTxHash(hash);
      setStatus("confirming");

      const receipt = await faucetClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status === "reverted") throw new Error("Mint transaction reverted");

      setStatus("success");
      fetchBalance();
    } catch (err: any) {
      if (err.code === 4001) {
        setError("You rejected the transaction.");
      } else {
        setError(err.shortMessage || err.message || "Mint failed");
      }
      setStatus("error");
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(USDC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProcessing = status === "switching" || status === "minting" || status === "confirming";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <div className="max-w-xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Droplets className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">USDC Faucet</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Get free test mUSDC tokens on Base Sepolia. Mint as much as you need for testing SuperPage.
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
          {/* Balance */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
            <span className="text-sm text-muted-foreground font-medium">Your Balance</span>
            <span className="text-xl font-bold text-primary">
              {!isConnected
                ? "—"
                : balance !== null
                  ? `${Number(balance).toLocaleString()} USDC`
                  : "Loading..."}
            </span>
          </div>

          {/* Amount selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Select Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {AMOUNTS.map((amt, i) => (
                <button
                  key={amt.label}
                  onClick={() => setSelectedAmount(i)}
                  disabled={isProcessing}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    selectedAmount === i
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                  }`}
                >
                  {amt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm font-medium">
                {status === "switching" && "Switching to Base Sepolia network..."}
                {status === "minting" && "Approve the mint in your wallet..."}
                {status === "confirming" && "Confirming transaction..."}
              </span>
            </div>
          )}

          {/* Error */}
          {status === "error" && error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {AMOUNTS[selectedAmount].label} USDC minted successfully!
                </span>
              </div>
              {txHash && (
                <a
                  href={getTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Action button */}
          {!isConnected ? (
            <button
              onClick={() => openConnectModal?.()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold py-4 transition-all flex items-center justify-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </button>
          ) : status === "success" ? (
            <button
              onClick={() => { setStatus("idle"); setTxHash(null); }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold py-4 transition-all"
            >
              Mint More
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={isProcessing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Droplets className="h-4 w-4" />
              )}
              {isProcessing ? "Minting..." : `Mint ${AMOUNTS[selectedAmount].label} USDC`}
            </button>
          )}
        </div>

        {/* Info card */}
        <div className="mt-6 rounded-2xl bg-card border border-border p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Token Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Token</span>
              <span className="font-medium">USDC (Test USDC)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Base Sepolia</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Decimals</span>
              <span className="font-medium">6</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gas Fees</span>
              <span className="font-medium text-primary">Free (zero gas)</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Contract</span>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {USDC_ADDRESS.slice(0, 6)}...{USDC_ADDRESS.slice(-4)}
                {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
