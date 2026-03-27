"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Loader2 } from "lucide-react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { needsOnboarding, isLoading, isAuthenticated } = useAuth();

  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    if (isLoading) return;

    // Unauthenticated users trying to access dashboard → send home
    if (!isAuthenticated && isDashboard) {
      router.replace("/");
      return;
    }

    if (!isAuthenticated) return;
    if (pathname === "/onboarding") return;

    // Public pages don't need onboarding check
    const publicPages = ["/", "/explore", "/creators"];
    if (publicPages.includes(pathname)) return;
    if (pathname.startsWith("/@")) return;

    // Authenticated but needs onboarding → send to onboarding
    if (needsOnboarding && isDashboard) {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, isLoading, isAuthenticated, pathname, isDashboard, router]);

  // Show a loading spinner while deciding where to redirect (prevents dashboard flash)
  if (isLoading && isDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block dashboard render for unauthenticated users (prevents layout flash)
  if (!isAuthenticated && isDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block dashboard render while redirecting to onboarding
  if (isAuthenticated && needsOnboarding && isDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
