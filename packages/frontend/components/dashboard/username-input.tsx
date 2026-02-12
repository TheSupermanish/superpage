"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  token: string;
}

export function UsernameInput({ value, onChange, token }: UsernameInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const checkAvailability = async () => {
      // Reset states
      setError("");
      setIsAvailable(null);

      // Don't check empty values
      if (!value) {
        return;
      }

      // Validate format
      const usernameRegex = /^[a-z0-9-]+$/;
      if (!usernameRegex.test(value)) {
        setError("Username can only contain lowercase letters, numbers, and hyphens");
        return;
      }

      if (value.length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }

      if (value.length > 30) {
        setError("Username must be less than 30 characters");
        return;
      }

      // Check availability with debounce
      setIsChecking(true);

      try {
        const res = await fetch(`${API_URL}/api/creators/check-username/${value}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setIsAvailable(data.available);
          if (!data.available) {
            setError("Username is already taken");
          }
        } else {
          setError("Failed to check availability");
        }
      } catch (err) {
        console.error("Username check error:", err);
        setError("Failed to check availability");
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [value, token]);

  return (
    <div className="space-y-2">
      <Label htmlFor="username">
        Username
        <span className="text-xs text-muted-foreground ml-2">(Optional - for public profile)</span>
      </Label>
      <div className="relative">
        <Input
          id="username"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          placeholder="mark-manson"
          className="bg-muted border-border pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isChecking && isAvailable === true && (
            <Check className="h-4 w-4 text-emerald-400" />
          )}
          {!isChecking && (isAvailable === false || error) && (
            <X className="h-4 w-4 text-red-400" />
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {isAvailable && !error && (
        <p className="text-xs text-emerald-400">Username is available!</p>
      )}
      {value && (
        <p className="text-xs text-muted-foreground">
          Your profile will be at: <span className="text-blue-400">/@{value}</span>
        </p>
      )}
    </div>
  );
}
