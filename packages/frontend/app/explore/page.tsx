"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Star, TrendingUp, Users } from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";
import { getCurrencyDisplay } from "@/lib/chain-config";
import { PurchaseModal, type PurchaseItem } from "@/components/purchase-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Resource {
  id: string;
  slug: string;
  type: "api" | "file" | "article" | "shopify";
  name: string;
  description: string | null;
  priceUsdc: number;
  accessCount: number;
  createdAt: string;
  creator: {
    id: string;
    walletAddress: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
}

interface Creator {
  id: string;
  username: string;
  displayName?: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  totalSales: number;
  resourceCount: number;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  createdAt: string;
  creator?: {
    username?: string;
    name?: string;
    avatarUrl?: string;
  };
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
}

const typeIcons: Record<string, string> = {
  api: "code",
  file: "description",
  article: "article",
  shopify: "shopping_bag",
};

const typeColors: Record<string, { bg: string; text: string; border: string; btn: string; btnHover: string; shadow: string }> = {
  api: { bg: "from-sp-blue/20 to-sp-blue/10", text: "text-sp-blue", border: "border-sp-blue/40", btn: "bg-sp-blue", btnHover: "hover:bg-sp-blue/90", shadow: "shadow-sp-blue/10" },
  file: { bg: "from-sp-gold/20 to-sp-gold/10", text: "text-sp-gold", border: "border-sp-gold/40", btn: "bg-sp-gold", btnHover: "hover:bg-sp-gold/90", shadow: "shadow-sp-gold/10" },
  article: { bg: "from-sp-coral/20 to-sp-coral/10", text: "text-sp-coral", border: "border-sp-coral/40", btn: "bg-sp-coral", btnHover: "hover:bg-sp-coral/90", shadow: "shadow-sp-coral/10" },
  shopify: { bg: "from-sp-pink/20 to-sp-pink/10", text: "text-sp-pink", border: "border-sp-pink/40", btn: "bg-sp-pink", btnHover: "hover:bg-sp-pink/90", shadow: "shadow-sp-pink/10" },
};

