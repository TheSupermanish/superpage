"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Github,
  Twitter,
  DollarSign,
  Package,
  FileText,
  Code,
  Copy,
  Check,
  Share2,
  BadgeCheck,
  ArrowLeft,
  Youtube,
  Linkedin,
  Instagram,
  Send,
  MessageCircle,
  Heart,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { parseUnits } from "viem";
import { PublicNavbar } from "@/components/public-navbar";
import { PurchaseModal, type PurchaseItem } from "@/components/purchase-modal";
import { getTxUrl, getChainId, getUsdcAddress } from "@/lib/chain-config";
import { getDefaultChainId } from "@/lib/chains";

const TIP_CHAIN_ID = getDefaultChainId();
const USDC_ADDRESS = getUsdcAddress();
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Profile {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  walletAddress?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    discord?: string;
    youtube?: string;
    linkedin?: string;
    instagram?: string;
    telegram?: string;
  };
  stats?: {
    totalSales: number;
    totalRevenue: number;
  };
}

interface Store {
  id: string;
  name: string;
  shopDomain?: string;
  description?: string;
  productCount: number;
}

interface Product {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  description?: string;
  image?: string;
  price: string;
  currency: string;
  inventory?: number;
}

interface Resource {
  id: string;
  slug?: string;
  type: string;
  name: string;
  description?: string;
  price: number;
  accessCount: number;
}

