"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { needsOnboarding, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // Don't redirect if not authenticated
    if (!isAuthenticated) return;

    // Don't redirect if already on onboarding page
    if (pathname === "/onboarding") return;

    // Don't redirect if on public pages
    const publicPages = ["/", "/explore", "/creators"];
    if (publicPages.includes(pathname)) return;

    // Don't redirect if viewing public profiles
    if (pathname.startsWith("/@")) return;

    // Redirect to onboarding if needs it and trying to access dashboard
    if (needsOnboarding && pathname.startsWith("/dashboard")) {
      router.push("/onboarding");
    }
  }, [needsOnboarding, isLoading, isAuthenticated, pathname, router]);

  return <>{children}</>;
}
