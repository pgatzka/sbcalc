"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { RecipeTree } from "@/components/recipe-tree";

export function CraftingTreeSingle(props: {
  selectedItem: string;
  expandedItems: Set<string>;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleExpanded: (id: string) => void;
  multiplier: number;
  forgeSettings: {
    forgeSlots: number;
    useMultipleSlots: boolean;
    quickForgeLevel: number;
  };
}) {
  const {
    selectedItem,
    expandedItems,
    onExpandAll,
    onCollapseAll,
    onToggleExpanded,
    multiplier,
    forgeSettings,
  } = props;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Crafting Tree</h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1" />
            Expand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="w-3.5 h-3.5 mr-1" />
            Collapse
          </Button>
        </div>
      </div>
      <div className="p-4 overflow-auto">
        <RecipeTree
          internalname={selectedItem}
          multiplier={multiplier}
          expandedItems={expandedItems}
          onToggleExpanded={onToggleExpanded}
          forgeSettings={forgeSettings}
        />
      </div>
    </div>
  );
}
