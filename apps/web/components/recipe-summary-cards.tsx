"use client";

import type React from "react";
import { useEffect } from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackRecipeSummaryView } from "@/lib/analytics";
import { formatForgeTime } from "@/lib/forge-time-utils";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

interface RecipeSummaryCardsProps {
  selectedItem: string;
  multiplier: number;
  totalMaterials: number;
  totalForgeTime: number;
  forgeSlots: number;
  useMultipleSlots: boolean;
}

function StatBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 rounded-lg bg-card/60 border border-border/40">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-semibold text-foreground truncate">{children}</div>
    </div>
  );
}

export function RecipeSummaryCards({
  selectedItem,
  multiplier,
  totalMaterials,
  totalForgeTime,
  forgeSlots,
  useMultipleSlots,
}: RecipeSummaryCardsProps) {
  const { recipes, itemsData } = useRecipeData();
  const displayName = getDisplayName(
    recipes[selectedItem],
    selectedItem,
    itemsData,
  );
  const plainDisplayName = displayName.replace(/§./g, "");
  const forgeSlotText = useMultipleSlots ? "parallel" : "";
  const forgeTimeSubtitle = useMultipleSlots
    ? `${forgeSlots} slots`
    : "";

  useEffect(() => {
    trackRecipeSummaryView(
      selectedItem,
      displayName,
      multiplier,
      totalMaterials,
      totalForgeTime,
      forgeSlots,
      useMultipleSlots,
    );
  }, [
    selectedItem,
    multiplier,
    totalMaterials,
    totalForgeTime,
    forgeSlots,
    useMultipleSlots,
    displayName,
  ]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <StatBlock label="Item">
        <MinecraftColoredText text={displayName} title={plainDisplayName} />
      </StatBlock>
      <StatBlock label="Qty">
        <span className="font-mono text-primary">{multiplier.toLocaleString()}</span>
      </StatBlock>
      <StatBlock label="Materials">
        <span className="font-mono">{totalMaterials}</span>
      </StatBlock>
      <StatBlock label="Slots">
        <span className="font-mono">{forgeSlots}</span>
        {forgeSlotText && <span className="text-xs text-muted-foreground ml-1">({forgeSlotText})</span>}
      </StatBlock>
      {totalForgeTime > 0 && (
        <StatBlock label={`Forge Time${forgeTimeSubtitle ? ` (${forgeTimeSubtitle})` : ""}`}>
          <span className="font-mono text-amber-600 dark:text-amber-500">{formatForgeTime(totalForgeTime)}</span>
        </StatBlock>
      )}
    </div>
  );
}
