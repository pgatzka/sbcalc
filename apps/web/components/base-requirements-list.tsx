"use client";

import { Package } from "lucide-react";
import { useEffect } from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackBaseRequirementsView } from "@/lib/analytics";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getBaseRequirements } from "@/lib/recipe-utils";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface BaseRequirementsListProps {
  internalname: string;
  multiplier: number;
  checkedItems?: Set<string>;
}

export function BaseRequirementsList({
  internalname,
  multiplier,
  checkedItems,
}: BaseRequirementsListProps) {
  const { recipes, itemsData } = useRecipeData();
  const baseRequirements = getBaseRequirements(
    internalname,
    recipes,
    multiplier,
    {},
    new Set(),
    itemsData,
  );

  const sortedRequirements = Object.entries(baseRequirements)
    .filter(([name]) => !checkedItems?.has(name))
    .sort(([, a], [, b]) => b - a);

  useEffect(() => {
    if (sortedRequirements.length > 0) {
      trackBaseRequirementsView(
        internalname,
        sortedRequirements.length,
        multiplier,
      );
    }
  }, [internalname, sortedRequirements.length, multiplier]);

  if (sortedRequirements.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No base materials required</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedRequirements.map(([name, count]) => {
        const entry = recipes[name];
        const displayName = getDisplayName(entry, name, itemsData);
        const plainDisplayName = displayName.replace(/§./g, "");

        return (
          <div
            key={name}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
          >
            <ItemImage
              entry={entry}
              internalname={name}
              alt={plainDisplayName}
              width={24}
              height={24}
              style={{ verticalAlign: "middle" }}
            />
            <div className="flex-1 min-w-0">
              <MinecraftColoredText
                text={displayName}
                className="text-sm font-medium text-foreground block truncate"
                title={plainDisplayName}
              />
              <div className="text-[10px] text-muted-foreground font-mono">
                {name}
              </div>
            </div>
            <span className="font-mono text-sm font-semibold text-primary">
              {count.toLocaleString()}
            </span>
          </div>
        );
      })}

      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between px-3">
        <span className="text-xs text-muted-foreground">Total types</span>
        <span className="font-mono text-sm font-bold text-primary">
          {sortedRequirements.length}
        </span>
      </div>
    </div>
  );
}
