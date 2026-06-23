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

export interface FlowNode {
  id: string;
  /** Total units of this item needed across the whole crafting tree. */
  quantity: number;
}
export interface FlowEdge {
  /** Parent item that consumes `to`. */
  from: string;
  /** Child item (ingredient) consumed by `from`. */
  to: string;
  /** Units of `to` consumed to produce its parent across the whole tree. */
  quantity: number;
}
export interface CraftingFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const EDGE_KEY_SEP = "|";

/**
 * Build an aggregated crafting flow graph (a DAG) for a single root item.
 *
 * Unlike the recipe tree (which renders an item once per appearance), every
 * item is collapsed into a single node and every (parent, child) ingredient
 * relationship into a single edge, with quantities summed across the whole
 * tree. Quantities mirror what the tree displays — i.e. they use
 * `actualMultiplier = ceil(multiplier / recipeCount)`, NOT the simpler
 * `getBaseRequirements` math.
 *
 * Node quantity = total units of that item needed across the tree (the root's
 * quantity is the requested `multiplier`). Edge quantity = total units of the
 * child consumed by that specific parent.
 */
export const getCraftingFlow = (
  rootName: string,
  recipes: RecipesData,
  multiplier = 1,
  itemsData?: RecipesData,
  checkedPaths?: Set<string>,
): CraftingFlow => {
  const nodeQty = new Map<string, number>();
  const edgeQty = new Map<string, number>();

  // The root has no parent edge, so seed its quantity directly. If the root
  // itself is checked off, the whole craft is done -> empty graph.
  if (checkedPaths?.has(rootName)) return { nodes: [], edges: [] };
  nodeQty.set(rootName, multiplier);
  collectFlow(
    rootName,
    recipes,
    multiplier,
    rootName,
    nodeQty,
    edgeQty,
    new Set(),
    checkedPaths,
  );

  // itemsData is unused for the graph shape but kept in the signature for
  // parity with the other requirement helpers and future leaf-display needs.
  void itemsData;

  return toFlow(nodeQty, edgeQty);
};

/** Convert the accumulator maps into the public CraftingFlow shape. */
const toFlow = (
  nodeQty: Map<string, number>,
  edgeQty: Map<string, number>,
): CraftingFlow => {
  const nodes: FlowNode[] = Array.from(nodeQty, ([id, quantity]) => ({
    id,
    quantity,
  }));
  const edges: FlowEdge[] = Array.from(edgeQty, ([key, quantity]) => {
    const [from, to] = key.split(EDGE_KEY_SEP) as [string, string];
    return { from, to, quantity };
  });
  return { nodes, edges };
};

/**
 * Recursive worker mirroring getBaseRequirements' branch-local `visited` cycle
 * guard. Accumulates node and edge quantities into the supplied maps.
 *
 * `path` is the unique node path (root->node internalname chain, joined with
 * PATH_DELIM) matching the keys the tree stores in `checkedItems`. When
 * `checkedPaths` is supplied (todo mode), a child whose path is checked is
 * skipped entirely — its node, its edge, and its whole subtree — so the graph
 * shows only the work that remains.
 */
const collectFlow = (
  name: string,
  recipes: RecipesData,
  multiplier: number,
  path: string,
  nodeQty: Map<string, number>,
  edgeQty: Map<string, number>,
  visited: Set<string>,
  checkedPaths?: Set<string>,
): void => {
  // Defensive: ensure the item exists as a node (root/children are seeded by
  // their caller before recursion, so this rarely fires).
  if (!nodeQty.has(name)) nodeQty.set(name, 0);

  if (visited.has(name)) return; // cycle guard
  if (BASE_MATERIALS.has(name)) return; // leaf: never expand

  const entry = recipes[name];
  if (!entry) return;
  const recipe = getRecipe(entry);
  if (!recipe) return;

  const newVisited = new Set(visited);
  newVisited.add(name);

  const isForge = (recipe as ForgeRecipe).type === "forge";
  const recipeCount = !isForge
    ? Number((recipe as Record<string, string | number>).count) || 1
    : 1;
  const actualMultiplier = Math.ceil(multiplier / recipeCount);

  const counts = aggregateIngredients(getIngredientsFromRecipe(recipe));
  for (const [child, count] of Object.entries(counts)) {
    const childPath = `${path}${PATH_DELIM}${child}`;
    // Checked-off subtree: it's done, so it contributes nothing to the graph.
    if (checkedPaths?.has(childPath)) continue;

    const childTotal = count * actualMultiplier;
    nodeQty.set(child, (nodeQty.get(child) || 0) + childTotal);

    const edgeKey = `${name}${EDGE_KEY_SEP}${child}`;
    edgeQty.set(edgeKey, (edgeQty.get(edgeKey) || 0) + childTotal);

    const expandable =
      !BASE_MATERIALS.has(child) && recipes[child] && getRecipe(recipes[child]);
    if (expandable) {
      collectFlow(
        child,
        recipes,
        childTotal,
        childPath,
        nodeQty,
        edgeQty,
        newVisited,
        checkedPaths,
      );
    }
  }
};

/**
 * Combined crafting flow for multiple root items (multi-item mode). Merges the
 * per-root node/edge quantity maps. Not yet wired into the UI.
 */
export const getCombinedCraftingFlow = (
  itemList: Array<{ itemId: string; quantity: number }>,
  recipes: RecipesData,
  itemsData?: RecipesData,
  checkedPaths?: Set<string>,
): CraftingFlow => {
  const nodeQty = new Map<string, number>();
  const edgeQty = new Map<string, number>();

  for (const { itemId, quantity } of itemList) {
    if (checkedPaths?.has(itemId)) continue;
    nodeQty.set(itemId, (nodeQty.get(itemId) || 0) + quantity);
    collectFlow(
      itemId,
      recipes,
      quantity,
      itemId,
      nodeQty,
      edgeQty,
      new Set(),
      checkedPaths,
    );
  }

  void itemsData;

  return toFlow(nodeQty, edgeQty);
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
