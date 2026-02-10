"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Clipboard, Heart, List, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import { CombinedMaterialsList } from "@/components/combined-materials-list";
import { CombinedSummaryCards } from "@/components/combined-summary-cards";
import { CraftingTreeMulti } from "@/components/crafting-tree-multi";
import { CraftingTreeSingle } from "@/components/crafting-tree-single";
import { HeaderBar } from "@/components/header-bar";
import { ModeSwitcher } from "@/components/mode-switcher";
import { MultiItemPanel } from "@/components/multi-item-panel";
import { RecipeSummaryCards } from "@/components/recipe-summary-cards";
import { SingleItemPanel } from "@/components/single-item-panel";
import itemsRaw from "@/data/items.json";
import recipesRaw from "@/data/recipes_items.json";
import { useRecipeState } from "@/hooks/use-recipe-state";
import { useRecipeTreeExpansion } from "@/hooks/use-recipe-tree-expansion";
import { useSharedRecipe } from "@/hooks/use-shared-recipe";
import {
  getCombinedForgeTime,
  getTotalForgeTime,
} from "@/lib/forge-time-utils";
import {
  getBaseRequirements,
  getCombinedBaseRequirements,
} from "@/lib/recipe-utils";
import { useSettings } from "@/lib/settings-context";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";

const recipes: RecipesData = recipesRaw as any;
const items: RecipesData = itemsRaw as any;

