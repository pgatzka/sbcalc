import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { log } from "./log.js";

const OUTPUT_DIR = join(import.meta.dirname, "..", "output");

const TARGETS = [
  {
    path: join(OUTPUT_DIR, "NotEnoughUpdates-REPO"),
    label: "NotEnoughUpdates-REPO",
  },
  { path: join(OUTPUT_DIR, "merged_items.json"), label: "merged_items.json" },
  {
    path: join(OUTPUT_DIR, "recipes_items.json"),
    label: "recipes_items.json",
  },
];

for (const { path, label } of TARGETS) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    log(`Removed: ${label}`);
  }
}

log("Cleanup completed.");
