import { useMemo } from "react";
import {
  getCombinedForgeTime,
  getTotalForgeTime,
} from "@/lib/forge-time-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  getBaseRequirements,
  getCombinedBaseRequirements,
} from "@/lib/recipe-utils";
import type { ForgeSettings } from "@/lib/types";

/**
 * Derives base material requirements and total forge time
 * from the current mode, selection, and settings.
 */
export function useCalculatorResults(
  mode: "single" | "multi",
  selectedItem: string | null,
  multiplier: number,
  itemList: Array<{ itemId: string; quantity: number }>,
  settings: ForgeSettings,
) {
  const { recipes, itemsData } = useRecipeData();

  const baseRequirements = useMemo(() => {
    if (mode === "single" && selectedItem) {
      return getBaseRequirements(selectedItem, recipes, multiplier);
    }
    if (mode === "multi") {
      return getCombinedBaseRequirements(itemList, recipes, itemsData);
    }
    return {};
  }, [mode, selectedItem, multiplier, itemList, recipes, itemsData]);

  const totalMaterials = Object.keys(baseRequirements).length;

  const totalForgeTime = useMemo(() => {
    if (mode === "single" && selectedItem) {
      return getTotalForgeTime(
        selectedItem,
        recipes,
        multiplier,
        new Set(),
        settings,
      );
    }
    if (mode === "multi") {
      return getCombinedForgeTime(itemList, recipes, settings);
    }
    return 0;
  }, [mode, selectedItem, multiplier, itemList, recipes, settings]);

  return { baseRequirements, totalMaterials, totalForgeTime };
}
