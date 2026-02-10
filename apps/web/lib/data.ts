import itemsRaw from "@/data/items.json";
import recipesRaw from "@/data/recipes_items.json";
import type { RecipesData } from "@/lib/types";

// Single cast point — all consumers import from here, never from JSON directly.
// Cast through unknown because raw JSON has extra recipe variants (NPC, etc.)
// that our typed interfaces intentionally don't model.
export const recipes = recipesRaw as unknown as RecipesData;
export const itemsData = itemsRaw as unknown as RecipesData;
