import { beforeEach, describe, expect, it } from "vitest";
import { PATH_DELIM } from "@/lib/constants";
import {
  aggregateIngredients,
  getBaseRequirements,
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
