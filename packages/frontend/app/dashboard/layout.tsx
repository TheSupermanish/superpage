"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/resources", label: "Resources", icon: Wallet },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/stores", label: "Stores", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const secondaryNavItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/docs", label: "Docs", icon: BookOpen },
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
            <img src="/logo.png" alt="SuperPage" className="h-10 w-auto" />
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
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
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
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
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
          <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 ring-2 ring-primary/20 flex items-center justify-center text-primary font-bold">
              {creator?.username?.charAt(0).toUpperCase() || "U"}
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
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">x402</span>
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
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
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
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
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
