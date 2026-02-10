"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ChevronDown, ChevronUp, Wrench, X } from "lucide-react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { RecipeTree } from "@/components/recipe-tree";
import { useSettings } from "@/lib/settings-context";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";

export function CraftingTreeMulti(props: {
  selectedItemId: string;
  itemList: { itemId: string; quantity: number }[];
  expandedItems: Set<string>;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleExpanded: (id: string) => void;
  onClose: () => void;
  recipes: RecipesData;
  itemsData: RecipesData;
  forgeSettings: {
    forgeSlots: number;
    useMultipleSlots: boolean;
    quickForgeLevel: number;
  };
}) {
  const {
    selectedItemId,
    itemList,
    expandedItems,
    onExpandAll,
    onCollapseAll,
    onToggleExpanded,
    onClose,
    recipes,
    itemsData,
    forgeSettings,
  } = props;

  const { settings } = useSettings();

  const multiplier =
    itemList.find((i) => i.itemId === selectedItemId)?.quantity || 1;
  const displayName = getDisplayName(
    recipes[selectedItemId],
    selectedItemId,
    itemsData,
  );
  const plainDisplayName = displayName.replace(/§./g, "");

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Wrench className="w-5 h-5" />
            <span>Crafting Tree - </span>
            <MinecraftColoredText
              text={displayName}
              title={plainDisplayName}
              enabled={settings.enableColoredNames}
            />
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              title="Close tree view"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onExpandAll}>
              <ChevronDown className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Expand All</span>
              <span className="sm:hidden">Expand</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onCollapseAll}>
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
            internalname={selectedItemId}
            recipes={recipes}
            multiplier={multiplier}
            itemsData={itemsData}
            expandedItems={expandedItems}
            onToggleExpanded={onToggleExpanded}
            forgeSettings={forgeSettings}
          />
        </div>
      </CardContent>
    </Card>
  );
}
