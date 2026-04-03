"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import {
  useX402Payment,
  type CheckoutRequest,
  type ResourceResult,
  type CheckoutResult,
  type PaymentStatus,
} from "@/hooks/use-x402-payment";
import { getCurrencyDisplay, getTxUrl } from "@/lib/chain-config";
import {
  Code,
  FileText,
  Globe,
  ShoppingBag,
  Loader2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Package,
} from "lucide-react";
import { marked } from "marked";

// ── Item types ──────────────────────────────────────

export interface ResourceItem {
  id: string;
  slug?: string;
  type: "api" | "file" | "article" | "shopify";
  name: string;
  description: string | null;
  priceUsdc: number;
  accessCount?: number;
  creator?: { name: string; username?: string };
}

export interface ProductItem {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  image: string | null;
  price: string;
  currency: string;
  inventory: number | null;
}

export type PurchaseItem =
  | { kind: "resource"; data: ResourceItem }
  | { kind: "product"; data: ProductItem };

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PurchaseItem | null;
}

// ── Helpers ─────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: typeof Code; color: string; label: string }> = {
  api: { icon: Code, color: "text-sp-blue bg-sp-blue/15", label: "API" },
  file: { icon: FileText, color: "text-sp-gold bg-sp-gold/15", label: "File" },
  article: { icon: Globe, color: "text-sp-coral bg-sp-coral/15", label: "Article" },
  shopify: { icon: ShoppingBag, color: "text-sp-pink bg-sp-pink/15", label: "Store" },
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  idle: "",
  "fetching-requirements": "Preparing payment...",
  "switching-network": "Switching network...",
  "awaiting-approval": "Approve transaction in your wallet",
  "confirming-tx": "Confirming transaction...",
  "verifying-payment": "Verifying payment...",
  success: "Payment successful!",
  error: "Payment failed",
};

// ── Component ───────────────────────────────────────

