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
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";
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

export interface ItemListEntry {
  itemId: string;
  quantity: number;
}

export function ItemSearchClient() {
  const [mode, setMode] = useLocalStorage<"single" | "multi">("sbcalc_mode", "single");
  const [selectedItem, setSelectedItem] = useLocalStorage<string | null>("sbcalc_selectedItem", null);
  const [multiplier, setMultiplier] = useLocalStorage<number>("sbcalc_multiplier", 1);
  const [itemList, setItemList] = useLocalStorage<ItemListEntry[]>("sbcalc_itemList", []);
  const [searchValue, setSearchValue] = useState<string>("");
  const [hasLoadedSharedRecipe, setHasLoadedSharedRecipe] = useState(false);
  const [multiTreeSelectedItem, setMultiTreeSelectedItem] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const { sharedState, clearSharedState, hasSharedRecipe } = useSharedRecipe();

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

  // Get recipe state for sharing
  const getRecipeState = () => {
    if (mode === "single" && selectedItem) {
      return { [selectedItem]: multiplier };
    } else if (mode === "multi") {
      return Object.fromEntries(
        itemList.map((item) => [item.itemId, item.quantity])
      );
    }
    return {};
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="text-center py-8 px-4 relative">
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/changelog" title="View Changelog" className="flex items-center gap-2">
                <History className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Changelog</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/Hexeption/sbcalc"
                target="_blank"
                rel="noopener noreferrer"
                title="View on GitHub"
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
          Skyblock Calculator
        </h1>
        <p className="text-muted-foreground text-lg">
          Calculate crafting recipes, forge times, and base material
          requirements for any Hypixel Skyblock item.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-24 h-[calc(100vh-230px)]">
        {/* Left column: Search and Settings */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-6">
          {/* Mode Switcher */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={mode === "single" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeSwitch("single")}
                  className="flex-1"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Single Item
                </Button>
                <Button
                  variant={mode === "multi" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeSwitch("multi")}
                  className="flex-1"
                >
                  <List className="w-4 h-4 mr-2" />
                  Multi Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Single Item Mode */}
          {mode === "single" && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Search className="w-5 h-5" />
                      Search Items
                    </CardTitle>
                    {selectedItem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(null);
                          setMultiplier(1);
                          setSearchValue("");
                        }}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                        title="Clear selection"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ItemSearch
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    onSelect={(item) => {
                      setSelectedItem(item);
                      setMultiplier(1);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Amount Controls */}
              {selectedItem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Settings className="w-5 h-5" />
                      Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="quantity"
                          className="text-muted-foreground mb-2 block"
                        >
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={1}
                          value={multiplier}
                          onChange={(e) =>
                            setMultiplier(Math.max(1, Number(e.target.value)))
                          }
                        />
                      </div>

                      {/* Forge Settings */}
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          Forge Settings
                        </h4>
                        <ForgeSettings />
                      </div>

                      {/* Share Recipe */}
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          Share Recipe
                        </h4>
                        <ShareRecipeDialog
                          recipeState={{
                            recipes: getRecipeState(),
                            forgeSettings: {
                              forgeSlots: settings.forgeSlots,
                              useMultipleSlots: settings.useMultipleSlots,
                              quickForgeLevel: settings.quickForgeLevel,
                            },
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Multi Item Mode */}
          {mode === "multi" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <List className="w-5 h-5" />
                  Item List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemListManager
                  items={itemList}
                  onItemsChange={setItemList}
                  recipes={recipes}
                  itemsData={items}
                  selectedItemId={multiTreeSelectedItem}
                  onItemClick={setMultiTreeSelectedItem}
                />

                {/* Forge Settings for Multi Mode */}
                {itemList.length > 0 && (
                  <>
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Forge Settings
                      </h4>
                      <ForgeSettings />
                    </div>

                    {/* Share Recipe */}
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Share Recipe
                      </h4>
                      <ShareRecipeDialog
                        recipeState={{
                          recipes: getRecipeState(),
                          forgeSettings: {
                            forgeSlots: settings.forgeSlots,
                            useMultipleSlots: settings.useMultipleSlots,
                            quickForgeLevel: settings.quickForgeLevel,
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {itemList.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Across {itemList.length} types
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Base Materials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalMaterials}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Unique materials needed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Forge Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(() => {
                          const seconds = totalForgeTime;
                          if (seconds < 60) return `${seconds}s`;
                          if (seconds < 3600)
                            return `${Math.floor(seconds / 60)}m`;
                          if (seconds < 86400)
                            return `${Math.floor(seconds / 3600)}h`;
                          return `${Math.floor(seconds / 86400)}d`;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        With {settings.forgeSlots} slot
                        {settings.forgeSlots > 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Crafting Tree - Single mode */}
              {mode === "single" && selectedItem && (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Wrench className="w-5 h-5" />
                        Crafting Tree
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExpandAll}
                        >
                          <ChevronDown className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Expand All</span>
                          <span className="sm:hidden">Expand</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCollapseAll}
                        >
                          <ChevronUp className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Collapse All</span>
                          <span className="sm:hidden">Collapse</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="bg-muted/80 rounded-xl p-6 border border-border/50 flex-1 overflow-auto">
                      <RecipeTree
                        internalname={selectedItem}
                        recipes={recipes}
                        multiplier={multiplier}
                        itemsData={items}
                        expandedItems={expandedItems}
                        onToggleExpanded={handleToggleExpanded}
                        forgeSettings={{
                          forgeSlots: settings.forgeSlots,
                          useMultipleSlots: settings.useMultipleSlots,
                          quickForgeLevel: settings.quickForgeLevel,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Crafting Tree - Multi mode */}
              {mode === "multi" && multiTreeSelectedItem && (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Wrench className="w-5 h-5" />
                        Crafting Tree - {getDisplayName(recipes[multiTreeSelectedItem], multiTreeSelectedItem, items)}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMultiTreeSelectedItem(null)}
                          title="Close tree view"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleMultiExpandAll}
                        >
                          <ChevronDown className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Expand All</span>
                          <span className="sm:hidden">Expand</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleMultiCollapseAll}
                        >
                          <ChevronUp className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Collapse All</span>
                          <span className="sm:hidden">Collapse</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="bg-muted/80 rounded-xl p-6 border border-border/50 flex-1 overflow-auto">
                      <RecipeTree
                        internalname={multiTreeSelectedItem}
                        recipes={recipes}
                        multiplier={
                          itemList.find((item) => item.itemId === multiTreeSelectedItem)
                            ?.quantity || 1
                        }
                        itemsData={items}
                        expandedItems={multiExpandedItems}
                        onToggleExpanded={handleMultiToggleExpanded}
                        forgeSettings={{
                          forgeSlots: settings.forgeSlots,
                          useMultipleSlots: settings.useMultipleSlots,
                          quickForgeLevel: settings.quickForgeLevel,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Materials List */}
              <Card className="flex-1 flex flex-col mb-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Clipboard className="w-5 h-5" />
                    {mode === "single"
                      ? "Materials Needed"
                      : "Combined Materials Needed"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {mode === "single" && selectedItem ? (
                    <BaseRequirementsList
                      internalname={selectedItem}
                      recipes={recipes}
                      multiplier={multiplier}
                      itemsData={items}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(baseRequirements)
                        .sort(([, a], [, b]) => b - a)
                        .map(([materialName, count]) => {
                          const entry =
                            recipes[materialName] || items[materialName];
                          const displayName = entry
                            ? getDisplayName(entry, materialName, items)
                            : materialName;
                          return (
                            <div
                              key={materialName}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
                            >
                              <ItemImage
                                entry={entry}
                                internalname={materialName}
                                alt={displayName}
                                width={32}
                                height={32}
                                itemsData={items}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {displayName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {count.toLocaleString()}x
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
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
