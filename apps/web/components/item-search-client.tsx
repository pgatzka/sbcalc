"use client";

import React, { useState, useEffect } from "react";
import {
  Github,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Settings,
  Wrench,
  Clipboard,
  Heart,
  List,
  History,
} from "lucide-react";
import { ItemSearch } from "@/components/item-search";
import { ItemListManager } from "@/components/item-list-manager";
import { ItemImage } from "@/components/item-image";
import { RecipeTree } from "@/components/recipe-tree";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import { ForgeSettings } from "@/components/forge-settings";
import { RecipeSummaryCards } from "@/components/recipe-summary-cards";
import { ShareRecipeDialog } from "@/components/share-recipe-dialog";
import Link from "next/link";
import { HeaderBar } from "@/components/header-bar";
import { ModeSwitcher } from "@/components/mode-switcher";
import { SingleItemPanel } from "@/components/single-item-panel";
import { MultiItemPanel } from "@/components/multi-item-panel";
import { CombinedSummaryCards } from "@/components/combined-summary-cards";
import { CraftingTreeSingle } from "@/components/crafting-tree-single";
import { CraftingTreeMulti } from "@/components/crafting-tree-multi";
import { CombinedMaterialsList } from "@/components/combined-materials-list";
import type { RecipesData } from "@/lib/types";
import { useRecipeState } from "@/hooks/use-recipe-state";
import { getTotalForgeTime, getCombinedForgeTime } from "@/lib/forge-time-utils";
import { useSettings } from "@/lib/settings-context";
import { useRecipeTreeExpansion } from "@/hooks/use-recipe-tree-expansion";
import { useSharedRecipe } from "@/hooks/use-shared-recipe";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card";
import { getBaseRequirements, getCombinedBaseRequirements } from "@/lib/recipe-utils";
import recipesRaw from "@/data/recipes_items.json";
import itemsRaw from "@/data/items.json";

const recipes: RecipesData = recipesRaw as any;
const items: RecipesData = itemsRaw as any;

export function SkyblockCalculatorClient() {
  ient() {
    const {
      mode,
      setMode,
      selectedItem,
      setSelectedItem,
      multiplier,
      setMultiplier,
      itemList,
      setItemList,
      handleModeSwitch,
      getRecipeState,
    } = useRecipeState();

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
            recipeEntries.map(([itemId, quantity]) => ({ itemId, quantity }))
          );
        }

        // Apply shared forge settings
        updateSettings(sharedState.forgeSettings);
        setHasLoadedSharedRecipe(true);
      }
    }, [sharedState, hasLoadedSharedRecipe, updateSettings]);

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

    const handleModeSwitch = (newMode: "single" | "multi") => {
      setMode(newMode);
      if (newMode === "single") {
        setItemList([]);
        setMultiTreeSelectedItem(null);
      } else {
        setSelectedItem(null);
        setMultiplier(1);
        setSearchValue("");
      }
    };

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
                    totalItemQuantity={itemList.reduce((sum, item) => sum + item.quantity, 0)}
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
