import { useMemo } from "react";
import { getTotalForgeTime } from "@/lib/forge-time-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getBaseRequirements } from "@/lib/recipe-utils";
import type { ForgeSettings } from "@/lib/types";

/**
 * Derives base material requirements and total forge time for the selected
 * item. Forge time is reduced by whatever is checked off in the checklist.
 */
export function useCalculatorResults(
  selectedItem: string | null,
  multiplier: number,
  settings: ForgeSettings,
  checkedItems?: Map<string, number>,
) {
  const { recipes } = useRecipeData();

  const baseRequirements = useMemo(() => {
    if (!selectedItem) return {};
    return getBaseRequirements(selectedItem, recipes, multiplier);
  }, [selectedItem, multiplier, recipes]);

  const totalMaterials = Object.keys(baseRequirements).length;

  const totalForgeTime = useMemo(() => {
    if (!selectedItem) return 0;
    return getTotalForgeTime(
      selectedItem,
      recipes,
      multiplier,
      new Set(),
      settings,
      checkedItems,
    );
  }, [selectedItem, multiplier, recipes, settings, checkedItems]);

  return { baseRequirements, totalMaterials, totalForgeTime };
}
