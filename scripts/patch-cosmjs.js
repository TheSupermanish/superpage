#!/usr/bin/env node
/**
 * Patches cosmjs-types and @cosmjs/amino to remove restrictive "exports" maps
 * that block deep ".js" imports used by @initia/interwovenkit-react.
 *
 * Run after `pnpm install` via the "postinstall" script.
 */
const fs = require('fs');
const path = require('path');

const packagesToFix = [
  'cosmjs-types',
  '@cosmjs/amino',
];

function findPackageJsons(dir, packageName) {
  const results = [];
  const needle = packageName.replace('/', path.sep);

  function walk(d) {
    try {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        if (entry.isDirectory() && entry.name !== '.cache') {
          walk(fullPath);
        } else if (entry.name === 'package.json' && fullPath.includes(needle)) {
          results.push(fullPath);
        }
      }
    } catch {}
  }

  walk(dir);
  return results;
}

const nodeModules = path.resolve(__dirname, '..', 'node_modules');
let patched = 0;

for (const pkg of packagesToFix) {
  const files = findPackageJsons(nodeModules, pkg);
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data.exports) {
        delete data.exports;
        fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
        patched++;
      }
    } catch {}
  }
}

if (patched > 0) {
  console.log(`[patch-cosmjs] Patched ${patched} package.json files`);
}
