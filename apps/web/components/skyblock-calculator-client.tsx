"use client";

import { Clipboard, Heart, Package, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BaseRequirementsList } from "@/components/base-requirements-list";
import { CombinedMaterialsList } from "@/components/combined-materials-list";
import { CombinedSummaryCards } from "@/components/combined-summary-cards";
import { CraftingFlowSingle } from "@/components/crafting-flow-single";
import { CraftingTreeMulti } from "@/components/crafting-tree-multi";
import { CraftingTreeSingle } from "@/components/crafting-tree-single";
import { HeaderBar } from "@/components/header-bar";
import { ModeSwitcher } from "@/components/mode-switcher";
import { MultiItemPanel } from "@/components/multi-item-panel";
import { RecipeSummaryCards } from "@/components/recipe-summary-cards";
import { SingleItemPanel } from "@/components/single-item-panel";
import { type CraftView, ViewToggle } from "@/components/view-toggle";
import { useCalculatorResults } from "@/hooks/use-calculator-results";
import { useRecipeTreeExpansion } from "@/hooks/use-recipe-tree-expansion";
import { useSharedRecipe } from "@/hooks/use-shared-recipe";
import { useSharedRecipeLoader } from "@/hooks/use-shared-recipe-loader";
import { useCalculatorStore } from "@/lib/calculator-store";
import { BASE_MATERIALS, PATH_DELIM } from "@/lib/constants";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  aggregateIngredients,
  getIngredientsFromRecipe,
  getRecipe,
} from "@/lib/recipe-utils";
import type { ForgeRecipe } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";