export function SkyblockCalculatorClient() {
  const {
    mode,
    setMode,
    selectedItem,
    setSelectedItem,
    multiplier,
    setMultiplier,
    itemList,
    setItemList,
    lastMultiSelectedItem,
    setLastMultiSelectedItem,
    handleModeSwitch,
    getRecipeState,
  } = useRecipeState();

  const [searchValue, setSearchValue] = useState<string>("");
  const [hasLoadedSharedRecipe, setHasLoadedSharedRecipe] = useState(false);
  const [hasRestoredMultiItem, setHasRestoredMultiItem] = useState(false);
  const [multiTreeSelectedItem, setMultiTreeSelectedItem] = useState<
    string | null
  >(null);
  const { settings, updateSettings } = useSettings();
  const { sharedState } = useSharedRecipe();

  // Load shared recipe if available (only once)
  useEffect(() => {
    if (sharedState && !hasLoadedSharedRecipe) {
      const recipeEntries = Object.entries(sharedState.recipes);

      if (recipeEntries.length === 1) {
        // Single item mode
        const firstEntry = recipeEntries[0];
        if (firstEntry) {
          const [itemName, quantity] = firstEntry;
          setMode("single");
          setSelectedItem(itemName);
          setMultiplier(quantity);
        }
      } else if (recipeEntries.length > 1) {
        // Multi item mode
        setMode("multi");
        setItemList(
          recipeEntries.map(([itemId, quantity]) => ({ itemId, quantity })),
        );
      }

      // Apply shared forge settings
      updateSettings(sharedState.forgeSettings);
      setHasLoadedSharedRecipe(true);
    }
  }, [
    sharedState,
    hasLoadedSharedRecipe,
    updateSettings,
    setMode,
    setSelectedItem,
    setMultiplier,
    setItemList,
  ]);

  // Reset restoration flag when switching modes
  useEffect(() => {
    if (mode === "single") {
      setHasRestoredMultiItem(false);
    }
  }, [mode]);

  // Sync search value with selected item when it loads from localStorage (strip color codes for input)
  useEffect(() => {
    if (selectedItem && mode === "single") {
      const item = recipes[selectedItem as keyof typeof recipes];
      if (item) {
        const displayNameColored = getDisplayName(item, selectedItem, items);
        const displayNamePlain = displayNameColored.replace(/§./g, "");
        setSearchValue(displayNamePlain);
      }
    }
  }, [selectedItem, mode]);

  // Restore last multi-selected item from localStorage on load or mode change
  useEffect(() => {
    if (
      mode === "multi" &&
      lastMultiSelectedItem &&
      itemList.length > 0 &&
      !hasRestoredMultiItem
    ) {
      // Verify the item exists in the current list
      const itemExists = itemList.some(
        (item) => item.itemId === lastMultiSelectedItem,
      );
      if (itemExists) {
        setMultiTreeSelectedItem(lastMultiSelectedItem);
        setHasRestoredMultiItem(true);
      }
    }
  }, [mode, hasRestoredMultiItem, itemList, lastMultiSelectedItem]); // Only depend on mode, not itemList or lastMultiSelectedItem

  // Save multi-selected item to localStorage when changed
  useEffect(() => {
    if (mode === "multi" && multiTreeSelectedItem) {
      setLastMultiSelectedItem(multiTreeSelectedItem);
    }
  }, [mode, multiTreeSelectedItem, setLastMultiSelectedItem]);

  const {
    expandedItems,
    handleToggleExpanded,
    handleExpandAll,
    handleCollapseAll,
  } = useRecipeTreeExpansion(selectedItem, recipes);

  // For multi-mode tree view
  const {
    expandedItems: multiExpandedItems,
    handleToggleExpanded: handleMultiToggleExpanded,
    handleExpandAll: handleMultiExpandAll,
    handleCollapseAll: handleMultiCollapseAll,
  } = useRecipeTreeExpansion(multiTreeSelectedItem, recipes);

  // Calculate base requirements based on mode
  const baseRequirements =
    mode === "single" && selectedItem
      ? getBaseRequirements(selectedItem, recipes, multiplier)
      : mode === "multi"
        ? getCombinedBaseRequirements(itemList, recipes, items)
        : {};

  const totalMaterials = Object.keys(baseRequirements).length;

  // Calculate forge time based on mode
  const totalForgeTime =
    mode === "single" && selectedItem
      ? getTotalForgeTime(selectedItem, recipes, multiplier, new Set(), {
          forgeSlots: settings.forgeSlots,
          useMultipleSlots: settings.useMultipleSlots,
          quickForgeLevel: settings.quickForgeLevel,
        })
      : mode === "multi"
        ? getCombinedForgeTime(itemList, recipes, {
            forgeSlots: settings.forgeSlots,
            useMultipleSlots: settings.useMultipleSlots,
            quickForgeLevel: settings.quickForgeLevel,
          })
        : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <HeaderBar />

      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-24 h-[calc(100vh-230px)]">
        {/* Left column: Search and Settings */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-6">
          {/* Mode Switcher */}
          <ModeSwitcher mode={mode} onSwitch={handleModeSwitch} />

          {/* Single Item Mode */}
          {mode === "single" && (
            <SingleItemPanel
              selectedItem={selectedItem}
              searchValue={searchValue}
              multiplier={multiplier}
              onSearchChange={setSearchValue}
              onSelectItem={setSelectedItem}
              onMultiplierChange={setMultiplier}
              onClear={() => {
                setSelectedItem(null);
                setMultiplier(1);
                setSearchValue("");
              }}
              recipeState={{
                recipes: getRecipeState(),
                forgeSettings: {
                  forgeSlots: settings.forgeSlots,
                  useMultipleSlots: settings.useMultipleSlots,
                  quickForgeLevel: settings.quickForgeLevel,
                },
              }}
            />
          )}

          {/* Multi Item Mode */}
          {mode === "multi" && (
            <MultiItemPanel
              itemList={itemList}
              onItemsChange={setItemList}
              recipes={recipes}
              itemsData={items}
              selectedItemId={multiTreeSelectedItem}
              onItemClick={setMultiTreeSelectedItem}
              recipeState={{
                recipes: getRecipeState(),
                forgeSettings: {
                  forgeSlots: settings.forgeSlots,
                  useMultipleSlots: settings.useMultipleSlots,
                  quickForgeLevel: settings.quickForgeLevel,
                },
              }}
            />
          )}
        </div>

        {/* Right column: Main content */}
        {/* Right Column - Results */}
        <div className="flex-1 min-w-0 flex flex-col">
          {(mode === "single" && selectedItem) ||
          (mode === "multi" && itemList.length > 0) ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Summary Cards Row */}
              {mode === "single" && selectedItem ? (
                <RecipeSummaryCards
                  selectedItem={selectedItem}
                  multiplier={multiplier}
                  totalMaterials={totalMaterials}
                  totalForgeTime={totalForgeTime}
                  forgeSlots={settings.forgeSlots}
                  useMultipleSlots={settings.useMultipleSlots}
                  recipes={recipes}
                  items={items}
                />
              ) : (
                <CombinedSummaryCards
                  itemListCount={itemList.length}
                  totalItemQuantity={itemList.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  )}
                  totalMaterials={totalMaterials}
                  totalForgeTimeSeconds={totalForgeTime}
                  forgeSlots={settings.forgeSlots}
                />
              )}

              {/* Crafting Tree - Single mode */}
              {mode === "single" && selectedItem && (
                <CraftingTreeSingle
                  selectedItem={selectedItem}
                  expandedItems={expandedItems}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                  onToggleExpanded={handleToggleExpanded}
                  multiplier={multiplier}
                  recipes={recipes}
                  itemsData={items}
                  forgeSettings={{
                    forgeSlots: settings.forgeSlots,
                    useMultipleSlots: settings.useMultipleSlots,
                    quickForgeLevel: settings.quickForgeLevel,
                  }}
                />
              )}

              {/* Crafting Tree - Multi mode */}
              {mode === "multi" && multiTreeSelectedItem && (
                <CraftingTreeMulti
                  selectedItemId={multiTreeSelectedItem}
                  itemList={itemList}
                  expandedItems={multiExpandedItems}
                  onExpandAll={handleMultiExpandAll}
                  onCollapseAll={handleMultiCollapseAll}
                  onToggleExpanded={handleMultiToggleExpanded}
                  onClose={() => setMultiTreeSelectedItem(null)}
                  recipes={recipes}
                  itemsData={items}
                  forgeSettings={{
                    forgeSlots: settings.forgeSlots,
                    useMultipleSlots: settings.useMultipleSlots,
                    quickForgeLevel: settings.quickForgeLevel,
                  }}
                />
              )}

              {/* Materials List */}
              {mode === "single" && selectedItem ? (
                <Card className="flex-1 flex flex-col mb-20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Clipboard className="w-5 h-5" />
                      Materials Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <BaseRequirementsList
                      internalname={selectedItem}
                      recipes={recipes}
                      multiplier={multiplier}
                      itemsData={items}
                    />
                  </CardContent>
                </Card>
              ) : (
                <CombinedMaterialsList
                  baseRequirements={baseRequirements}
                  recipes={recipes}
                  itemsData={items}
                />
              )}
            </div>
          ) : (
            <Card className="text-center flex-1 flex flex-col justify-center">
              <CardContent>
                <div className="mb-4">
                  {mode === "single" ? (
                    <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                  ) : (
                    <List className="w-16 h-16 mx-auto text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  {mode === "single" ? "No Item Selected" : "No Items Added"}
                </h3>
                <p className="text-muted-foreground">
                  {mode === "single"
                    ? "Search and select an item to view its crafting requirements."
                    : "Add items to your list to calculate combined material requirements."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 backdrop-blur-sm fixed bottom-0 w-full">
        <div className="px-4 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            made with{" "}
            <Heart className="w-4 h-4 inline text-red-500 fill-current" /> by{" "}
            <span className="font-semibold text-foreground">hexeption</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
