"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type React from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackRecipeTreeItemClick } from "@/lib/analytics";
import { BASE_MATERIALS } from "@/lib/constants";
import {
  calculateOptimalForgeTime,
  formatForgeTime,
} from "@/lib/forge-time-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type { ForgeRecipe, ForgeSettings } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface RecipeTreeProps {
  internalname: string;
  multiplier?: number;
  depth?: number;
  visited?: Set<string>;
  expandedItems: Set<string>;
  onToggleExpanded: (itemName: string) => void;
  forgeSettings?: ForgeSettings;
}

export function RecipeTree({
  internalname,
  multiplier = 1,
  depth = 0,
  visited = new Set(),
  expandedItems: externalExpandedItems,
  onToggleExpanded,
  forgeSettings = { forgeSlots: 2, useMultipleSlots: true, quickForgeLevel: 0 },
}: RecipeTreeProps): React.ReactElement | null {
  const { recipes, itemsData } = useRecipeData();

  const expandedItems = externalExpandedItems ?? new Set([internalname]);

  // Check for cycle detection
  if (visited.has(internalname)) {
    return (
      <div
        className={`flex items-center gap-3 p-3 my-2 bg-card rounded-lg border-l-4 border-destructive`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <span className="text-destructive">(cycle detected)</span>
      </div>
    );
  }

  // Try to get entry from recipes, fallback to itemsData
  let entry = recipes[internalname];
  let isLeafFromItems = false;
  if (!entry && itemsData && itemsData[internalname]) {
    entry = itemsData[internalname];
    isLeafFromItems = true;
  }
  if (!entry) return null;

  const recipe = !isLeafFromItems ? getRecipe(entry) : undefined;
  const isBaseMaterial = BASE_MATERIALS.has(internalname) || isLeafFromItems;
  const ingredients = recipe ? getIngredientsFromRecipe(recipe) : [];
  const hasIngredients = ingredients.length > 0 && !isBaseMaterial;

  const counts = aggregateIngredients(ingredients);
  const nextVisited = new Set(visited);
  nextVisited.add(internalname);

  const isExpanded = expandedItems.has(internalname);

  const toggleExpanded = (itemName: string) => {
    onToggleExpanded(itemName);
  };

  const displayName = getDisplayName(entry, internalname, itemsData);
  const plainDisplayName = displayName.replace(/§./g, "");

  // Detect Forge recipe
  const isForgeRecipe = (recipe as ForgeRecipe)?.type === "forge";
  // Format forge time for display
  const rawForgeTime = isForgeRecipe
    ? (recipe as ForgeRecipe).forge_time
    : undefined;

  // Calculate optimized forge time considering multiple slots
  const optimizedForgeTime =
    rawForgeTime !== undefined
      ? calculateOptimalForgeTime(rawForgeTime, multiplier, forgeSettings)
      : undefined;

  const forgeTime =
    optimizedForgeTime !== undefined
      ? formatForgeTime(optimizedForgeTime)
      : undefined;
  const recipeCount: number = !isForgeRecipe
    ? Number((recipe as Record<string, string | number>)?.count) || 1
    : 1;
  const actualMultiplier = Math.ceil(multiplier / recipeCount);

  return (
    <div className="space-y-1">
      {/* Current item display */}
      <div
        className={`flex items-center gap-4 p-3 my-2 bg-card rounded-lg border-l-4 ${
          visited.has(internalname) ? "border-destructive" : "border-primary"
        } hover:bg-accent transition-all hover:translate-x-1 ${hasIngredients ? "cursor-pointer" : ""}`}
        style={{ marginLeft: `${depth * 20}px` }}
        onClick={() => {
          if (hasIngredients) {
            toggleExpanded(internalname);

            // Track recipe tree item click
            trackRecipeTreeItemClick(
              internalname,
              displayName,
              depth,
              multiplier,
              isForgeRecipe,
              isExpanded,
            );
          }
        }}
      >
        <ItemImage
          entry={entry} // Use the current item's entry
          internalname={internalname}
          alt={plainDisplayName}
          width={32}
          height={32}
          style={{ verticalAlign: "middle" }}
        />
        <MinecraftColoredText
          text={displayName}
          className="font-medium text-foreground"
          title={plainDisplayName}
        />
        {isForgeRecipe && (
          <span className="ml-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-xs font-semibold">
            Forge Recipe
          </span>
        )}
        <span className="ml-auto font-semibold text-primary bg-primary/10 px-3 py-1 rounded-md">
          {multiplier}x
        </span>
        {isForgeRecipe && forgeTime && (
          <div className="ml-2 bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
            <span>Forge Time: {forgeTime}</span>
            {forgeSettings.useMultipleSlots && multiplier > 1 && (
              <span className="ml-1 text-blue-600 dark:text-blue-300">
                (
                {multiplier > forgeSettings.forgeSlots
                  ? `${Math.min(multiplier, forgeSettings.forgeSlots)} slots`
                  : `${multiplier} slot${multiplier > 1 ? "s" : ""}`}
                )
              </span>
            )}
          </div>
        )}
        {isBaseMaterial && (
          <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-sm font-medium">
            Base Material
          </span>
        )}
        {hasIngredients && (
          <span className="text-muted-foreground text-sm ml-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </div>
      {/* Render children if expanded and has ingredients */}{" "}
      {isExpanded && hasIngredients && (
        <div className="space-y-1">
          {Object.entries(counts).map(([name, count]) => (
            <RecipeTree
              key={name}
              internalname={name}
              multiplier={count * actualMultiplier} // Correct multiplier for children
              depth={depth + 1} // Increment depth for children
              visited={nextVisited}
              expandedItems={externalExpandedItems}
              onToggleExpanded={onToggleExpanded}
              forgeSettings={forgeSettings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