export default function ExplorePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the new combined explore endpoint
        const exploreRes = await fetch(`${API_URL}/api/explore?limit=50`);

        if (exploreRes.ok) {
          const data = await exploreRes.json();
          if (data.success && data.data) {
            setResources(data.data.resources || []);
            setCreators(data.data.creators || []);
            setStores(data.data.stores || []);
            setStoreProducts(data.data.products || []);
          }
        } else {
          // Fallback to individual endpoints if combined endpoint fails
          const [resourcesRes, creatorsRes, storesRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/x402/resources?limit=50`),
            fetch(`${API_URL}/api/creators?limit=20&sortBy=sales`),
            fetch(`${API_URL}/x402/stores`),
            fetch(`${API_URL}/x402/store-products?limit=30`),
          ]);

          if (resourcesRes.ok) {
            const data = await resourcesRes.json();
            setResources(data.resources || []);
          }

          if (creatorsRes.ok) {
            const data = await creatorsRes.json();
            setCreators(data.creators || data.data || []);
          }

          if (storesRes.ok) {
            const data = await storesRes.json();
            setStores(data.stores || data.data?.stores || []);
          }

          if (productsRes.ok) {
            const data = await productsRes.json();
            setStoreProducts(data.products || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter all content by search term
  const searchLower = search.toLowerCase();

  const filteredResources = resources.filter((r) => {
    const matchesSearch = search
      ? r.name.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.creator?.name?.toLowerCase().includes(searchLower)
      : true;
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredCreators = creators.filter((c) => {
    if (!search) return true;
    return c.name?.toLowerCase().includes(searchLower) ||
      c.username?.toLowerCase().includes(searchLower) ||
      c.displayName?.toLowerCase().includes(searchLower) ||
      c.bio?.toLowerCase().includes(searchLower);
  });

  const filteredStores = stores.filter((s) => {
    if (!search) return true;
    return s.name?.toLowerCase().includes(searchLower) ||
      s.description?.toLowerCase().includes(searchLower) ||
      s.domain?.toLowerCase().includes(searchLower);
  });

  const filteredProducts = storeProducts.filter((p) => {
    if (!search) return true;
    return p.name?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower);
  });

  const formatPrice = (amount: number) => {
    return `$${amount.toFixed(2)} ${getCurrencyDisplay()}`;
  };

  return (
    <div className="min-h-screen bg-card text-foreground">
      <PublicNavbar />
      {/* Hero Section */}
      <div className="bg-muted/50 border-b border-border pt-36 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto w-full flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Discover the Future of Web3 Commerce
              </h1>
              <p className="text-muted-foreground">
                Explore curated resources, expert creators, and powerful stores
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-sp-pink transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search resources, creators, or stores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border focus:border-sp-pink focus:ring-4 focus:ring-sp-pink/10 rounded-2xl py-5 pl-14 pr-32 text-base font-medium transition-all shadow-sm outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <kbd className="hidden md:inline-flex items-center px-2 py-1 rounded border border-border text-[10px] text-muted-foreground font-mono bg-muted">
                  cmd K
                </kbd>
                <button className="bg-sp-pink text-white p-2.5 rounded-xl hover:bg-sp-pink/90 transition-all">
                  <Filter size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12 flex flex-col gap-16">
        {/* Featured Creators */}
        {filteredCreators.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {search ? `Creators matching "${search}"` : "Featured Creators"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {search ? `${filteredCreators.length} creator(s) found` : "The most influential builders in the SuperPage ecosystem"}
                </p>
              </div>
              <Link
                href="/creators"
                className="text-sp-pink text-sm font-bold flex items-center gap-1 hover:underline"
              >
                View all
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 hide-scroll">
              {filteredCreators.slice(0, 6).map((creator) => (
                <Link
                  key={creator.id}
                  href={creator.username ? `/${creator.username}` : `/creators/${creator.id}`}
                  className="flex-none w-56 bg-card rounded-3xl p-6 border border-border flex flex-col items-center text-center gap-4 group hover:border-sp-pink hover:shadow-xl hover:shadow-sp-pink/5 transition-all"
                >
                  <div className="relative">
                    <div
                      className="size-24 rounded-full bg-cover bg-center ring-4 ring-sp-pink/10"
                      style={{
                        backgroundImage: creator.avatarUrl
                          ? `url(${creator.avatarUrl})`
                          : `url(https://api.dicebear.com/7.x/shapes/svg?seed=${creator.username || creator.id})`,
                      }}
                    />
                  </div>
                  <div className="w-full">
                    <p className="font-bold text-base truncate">
                      {creator.displayName || creator.name}
                    </p>
                    {creator.username && (
                      <p className="text-xs text-muted-foreground font-medium">@{creator.username}</p>
                    )}
                  </div>
                  <div className="w-full pt-2 border-t border-border flex justify-between text-xs">
                    <div className="flex flex-col items-start">
                      <span className="text-muted-foreground">Resources</span>
                      <span className="text-sp-pink font-bold">{creator.resourceCount}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground">Sales</span>
                      <span className="text-foreground font-bold">{creator.totalSales}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular Resources */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Popular Resources</h2>
              <p className="text-sm text-muted-foreground">
                Access premium APIs, files, articles, and integrations
              </p>
            </div>

            {/* Type Filter */}
            <div className="flex bg-card p-1.5 rounded-2xl border border-border w-fit overflow-x-auto hide-scroll">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-6 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  typeFilter === "all"
                    ? "bg-sp-pink text-white shadow-sm"
                    : "text-muted-foreground hover:text-sp-pink"
                }`}
              >
                All
              </button>
              {["api", "file", "article", "shopify"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-6 py-2 text-xs font-medium rounded-xl transition-all capitalize whitespace-nowrap ${
                    typeFilter === type
                      ? "bg-sp-pink text-white shadow-sm"
                      : "text-muted-foreground hover:text-sp-pink"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sp-pink border-t-transparent" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="bg-card rounded-3xl border border-border p-16 text-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                <Search className="text-muted-foreground" size={32} />
              </div>
              <h3 className="text-lg font-medium mb-2">No resources found</h3>
              <p className="text-muted-foreground text-sm">
                {search ? "Try a different search term" : "No resources available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map((resource) => {
                const colors = typeColors[resource.type] || typeColors.api;
                const icon = typeIcons[resource.type] || "code";

                return (
                  <div
                    key={resource.id}
                    className={`group bg-card rounded-3xl border border-border overflow-hidden flex flex-col hover:${colors.border} hover:shadow-2xl hover:shadow-sp-pink/5 transition-all`}
                  >
                    <div
                      className={`h-40 bg-gradient-to-br ${colors.bg} p-6 flex items-center justify-center relative`}
                    >
                      <span className={`material-symbols-outlined ${colors.text} text-6xl`}>
                        {icon}
                      </span>
                      {resource.accessCount > 50 && (
                        <div className="absolute top-5 right-5 bg-sp-pink/20 backdrop-blur text-sp-pink text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-sp-pink/20">
                          Trending
                        </div>
                      )}
                    </div>

                    <div className="p-8 flex flex-col gap-6 flex-1">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1">{resource.name}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {resource.description || "Premium resource available for access"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between py-4 border-y border-border">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            Price
                          </span>
                          <span className={`${colors.text} font-bold text-2xl`}>
                            {formatPrice(resource.priceUsdc)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            Accesses
                          </span>
                          <span className="font-bold text-foreground text-lg">
                            {resource.accessCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users size={14} />
                        <span>by {resource.creator.name}</span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setPurchaseItem({
                              kind: "resource",
                              data: {
                                id: resource.id,
                                slug: resource.slug,
                                type: resource.type as "api" | "file" | "article",
                                name: resource.name,
                                description: resource.description,
                                priceUsdc: resource.priceUsdc,
                                accessCount: resource.accessCount,
                                creator: resource.creator,
                              },
                            });
                            setPurchaseOpen(true);
                          }}
                          className={`flex-1 ${colors.btn} text-white font-bold py-3.5 rounded-2xl text-sm ${colors.btnHover} transition-all shadow-lg ${colors.shadow} text-center`}
                        >
                          Buy Access
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Featured Stores */}
        {filteredStores.length > 0 && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {search ? `Stores matching "${search}"` : "Featured Stores"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {search ? `${filteredStores.length} store(s) found` : "Shopify stores accepting crypto payments via x402"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.slice(0, 6).map((store: any) => {
                const storeProds = storeProducts.filter(p => p.storeId === store.id);
                const profileHref = store.creator?.username
                  ? `/${store.creator.username}`
                  : null;
                const Wrapper = profileHref ? Link : "div" as any;
                const wrapperProps = profileHref ? { href: profileHref } : {};
                return (
                  <Wrapper
                    key={store.id}
                    {...wrapperProps}
                    className="bg-card rounded-2xl border border-border overflow-hidden hover:border-sp-pink hover:shadow-xl hover:shadow-sp-pink/5 transition-all group cursor-pointer block"
                  >
                    {/* Store header with gradient */}
                    <div className="bg-gradient-to-br from-sp-pink/15 to-sp-pink/5 p-6 border-b border-border">
                      <div className="flex items-start gap-4">
                        <div className="size-14 bg-sp-pink/20 group-hover:bg-sp-pink rounded-xl flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-sp-pink group-hover:text-white text-2xl transition-colors">
                            storefront
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{store.name}</h3>
                          {store.domain && (
                            <p className="text-xs text-muted-foreground truncate">{store.domain}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                              {storeProds.length} products
                            </span>
                            <span className="text-sp-pink font-bold">USDC payments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Product preview thumbnails */}
                    {storeProds.length > 0 && (
                      <div className="p-4 flex gap-2 overflow-hidden">
                        {storeProds.slice(0, 4).map((p) => (
                          <div key={p.id} className="size-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-muted-foreground text-xl">shopping_bag</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {storeProds.length > 4 && (
                          <div className="size-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground font-bold">
                            +{storeProds.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </Wrapper>
                );
              })}
            </div>
          </section>
        )}

        {/* Top Store Products */}
        {filteredProducts.length > 0 && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {search ? `Products matching "${search}"` : "Top Store Products"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {search ? `${filteredProducts.length} product(s) found` : "Physical and digital products you can buy with crypto"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:border-sp-pink/40 hover:shadow-xl hover:shadow-sp-pink/5 transition-all"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-muted-foreground text-5xl">
                          shopping_bag
                        </span>
                      </div>
                    )}
                    {product.inventory !== null && product.inventory === 0 && (
                      <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        SOLD OUT
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sp-pink font-bold text-lg">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.inventory !== null && product.inventory > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {product.inventory} in stock
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setPurchaseItem({
                          kind: "product",
                          data: {
                            id: product.id,
                            storeId: product.storeId,
                            name: product.name,
                            description: product.description,
                            image: product.image,
                            price: product.price,
                            currency: product.currency,
                            inventory: product.inventory,
                          },
                        });
                        setPurchaseOpen(true);
                      }}
                      disabled={product.inventory === 0}
                      className="w-full bg-sp-pink text-white font-bold py-2.5 rounded-xl text-sm hover:bg-sp-pink/90 transition-all shadow-lg shadow-sp-pink/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.inventory === 0 ? "Sold Out" : "Buy Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <PurchaseModal
        open={purchaseOpen}
        onOpenChange={(open) => {
          setPurchaseOpen(open);
          if (!open) setPurchaseItem(null);
        }}
        item={purchaseItem}
      />

      <style jsx>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </div>
  );
}
