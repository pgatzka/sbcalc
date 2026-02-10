import { describe, expect, it } from "vitest";
import type { RecipeEntry, RecipesData } from "@/lib/types";
import { extractFromSNBT, getDisplayName } from "@/lib/utils";

describe("getDisplayName", () => {
  it("should return formatted display name from recipe entry", () => {
    const entry: RecipeEntry = {
      displayname: "§6Hyperion",
      internalname: "HYPERION",
    };

    const result = getDisplayName(entry, "HYPERION");
    expect(result).toBe("§6Hyperion");
  });

  it("should return display name from items data when not in recipe entry", () => {
    const entry: RecipeEntry = {
      internalname: "HYPERION",
    };

    const itemsData: RecipesData = {
      HYPERION: {
        displayname: "§6Hyperion Sword",
        internalname: "HYPERION",
      },
    };

    const result = getDisplayName(entry, "HYPERION", itemsData);
    expect(result).toBe("§6Hyperion Sword");
  });

  it("should format internal name when no display name is available", () => {
    const entry: RecipeEntry = {
      internalname: "ENCHANTED_IRON_INGOT",
    };

    const result = getDisplayName(entry, "ENCHANTED_IRON_INGOT");
    expect(result).toBe("Enchanted Iron Ingot");
  });

  it("should handle undefined entry", () => {
    const result = getDisplayName(undefined, "IRON_INGOT");
    expect(result).toBe("Iron Ingot");
  });

  it("should preserve minecraft formatting codes in display name", () => {
    const entry: RecipeEntry = {
      displayname: "§l§6Super §r§cPowerful §bSword",
      internalname: "SWORD",
    };

    const result = getDisplayName(entry, "SWORD");
    expect(result).toBe("§l§6Super §r§cPowerful §bSword");
  });
});

describe("extractFromSNBT", () => {
  it("should return null values for invalid SNBT", () => {
    const result = extractFromSNBT("invalid snbt");
    expect(result).toEqual({
      textureUrl: null,
      itemModel: null,
    });
  });

  it("should extract ItemModel from valid SNBT", () => {
    const snbt = '{ItemModel:"minecraft:golden_sword"}';
    const result = extractFromSNBT(snbt);
    expect(result.itemModel).toBe("golden_sword");
  });

  it("should handle empty SNBT", () => {
    const result = extractFromSNBT("");
    expect(result).toEqual({
      textureUrl: null,
      itemModel: null,
    });
  });
});