export function SkyblockCalculatorClient() {
  const {
    mode,
    setMode,
    selectedItem,
    setSelectedItem,
    multiplier,
    setMultiplier,
    searchValue,
    setSearchValue,
    itemList,
    setItemList,
    multiTreeSelectedItem,
    setMultiTreeSelectedItem,
    materialDepth,
    setMaterialDepth,
    settings,
    updateSettings,
    handleModeSwitch,
    getRecipeState,
    hydrate,
    todoMode,
    checkedItems,
    toggleTodoMode,
    toggleChecked,
    setCheckedCount,
    setItemCheckedCount,
    setPathsChecked,
  } = useCalculatorStore();

  const { recipes, itemsData } = useRecipeData();
  const { sharedState } = useSharedRecipe();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
  }, [selectedItem, mode, recipes, itemsData, setSearchValue]);

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
      todoMode ? checkedItems : undefined,
    );

  const hasResults =
    (mode === "single" && selectedItem) ||
    (mode === "multi" && itemList.length > 0);

  const handleToggleChecked = useCallback(
    (path: string, internalname: string, needed: number) => {
      // Collect every descendant within this node's own subtree along with its
      // own needed quantity, mirroring the tree's branch-local `visited` cycle
      // guard AND its multiplier math (forge count = 1, crafting = recipe.count)
      // so the cascade writes the same per-node needed the tree displays.
      const collectDescendants = (
        name: string,
        basePath: string,
        baseNeeded: number,
        visited: Set<string>,
      ): Array<{ path: string; needed: number }> => {
        const entry = recipes[name];
        const recipe = entry ? getRecipe(entry) : undefined;
        if (!recipe || BASE_MATERIALS.has(name)) return [];

        const isForge = (recipe as ForgeRecipe).type === "forge";
        const recipeCount = !isForge
          ? Number((recipe as Record<string, string | number>).count) || 1
          : 1;
        const actualMultiplier = Math.ceil(baseNeeded / recipeCount);

        const counts = aggregateIngredients(getIngredientsFromRecipe(recipe));
        const result: Array<{ path: string; needed: number }> = [];
        for (const [child, count] of Object.entries(counts)) {
          if (visited.has(child)) continue;
          const childPath = `${basePath}${PATH_DELIM}${child}`;
          const childNeeded = count * actualMultiplier;
          result.push({ path: childPath, needed: childNeeded });
          result.push(
            ...collectDescendants(
              child,
              childPath,
              childNeeded,
              new Set(visited).add(child),
            ),
          );
        }
        return result;
      };

      // The path is the chain of ancestor names; use it to seed the cycle guard.
      const ancestorNames = new Set(path.split(PATH_DELIM));
      toggleChecked(
        path,
        needed,
        collectDescendants(internalname, path, needed, ancestorNames),
      );
    },
    [recipes, toggleChecked],
  );

  const handleSetCheckedCount = useCallback(
    (path: string, count: number) => setCheckedCount(path, count),
    [setCheckedCount],
  );

  const handleSetItemCheckedCount = useCallback(
    (paths: Array<{ path: string; needed: number }>, totalCount: number) =>
      setItemCheckedCount(paths, totalCount),
    [setItemCheckedCount],
  );

  const handleSetPathsChecked = useCallback(
    (paths: Array<{ path: string; needed: number }>, checked: boolean) =>
      setPathsChecked(paths, checked),
    [setPathsChecked],
  );

  const [craftView, setCraftView] = useState<CraftView>("tree");

  const [sidebarWidth, setSidebarWidth] = useState(340);
  const isResizing = useRef(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = Math.min(
          Math.max(startWidth + ev.clientX - startX, 260),
          600,
        );
        setSidebarWidth(newWidth);
      };

      const onMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth],
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <HeaderBar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside
          className="sidebar-panel shrink-0 border-b md:border-b-0 md:border-r border-border/60 bg-card/30 overflow-y-auto overflow-x-hidden"
          style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
        >
          <div className="p-4 space-y-4">
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
        </aside>

        {/* Resize handle */}
        <div
          className="hidden md:flex w-1.5 cursor-col-resize items-center justify-center hover:bg-border/40 active:bg-border/60 transition-colors shrink-0"
          onMouseDown={handleResizeStart}
        >
          <div className="w-px h-8 bg-border/60 rounded-full" />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {hasResults ? (
            <div className="p-4 md:p-6 space-y-5">
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
                <div className="space-y-3">
                  <ViewToggle view={craftView} onChange={setCraftView} />
                  {craftView === "tree" ? (
                    <CraftingTreeSingle
                      selectedItem={selectedItem}
                      expandedItems={expandedItems}
                      onExpandAll={handleExpandAll}
                      onCollapseAll={handleCollapseAll}
                      onToggleExpanded={handleToggleExpanded}
                      multiplier={multiplier}
                      forgeSettings={forgeSettings}
                      todoMode={todoMode}
                      onToggleTodoMode={toggleTodoMode}
                      checkedItems={checkedItems}
                      onToggleChecked={handleToggleChecked}
                      onSetCheckedCount={handleSetCheckedCount}
                    />
                  ) : (
                    <CraftingFlowSingle
                      selectedItem={selectedItem}
                      multiplier={multiplier}
                      checkedItems={todoMode ? checkedItems : undefined}
                    />
                  )}
                </div>
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
                  todoMode={todoMode}
                  onToggleTodoMode={toggleTodoMode}
                  checkedItems={checkedItems}
                  onToggleChecked={handleToggleChecked}
                  onSetCheckedCount={handleSetCheckedCount}
                />
              )}

              {mode === "single" && selectedItem ? (
                <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                    <Clipboard className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Materials Needed</h3>
                  </div>
                  <div className="p-5">
                    <BaseRequirementsList
                      internalname={selectedItem}
                      multiplier={multiplier}
                      todoMode={todoMode}
                      checkedItems={checkedItems}
                      onSetItemCheckedCount={handleSetItemCheckedCount}
                      onSetPathsChecked={handleSetPathsChecked}
                    />
                  </div>
                </div>
              ) : (
                <CombinedMaterialsList
                  baseRequirements={baseRequirements}
                  materialDepth={materialDepth}
                  onMaterialDepthChange={setMaterialDepth}
                  todoMode={todoMode}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-sm mx-auto px-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {mode === "single" ? (
                    <Search className="w-7 h-7 text-primary/60" />
                  ) : (
                    <Package className="w-7 h-7 text-primary/60" />
                  )}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {mode === "single"
                    ? "Search for an item"
                    : "Add items to begin"}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {mode === "single"
                    ? "Select an item from the search to view its full crafting tree and material requirements."
                    : "Add items to your list to calculate combined materials across multiple recipes."}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border/40 bg-card/40 backdrop-blur-sm py-3">
        <p className="text-muted-foreground text-xs text-center">
          made with{" "}
          <Heart className="w-3 h-3 inline text-red-500 fill-current" /> by{" "}
          <span className="font-medium text-foreground">hexeption</span>
        </p>
      </footer>
    </div>
  );
}
