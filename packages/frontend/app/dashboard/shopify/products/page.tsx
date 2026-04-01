"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  ShoppingBag,
  Package,
  CheckCircle,
  Search,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ShopifyProduct {
  id: string;
  title: string;
  handle?: string;
  imageUrl?: string;
  descriptionHtml?: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    imageUrl?: string;
    sku?: string;
    inventoryQuantity?: number;
  }>;
}

export default function ShopifyProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [storeId, setStoreId] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("");
  const [shopDomain, setShopDomain] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storeIdParam = searchParams.get("store_id");
    const storeNameParam = searchParams.get("store_name");
    const shopDomainParam = searchParams.get("shop_domain");

    if (!storeIdParam) {
      setError("No store ID provided");
      setLoading(false);
      return;
    }

    setStoreId(storeIdParam);
    setStoreName(storeNameParam || "");
    setShopDomain(shopDomainParam || "");
    fetchProducts(storeIdParam);
  }, [searchParams]);

  const fetchProducts = async (sid: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/shopify/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeId: sid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch products");
      }

      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product");
      return;
    }

    if (!token) {
      alert("Please sign in first");
      return;
    }

    setImporting(true);
    setError("");

    try {
      // Get full product details for selected products
      const selectedProductsList = products.filter((p) =>
        selectedProducts.has(p.id)
      );

      // Transform Shopify products into individual variants for import
      const variantsToImport = selectedProductsList.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id, // This is the variantId
          name: `${product.title}${variant.title !== "Default Title" ? ` - ${variant.title}` : ""}`,
          description: product.descriptionHtml || null,
          image: variant.imageUrl || product.imageUrl || null,
          price: variant.price,
          currency: "USD",
          inventory: variant.inventoryQuantity ?? null,
          metadata: {
            productId: product.id,
            handle: product.handle || null,
            variantTitle: variant.title,
            sku: variant.sku,
          },
        }))
      );

      console.log("Importing to storeId:", storeId);
      console.log("Importing variants:", variantsToImport);
      console.log("API URL:", `${API_URL}/api/stores/${encodeURIComponent(storeId)}/products`);

      const res = await fetch(`${API_URL}/api/stores/${encodeURIComponent(storeId)}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: variantsToImport }),
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Received non-JSON response:", text);
        throw new Error(`Server returned ${contentType || 'unknown content type'}. Expected JSON.`);
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to import products");
      }

      console.log("Import successful:", result);

      // Redirect back to stores page
      router.push("/dashboard/stores");
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error && !products.length) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard/stores")}>
            Back to Stores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <button
        onClick={() => router.push("/dashboard/stores")}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stores
      </button>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Select Products to Import</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>From</span>
          <span className="font-medium text-foreground">{storeName}</span>
          {shopDomain && shopDomain !== storeName && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{shopDomain}</span>
            </>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          Choose which products you want to sell via x402
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-sp-pink animate-spin mb-4" />
          <p className="text-muted-foreground">Loading products from Shopify...</p>
        </div>
      ) : (
        <>
          {/* Search and Actions */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    setSelectedProducts(
                      new Set(selectedProducts.size > 0 ? [] : products.map((p) => p.id))
                    )
                  }
                  variant="outline"
                  className="border-border rounded-xl"
                >
                  {selectedProducts.size > 0 ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || selectedProducts.size === 0}
                  className="bg-sp-pink hover:bg-sp-pink/90 rounded-xl shadow-lg shadow-sp-pink/10 font-bold"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Import {selectedProducts.size} Product
                      {selectedProducts.size !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                {searchTerm ? "No products found" : "No products in store"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try a different search term"
                  : "Add products to your Shopify store first"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-card border transition-all cursor-pointer rounded-2xl p-4 group ${
                    selectedProducts.has(product.id)
                      ? "border-sp-pink bg-sp-pink/5"
                      : "border-border hover:border-sp-pink/30"
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.variants.length} variant
                        {product.variants.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {product.variants[0] && (
                      <p className="text-lg font-bold text-sp-pink">
                        ${product.variants[0].price}
                      </p>
                    )}
                    {product.variants[0]?.inventoryQuantity !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {(product.variants[0].inventoryQuantity ?? 0) > 0 ? (
                          <span className="text-sp-pink">{product.variants[0].inventoryQuantity} in stock</span>
                        ) : (
                          <span className="text-red-400">Out of stock</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
