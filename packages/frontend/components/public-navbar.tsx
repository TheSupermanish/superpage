"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./providers/auth-provider";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard, User, LogOut, ChevronDown } from "lucide-react";

export function PublicNavbar() {
  const pathname = usePathname();
  const { isAuthenticated, creator, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home", show: true },
    { href: "/explore", label: "Explore", show: true },
    { href: "/docs", label: "Docs", show: true },
    { href: "/faucet", label: "Faucet", show: true },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 pt-4"
      >
        <div
          className={cn(
            "mx-auto max-w-7xl transition-all duration-500 ease-out",
            scrolled
              ? "mt-1 mx-4 sm:mx-auto max-w-5xl bg-background/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg px-5 sm:px-6"
              : "px-6 sm:px-8"
          )}
        >
          <div className="flex items-center justify-between h-16">
            {/* Logo + Wordmark */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/logo.png" alt="Airaa" width={32} height={32} className="h-8 w-auto" />
              <span className="text-lg font-bold tracking-tight">
                Air<span className="text-primary">aa</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-primary/40 bg-card transition-all"
                  >
                    {creator?.avatarUrl ? (
                      <img src={creator.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {creator?.username || creator?.walletAddress?.slice(0, 8) + "..."}
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl bg-card border border-border shadow-xl py-1.5 z-50">
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Profile
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={() => { setProfileOpen(false); signOut(); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-muted transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <WalletConnect compact />
              )}
            </div>

            {/* Mobile: theme toggle + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 w-72 h-full bg-card border-l border-border slide-in-right p-6 pt-20 space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block text-lg font-medium py-2 transition-colors",
                  pathname === link.href
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="shimmer-btn block text-center text-white px-5 py-3 rounded-full font-bold transition-all"
                >
                  Dashboard
                </Link>
              ) : (
                <WalletConnect />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
