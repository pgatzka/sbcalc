import { BASE_MATERIALS, PATH_DELIM } from "./constants";
import type {
  CraftingRecipe,
  ForgeRecipe,
  RecipeEntry,
  RecipesData,
} from "./types";

/**
 * Helper to aggregate ingredient counts from recipe strings
 */
export const aggregateIngredients = (
  ingredients: string[],
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const ingredient of ingredients) {
    const [name, count] = ingredient.split(":");
    if (!name) continue;
    const num = Number(count) || 1;
    counts[name] = (counts[name] || 0) + num;
  }
  return counts;
};

/**
 * Get the recipe from a recipe entry, prioritizing forge recipes over crafting recipes
 */
export const getRecipe = (
  entry: RecipeEntry,
): CraftingRecipe | ForgeRecipe | undefined => {
  // Support forge recipes in the 'recipes' array
  if (Array.isArray(entry.recipes)) {
    const forgeRecipe = entry.recipes.find(
      (r): r is { type: "forge"; duration: number; inputs: string[] } =>
        "type" in r && r.type === "forge",
    );
    if (forgeRecipe) {
      return {
        type: "forge",
        forge_time: forgeRecipe.duration || 0,
        forge_ingredients: (forgeRecipe.inputs || []).map((input: string) => {
          const [item, count] = input.split(":");
          return { item: item || "", count: Number(count) || 1 };
        }),
      };
    }
  }
  if (entry.type === "forge" && entry.forge) {
    return entry.forge;
  }
  return (
    entry.recipe ||
    (Array.isArray(entry.recipes)
      ? (entry.recipes[0] as CraftingRecipe)
      : undefined)
  );
};

/**
 * Extract ingredients from a recipe object
 */
export const getIngredientsFromRecipe = (
  recipe: CraftingRecipe | ForgeRecipe,
): string[] => {
  if ((recipe as ForgeRecipe).type === "forge") {
    // Forge recipe: return as "item:count" strings
    return (recipe as ForgeRecipe).forge_ingredients.map(
      (ing: { item: string; count: number }) => `${ing.item}:${ing.count}`,
    );
  }
  return Object.values(recipe as CraftingRecipe)
    .filter((v) => typeof v === "string" && v && v.includes(":"))
    .map((v) => v as string);
};

/**
 * Recursively collect all base (non-craftable) items and their total counts, with cycle protection
 */
export const getBaseRequirements = (
  internalname: string,
  recipes: RecipesData,
  multiplier = 1,
  acc: Record<string, number> = {},
  visited: Set<string> = new Set(),
  itemsData?: RecipesData, // pass items.json as itemsData
): Record<string, number> => {
  if (visited.has(internalname)) return acc;

  // Create a new visited set for this branch to prevent infinite loops
  // but allow the same item to be processed in different branches
  const newVisited = new Set(visited);
  newVisited.add(internalname);

  const entry = recipes[internalname];
  if (!entry) return acc;

  const recipe = getRecipe(entry);
  if (!recipe) return acc;

  const ingredients = getIngredientsFromRecipe(recipe);
  const counts = aggregateIngredients(ingredients);

  for (const [name, count] of Object.entries(counts)) {
    const total = count * multiplier;
    if (
      !BASE_MATERIALS.has(name) &&
      recipes[name] &&
      getRecipe(recipes[name])
    ) {
      // Use the new visited set for each recursive call
      getBaseRequirements(name, recipes, total, acc, newVisited, itemsData);
    } else if (itemsData?.[name]) {
      // If not in recipes but exists in items.json, treat as base
      acc[name] = (acc[name] || 0) + total;
    } else {
      acc[name] = (acc[name] || 0) + total;
    }
  }

  return acc;
};

export interface ItemCheckoff {
  /** Total units of this item needed across the whole tree (all appearances). */
  needed: number;
  /** True if the item is a base material / has no expandable recipe. */
  isLeaf: boolean;
  /** Every tree path where this item appears, with that appearance's needed. */
  paths: Array<{ path: string; needed: number }>;
}

/**
 * Walk the whole crafting tree and group every product (intermediate craftables
 * and base materials, but NOT the root itself) by item name, recording each
 * appearance's tree path and needed quantity. The paths match the keys the tree
 * stores in `checkedItems`, so the materials list can drive/read per-appearance
 * check-off state aggregated by item.
 */
export const getItemCheckoffs = (
  rootName: string,
  recipes: RecipesData,
  multiplier = 1,
  itemsData?: RecipesData,
): Map<string, ItemCheckoff> => {
  const acc = new Map<string, ItemCheckoff>();
  collectItemCheckoffs(rootName, recipes, multiplier, rootName, new Set(), acc);
  // itemsData unused for the shape; kept for parity / future leaf-display needs.
  void itemsData;
  return acc;
};

const collectItemCheckoffs = (
  name: string,
  recipes: RecipesData,
  multiplier: number,
  path: string,
  visited: Set<string>,
  acc: Map<string, ItemCheckoff>,
): void => {
  const entry = recipes[name];
  const recipe = entry ? getRecipe(entry) : undefined;
  // Leaf / base material -> no children to expand.
  if (!recipe || BASE_MATERIALS.has(name)) return;

  const isForge = (recipe as ForgeRecipe).type === "forge";
  const recipeCount = !isForge
    ? Number((recipe as Record<string, string | number>).count) || 1
    : 1;
  const actualMultiplier = Math.ceil(multiplier / recipeCount);

  const newVisited = new Set(visited).add(name);
  const counts = aggregateIngredients(getIngredientsFromRecipe(recipe));
  for (const [child, count] of Object.entries(counts)) {
    // Cycle: the tree renders nothing for a child already on the branch.
    if (newVisited.has(child)) continue;

    const childPath = `${path}${PATH_DELIM}${child}`;
    const childNeeded = count * actualMultiplier;
    const childEntry = recipes[child];
    const childRecipe = childEntry ? getRecipe(childEntry) : undefined;
    const childIsLeaf =
      BASE_MATERIALS.has(child) || !childEntry || !childRecipe;

    let item = acc.get(child);
    if (!item) {
      item = { needed: 0, isLeaf: childIsLeaf, paths: [] };
      acc.set(child, item);
    }
    item.needed += childNeeded;
    item.paths.push({ path: childPath, needed: childNeeded });

    if (!childIsLeaf) {
      collectItemCheckoffs(
        child,
        recipes,
        childNeeded,
        childPath,
        newVisited,
        acc,
      );
    }
  }
};

/**
 * Given the appearances of an item (from getItemCheckoffs) plus the full
 * checkoff map, return that item's appearance paths AND every descendant path
 * beneath them (with each path's needed). Used to cascade a list checkbox the
 * same way the tree does: checking a product also checks everything it's made
 * from.
 */
export const getSubtreeCheckPaths = (
  itemCheckoffs: Map<string, ItemCheckoff>,
  appearancePaths: Array<{ path: string; needed: number }>,
): Array<{ path: string; needed: number }> => {
  const prefixes = appearancePaths.map((p) => p.path);
  const result = new Map<string, number>();
  for (const item of itemCheckoffs.values()) {
    for (const p of item.paths) {
      const underPrefix = prefixes.some(
        (pre) => p.path === pre || p.path.startsWith(pre + PATH_DELIM),
      );
      if (underPrefix) result.set(p.path, p.needed);
    }
  }
  return Array.from(result, ([path, needed]) => ({ path, needed }));
};
