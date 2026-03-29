"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Variant = {
  id: string;
  title: string;
  price: string | { amount: string; currencyCode: string };
  imageUrl?: string | null;
  sku?: string | null;
  inventoryQuantity?: number | null;
};

type Product = {
  id: string;
  title: string;
  imageUrl?: string | null;
  variants: Variant[];
  descriptionHtml?: string | null;
};

export default function ProductsPage() {
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedStoreId = localStorage.getItem("store_id");
    const domain = localStorage.getItem("shop_domain");
    
    // For OAuth flow, we only need storeId
    if (!storedStoreId) {
      setError("Missing store information. Please connect your store first.");
      return;
    }
    
    setStoreId(storedStoreId);
    setStoreUrl(domain);

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use storeId to fetch products (access token is stored in backend)
        const res = await fetch(`${API_URL}/api/shopify/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: storedStoreId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.details || `Error ${res.status}`);
        }
        const data = (await res.json()) as { products: Product[] };
        setProducts(data.products ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Default select all products when they first load
  useEffect(() => {
    if (products.length && selected.size === 0) {
      setSelected(new Set(products.map((p) => p.id)));
    }
  }, [products]);

  function toggleSelected(id: string, next?: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      const shouldSelect = typeof next === "boolean" ? next : !copy.has(id);
      if (shouldSelect) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  const selectedCount = selected.size;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/register")}
            variant="ghost"
            size="sm"
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Select products for Agent store</h1>
              <p className="text-muted-foreground">
                {storeUrl ? `Connected to ${storeUrl}` : storeId ? `Store: ${storeId}` : "Not connected"}
              </p>
            </div>
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground">Loading products from Shopify...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            <p className="font-medium">Error loading products</p>
            <p className="mt-1">{error}</p>
            <Button
              onClick={() => router.push("/register")}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Connect Store Again
            </Button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found in your store.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add some products to your Shopify store first.
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const allPrices = p.variants
                .map((v) =>
                  typeof v.price === "string"
                    ? parseFloat(v.price)
                    : parseFloat(v.price.amount)
                )
                .filter((n) => !Number.isNaN(n));
              const minPrice = allPrices.length
                ? Math.min(...allPrices)
                : undefined;
              const currency = p.variants.find((v) => typeof v.price !== "string")
                ? (p.variants.find((v) => typeof v.price !== "string")!.price as { amount: string; currencyCode: string })
                    .currencyCode
                : undefined;

              return (
                <Card
                  key={p.id}
                  className={cn(
                    "overflow-hidden relative cursor-pointer transition-all border",
                    selected.has(p.id)
                      ? "ring-2 ring-primary/60 border-primary/60 shadow-lg scale-[1.01] bg-primary/5"
                      : "hover:shadow-md"
                  )}
                  onClick={() => toggleSelected(p.id)}
                >
                  <div className="absolute left-2 top-2 z-10">
                    <Checkbox
                      className="size-5"
                      checked={selected.has(p.id)}
                      onCheckedChange={(v) => toggleSelected(p.id, Boolean(v))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {selected.has(p.id) && (
                    <div className="absolute right-2 top-2 z-10 text-sp-blue">
                      <CheckCircle2 className="size-6 drop-shadow-sm" />
                    </div>
                  )}
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 w-full bg-muted flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}
                    </div>
                    <div className="text-base font-medium">
                      {minPrice !== undefined
                        ? `From ${currency ?? ""} $${minPrice.toFixed(2)}`
                        : "Price unavailable"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom sticky continue bar */}
        {!loading && !error && products.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 mt-8 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 py-4">
              <div className="text-sm text-muted-foreground">
                {selectedCount} product{selectedCount === 1 ? "" : "s"} selected
              </div>
              <Button
                className="bg-sp-blue hover:bg-sp-blue/90"
                disabled={selectedCount === 0 || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const currentStoreId = localStorage.getItem("store_id");
                    
                    if (!currentStoreId) {
                      throw new Error("Store ID not found");
                    }

                    // Prepare selected variants for upsert
                    const selectedProducts = products.filter((p) =>
                      selected.has(p.id)
                    );
                    const selectedVariants = selectedProducts.flatMap((p) =>
                      p.variants.map((v) => ({
                        id: v.id,
                        name:
                          v.title && v.title !== "Default Title"
                            ? `${p.title} - ${v.title}`
                            : p.title,
                        description: p.descriptionHtml ?? null,
                        image: v.imageUrl || p.imageUrl || null,
                        price:
                          typeof v.price === "string"
                            ? v.price
                            : v.price.amount,
                        currency: "USD",
                        inventory: v.inventoryQuantity ?? null,
                        metadata: {
                          sku: v.sku ?? undefined,
                          productId: p.id,
                        },
                      }))
                    );

                    // Save selected products via backend
                    const prodRes = await fetch(
                      `${API_URL}/api/stores/${currentStoreId}/products`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          products: selectedVariants,
                        }),
                      }
                    );
                    if (!prodRes.ok) {
                      const t = await prodRes.text();
                      throw new Error(`Save products failed: ${t}`);
                    }

                    // Save selection locally
                    localStorage.setItem(
                      "selected_product_ids",
                      JSON.stringify(Array.from(selected))
                    );

                    // Navigate to dashboard
                    window.location.href = "/dashboard";
                  } catch (e) {
                    console.error(e);
                    alert(
                      e instanceof Error ? e.message : "Failed to save selection"
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : `Continue with ${selectedCount} products`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
