"use client";

import { useEffect, useState } from "react";
import type { ShareableRecipeState } from "@/lib/share-utils";
import type { Settings } from "@/lib/types";

/**
 * Loads a shared recipe from URL state into the recipe state hooks.
 * Handles both single-item and multi-item shared recipes.
 */
export function useSharedRecipeLoader(
  sharedState: ShareableRecipeState | null,
  actions: {
    setMode: (mode: "single" | "multi") => void;
    setSelectedItem: (item: string) => void;
    setMultiplier: (n: number) => void;
    setItemList: (items: Array<{ itemId: string; quantity: number }>) => void;
    updateSettings: (settings: Partial<Settings>) => void;
  },
) {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (sharedState && !hasLoaded) {
      const recipeEntries = Object.entries(sharedState.recipes);

      if (recipeEntries.length === 1) {
        const firstEntry = recipeEntries[0];
        if (firstEntry) {
          const [itemName, quantity] = firstEntry;
          actions.setMode("single");
          actions.setSelectedItem(itemName);
          actions.setMultiplier(quantity);
        }
      } else if (recipeEntries.length > 1) {
        actions.setMode("multi");
        actions.setItemList(
          recipeEntries.map(([itemId, quantity]) => ({ itemId, quantity })),
        );
      }

      actions.updateSettings(sharedState.forgeSettings);
      setHasLoaded(true);
    }
  }, [sharedState, hasLoaded, actions]);
}
