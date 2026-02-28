"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./providers/auth-provider";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function PublicNavbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
              <Image src="/logo.png" alt="SuperPage" width={32} height={32} className="h-8 w-auto" />
              <span className="text-lg font-bold tracking-tight">
                Super<span className="text-primary">Page</span>
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
                <Link
                  href="/dashboard"
                  className="shimmer-btn text-white px-5 py-2 rounded-full text-sm font-bold transition-all"
                >
                  Dashboard
                </Link>
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
