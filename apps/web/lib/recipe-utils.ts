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

/**
 * Get combined base requirements for multiple items
 */
export const getCombinedBaseRequirements = (
  itemList: Array<{ itemId: string; quantity: number }>,
  recipes: RecipesData,
  itemsData?: RecipesData,
): Record<string, number> => {
  const combined: Record<string, number> = {};

  for (const { itemId, quantity } of itemList) {
    const requirements = getBaseRequirements(
      itemId,
      recipes,
      quantity,
      {},
      new Set(),
      itemsData,
    );

    // Merge requirements into combined
    for (const [material, count] of Object.entries(requirements)) {
      combined[material] = (combined[material] || 0) + count;
    }
  }

  return combined;
};

/**
 * Collect requirements stopping at a given recursion depth.
 * depth=1 returns direct ingredients (what you'd buy from Bazaar).
 * depth=Infinity behaves like getBaseRequirements.
 */
export const getRequirementsAtDepth = (
  internalname: string,
  recipes: RecipesData,
  multiplier = 1,
  maxDepth: number,
  acc: Record<string, number> = {},
  visited: Set<string> = new Set(),
  currentDepth = 0,
  itemsData?: RecipesData,
): Record<string, number> => {
  if (visited.has(internalname)) return acc;

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
    const hasCraftableRecipe =
      !BASE_MATERIALS.has(name) && recipes[name] && getRecipe(recipes[name]);

    if (hasCraftableRecipe && currentDepth + 1 < maxDepth) {
      getRequirementsAtDepth(
        name,
        recipes,
        total,
        maxDepth,
        acc,
        newVisited,
        currentDepth + 1,
        itemsData,
      );
    } else {
      acc[name] = (acc[name] || 0) + total;
    }
  }

  return acc;
};

/**
 * "Frontier" requirements for todo mode.
 *
 * Walks the crafting tree keyed by unique node PATH (root->node chain) and
 * returns the most granular items still needed, given the set of checked-off
 * node paths. Rules per node:
 *  - path is checked        -> the whole subtree is done, contributes nothing.
 *  - leaf / base material   -> it's a granular item still needed.
 *  - has ingredients        -> recurse; if every child contributes nothing
 *                              (all gathered) the node itself becomes the
 *                              granular item to craft, otherwise return the
 *                              union of the children's contributions.
 *
 * Output is aggregated by item name (Record<name, qty>), matching the shape of
 * getBaseRequirements so list components need no structural change.
 */
export const getFrontierRequirements = (
  internalname: string,
  recipes: RecipesData,
  multiplier: number,
  checkedPaths: Set<string>,
  path: string = internalname,
  visited: Set<string> = new Set(),
): Record<string, number> => {
  // Entire subtree already gathered/crafted.
  if (checkedPaths.has(path)) return {};

  // Cycle guard (mirrors getBaseRequirements' branch-local visited): if this
  // name already appears on the current branch, treat it as a leaf.
  if (visited.has(internalname)) return { [internalname]: multiplier };

  const entry = recipes[internalname];
  const recipe = entry ? getRecipe(entry) : undefined;

  // Leaf / base material -> the granular item still needed. Items missing from
  // `recipes` (e.g. items.json-only) are treated as base here as well.
  if (BASE_MATERIALS.has(internalname) || !entry || !recipe) {
    return { [internalname]: multiplier };
  }

  const counts = aggregateIngredients(getIngredientsFromRecipe(recipe));
  if (Object.keys(counts).length === 0) {
    return { [internalname]: multiplier };
  }

  const newVisited = new Set(visited);
  newVisited.add(internalname);

  // Mirror recipe-tree's multiplier math: forge recipes craft 1 per run,
  // crafting recipes craft `recipe.count` per run.
  const isForge = (recipe as ForgeRecipe).type === "forge";
  const recipeCount = !isForge
    ? Number((recipe as Record<string, string | number>).count) || 1
    : 1;
  const actualMultiplier = Math.ceil(multiplier / recipeCount);

  const childAcc: Record<string, number> = {};
  for (const [name, count] of Object.entries(counts)) {
    const childResult = getFrontierRequirements(
      name,
      recipes,
      count * actualMultiplier,
      checkedPaths,
      `${path}${PATH_DELIM}${name}`,
      newVisited,
    );
    for (const [material, qty] of Object.entries(childResult)) {
      childAcc[material] = (childAcc[material] || 0) + qty;
    }
  }

  // All ingredients gathered -> this node is now the granular item to craft.
  if (Object.keys(childAcc).length === 0) {
    return { [internalname]: multiplier };
  }
  return childAcc;
};

/**
 * Combined frontier requirements for multiple items (multi-item mode). Each
 * root's path is its own itemId, so paths from different roots never collide.
 */
export const getCombinedFrontierRequirements = (
  itemList: Array<{ itemId: string; quantity: number }>,
  recipes: RecipesData,
  checkedPaths: Set<string>,
): Record<string, number> => {
  const combined: Record<string, number> = {};

  for (const { itemId, quantity } of itemList) {
    const requirements = getFrontierRequirements(
      itemId,
      recipes,
      quantity,
      checkedPaths,
    );
    for (const [material, count] of Object.entries(requirements)) {
      combined[material] = (combined[material] || 0) + count;
    }
  }

  return combined;
};

/**
 * Get combined requirements for multiple items at a given depth.
 */
export const getCombinedRequirementsAtDepth = (
  itemList: Array<{ itemId: string; quantity: number }>,
  recipes: RecipesData,
  maxDepth: number,
  itemsData?: RecipesData,
): Record<string, number> => {
  const combined: Record<string, number> = {};

  for (const { itemId, quantity } of itemList) {
    const requirements = getRequirementsAtDepth(
      itemId,
      recipes,
      quantity,
      maxDepth,
      {},
      new Set(),
      0,
      itemsData,
    );

    for (const [material, count] of Object.entries(requirements)) {
      combined[material] = (combined[material] || 0) + count;
    }
  }

  return combined;
};
