"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { WalletConnect } from "@/components/wallet-connect";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  Settings,
  Plus,
  Loader2,
  ShoppingCart,
  Wallet,
  Users,
  LogOut,
  Menu,
  DollarSign,
  Compass,
  BookOpen,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, activeBg: "bg-sp-blue", activeText: "text-white", activeShad: "shadow-sp-blue/20", hoverBg: "hover:bg-sp-blue/10", hoverText: "hover:text-sp-blue" },
  { href: "/dashboard/resources", label: "Resources", icon: Wallet, activeBg: "bg-sp-gold", activeText: "text-white", activeShad: "shadow-sp-gold/20", hoverBg: "hover:bg-sp-gold/10", hoverText: "hover:text-sp-gold" },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, activeBg: "bg-sp-coral", activeText: "text-white", activeShad: "shadow-sp-coral/20", hoverBg: "hover:bg-sp-coral/10", hoverText: "hover:text-sp-coral" },
  { href: "/dashboard/stores", label: "Stores", icon: Users, activeBg: "bg-sp-pink", activeText: "text-white", activeShad: "shadow-sp-pink/20", hoverBg: "hover:bg-sp-pink/10", hoverText: "hover:text-sp-pink" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, activeBg: "bg-sp-blue", activeText: "text-white", activeShad: "shadow-sp-blue/20", hoverBg: "hover:bg-sp-blue/10", hoverText: "hover:text-sp-blue" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, activeBg: "bg-muted", activeText: "text-foreground", activeShad: "", hoverBg: "hover:bg-muted/80", hoverText: "hover:text-foreground" },
];

const secondaryNavItems = [
  { href: "/explore", label: "Explore", icon: Compass, activeBg: "bg-sp-pink", activeText: "text-white", activeShad: "shadow-sp-pink/20", hoverBg: "hover:bg-sp-pink/10", hoverText: "hover:text-sp-pink" },
  { href: "/docs", label: "Docs", icon: BookOpen, activeBg: "bg-sp-gold", activeText: "text-white", activeShad: "shadow-sp-gold/20", hoverBg: "hover:bg-sp-gold/10", hoverText: "hover:text-sp-gold" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, creator, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-['Space_Grotesk',sans-serif]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-full border-r border-border bg-background p-6 justify-between">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <Image src="/logo.png" alt="Airaa" width={40} height={40} className="h-10 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? `${item.activeBg} ${item.activeText} shadow-lg ${item.activeShad}`
                      : `text-muted-foreground ${item.hoverBg} ${item.hoverText}`
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* Secondary Navigation */}
          <nav className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider px-4 mb-1">Discover</p>
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? `${item.activeBg} ${item.activeText} shadow-lg ${item.activeShad}`
                      : `text-muted-foreground ${item.hoverBg} ${item.hoverText}`
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-muted ring-2 ring-primary/20 shrink-0 overflow-hidden">
              <Image
                src={creator?.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${creator?.username || creator?.walletAddress || "user"}`}
                alt={creator?.username || "User"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="font-bold text-sm truncate">{creator?.username || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{creator?.walletAddress?.slice(0, 4)}...{creator?.walletAddress?.slice(-4)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl h-12 px-4 bg-muted text-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-bold"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-background sticky top-0 z-20 border-b border-border">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Airaa" width={32} height={32} className="h-8 w-auto" />
          </div>
          <button
            className="p-2 rounded-lg bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-card border-b border-border p-4 z-10">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                      isActive
                        ? `${item.activeBg} ${item.activeText}`
                        : `text-muted-foreground ${item.hoverBg} ${item.hoverText}`
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="border-t border-border my-2" />
              <p className="text-xs text-muted-foreground/60 uppercase tracking-wider px-4">Discover</p>

              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                      isActive
                        ? `${item.activeBg} ${item.activeText}`
                        : `text-muted-foreground ${item.hoverBg} ${item.hoverText}`
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 md:p-8 flex flex-col gap-6 md:gap-8 max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