export function PurchaseModal({ open, onOpenChange, item }: PurchaseModalProps) {
  const { isConnected, openConnect } = useInterwovenKit();
  const { payForResource, payForProduct, status, error, txHash, reset } = useX402Payment();

  const [resourceResult, setResourceResult] = useState<ResourceResult | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  // Shipping form (products only)
  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    address1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Reset state when modal opens/closes or item changes
  useEffect(() => {
    if (open) {
      reset();
      setResourceResult(null);
      setCheckoutResult(null);
      setFormError(null);
    }
  }, [open, item, reset]);

  // Revoke blob URLs when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (resourceResult?.downloaded?.url) {
        URL.revokeObjectURL(resourceResult.downloaded.url);
      }
    };
  }, [resourceResult]);

  if (!item) return null;

  const isResource = item.kind === "resource";
  const isProduct = item.kind === "product";
  const isProcessing = status !== "idle" && status !== "success" && status !== "error";

  const price = isResource
    ? `${item.data.priceUsdc} ${getCurrencyDisplay()}`
    : `${item.data.price} ${item.data.currency}`;

  const typeConfig = isResource ? TYPE_CONFIG[item.data.type] || TYPE_CONFIG.api : null;
  const TypeIcon = typeConfig?.icon || Package;

  // ── Handlers ────────────────────────────────────

  const handleBuy = async () => {
    if (!isConnected) {
      openConnect();
      return;
    }

    try {
      if (isResource) {
        const result = await payForResource(item.data.slug || item.data.id);
        setResourceResult(result);
      } else {
        // Validate shipping
        if (!shipping.name || !shipping.email || !shipping.address1 || !shipping.city || !shipping.postalCode || !shipping.country) {
          setFormError("Please fill in all required shipping fields");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
          setFormError("Please enter a valid email address");
          return;
        }
        setFormError(null);

        const checkoutData: CheckoutRequest = {
          storeId: item.data.storeId,
          items: [{ productId: item.data.id, quantity: 1 }],
          shippingAddress: {
            name: shipping.name,
            address1: shipping.address1,
            city: shipping.city,
            state: shipping.state || undefined,
            postalCode: shipping.postalCode,
            country: shipping.country,
          },
          email: shipping.email,
        };

        const result = await payForProduct(checkoutData);
        setCheckoutResult(result);
      }
    } catch {
      // Error state is handled by the hook
    }
  };

  const handleRetry = () => {
    reset();
    setResourceResult(null);
    setCheckoutResult(null);
  };

  // ── Render ──────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isProcessing) onOpenChange(o); }}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-3xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isResource && typeConfig && (
              <div className={`size-10 rounded-xl flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon className="h-5 w-5" />
              </div>
            )}
            {isProduct && item.data.image && (
              <img
                src={item.data.image}
                alt={item.data.name}
                className="size-10 rounded-xl object-cover"
              />
            )}
            {isProduct && !item.data.image && (
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold truncate">
                {isResource ? item.data.name : item.data.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {isResource && typeConfig && (
                  <Badge variant="secondary" className="text-xs">{typeConfig.label}</Badge>
                )}
                {isProduct && (
                  <Badge variant="secondary" className="text-xs">Store Product</Badge>
                )}
                {isResource && item.data.creator && (
                  <span className="text-xs text-muted-foreground">
                    by {item.data.creator.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {(isResource ? item.data.description : item.data.description) && (
            <DialogDescription className="mt-3 text-sm text-muted-foreground">
              {isResource ? item.data.description : item.data.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Price */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
          <span className="text-sm text-muted-foreground font-medium">Price</span>
          <span className="text-xl font-bold text-primary">{price}</span>
        </div>

        {/* Product image (large) */}
        {isProduct && item.data.image && (
          <div className="rounded-xl overflow-hidden border border-border">
            <img
              src={item.data.image}
              alt={item.data.name}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {/* Shipping form (products only) */}
        {isProduct && status === "idle" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Shipping Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="ship-name" className="text-xs text-muted-foreground mb-1">Full Name *</Label>
                <Input
                  id="ship-name"
                  placeholder="John Doe"
                  value={shipping.name}
                  onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ship-email" className="text-xs text-muted-foreground mb-1">Email *</Label>
                <Input
                  id="ship-email"
                  type="email"
                  placeholder="john@example.com"
                  value={shipping.email}
                  onChange={(e) => setShipping((s) => ({ ...s, email: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ship-address" className="text-xs text-muted-foreground mb-1">Address *</Label>
                <Input
                  id="ship-address"
                  placeholder="123 Main St"
                  value={shipping.address1}
                  onChange={(e) => setShipping((s) => ({ ...s, address1: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label htmlFor="ship-city" className="text-xs text-muted-foreground mb-1">City *</Label>
                <Input
                  id="ship-city"
                  placeholder="New York"
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label htmlFor="ship-state" className="text-xs text-muted-foreground mb-1">State</Label>
                <Input
                  id="ship-state"
                  placeholder="NY"
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label htmlFor="ship-postal" className="text-xs text-muted-foreground mb-1">Postal Code *</Label>
                <Input
                  id="ship-postal"
                  placeholder="10001"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label htmlFor="ship-country" className="text-xs text-muted-foreground mb-1">Country *</Label>
                <Input
                  id="ship-country"
                  placeholder="US"
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}
          </div>
        )}

        {/* Payment status */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-3">
              {status === "awaiting-approval" ? (
                <Wallet className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              <span className="text-sm font-medium text-foreground">
                {STATUS_LABELS[status]}
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

        {/* Error */}
        {status === "error" && error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success: Resource (file download) */}
        {status === "success" && isResource && resourceResult?.downloaded && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Payment successful!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {resourceResult.downloaded.filename} is ready to download
                </p>
              </div>
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
            {resourceResult.downloaded.url && (
              <a
                href={resourceResult.downloaded.url}
                download={resourceResult.downloaded.filename}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10"
              >
                <FileText className="h-5 w-5" />
                Download {resourceResult.downloaded.filename}
              </a>
            )}
          </div>
        )}

        {/* Success: Resource (non-file) */}
        {status === "success" && isResource && resourceResult && !resourceResult.downloaded && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Access granted!</span>
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
            {/* Content display */}
            {(() => {
              // Extract article content (may be nested in response object)
              const raw = resourceResult.content as any;
              const articleText = raw?.content || (typeof raw === "string" ? raw : null);
              const isMarkdown = articleText && (
                resourceResult.contentType?.includes("markdown") ||
                raw?.contentType === "markdown" ||
                articleText.startsWith("#")
              );

              if (isMarkdown || (articleText && typeof articleText === "string")) {
                const htmlContent = marked.parse(articleText, { breaks: true }) as string;
                return (
                  <div className="p-6 rounded-xl bg-muted border border-border max-h-[50vh] overflow-y-auto">
                    <article
                      className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-code:text-primary prose-code:bg-background prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-strong:text-foreground prose-li:text-muted-foreground prose-ul:list-disc prose-ol:list-decimal prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  </div>
                );
              }

              // Fallback: JSON/raw content (APIs return JSON)
              return (
                <div className="p-4 rounded-xl bg-muted border border-border max-h-[50vh] overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}

        {/* Success: Product */}
        {status === "success" && isProduct && checkoutResult && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Order confirmed!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Order ID: {checkoutResult.orderId}
                </p>
              </div>
            </div>
            {checkoutResult.txHash && (
              <a
                href={getTxUrl(checkoutResult.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="p-3 rounded-xl bg-muted border border-border text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{checkoutResult.amounts.total} {checkoutResult.amounts.currency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-2">
          {status === "idle" && !isConnected && (
            <Button
              onClick={() => openConnect()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold py-6"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet to Buy
            </Button>
          )}
          {status === "idle" && isConnected && (
            <Button
              onClick={handleBuy}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold py-6"
            >
              {isResource && item.data.type === "article" ? "Read for" : "Pay"} {price}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {status === "error" && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full rounded-xl font-bold py-6 border-border"
            >
              Try Again
            </Button>
          )}
          {status === "success" && (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold py-6"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
