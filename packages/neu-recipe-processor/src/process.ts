import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createTimer, log } from "./log.js";
import type { MergedItems, NeuItem } from "./types.js";

/** Recipe types that are relevant for crafting calculations */
const RECIPE_TYPES = new Set(["crafting", "forge"]);

/** Check whether an item has at least one relevant recipe */
function hasRelevantRecipe(item: NeuItem): boolean {
  if (item.recipe && typeof item.recipe === "object") {
    return true;
  }
  if (Array.isArray(item.recipes)) {
    return item.recipes.some((r) => RECIPE_TYPES.has(r.type));
  }
  return false;
}

/** Parse a single JSON file, returning one or more NeuItems */
function parseItemFile(filePath: string): NeuItem[] {
  const data: unknown = JSON.parse(readFileSync(filePath, "utf8"));
  if (Array.isArray(data)) {
    return data.filter(
      (d): d is NeuItem =>
        d != null && typeof d === "object" && "internalname" in d,
    );
  }
  if (data != null && typeof data === "object" && "internalname" in data) {
    return [data as NeuItem];
  }
  return [];
}

export interface ProcessResult {
  merged: MergedItems;
  recipes: MergedItems;
  fileCount: number;
  itemCount: number;
  recipeCount: number;
}

/** Read all item JSON files and produce merged + recipe-filtered outputs in a single pass */
export function processItems(itemsDir: string): ProcessResult {
  const done = createTimer("Processing items");

  const files = readdirSync(itemsDir).filter((f) => f.endsWith(".json"));
  const merged: MergedItems = {};
  const recipes: MergedItems = {};

  for (const file of files) {
    const items = parseItemFile(join(itemsDir, file));
    for (const item of items) {
      merged[item.internalname] = item;
      if (hasRelevantRecipe(item)) {
        recipes[item.internalname] = item;
      }
    }
  }

  done();
  log(
    `  ${files.length} files, ${Object.keys(merged).length} items, ${Object.keys(recipes).length} with recipes`,
  );

  return {
    merged,
    recipes,
    fileCount: files.length,
    itemCount: Object.keys(merged).length,
    recipeCount: Object.keys(recipes).length,
  };
}
