#!/usr/bin/env node

/**
 * Cross-platform cleanup script for neu-recipe-processor
 * Removes cached repository and output files
 */

import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, "output");
const REPO_DIR = join(OUTPUT_DIR, "NotEnoughUpdates-REPO");
const MERGED_ITEMS = join(OUTPUT_DIR, "merged_items.json");
const RECIPES_ITEMS = join(OUTPUT_DIR, "recipes_items.json");

function removeIfExists(path, name) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`Removed: ${name}`);
  }
}

console.log("[clean] Cleaning neu-recipe-processor outputs...");

removeIfExists(REPO_DIR, "NotEnoughUpdates-REPO");
removeIfExists(MERGED_ITEMS, "merged_items.json");
removeIfExists(RECIPES_ITEMS, "recipes_items.json");

console.log("[clean] Cleanup completed! ✓");
