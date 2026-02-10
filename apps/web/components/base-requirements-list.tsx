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
}

export function BaseRequirementsList({
  internalname,
  multiplier,
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

  // Sort by quantity descending
  const sortedRequirements = Object.entries(baseRequirements).sort(
    ([, a], [, b]) => b - a,
  );

  // Track base requirements view
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
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p>No base materials required</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRequirements.map(([name, count]) => {
        const entry = recipes[name];
        const displayName = getDisplayName(entry, name, itemsData);
        const plainDisplayName = displayName.replace(/§./g, "");

        return (
          <div
            key={name}
            className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-border/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ItemImage
                entry={entry}
                internalname={name}
                alt={plainDisplayName}
                width={32}
                height={32}
                style={{ verticalAlign: "middle" }}
              />
              <div>
                <MinecraftColoredText
                  text={displayName}
                  className="font-medium text-foreground block"
                  title={plainDisplayName}
                />
                <div className="text-xs text-muted-foreground">{name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                ×{count.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">needed</div>
            </div>
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            Total Materials
          </div>
          <div className="text-2xl font-bold text-primary">
            {sortedRequirements.length} types
          </div>
        </div>
      </div>
    </div>
  );
}
