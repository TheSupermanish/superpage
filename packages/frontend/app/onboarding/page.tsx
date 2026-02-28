"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import Image from "next/image";
import { Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { creator, updateProfile, isLoading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already has username
  useEffect(() => {
    if (!authLoading && creator?.username) {
      router.push("/dashboard");
    }
  }, [creator, authLoading, router]);

  // Check username availability
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/creators/${username}/exists`
        );
        const data = await res.json();
        setIsAvailable(!data.exists);
      } catch (err) {
        console.error("Failed to check username:", err);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!isAvailable) {
      setError("Username is not available");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateProfile({
        username: username.toLowerCase(),
        name: displayName || username,
        bio: bio || undefined,
        isPublic: true,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-16 rounded-full bg-primary/20 animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 size-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-xl">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
              <Image src="/logo.png" alt="SuperPage" width={48} height={48} className="h-12 w-auto" />
            </div>
            <div className="absolute -top-2 -right-2 size-8 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="text-primary-foreground" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 text-foreground">
              Welcome to SuperPage!
            </h1>
            <p className="text-muted-foreground text-base">
              Let's set up your public profile so others can discover and purchase from you
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-foreground">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground text-lg">
                  @
                </div>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="yourname"
                  className="w-full pl-10 pr-12 py-3.5 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground transition-all"
                  required
                  minLength={3}
                  maxLength={30}
                />
                {isChecking && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isChecking && isAvailable === true && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                )}
                {!isChecking && isAvailable === false && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Your public profile will be at: superpa.ge/@{username || "yourname"}
              </p>
              {isAvailable === false && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  This username is already taken
                </p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-sm font-semibold text-foreground">
                Display Name
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                maxLength={50}
                className="w-full px-4 py-3.5 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground transition-all"
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear on your profile
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-semibold text-foreground">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                className="w-full min-h-[120px] px-4 py-3.5 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground resize-none transition-all"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/200
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!username || !isAvailable || isSaving}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/10 disabled:shadow-none"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Profile...
                </span>
              ) : (
                "Create Profile"
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              You can always update your profile later in settings
            </p>
          </form>
        </div>

        {/* Footer decoration */}
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-xs">
          <div className="size-1.5 rounded-full bg-primary/50" />
          <span>Powered by SuperPage</span>
          <div className="size-1.5 rounded-full bg-primary/50" />
        </div>
      </div>
    </div>
  );
}
