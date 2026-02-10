#!/usr/bin/env node

/**
 * Generate recipe data from the NotEnoughUpdates repository.
 * 1. Builds the neu-recipe-processor package
 * 2. Runs the processor to generate recipe data
 * 3. Copies the output files to the web app data directory
 */

import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT_DIR = join(import.meta.dirname, "..");
const PROCESSOR_DIR = join(ROOT_DIR, "packages", "neu-recipe-processor");
const OUTPUT_DIR = join(PROCESSOR_DIR, "output");
const WEB_DATA_DIR = join(ROOT_DIR, "apps", "web", "data");

const PREFIX = "[generate-recipes]";

function log(message) {
  console.log(`${PREFIX} ${message}`);
}

function exec(command, cwd) {
  try {
    execSync(command, { cwd, stdio: "inherit", encoding: "utf-8" });
  } catch {
    console.error(`${PREFIX} Failed to execute: ${command}`);
    process.exit(1);
  }
}

function copy(source, destination) {
  if (!existsSync(source)) {
    console.error(`${PREFIX} Source file not found: ${source}`);
    process.exit(1);
  }
  const destDir = dirname(destination);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(source, destination);
  log(`Copied: ${source} -> ${destination}`);
}

log("Starting recipe generation...");

// Build and run the processor
log("Building neu-recipe-processor...");
exec("pnpm run build", PROCESSOR_DIR);

log("Running recipe processor...");
exec("node dist/index.js", PROCESSOR_DIR);

// Copy output files to web app
log("Copying generated files to web app...");
copy(
  join(OUTPUT_DIR, "recipes_items.json"),
  join(WEB_DATA_DIR, "recipes_items.json"),
);
copy(join(OUTPUT_DIR, "merged_items.json"), join(WEB_DATA_DIR, "items.json"));

log("Done.");
