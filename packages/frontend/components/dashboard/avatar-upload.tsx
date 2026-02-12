"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUpload: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, onUpload }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Implement actual upload to storage (S3/Cloudinary/etc)
      // For now, we'll just use the data URL
      // In production, you'd upload to a CDN and get back a URL
      
      const formData = new FormData();
      formData.append("file", file);
      
      // Placeholder - implement actual upload endpoint
      // const res = await fetch(`${API_URL}/api/upload/avatar`, {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: formData,
      // });
      
      // const data = await res.json();
      // onUpload(data.url);

      // For now, just use a placeholder URL or data URL
      setTimeout(() => {
        const dataUrl = reader.result as string;
        onUpload(dataUrl);
        setIsUploading(false);
      }, 1000);
      
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload avatar");
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Avatar</Label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("avatar-upload")?.click()}
            disabled={isUploading}
            className="border-border"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Max 5MB. Square images work best.
          </p>
        </div>
      </div>
    </div>
  );
}
