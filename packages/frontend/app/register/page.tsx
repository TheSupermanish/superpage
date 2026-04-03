"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ShoppingBag, Zap } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for OAuth errors from callback
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  // Handle "Install with Shopify" OAuth flow
  async function handleInstallWithShopify(e: React.FormEvent) {
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
      const params = new URLSearchParams({ shop: shopDomain });

      // Add redirect parameter if coming from resource creation
      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        params.set("redirect", redirectPath);
      }

      // Redirect to backend OAuth endpoint - it will handle everything
      window.location.href = `${API_URL}/api/shopify/auth?${params.toString()}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start installation");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col px-4">
      {/* Back button */}
      <div className="pt-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex items-center justify-center py-8">
        <Card className="w-full max-w-lg border-border">
          <form onSubmit={handleInstallWithShopify} className="contents">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Connect Your Shopify Store</CardTitle>
              <CardDescription>
                Install the Airaa app to enable AI agent commerce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Store URL - Required */}
              <div className="space-y-2">
                <Label htmlFor="store-url">Store URL *</Label>
                <Input
                  id="store-url"
                  type="text"
                  required
                  placeholder="your-store.myshopify.com"
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Shopify store domain (e.g., my-store or my-store.myshopify.com)
                </p>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-2">
                <p className="text-sm font-medium text-foreground">
                  Optional Details
                </p>

                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    type="text"
                    placeholder="My Awesome Store"
                    className="bg-muted"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-description">Store Description</Label>
                  <Textarea
                    id="store-description"
                    placeholder="Brief description of your store for AI agents"
                    className="bg-muted min-h-20"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              {/* How it works */}
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">
                      How it works
                    </p>
                    <ol className="mt-1 text-foreground space-y-1 list-decimal list-inside">
                      <li>Click Install to connect via Shopify</li>
                      <li>Authorize the app permissions</li>
                      <li>Select products for AI agents</li>
                      <li>Start receiving orders!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-medium"
              >
                {isLoading ? (
                  "Redirecting to Shopify..."
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Install with Shopify
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
