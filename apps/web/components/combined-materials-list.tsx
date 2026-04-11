"use client";

import { Clipboard, Layers, Pickaxe } from "lucide-react";
import { ItemImage } from "@/components/item-image";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

export function CombinedMaterialsList(props: {
  baseRequirements: Record<string, number>;
  materialDepth: number;
  onMaterialDepthChange: (depth: number) => void;
  checkedItems?: Set<string>;
}) {
  const {
    baseRequirements,
    materialDepth,
    onMaterialDepthChange,
    checkedItems,
  } = props;
  const { recipes, itemsData } = useRecipeData();

  const isBase = !Number.isFinite(materialDepth);

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Combined Materials</h3>
        </div>
        <div className="flex rounded-md bg-muted/60 p-0.5 border border-border/40">
          <button
            type="button"
            onClick={() => onMaterialDepthChange(1)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              !isBase
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3 h-3" />
            Crafting
          </button>
          <button
            type="button"
            onClick={() => onMaterialDepthChange(Number.POSITIVE_INFINITY)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              isBase
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pickaxe className="w-3 h-3" />
            Raw
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {Object.entries(baseRequirements)
            .filter(([name]) => !checkedItems?.has(name))
            .sort(([, a], [, b]) => b - a)
            .map(([materialName, count]) => {
              const entry = recipes[materialName] || itemsData[materialName];
              const displayName = entry
                ? getDisplayName(entry, materialName, itemsData)
                : materialName;
              const plainDisplayName = displayName.replace(/§./g, "");
              return (
                <div
                  key={materialName}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <ItemImage
                    entry={entry}
                    internalname={materialName}
                    alt={plainDisplayName}
                    width={24}
                    height={24}
                  />
                  <div className="flex-1 min-w-0">
                    <MinecraftColoredText
                      text={displayName}
                      className="text-sm font-medium truncate block"
                      title={plainDisplayName}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-primary flex-shrink-0">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
