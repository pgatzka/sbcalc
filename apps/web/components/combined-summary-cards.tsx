"use client";

import { formatForgeTime } from "@/lib/forge-time-utils";

export function CombinedSummaryCards(props: {
  itemListCount: number;
  totalItemQuantity: number;
  totalMaterials: number;
  totalForgeTimeSeconds: number;
  forgeSlots: number;
}) {
  const {
    itemListCount,
    totalItemQuantity,
    totalMaterials,
    totalForgeTimeSeconds,
    forgeSlots,
  } = props;

  const formattedTime = formatForgeTime(totalForgeTimeSeconds);

  return (
    <div className={`grid grid-cols-2 gap-2 ${totalForgeTimeSeconds > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      <div className="px-4 py-3 rounded-lg bg-card/60 border border-border/40">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Total Items</div>
        <div className="text-lg font-bold font-mono text-foreground">{totalItemQuantity}</div>
        <div className="text-xs text-muted-foreground">{itemListCount} types</div>
      </div>

      <div className="px-4 py-3 rounded-lg bg-card/60 border border-border/40">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Materials</div>
        <div className="text-lg font-bold font-mono text-foreground">{totalMaterials}</div>
        <div className="text-xs text-muted-foreground">unique needed</div>
      </div>

      {totalForgeTimeSeconds > 0 && (
        <div className="px-4 py-3 rounded-lg bg-card/60 border border-border/40">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Forge Time</div>
          <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-500">{formattedTime}</div>
          <div className="text-xs text-muted-foreground">{forgeSlots} slot{forgeSlots > 1 ? "s" : ""}</div>
        </div>
      )}
    </div>
  );
}
