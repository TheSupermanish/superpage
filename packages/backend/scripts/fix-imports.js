#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to relative imports in compiled JS files
 * This is needed for Node.js ES modules
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

async function isFile(path) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function processFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  
  // Fix relative imports: from "./something" -> from "./something.js"
  // But skip if already has .js extension or is a package import
  const fixed = content.replace(
    /from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g,
    (match, importPath) => {
      // Don't add .js if it's already there or if it's a directory import
      if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
        return match;
      }
      return match.replace(importPath, importPath + '.js');
    }
  );
  
  if (fixed !== content) {
    await writeFile(filePath, fixed, 'utf-8');
    console.log(`Fixed imports in: ${filePath.replace(distDir + '/', '')}`);
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    if (await isDirectory(fullPath)) {
      await processDirectory(fullPath);
    } else if (entry.endsWith('.js') && !entry.endsWith('.d.ts')) {
      await processFile(fullPath);
    }
  }
}

async function main() {
  try {
    console.log('Fixing ES module imports...');
    await processDirectory(distDir);
    console.log('Done fixing imports!');
  } catch (error) {
    console.error('Error fixing imports:', error);
    process.exit(1);
  }
}

main();
