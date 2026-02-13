#!/usr/bin/env npx tsx
/**
 * Fix file resource URLs in the database.
 * Updates external_url to point to local static files served by the backend.
 *
 * Usage:
 *   npx tsx scripts/fix-file-urls.ts                  # default: http://localhost:3001
 *   npx tsx scripts/fix-file-urls.ts http://host:port  # custom backend URL
 */
import mongoose from "mongoose";
import "dotenv/config";

const BASE_URL = process.argv[2] || "http://localhost:3001";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/superpage";

// Map resource names to local file paths and filenames
const FILE_URL_MAP: Record<string, { external_url: string; filename: string }> = {
  "Historical Stock Data 2024": {
    external_url: `${BASE_URL}/files/sp500-2024.csv`,
    filename: "sp500-ohlcv-2024.csv",
  },
  "Full-Stack Project Template": {
    external_url: `${BASE_URL}/files/fullstack-template-readme.txt`,
    filename: "fullstack-template-v2.txt",
  },
  "Smart Contract Audit Checklist": {
    external_url: `${BASE_URL}/files/smart-contract-audit-checklist.txt`,
    filename: "audit-checklist-v3.txt",
  },
  "LLM Fine-Tuning Pipeline": {
    external_url: `${BASE_URL}/files/llm-finetune-pipeline.txt`,
    filename: "llm-finetune-pipeline-v2.txt",
  },
};

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI.replace(/\/\/.*@/, "//<redacted>@"));
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db!;
  const resources = db.collection("resources");

  for (const [name, update] of Object.entries(FILE_URL_MAP)) {
    const result = await resources.updateMany(
      { name, type: "file" },
      {
        $set: {
          "config.external_url": update.external_url,
          "config.filename": update.filename,
          "config.mode": "external",
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`  Updated "${name}" (${result.modifiedCount} doc(s)) -> ${update.external_url}`);
    } else {
      console.log(`  "${name}" — not found or already up to date`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
