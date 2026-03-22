"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAccount, useDisconnect } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UsernameInput } from "@/components/dashboard/username-input";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import {
  Wallet,
  User,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Twitter,
  Github,
  MessageCircle,
  Youtube,
  Linkedin,
  Instagram,
  Send,
} from "lucide-react";
import { getAddressUrl, getNetwork, isTestnet } from "@/lib/chain-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SettingsPage() {
  const { creator, updateProfile, signOut, token } = useAuth();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [name, setName] = useState(creator?.name || "");
  const [username, setUsername] = useState(creator?.username || "");
  const [bio, setBio] = useState(creator?.bio || "");
  const [website, setWebsite] = useState(creator?.website || "");
  const [avatarUrl, setAvatarUrl] = useState(creator?.avatarUrl || "");
  const [isPublic, setIsPublic] = useState(creator?.isPublic ?? true);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    creator?.socialLinks || {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ 
        name, 
        username: username || undefined,
        bio, 
        website, 
        avatarUrl,
        socialLinks,
        isPublic,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value,
    }));
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = () => {
    signOut();
    disconnect();
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and account</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg text-foreground">Public Profile</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your creator profile visible to others
            {username && (
              <span className="ml-2 text-primary">
                • View at /@{username}
              </span>
            )}
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Avatar Upload */}
          <AvatarUpload 
            currentAvatarUrl={avatarUrl}
            onUpload={(url) => setAvatarUrl(url)}
          />

          {/* Username */}
          {token && (
            <UsernameInput 
              value={username}
              onChange={setUsername}
              token={token}
            />
          )}

          {/* Display Name */}
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-muted border-border text-foreground focus:border-primary"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-foreground">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell us about yourself (max 500 characters)"
              className="bg-muted border-border text-foreground focus:border-primary"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website" className="text-foreground">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="bg-muted border-border text-foreground focus:border-primary"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-foreground">Social Links</Label>

            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.twitter || ""}
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                placeholder="https://twitter.com/username"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.github || ""}
                onChange={(e) => handleSocialLinkChange("github", e.target.value)}
                placeholder="https://github.com/username"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.discord || ""}
                onChange={(e) => handleSocialLinkChange("discord", e.target.value)}
                placeholder="Discord username or invite link"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.youtube || ""}
                onChange={(e) => handleSocialLinkChange("youtube", e.target.value)}
                placeholder="https://youtube.com/@channel"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.linkedin || ""}
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.instagram || ""}
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                placeholder="https://instagram.com/username"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <Input
                value={socialLinks.telegram || ""}
                onChange={(e) => handleSocialLinkChange("telegram", e.target.value)}
                placeholder="https://t.me/username"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>
          </div>

          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
            <div>
              <Label className="text-sm font-medium text-foreground">Enable Public Profile</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Allow others to discover your profile and resources
              </p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white w-full rounded-xl py-3 font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Wallet Settings */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg text-foreground">Wallet</h3>
          </div>
          <p className="text-sm text-muted-foreground">Your connected Ethereum wallet</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-foreground">Wallet Address</Label>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono text-foreground truncate">
                {address || creator?.walletAddress || "Not connected"}
              </code>
              {address && (
                <>
                  <button
                    onClick={copyAddress}
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={getAddressUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All earnings are sent directly to this wallet
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="text-foreground">Network</Label>
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-3 py-1.5 rounded-full text-sm ${
                isTestnet()
                  ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                  : "bg-primary/10 border border-primary/20 text-primary"
              }`}>
                {getNetwork()}
              </div>
              <span className="text-xs text-muted-foreground">
                {isTestnet() ? "Test network - Use test tokens" : "Production network"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Access */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg text-foreground">API Access</h3>
          </div>
          <p className="text-sm text-muted-foreground">Integration information</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-foreground">Gateway Endpoint</Label>
            <code className="block mt-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono text-foreground">
              {API_URL}/x402/resource/:id
            </code>
          </div>
          <div>
            <Label className="text-foreground">Discovery Endpoint</Label>
            <code className="block mt-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono text-foreground">
              {API_URL}/x402/resources
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            Use these endpoints to integrate x402 payments into your applications
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/20 rounded-2xl">
        <div className="p-6 border-b border-destructive/20">
          <h3 className="font-bold text-lg text-red-400">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">Irreversible actions</p>
        </div>
        <div className="p-6">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
          >
            Sign Out & Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}








