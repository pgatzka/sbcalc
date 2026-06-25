import { beforeEach, describe, expect, it } from "vitest";
import { PATH_DELIM } from "@/lib/constants";
import {
  aggregateIngredients,
  getBaseRequirements,
  getIngredientsFromRecipe,
  getItemCheckoffs,
  getRecipe,
  getSubtreeCheckPaths,
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

describe("getItemCheckoffs", () => {
  // GADGET -> WIDGET (-> 2 SCREW) + BOLT (-> 3 SCREW); SCREW appears twice.
  const recipes: RecipesData = {
    GADGET: {
      internalname: "GADGET",
      recipe: { A1: "WIDGET:1", B1: "BOLT:1", count: "1" },
    },
    WIDGET: { internalname: "WIDGET", recipe: { A1: "SCREW:2", count: "1" } },
    BOLT: { internalname: "BOLT", recipe: { A1: "SCREW:3", count: "1" } },
    SCREW: { internalname: "SCREW" },
  };

  it("groups every product (intermediate + base) by name, excluding the root", () => {
    const map = getItemCheckoffs("GADGET", recipes, 1);

    expect([...map.keys()].sort()).toEqual(["BOLT", "SCREW", "WIDGET"]);
    expect(map.get("GADGET")).toBeUndefined(); // root is not a material
    expect(map.get("WIDGET")?.isLeaf).toBe(false);
    expect(map.get("SCREW")?.isLeaf).toBe(true);
  });

  it("sums needed across appearances and records every path", () => {
    const map = getItemCheckoffs("GADGET", recipes, 1);

    const screw = map.get("SCREW");
    expect(screw?.needed).toBe(5); // 2 under WIDGET + 3 under BOLT
    expect(screw?.paths.map((p) => p.needed).sort()).toEqual([2, 3]);
    expect(screw?.paths.map((p) => p.path).sort()).toEqual(
      [
        ["GADGET", "BOLT", "SCREW"].join(PATH_DELIM),
        ["GADGET", "WIDGET", "SCREW"].join(PATH_DELIM),
      ].sort(),
    );
  });

  it("scales by the multiplier and recipe count", () => {
    const batched: RecipesData = {
      PLATE: {
        internalname: "PLATE",
        recipe: { A1: "IRON:5", count: "2" }, // 1 craft yields 2 plates
      },
      IRON: { internalname: "IRON" },
    };
    // Need 3 plates -> ceil(3/2)=2 crafts -> 10 iron.
    const map = getItemCheckoffs("PLATE", batched, 3);
    expect(map.get("IRON")?.needed).toBe(10);
  });

  it("getSubtreeCheckPaths returns an item's appearances plus descendants", () => {
    const map = getItemCheckoffs("GADGET", recipes, 1);
    const widgetPaths = map.get("WIDGET")?.paths ?? [];

    const subtree = getSubtreeCheckPaths(map, widgetPaths);
    const paths = subtree.map((p) => p.path).sort();

    // WIDGET itself and the SCREW beneath WIDGET — but NOT the SCREW under BOLT.
    expect(paths).toEqual(
      [
        ["GADGET", "WIDGET"].join(PATH_DELIM),
        ["GADGET", "WIDGET", "SCREW"].join(PATH_DELIM),
      ].sort(),
    );
    // The SCREW under WIDGET needs 2.
    const screw = subtree.find((p) =>
      p.path.endsWith(`${PATH_DELIM}WIDGET${PATH_DELIM}SCREW`),
    );
    expect(screw?.needed).toBe(2);
  });
});
