"use client";

import { useState } from "react";
import { useAuth } from "./providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, Zap, Loader2, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ConnectStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConnectStoreModal({
  open,
  onOpenChange,
  onSuccess,
}: ConnectStoreModalProps) {
  const { token } = useAuth();
  const [storeUrl, setStoreUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!storeUrl.trim()) {
      setError("Please enter your Shopify store URL");
      return;
    }

    setIsLoading(true);

    try {
      // Extract shop domain from URL
      let shopDomain = storeUrl.trim();
      shopDomain = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

      // Ensure it ends with .myshopify.com
      if (!shopDomain.includes(".myshopify.com")) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }

      // Build OAuth URL with redirect parameter
      const params = new URLSearchParams({
        shop: shopDomain,
        redirect: "/dashboard/stores",
      });

      // Get the install URL from backend (avoids CORS issues with redirects)
      const installUrlRes = await fetch(
        `${API_URL}/api/shopify/install-url?shop=${encodeURIComponent(shopDomain)}`,
        {
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        }
      );

      if (!installUrlRes.ok) {
        throw new Error("Failed to get Shopify install URL");
      }

      const { installUrl } = await installUrlRes.json();

      // Redirect to Shopify OAuth
      window.location.href = installUrl;
    } catch (err: any) {
      setError(err.message || "Failed to start installation");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setStoreUrl("");
      setStoreName("");
      setStoreDescription("");
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Connect Your Shopify Store
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Install the Airaa app to enable AI agent commerce
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-6 mt-4">
          {/* Store URL - Required */}
          <div className="space-y-2">
            <Label htmlFor="store-url" className="text-foreground">
              Store URL <span className="text-red-400">*</span>
            </Label>
            <Input
              id="store-url"
              type="text"
              required
              placeholder="your-store.myshopify.com"
              className="bg-muted border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter your Shopify store domain (e.g., my-store or
              my-store.myshopify.com)
            </p>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium text-foreground">
              Optional Details
            </p>

            <div className="space-y-2">
              <Label htmlFor="store-name" className="text-foreground">
                Store Name
              </Label>
              <Input
                id="store-name"
                type="text"
                placeholder="My Awesome Store"
                className="bg-muted border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-description" className="text-foreground">
                Store Description
              </Label>
              <Textarea
                id="store-description"
                placeholder="Brief description of your store for AI agents"
                className="bg-muted border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-20 resize-none"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-2">How it works</p>
                <ol className="text-foreground space-y-1 list-decimal list-inside">
                  <li>Click Install to connect via Shopify</li>
                  <li>Authorize the app permissions</li>
                  <li>Select products for AI agents</li>
                  <li>Start receiving orders!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl text-foreground font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !storeUrl.trim()}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Install with Shopify
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