interface ProfileData {
  profile: Profile;
  content: {
    stores: Store[];
    products: Product[];
    resources: Resource[];
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  // Tip state
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [tipStatus, setTipStatus] = useState<"idle" | "switching" | "sending" | "success" | "error">("idle");
  const [tipTxHash, setTipTxHash] = useState<string | null>(null);
  const [tipError, setTipError] = useState<string | null>(null);

  const { address: senderAddress, isConnected } = useAccount();
  const { openConnect } = useInterwovenKit();
  const { writeContractAsync } = useWriteContract();

  const handleTip = async (amount: string) => {
    if (!isConnected || !senderAddress) {
      openConnect();
      return;
    }
    if (!data?.profile.walletAddress) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setTipStatus("idle");
    setTipError(null);
    setTipTxHash(null);

    try {
      // Send USDC transfer
      setTipStatus("sending");
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [
          data.profile.walletAddress as `0x${string}`,
          parseUnits(amount, 6),
        ],
        chainId: TIP_CHAIN_ID,
      });

      setTipTxHash(hash);
      setTipStatus("success");
    } catch (err: any) {
      const msg = err?.message || "Transaction failed";
      if (msg.includes("User rejected") || msg.includes("denied")) {
        setTipStatus("idle");
      } else {
        setTipError(msg.length > 60 ? msg.slice(0, 60) + "..." : msg);
        setTipStatus("error");
      }
    }
  };

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/@${username}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Profile not found");
          } else {
            setError("Failed to load profile");
          }
          return;
        }

        const profileData = await res.json();
        setData(profileData);
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const copyWalletAddress = () => {
    if (data?.profile.walletAddress) {
      navigator.clipboard.writeText(data.profile.walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="size-16 rounded-full bg-primary/20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">{error || "Profile not found"}</p>
          <Link href="/">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, content } = data;

  return (
    <div className="min-h-screen bg-card text-foreground relative overflow-x-hidden">
      <PublicNavbar />
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 size-96 bg-primary/5 rounded-full blur-3xl animate-blob" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-primary/5 rounded-full blur-3xl animate-blob" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-6 sm:px-8 lg:px-10 pt-20 pb-12 flex flex-col items-center">
        {/* Back Button and Share Button */}
        <div className="w-full flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${profile.displayName || profile.username} on Airaa`,
                  url: window.location.href
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="size-10 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center text-center mb-12 w-full">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div
              className="relative size-32 rounded-full border-4 border-card overflow-hidden ring-4 ring-primary/10 bg-cover bg-center"
              style={{
                backgroundImage: profile.avatarUrl
                  ? `url(${profile.avatarUrl})`
                  : `url(https://api.dicebear.com/7.x/shapes/svg?seed=${profile.username})`,
              }}
            />
            <div className="absolute bottom-2 right-2 bg-primary border-4 border-card size-8 rounded-full shadow-lg flex items-center justify-center" title="Verified">
              <BadgeCheck className="text-primary-foreground" size={14} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-primary font-mono text-sm mb-4">@{profile.username}</p>

          {profile.bio && (
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto text-base">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {(() => {
            const links = profile.socialLinks;
            const hasSocials = profile.website || links?.twitter || links?.github || links?.discord || links?.youtube || links?.linkedin || links?.instagram || links?.telegram;
            if (!hasSocials) return null;

            const socialIcon = (href: string, icon: React.ReactNode, label: string) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                className="size-10 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
              >
                {icon}
              </a>
            );

            return (
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                {profile.website && socialIcon(profile.website, <Globe className="h-5 w-5" />, "Website")}
                {links?.twitter && socialIcon(links.twitter.startsWith("http") ? links.twitter : `https://twitter.com/${links.twitter}`, <Twitter className="h-5 w-5" />, "Twitter")}
                {links?.github && socialIcon(links.github.startsWith("http") ? links.github : `https://github.com/${links.github}`, <Github className="h-5 w-5" />, "GitHub")}
                {links?.youtube && socialIcon(links.youtube.startsWith("http") ? links.youtube : `https://youtube.com/@${links.youtube}`, <Youtube className="h-5 w-5" />, "YouTube")}
                {links?.linkedin && socialIcon(links.linkedin.startsWith("http") ? links.linkedin : `https://linkedin.com/in/${links.linkedin}`, <Linkedin className="h-5 w-5" />, "LinkedIn")}
                {links?.instagram && socialIcon(links.instagram.startsWith("http") ? links.instagram : `https://instagram.com/${links.instagram}`, <Instagram className="h-5 w-5" />, "Instagram")}
                {links?.telegram && socialIcon(links.telegram.startsWith("http") ? links.telegram : `https://t.me/${links.telegram}`, <Send className="h-5 w-5" />, "Telegram")}
                {links?.discord && socialIcon(links.discord.startsWith("http") ? links.discord : `https://discord.gg/${links.discord}`, <MessageCircle className="h-5 w-5" />, "Discord")}
              </div>
            );
          })()}
        </div>

        {/* Tip Button */}
        {profile.walletAddress && (
          <div className="w-full mb-6">
            {!tipOpen ? (
              <button
                onClick={() => setTipOpen(true)}
                className="w-full py-3.5 rounded-2xl font-bold text-base bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Heart className="h-5 w-5" />
                Send a Tip
              </button>
            ) : (
              <div className="w-full p-5 rounded-2xl bg-card border border-primary/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Tip {profile.displayName || profile.username}
                  </h3>
                  <button onClick={() => { setTipOpen(false); setTipStatus("idle"); setTipError(null); setTipTxHash(null); setTipAmount(""); }} className="text-muted-foreground hover:text-foreground text-sm">
                    Cancel
                  </button>
                </div>

                {tipStatus === "success" ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="size-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                      <Check className="h-7 w-7 text-green-500" />
                    </div>
                    <p className="font-bold text-foreground">Tip sent!</p>
                    <p className="text-sm text-muted-foreground">${tipAmount} USDC to {profile.displayName || profile.username}</p>
                    {tipTxHash && (
                      <a
                        href={getTxUrl(tipTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Preset amounts */}
                    <div className="grid grid-cols-4 gap-2">
                      {["1", "2", "5", "10"].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTipAmount(amt)}
                          className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                            tipAmount === amt
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "bg-muted text-foreground hover:bg-primary/10 border border-border"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    {/* Custom amount */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Custom amount"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                          className="w-full pl-7 pr-16 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:border-primary focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">USDC</span>
                      </div>
                    </div>

                    {tipError && (
                      <p className="text-xs text-red-500">{tipError}</p>
                    )}

                    {/* Send button */}
                    <button
                      onClick={() => handleTip(tipAmount)}
                      disabled={!tipAmount || parseFloat(tipAmount) <= 0 || tipStatus === "sending" || tipStatus === "switching"}
                      className="w-full py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {tipStatus === "switching" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Switching network...</>
                      ) : tipStatus === "sending" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Confirm in wallet...</>
                      ) : !isConnected ? (
                        <>Connect Wallet to Tip</>
                      ) : (
                        <>Send ${tipAmount || "0"} USDC</>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Wallet Address */}
        {profile.walletAddress && (
          <div className="w-full mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Wallet Address</h2>
            <div className="w-full p-5 rounded-2xl bg-card border border-border hover:border-primary transition-all group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground text-base">Ethereum</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyWalletAddress}
                  className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary-foreground group-hover:bg-primary transition-all"
                >
                  {copiedWallet ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="w-full space-y-6 mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Resources & APIs</h2>
          {content.resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.resources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => {
                    setPurchaseItem({
                      kind: "resource",
                      data: {
                        id: resource.id,
                        slug: resource.slug,
                        type: resource.type as "api" | "file" | "article",
                        name: resource.name,
                        description: resource.description || null,
                        priceUsdc: resource.price,
                        accessCount: resource.accessCount,
                      },
                    });
                    setPurchaseOpen(true);
                  }}
                  className="w-full p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      {resource.type === 'api' ? (
                        <Code className="h-6 w-6" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">${resource.price}</p>
                      <p className="text-xs text-muted-foreground">{resource.accessCount} accesses</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">{resource.name}</p>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full p-12 rounded-2xl bg-card border border-border text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground text-sm">No resources yet</p>
              <p className="text-muted-foreground text-xs mt-1">Check back soon for APIs, files, and articles</p>
            </div>
          )}
        </div>

        {/* Store Products */}
        <div className="w-full mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Store Products</h2>
          {content.products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {content.products.slice(0, 6).map((product) => (
                <div
                  key={product._id}
                  onClick={() => {
                    setPurchaseItem({
                      kind: "product",
                      data: {
                        id: product.id || product._id,
                        storeId: product.storeId,
                        name: product.name,
                        description: product.description || null,
                        image: product.image || null,
                        price: product.price,
                        currency: product.currency,
                        inventory: product.inventory ?? null,
                      },
                    });
                    setPurchaseOpen(true);
                  }}
                  className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border border-border bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all"
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Package className="h-12 w-12 text-primary/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent flex flex-col justify-end p-4">
                    <p className="text-xs text-primary font-bold mb-1">{product.currency}</p>
                    <p className="text-sm font-bold text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">${parseFloat(product.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full p-12 rounded-2xl bg-card border border-border text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground text-sm">No products yet</p>
              <p className="text-muted-foreground text-xs mt-1">This creator hasn't added any store products</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-2 mt-auto pb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="text-sm font-bold">Airaa</span>
          </div>
          <p className="text-xs text-muted-foreground">Join {profile.username} on Airaa today</p>
        </footer>
      </main>

      <PurchaseModal
        open={purchaseOpen}
        onOpenChange={(open) => {
          setPurchaseOpen(open);
          if (!open) setPurchaseItem(null);
        }}
        item={purchaseItem}
      />

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}
