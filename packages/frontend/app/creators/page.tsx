"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  Loader2,
} from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Creator {
  id: string;
  name: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  resourceCount: number;
  totalSales: number;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"oldest" | "sales" | "resources">("oldest");

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await fetch(`${API_URL}/api/creators`);
        if (res.ok) {
          const data = await res.json();
          const list = data.creators ?? data.data ?? [];
          const reversed = [...list].reverse();
          setCreators(reversed);
          setFilteredCreators(reversed);
        }
      } catch (err) {
        console.error("Failed to fetch creators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  // Filter and sort creators
  useEffect(() => {
    let filtered = creators.filter((creator) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (creator.displayName || creator.name).toLowerCase().includes(searchLower) ||
        creator.username.toLowerCase().includes(searchLower) ||
        creator.bio?.toLowerCase().includes(searchLower)
      );
    });

    // Sort — oldest first by default (preserve API order which is oldest first)
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "sales") {
        return (b.totalSales || 0) - (a.totalSales || 0);
      } else if (sortBy === "resources") {
        return (b.resourceCount || 0) - (a.resourceCount || 0);
      }
      // Default: oldest first — keep original order
      return 0;
    });

    setFilteredCreators(filtered);
  }, [searchQuery, sortBy, creators]);

  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative pt-28 pb-8 px-6 border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Discover Creators</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore creators monetizing their content with SuperPage. Find APIs, files, articles, and more.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-6 px-6 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border text-foreground"
              />
            </div>
            <div className="flex gap-2">
              {(["oldest", "sales", "resources"] as const).map((s) => (
                <Button
                  key={s}
                  variant={sortBy === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(s)}
                  className={sortBy === s ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-border text-muted-foreground hover:text-primary"}
                >
                  {s === "oldest" ? "Oldest First" : s === "sales" ? "Most Sales" : "Most Resources"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="py-20 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No creators found matching your search" : "No creators available yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-muted-foreground">
                {filteredCreators.length} creator{filteredCreators.length !== 1 ? "s" : ""} found
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredCreators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/@${creator.username}`}
                    className="bg-card rounded-3xl p-6 border border-border flex flex-col items-center text-center gap-4 group hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all"
                  >
                    <div className="relative">
                      <div
                        className="size-24 rounded-full bg-cover bg-center ring-4 ring-primary/10"
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
                        <span className="text-primary font-bold">{creator.resourceCount || 0}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground">Sales</span>
                        <span className="text-foreground font-bold">{creator.totalSales || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
