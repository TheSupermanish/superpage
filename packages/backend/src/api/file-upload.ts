import { Response } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { AuthenticatedRequest } from "./wallet-auth";

const APP_URL = process.env.APP_URL || "http://localhost:3001";

// Ensure upload directories exist
const uploadsDir = path.join(process.cwd(), "uploads");
const filesDir = path.join(uploadsDir, "files");
const avatarsDir = path.join(uploadsDir, "avatars");
fs.mkdirSync(filesDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });

// Disk storage for general file uploads
const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, filesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Disk storage for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function handleFileUpload(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const storageKey = path.relative(uploadsDir, file.path);
    const url = `${APP_URL}/uploads/${storageKey}`;

    console.log(`[FileUpload] File uploaded:`, {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      creator: req.creator.id,
      storageKey,
    });

    return res.json({
      success: true,
      url,
      storageKey,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (err: any) {
    console.error("[FileUpload] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleAvatarUpload(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!file.mimetype.startsWith("image/")) {
      // Remove the uploaded file since it's not an image
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: "Only image files are allowed" });
    }

    const storageKey = path.relative(uploadsDir, file.path);
    const url = `${APP_URL}/uploads/${storageKey}`;

    console.log(`[AvatarUpload] Avatar uploaded:`, {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      creator: req.creator.id,
    });

    return res.json({
      success: true,
      url,
    });
  } catch (err: any) {
    console.error("[AvatarUpload] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
