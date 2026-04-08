"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Clipboard, Heart, List, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useCalculatorResults } from "@/hooks/use-calculator-results";
import { useMultiTreeSelection } from "@/hooks/use-multi-tree-selection";
import { useRecipeState } from "@/hooks/use-recipe-state";
import { useRecipeTreeExpansion } from "@/hooks/use-recipe-tree-expansion";
import { useSharedRecipe } from "@/hooks/use-shared-recipe";
import { useSharedRecipeLoader } from "@/hooks/use-shared-recipe-loader";
import { useRecipeData } from "@/lib/recipe-data-context";
import { useSettings } from "@/lib/settings-context";
import { getDisplayName } from "@/lib/utils";

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
    handleModeSwitch,
    getRecipeState,
  } = useRecipeState();

  const { recipes, itemsData } = useRecipeData();
  const { settings, updateSettings } = useSettings();
  const { sharedState } = useSharedRecipe();

  const [searchValue, setSearchValue] = useState<string>("");
  const [materialDepth, setMaterialDepth] = useState<number>(
    Number.POSITIVE_INFINITY,
  );

  // Load shared recipe
  const loaderActions = useMemo(
    () => ({
      setMode,
      setSelectedItem,
      setMultiplier,
      setItemList,
      updateSettings,
    }),
    [setMode, setSelectedItem, setMultiplier, setItemList, updateSettings],
  );
  useSharedRecipeLoader(sharedState, loaderActions);

  // Sync search value with selected item
  useEffect(() => {
    if (selectedItem && mode === "single") {
      const item = recipes[selectedItem];
      if (item) {
        const displayNameColored = getDisplayName(
          item,
          selectedItem,
          itemsData,
        );
        setSearchValue(displayNameColored.replace(/§./g, ""));
      }
    }
  }, [selectedItem, mode, recipes, itemsData]);

  // Multi-tree selection management
  const { multiTreeSelectedItem, setMultiTreeSelectedItem } =
    useMultiTreeSelection(mode, itemList);

  // Tree expansion
  const {
    expandedItems,
    handleToggleExpanded,
    handleExpandAll,
    handleCollapseAll,
  } = useRecipeTreeExpansion(selectedItem);

  const {
    expandedItems: multiExpandedItems,
    handleToggleExpanded: handleMultiToggleExpanded,
    handleExpandAll: handleMultiExpandAll,
    handleCollapseAll: handleMultiCollapseAll,
  } = useRecipeTreeExpansion(multiTreeSelectedItem);

  // Calculator results
  const forgeSettings = useMemo(
    () => ({
      forgeSlots: settings.forgeSlots,
      useMultipleSlots: settings.useMultipleSlots,
      quickForgeLevel: settings.quickForgeLevel,
    }),
    [settings.forgeSlots, settings.useMultipleSlots, settings.quickForgeLevel],
  );

  const { baseRequirements, totalMaterials, totalForgeTime } =
    useCalculatorResults(
      mode,
      selectedItem,
      multiplier,
      itemList,
      forgeSettings,
      materialDepth,
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeaderBar />

      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-24 h-[calc(100vh-230px)]">
        {/* Left column: Search and Settings */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-6">
          <ModeSwitcher mode={mode} onSwitch={handleModeSwitch} />

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
                forgeSettings,
              }}
            />
          )}

          {mode === "multi" && (
            <MultiItemPanel
              itemList={itemList}
              onItemsChange={setItemList}
              selectedItemId={multiTreeSelectedItem}
              onItemClick={setMultiTreeSelectedItem}
              recipeState={{
                recipes: getRecipeState(),
                forgeSettings,
              }}
            />
          )}
        </div>

        {/* Right column: Results */}
        <div className="flex-1 min-w-0 flex flex-col">
          {(mode === "single" && selectedItem) ||
          (mode === "multi" && itemList.length > 0) ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {mode === "single" && selectedItem ? (
                <RecipeSummaryCards
                  selectedItem={selectedItem}
                  multiplier={multiplier}
                  totalMaterials={totalMaterials}
                  totalForgeTime={totalForgeTime}
                  forgeSlots={settings.forgeSlots}
                  useMultipleSlots={settings.useMultipleSlots}
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

              {mode === "single" && selectedItem && (
                <CraftingTreeSingle
                  selectedItem={selectedItem}
                  expandedItems={expandedItems}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                  onToggleExpanded={handleToggleExpanded}
                  multiplier={multiplier}
                  forgeSettings={forgeSettings}
                />
              )}

              {mode === "multi" && multiTreeSelectedItem && (
                <CraftingTreeMulti
                  selectedItemId={multiTreeSelectedItem}
                  itemList={itemList}
                  expandedItems={multiExpandedItems}
                  onExpandAll={handleMultiExpandAll}
                  onCollapseAll={handleMultiCollapseAll}
                  onToggleExpanded={handleMultiToggleExpanded}
                  onClose={() => setMultiTreeSelectedItem(null)}
                  forgeSettings={forgeSettings}
                />
              )}

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
                      multiplier={multiplier}
                    />
                  </CardContent>
                </Card>
              ) : (
                <CombinedMaterialsList
                  baseRequirements={baseRequirements}
                  materialDepth={materialDepth}
                  onMaterialDepthChange={setMaterialDepth}
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
