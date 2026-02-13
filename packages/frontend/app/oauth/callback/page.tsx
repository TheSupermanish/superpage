"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing installation...");

  useEffect(() => {
    const storeId = searchParams.get("store_id");
    const shop = searchParams.get("shop");
    const name = searchParams.get("name");
    const error = searchParams.get("error");
    const redirectPath = searchParams.get("redirect");

    if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      return;
    }

    if (!storeId || !shop) {
      setStatus("error");
      setMessage("Missing store information");
      return;
    }

    // Store credentials in localStorage
    localStorage.setItem("store_id", storeId);
    localStorage.setItem("shop_domain", `https://${shop}`);
    
    // We don't store the access_token on frontend anymore - it's safely in the backend
    setStatus("success");
    setMessage(`Successfully connected ${name || shop}!`);

    // Redirect to the specified path or products page after a short delay
    setTimeout(() => {
      router.push(redirectPath || "/products");
    }, 2000);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto" />
            <h1 className="text-2xl font-semibold text-foreground">
              {message}
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              {message}
            </h1>
            <p className="text-muted-foreground">
              Redirecting to product selection...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-semibold text-red-600">
              Installation Failed
            </h1>
            <p className="text-muted-foreground">
              {message}
            </p>
            <button
              onClick={() => router.push("/register")}
              className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}










