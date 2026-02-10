import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureRepo } from "./git.js";
import { createTimer, log } from "./log.js";
import { processItems } from "./process.js";

const OUTPUT_DIR = join(import.meta.dirname, "..", "output");
const REPO_DIR = join(OUTPUT_DIR, "NotEnoughUpdates-REPO");
const ITEMS_DIR = join(REPO_DIR, "items");
const MERGED_FILE = join(OUTPUT_DIR, "merged_items.json");
const RECIPES_FILE = join(OUTPUT_DIR, "recipes_items.json");

async function main(): Promise<void> {
  const done = createTimer("Pipeline");

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Clone or pull the NEU repository
  await ensureRepo(REPO_DIR);

  // Step 2: Read, merge, and filter items in a single pass
  const { merged, recipes } = processItems(ITEMS_DIR);

  // Step 3: Write output files
  const writeDone = createTimer("Writing output files");
  writeFileSync(MERGED_FILE, JSON.stringify(merged, null, 2));
  writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
  writeDone();

  done();
}

main().catch((err: unknown) => {
  log(`Fatal error: ${err}`);
  process.exit(1);
});
