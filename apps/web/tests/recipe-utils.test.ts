import { beforeEach, describe, expect, it } from "vitest";
import { PATH_DELIM } from "@/lib/constants";
import {
  aggregateIngredients,
  getBaseRequirements,
  getCraftingFlow,
  getFrontierRequirements,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type { ForgeRecipe, RecipeEntry, RecipesData } from "@/lib/types";

describe("aggregateIngredients", () => {
  it("should aggregate ingredient counts correctly", () => {
    const ingredients = ["IRON_INGOT:10", "DIAMOND:5", "IRON_INGOT:20"];

    const result = aggregateIngredients(ingredients);

    expect(result).toEqual({
      IRON_INGOT: 30,
      DIAMOND: 5,
    });
  });

  it("should handle ingredients without count", () => {
    const ingredients = ["IRON_INGOT", "DIAMOND:5"];

    const result = aggregateIngredients(ingredients);

    expect(result).toEqual({
      IRON_INGOT: 1,
      DIAMOND: 5,
    });
  });

  it("should handle empty array", () => {
    const result = aggregateIngredients([]);
    expect(result).toEqual({});
  });

  it("should handle invalid ingredient strings", () => {
    const ingredients = ["", "IRON_INGOT:10", ":5"];

    const result = aggregateIngredients(ingredients);

    expect(result).toEqual({
      IRON_INGOT: 10,
    });
  });
});

describe("getRecipe", () => {
  it("should return recipe object when present", () => {
    const entry: RecipeEntry = {
      internalname: "TEST_ITEM",
      recipe: {
        A1: "IRON_INGOT:10",
        count: "1",
      },
    };

    const result = getRecipe(entry);

    expect(result).toEqual({
      A1: "IRON_INGOT:10",
      count: "1",
    });
  });

  it("should return forge recipe when present in recipes array", () => {
    const entry: RecipeEntry = {
      internalname: "TEST_ITEM",
      recipes: [
        {
          type: "forge" as const,
          duration: 300,
          inputs: ["IRON_INGOT:10", "DIAMOND:5"],
        },
      ],
    };

    const result = getRecipe(entry) as ForgeRecipe;

    expect(result.type).toBe("forge");
    expect(result.forge_time).toBe(300);
    expect(result.forge_ingredients).toEqual([
      { item: "IRON_INGOT", count: 10 },
      { item: "DIAMOND", count: 5 },
    ]);
  });

  it("should return undefined when no recipe present", () => {
    const entry: RecipeEntry = {
      internalname: "TEST_ITEM",
    };

    const result = getRecipe(entry);
    expect(result).toBeUndefined();
  });
});

describe("getIngredientsFromRecipe", () => {
  it("should extract ingredients from regular recipe", () => {
    const recipe = {
      A1: "IRON_INGOT:10",
      B2: "DIAMOND:5",
      count: "1",
    };

    const result = getIngredientsFromRecipe(recipe);

    expect(result).toEqual(["IRON_INGOT:10", "DIAMOND:5"]);
  });

  it("should extract ingredients from forge recipe", () => {
    const recipe: ForgeRecipe = {
      type: "forge",
      forge_time: 300,
      forge_ingredients: [
        { item: "IRON_INGOT", count: 10 },
        { item: "DIAMOND", count: 5 },
      ],
    };

    const result = getIngredientsFromRecipe(recipe);

    expect(result).toEqual(["IRON_INGOT:10", "DIAMOND:5"]);
  });

  it("should filter out non-ingredient entries", () => {
    const recipe = {
      A1: "IRON_INGOT:10",
      count: "1",
      invalid: "no_colon",
      empty: "",
    };

    const result = getIngredientsFromRecipe(recipe);

    expect(result).toEqual(["IRON_INGOT:10"]);
  });
});

describe("getBaseRequirements", () => {
  let recipesData: RecipesData;

  beforeEach(() => {
    recipesData = {
      ENCHANTED_IRON: {
        internalname: "ENCHANTED_IRON",
        recipe: {
          A1: "IRON_INGOT:160",
          count: "1",
        },
      },
      HYPERION: {
        internalname: "HYPERION",
        recipe: {
          A1: "ENCHANTED_IRON:64",
          B1: "DIAMOND:32",
          count: "1",
        },
      },
      IRON_INGOT: {
        internalname: "IRON_INGOT",
      },
      DIAMOND: {
        internalname: "DIAMOND",
      },
    };
  });

  it("should calculate base requirements recursively", () => {
    const result = getBaseRequirements("HYPERION", recipesData);

    expect(result).toEqual({
      IRON_INGOT: 10240, // 64 * 160
      DIAMOND: 32,
    });
  });

  it("should handle items with no recipe", () => {
    const result = getBaseRequirements("DIAMOND", recipesData);

    expect(result).toEqual({});
  });

  it("should handle missing items", () => {
    const result = getBaseRequirements("NONEXISTENT", recipesData);

    expect(result).toEqual({});
  });

  it("should apply multiplier correctly", () => {
    const result = getBaseRequirements("ENCHANTED_IRON", recipesData, 2);

    expect(result).toEqual({
      IRON_INGOT: 320, // 160 * 2
    });
  });
});

describe("getFrontierRequirements", () => {
  // SUPER_ITEM -> 2x ENCHANTED_DIAMOND -> 160x DIAMOND
  // GADGET -> WIDGET (-> 2x SCREW) + BOLT (-> 3x SCREW); SCREW appears twice.
  let recipesData: RecipesData;

  beforeEach(() => {
    recipesData = {
      SUPER_ITEM: {
        internalname: "SUPER_ITEM",
        recipe: { A1: "ENCHANTED_DIAMOND:2", count: "1" },
      },
      ENCHANTED_DIAMOND: {
        internalname: "ENCHANTED_DIAMOND",
        recipe: { A1: "DIAMOND:160", count: "1" },
      },
      DIAMOND: { internalname: "DIAMOND" },
      GADGET: {
        internalname: "GADGET",
        recipe: { A1: "WIDGET:1", B1: "BOLT:1", count: "1" },
      },
      WIDGET: {
        internalname: "WIDGET",
        recipe: { A1: "SCREW:2", count: "1" },
      },
      BOLT: { internalname: "BOLT", recipe: { A1: "SCREW:3", count: "1" } },
      SCREW: { internalname: "SCREW" },
    };
  });

  it("returns the deepest base materials when nothing is checked", () => {
    const result = getFrontierRequirements(
      "SUPER_ITEM",
      recipesData,
      1,
      new Set(),
    );

    expect(result).toEqual({ DIAMOND: 320 }); // 2 * 160
  });

  it("rolls up to the next un-crafted parent when a leaf is checked", () => {
    const diamondPath = ["SUPER_ITEM", "ENCHANTED_DIAMOND", "DIAMOND"].join(
      PATH_DELIM,
    );

    const result = getFrontierRequirements(
      "SUPER_ITEM",
      recipesData,
      1,
      new Set([diamondPath]),
    );

    // Diamonds gathered -> the next granular item is the enchanted diamond.
    expect(result).toEqual({ ENCHANTED_DIAMOND: 2 });
  });

  it("treats duplicate appearances of an item independently", () => {
    const screwUnderWidget = ["GADGET", "WIDGET", "SCREW"].join(PATH_DELIM);

    const result = getFrontierRequirements(
      "GADGET",
      recipesData,
      1,
      new Set([screwUnderWidget]),
    );

    // The SCREW under WIDGET is done (so WIDGET rolls up), but the SCREW under
    // BOLT is still independently needed.
    expect(result).toEqual({ WIDGET: 1, SCREW: 3 });
  });

  it("excludes a whole subtree when a parent node is checked", () => {
    const widgetPath = ["GADGET", "WIDGET"].join(PATH_DELIM);

    const result = getFrontierRequirements(
      "GADGET",
      recipesData,
      1,
      new Set([widgetPath]),
    );

    // WIDGET (and its SCREW) gone; only BOLT's SCREW remains.
    expect(result).toEqual({ SCREW: 3 });
  });
});

describe("getCraftingFlow", () => {
  const nodeQty = (flow: { nodes: { id: string; quantity: number }[] }) =>
    Object.fromEntries(flow.nodes.map((n) => [n.id, n.quantity]));
  const edgeQty = (flow: {
    edges: { from: string; to: string; quantity: number }[];
  }) =>
    Object.fromEntries(
      flow.edges.map((e) => [`${e.from}->${e.to}`, e.quantity]),
    );

  it("aggregates nodes and edges with tree quantities", () => {
    const recipes: RecipesData = {
      HYPERION: {
        internalname: "HYPERION",
        recipe: { A1: "ENCHANTED_IRON:64", B1: "DIAMOND:32", count: "1" },
      },
      ENCHANTED_IRON: {
        internalname: "ENCHANTED_IRON",
        recipe: { A1: "IRON_INGOT:160", count: "1" },
      },
      IRON_INGOT: { internalname: "IRON_INGOT" },
      DIAMOND: { internalname: "DIAMOND" },
    };

    const flow = getCraftingFlow("HYPERION", recipes, 1);

    expect(nodeQty(flow)).toEqual({
      HYPERION: 1,
      ENCHANTED_IRON: 64,
      IRON_INGOT: 10240, // 64 * 160
      DIAMOND: 32,
    });
    expect(edgeQty(flow)).toEqual({
      "HYPERION->ENCHANTED_IRON": 64,
      "HYPERION->DIAMOND": 32, // DIAMOND is a base material -> leaf, no children
      "ENCHANTED_IRON->IRON_INGOT": 10240,
    });
  });

  it("collapses a duplicate ingredient into one node with summed edges", () => {
    // GADGET needs WIDGET and BOLT; both consume SCREW.
    const recipes: RecipesData = {
      GADGET: {
        internalname: "GADGET",
        recipe: { A1: "WIDGET:1", B1: "BOLT:1", count: "1" },
      },
      WIDGET: { internalname: "WIDGET", recipe: { A1: "SCREW:2", count: "1" } },
      BOLT: { internalname: "BOLT", recipe: { A1: "SCREW:3", count: "1" } },
      SCREW: { internalname: "SCREW" },
    };

    const flow = getCraftingFlow("GADGET", recipes, 1);

    // SCREW appears once, with two incoming edges (2 + 3 total demand).
    expect(flow.nodes.filter((n) => n.id === "SCREW")).toHaveLength(1);
    expect(nodeQty(flow).SCREW).toBe(5);
    expect(edgeQty(flow)).toMatchObject({
      "WIDGET->SCREW": 2,
      "BOLT->SCREW": 3,
    });
  });

  it("uses ceil(multiplier / count) for batch crafting recipes", () => {
    const recipes: RecipesData = {
      PLATE: {
        internalname: "PLATE",
        recipe: { A1: "IRON_INGOT:5", count: "2" }, // 1 craft yields 2 plates
      },
      IRON_INGOT: { internalname: "IRON_INGOT" },
    };

    // Need 3 plates -> ceil(3/2) = 2 crafts -> 2 * 5 = 10 iron.
    const flow = getCraftingFlow("PLATE", recipes, 3);
    expect(nodeQty(flow).PLATE).toBe(3);
    expect(edgeQty(flow)["PLATE->IRON_INGOT"]).toBe(10);
  });

  it("treats forge recipes as count = 1", () => {
    const recipes: RecipesData = {
      AMBER_MATERIAL: {
        internalname: "AMBER_MATERIAL",
        recipes: [
          {
            type: "forge",
            duration: 1000,
            inputs: ["GOLDEN_PLATE:1", "FINE_AMBER_GEM:12"],
          },
        ],
      },
      GOLDEN_PLATE: { internalname: "GOLDEN_PLATE" },
      FINE_AMBER_GEM: { internalname: "FINE_AMBER_GEM" },
    };

    const flow = getCraftingFlow("AMBER_MATERIAL", recipes, 2);
    // count forced to 1 -> child qty = count * multiplier.
    expect(edgeQty(flow)).toMatchObject({
      "AMBER_MATERIAL->GOLDEN_PLATE": 2,
      "AMBER_MATERIAL->FINE_AMBER_GEM": 24,
    });
  });

  it("terminates on cycles", () => {
    const recipes: RecipesData = {
      A: { internalname: "A", recipe: { A1: "B:1", count: "1" } },
      B: { internalname: "B", recipe: { A1: "A:1", count: "1" } },
    };

    const flow = getCraftingFlow("A", recipes, 1);
    expect(flow.nodes.map((n) => n.id).sort()).toEqual(["A", "B"]);
  });

  it("returns just the root node when it has no recipe", () => {
    const recipes: RecipesData = { LONELY: { internalname: "LONELY" } };
    const flow = getCraftingFlow("LONELY", recipes, 5);
    expect(flow.nodes).toEqual([{ id: "LONELY", quantity: 5 }]);
    expect(flow.edges).toEqual([]);
  });

  it("drops checked-off subtrees so only remaining work is shown", () => {
    const recipes: RecipesData = {
      SUPER_ITEM: {
        internalname: "SUPER_ITEM",
        recipe: { A1: "ENCHANTED_DIAMOND:2", count: "1" },
      },
      ENCHANTED_DIAMOND: {
        internalname: "ENCHANTED_DIAMOND",
        recipe: { A1: "DIAMOND:160", count: "1" },
      },
      DIAMOND: { internalname: "DIAMOND" },
    };
    const diamondPath = ["SUPER_ITEM", "ENCHANTED_DIAMOND", "DIAMOND"].join(
      PATH_DELIM,
    );

    const flow = getCraftingFlow(
      "SUPER_ITEM",
      recipes,
      1,
      undefined,
      new Set([diamondPath]),
    );

    // DIAMOND is gathered -> its node and the ENCHANTED_DIAMOND->DIAMOND edge
    // are gone; ENCHANTED_DIAMOND remains as a (now childless) node.
    expect(flow.nodes.map((n) => n.id).sort()).toEqual([
      "ENCHANTED_DIAMOND",
      "SUPER_ITEM",
    ]);
    expect(flow.edges).toEqual([
      { from: "SUPER_ITEM", to: "ENCHANTED_DIAMOND", quantity: 2 },
    ]);
  });

  it("respects checks per appearance for duplicated items", () => {
    const recipes: RecipesData = {
      GADGET: {
        internalname: "GADGET",
        recipe: { A1: "WIDGET:1", B1: "BOLT:1", count: "1" },
      },
      WIDGET: { internalname: "WIDGET", recipe: { A1: "SCREW:2", count: "1" } },
      BOLT: { internalname: "BOLT", recipe: { A1: "SCREW:3", count: "1" } },
      SCREW: { internalname: "SCREW" },
    };
    const screwUnderWidget = ["GADGET", "WIDGET", "SCREW"].join(PATH_DELIM);

    const flow = getCraftingFlow(
      "GADGET",
      recipes,
      1,
      undefined,
      new Set([screwUnderWidget]),
    );

    // Only the WIDGET->SCREW edge is gone; BOLT still needs its SCREW, so SCREW
    // remains as a node with quantity 3 (the WIDGET demand of 2 is dropped).
    const edgeMap = Object.fromEntries(
      flow.edges.map((e) => [`${e.from}->${e.to}`, e.quantity]),
    );
    expect(edgeMap).toEqual({
      "GADGET->WIDGET": 1,
      "GADGET->BOLT": 1,
      "BOLT->SCREW": 3,
    });
    expect(flow.nodes.find((n) => n.id === "SCREW")?.quantity).toBe(3);
  });
});
