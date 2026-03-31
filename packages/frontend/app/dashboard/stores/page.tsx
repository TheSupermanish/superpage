"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ConnectStoreModal } from "@/components/connect-store-modal";
import {
  Loader2,
  ShoppingBag,
  Plus,
  ExternalLink,
  Pencil,
  Package,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Store {
  _id: string;
  id: string;
  name: string;
  url: string;
  shopDomain: string;
  createdAt: string;
}

interface StoreProduct {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  image: string | null;
  price: string;
  currency: string;
  inventory: number | null;
  metadata?: {
    productId?: string;
    handle?: string;
    sku?: string;
  } | null;
}

export default function StoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteStoreId, setDeleteStoreId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle URL query params for error/success messages
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const connectedParam = searchParams.get("connected");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear the URL params
      router.replace("/dashboard/stores", { scroll: false });
    }

    if (connectedParam === "true") {
      const transferred = searchParams.get("transferred");
      if (transferred === "true") {
        setSuccess("Store reconnected and transferred to your account. Products imported.");
      } else {
        setSuccess("Store connected successfully! Products imported.");
      }
      // Clear the URL params
      router.replace("/dashboard/stores", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (token) {
      fetchStores();
    }
  }, [token]);

  useEffect(() => {
    if (stores.length > 0 && token) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, stores.length, token]);

  const fetchStores = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch stores");
      }

      const data = await res.json();
      // Handle both {stores: [...]} and {data: {stores: [...]}} response formats
      if (data.success && data.data?.stores) {
        setStores(data.data.stores);
      } else if (Array.isArray(data)) {
        setStores(data);
      } else {
        setStores(data.stores || []);
      }
    } catch (err: any) {
      console.error("Error fetching stores:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;

    setProductsLoading(true);
    try {
      if (selectedStoreId) {
        // Fetch products for a specific store
        const res = await fetch(`${API_URL}/x402/stores/${encodeURIComponent(selectedStoreId)}/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } else {
        // Fetch all products from all stores
        const res = await fetch(`${API_URL}/x402/store-products?limit=200`);
        if (res.ok) {
          const data = await res.json();
          const allProducts = data.products || [];
          // Filter to only show products from user's stores
          const storeIds = stores.map(s => s.id);
          const filteredProducts = allProducts.filter((p: StoreProduct) =>
            storeIds.includes(p.storeId)
          );
          setProducts(filteredProducts);
        }
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!deleteStoreId || !token) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/stores/${deleteStoreId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete store");
      }

      // Refresh stores list and products
      await fetchStores();
      await fetchProducts();
      setDeleteStoreId(null);
    } catch (err: any) {
      console.error("Error deleting store:", err);
      alert(err.message || "Failed to delete store");
    } finally {
      setDeleting(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery.trim() === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || storeId;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Connected Stores
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Shopify stores and import products
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sp-pink hover:bg-sp-pink/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sp-pink/10 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Connect Store
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-500 font-semibold mb-1">Connection Error</h4>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-sp-pink/10 border border-sp-pink/20 rounded-xl p-4 flex items-start gap-3">
          <ShoppingBag className="h-5 w-5 text-sp-pink flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sp-pink font-semibold">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-sp-pink hover:text-sp-pink/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <ConnectStoreModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          fetchStores();
          setSuccess("Store connected successfully!");
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteStoreId} onOpenChange={(open) => !open && setDeleteStoreId(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Store</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this store? This action cannot be undone and will also delete all associated products.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setDeleteStoreId(null)}
              disabled={deleting}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-foreground font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStore}
              disabled={deleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stores List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-sp-pink animate-spin mb-4" />
          <p className="text-muted-foreground">Loading stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 rounded-2xl bg-sp-pink/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-10 w-10 text-sp-pink" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No stores connected yet
          </h3>
          <p className="text-muted-foreground mb-4">Connect your first Shopify store to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-sp-pink hover:bg-sp-pink/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-sp-pink/10 flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Connect Store
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div
              key={store._id}
              className="bg-card border border-border hover:border-sp-pink/30 transition-all rounded-2xl p-6 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-xl bg-sp-pink/10 group-hover:bg-sp-pink flex items-center justify-center flex-shrink-0 transition-colors">
                  <ShoppingBag className="h-7 w-7 text-sp-pink group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg mb-1 truncate">
                    {store.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {store.shopDomain}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connected {new Date(store.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/shopify/products?store_id=${encodeURIComponent(store.id)}&store_name=${encodeURIComponent(store.name)}&shop_domain=${encodeURIComponent(store.shopDomain)}`
                    )
                  }
                  className="flex-1 bg-sp-pink hover:bg-sp-pink/90 text-white rounded-xl px-4 py-2 text-sm font-bold transition-colors shadow-lg shadow-sp-pink/10 flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Import Products
                </button>
                <button
                  onClick={() => {
                    const storeUrl = store.url || (store.shopDomain ? `https://${store.shopDomain}` : null);
                    if (storeUrl) {
                      window.open(storeUrl, "_blank");
                    }
                  }}
                  disabled={!store.url && !store.shopDomain}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-sp-pink hover:border-sp-pink/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Open store in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    // Use _id if available (MongoDB), otherwise use id
                    const storeId = store._id || store.id;
                    setDeleteStoreId(storeId);
                  }}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-colors"
                  title="Delete store"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Section */}
      {stores.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Store Products</h2>
              <p className="text-muted-foreground mt-1">
                View and manage products from your connected stores
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Store Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Filter by Store
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedStoreId || ""}
                    onChange={(e) => setSelectedStoreId(e.target.value || null)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-sp-pink focus:ring-2 focus:ring-sp-pink/20"
                  >
                    <option value="">All Stores</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sp-pink focus:ring-2 focus:ring-sp-pink/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products List */}
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 text-sp-pink animate-spin mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                {searchQuery || selectedStoreId ? "No products found" : "No products yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedStoreId
                  ? "Try adjusting your filters"
                  : "Import products from your stores to see them here"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-card border border-border hover:border-sp-pink/30 transition-all rounded-2xl p-4 group"
                >
                  {product.image && (
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {getStoreName(product.storeId)}
                    </p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-sp-pink">
                        {product.price} {product.currency}
                      </p>
                      {product.inventory !== null && (
                        <p className="text-xs text-muted-foreground">
                          {product.inventory > 0 ? (
                            <span className="text-sp-pink">{product.inventory} in stock</span>
                          ) : (
                            <span className="text-red-400">Out of stock</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const store = stores.find(s => s.id === product.storeId || s._id === product.storeId);
                        if (!store?.shopDomain) return null;
                        const shopName = store.shopDomain.replace('.myshopify.com', '');
                        const prefix = 'gid://shopify/Product/';
                        const productId = product.metadata?.productId
                          ? (product.metadata.productId.startsWith(prefix)
                            ? product.metadata.productId.slice(prefix.length)
                            : product.metadata.productId)
                          : null;
                        const adminUrl = productId
                          ? `https://admin.shopify.com/store/${shopName}/products/${productId}`
                          : `https://admin.shopify.com/store/${shopName}/products`;
                        return (
                          <a
                            href={adminUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-sp-pink hover:border-sp-pink/30 transition-colors"
                            title="Edit in Shopify Admin"
                          >
                            <Pencil className="h-4 w-4" />
                          </a>
                        );
                      })()}
                      {(() => {
                        const store = stores.find(s => s.id === product.storeId || s._id === product.storeId);
                        if (!store?.shopDomain || !product.metadata?.handle) return null;
                        return (
                          <a
                            href={`https://${store.shopDomain}/products/${product.metadata.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-sp-pink hover:border-sp-pink/30 transition-colors"
                            title="View on Shopify store"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          )}
        </div>
      )}
    </div>
  );
}
