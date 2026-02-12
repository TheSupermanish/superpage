/**
 * Check if username exists
 * GET /api/creators/:username/exists
 */

import { Request, Response } from "express";
import { Creator } from "../models/index.js";

export async function handleCheckUsernameExists(req: Request, res: Response) {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username exists (case-insensitive)
    const creator = await Creator.findOne({
      username: username.toLowerCase(),
    }).lean();

    return res.json({
      exists: !!creator,
      username: username.toLowerCase(),
    });
  } catch (err: any) {
    console.error("Check username error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Check if username is available for current user
 * GET /api/creators/check-username/:username
 * Requires authentication
 */
export async function handleCheckUsernameAvailability(req: any, res: Response) {
  try {
    const { username } = req.params;
    const currentUserId = req.creator?.id;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username exists (case-insensitive)
    const existingCreator = await Creator.findOne({
      username: username.toLowerCase(),
    }).lean();

    // If no creator has this username, it's available
    if (!existingCreator) {
      return res.json({
        available: true,
        username: username.toLowerCase(),
      });
    }

    // If the creator with this username is the current user, it's available (they own it)
    const isOwnUsername = currentUserId && existingCreator._id.toString() === currentUserId;
    
    return res.json({
      available: isOwnUsername,
      username: username.toLowerCase(),
      isOwn: isOwnUsername,
    });
  } catch (err: any) {
    console.error("Check username availability error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
