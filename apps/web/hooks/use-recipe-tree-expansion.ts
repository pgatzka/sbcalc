import { useEffect, useState } from "react";
import { BASE_MATERIALS } from "@/lib/constants";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";

export function useRecipeTreeExpansion(selectedItem: string | null) {
  const { recipes } = useRecipeData();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Helper function to get all expandable items in the recipe tree
  const getAllExpandableItems = (
    internalname: string,
    visited: Set<string> = new Set(),
  ): Set<string> => {
    if (visited.has(internalname)) return new Set();

    const entry = recipes[internalname];
    if (!entry) return new Set();

    const recipe = getRecipe(entry);
    if (!recipe) return new Set();

    const ingredients = getIngredientsFromRecipe(recipe);
    if (ingredients.length === 0) return new Set();

    const expandableItems = new Set<string>();
    const nextVisited = new Set(visited);
    nextVisited.add(internalname);

    const aggregated = aggregateIngredients(ingredients);
    for (const [name] of Object.entries(aggregated)) {
      if (recipes[name] && !BASE_MATERIALS.has(name)) {
        expandableItems.add(name);
        // Recursively get expandable items from this ingredient
        const nestedExpandable = getAllExpandableItems(name, nextVisited);
        nestedExpandable.forEach((item) => expandableItems.add(item));
      }
    }

    return expandableItems;
  };

  // Initialize expanded items when item changes
  useEffect(() => {
    if (selectedItem) {
      setExpandedItems(new Set([selectedItem]));
    }
  }, [selectedItem]);

  const handleToggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const handleExpandAll = () => {
    if (selectedItem) {
      const allExpandable = getAllExpandableItems(selectedItem);
      allExpandable.add(selectedItem); // Include the root item
      setExpandedItems(allExpandable);
    }
  };

  const handleCollapseAll = () => {
    if (selectedItem) {
      setExpandedItems(new Set([selectedItem])); // Keep only the root item expanded
    }
  };

  return {
    expandedItems,
    handleToggleExpanded,
    handleExpandAll,
    handleCollapseAll,
  };
}
