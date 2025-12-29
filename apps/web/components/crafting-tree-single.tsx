"use client";

import { Button } from "@workspace/ui/components/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@workspace/ui/components/card";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { RecipeTree } from "@/components/recipe-tree";
import type { RecipesData } from "@/lib/types";

export function CraftingTreeSingle(props: {
    selectedItem: string;
    expandedItems: Set<string>;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onToggleExpanded: (id: string) => void;
    multiplier: number;
    recipes: RecipesData;
    itemsData: RecipesData;
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
        recipes,
        itemsData,
        forgeSettings,
    } = props;

    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <Wrench className="w-5 h-5" />
                        Crafting Tree
                    </CardTitle>
                    <div className="flex gap-2">
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
                        internalname={selectedItem}
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
