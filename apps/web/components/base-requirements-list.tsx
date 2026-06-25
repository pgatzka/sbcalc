"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Layers, Minus, Package, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackBaseRequirementsView } from "@/lib/analytics";
import { useRecipeData } from "@/lib/recipe-data-context";
import {
  getBaseRequirements,
  getFrontierRequirements,
  getItemCheckoffs,
} from "@/lib/recipe-utils";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface BaseRequirementsListProps {
  internalname: string;
  multiplier: number;
  todoMode?: boolean;
  checkedItems?: Map<string, number>;
  /** Set an item's total checked count, distributed across its appearances. */
  onSetItemCheckedCount?: (
    paths: Array<{ path: string; needed: number }>,
    totalCount: number,
  ) => void;
}

interface MaterialRow {
  name: string;
  /** Total units needed across all appearances. */
  needed: number;
  /** Units still required (after check-offs). */
  remaining: number;
  /** Units already checked off across all appearances. */
  checked: number;
  paths: Array<{ path: string; needed: number }>;
}

export function BaseRequirementsList({
  internalname,
  multiplier,
  todoMode,
  checkedItems,
  onSetItemCheckedCount,
}: BaseRequirementsListProps) {
  const { recipes, itemsData } = useRecipeData();
  // Toggle: "needed" = the granular/actionable set (current behavior);
  // "all" = a full checklist of every intermediate craftable + base material.
  const [showAll, setShowAll] = useState(false);

  // Every product in the tree grouped by item, with each appearance's path —
  // the source for both the full checklist and the aggregated check controls.
  const itemCheckoffs = useMemo(
    () => getItemCheckoffs(internalname, recipes, multiplier, itemsData),
    [internalname, recipes, multiplier, itemsData],
  );

  const rows = useMemo<MaterialRow[]>(() => {
    const checkedOf = (paths: Array<{ path: string; needed: number }>) =>
      paths.reduce((sum, p) => sum + (checkedItems?.get(p.path) ?? 0), 0);

    if (showAll) {
      return Array.from(itemCheckoffs, ([name, c]) => {
        const checked = checkedOf(c.paths);
        return {
          name,
          needed: c.needed,
          checked,
          remaining: c.needed - checked,
          paths: c.paths,
        };
      });
    }

    if (todoMode && checkedItems) {
      // Granular frontier: most granular items still needed (rolls up).
      const frontier = getFrontierRequirements(
        internalname,
        recipes,
        multiplier,
        checkedItems,
      );
      return Object.entries(frontier).map(([name, remaining]) => {
        const c = itemCheckoffs.get(name);
        const paths = c?.paths ?? [];
        return {
          name,
          needed: c?.needed ?? remaining,
          checked: checkedOf(paths),
          remaining,
          paths,
        };
      });
    }

    // Not todo mode, not showing all: classic base materials view.
    const base = getBaseRequirements(
      internalname,
      recipes,
      multiplier,
      {},
      new Set(),
      itemsData,
    );
    return Object.entries(base).map(([name, needed]) => ({
      name,
      needed,
      checked: 0,
      remaining: needed,
      paths: itemCheckoffs.get(name)?.paths ?? [],
    }));
  }, [
    showAll,
    todoMode,
    checkedItems,
    itemCheckoffs,
    internalname,
    recipes,
    multiplier,
    itemsData,
  ]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => b.remaining - a.remaining || b.needed - a.needed,
      ),
    [rows],
  );

  useEffect(() => {
    if (sortedRows.length > 0) {
      trackBaseRequirementsView(internalname, sortedRows.length, multiplier);
    }
  }, [internalname, sortedRows.length, multiplier]);

  const showControls = todoMode && !!onSetItemCheckedCount;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-end pb-1">
        <div className="flex rounded-md bg-muted/60 p-0.5 border border-border/40">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              !showAll
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="w-3 h-3" />
            Needed
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              showAll
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3 h-3" />
            All products
          </button>
        </div>
      </div>

      {sortedRows.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {showAll ? "No products required" : "No materials required"}
          </p>
        </div>
      ) : (
        <>
          {sortedRows.map((row) => {
            const entry = recipes[row.name] ?? itemsData[row.name];
            const displayName = getDisplayName(entry, row.name, itemsData);
            const plainDisplayName = displayName.replace(/§./g, "");
            const isFullyChecked = row.checked >= row.needed && row.needed > 0;
            const isPartiallyChecked =
              row.checked > 0 && row.checked < row.needed;

            return (
              <div
                key={row.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group ${
                  isFullyChecked ? "opacity-40" : ""
                }`}
              >
                {showControls && (
                  <Checkbox
                    checked={
                      isFullyChecked
                        ? true
                        : isPartiallyChecked
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={() =>
                      onSetItemCheckedCount?.(
                        row.paths,
                        isFullyChecked ? 0 : row.needed,
                      )
                    }
                    className="flex-shrink-0"
                  />
                )}
                <ItemImage
                  entry={entry}
                  internalname={row.name}
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
                    {row.name}
                  </div>
                </div>

                {showControls && row.needed > 1 && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={row.checked <= 0}
                      onClick={() =>
                        onSetItemCheckedCount?.(
                          row.paths,
                          Math.max(0, row.checked - 1),
                        )
                      }
                      aria-label={`Remove one ${plainDisplayName}`}
                    >
                      <Minus />
                    </Button>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground min-w-[3.5rem] text-center">
                      {row.checked.toLocaleString()}/
                      {row.needed.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={row.checked >= row.needed}
                      onClick={() =>
                        onSetItemCheckedCount?.(
                          row.paths,
                          Math.min(row.needed, row.checked + 1),
                        )
                      }
                      aria-label={`Add one ${plainDisplayName}`}
                    >
                      <Plus />
                    </Button>
                  </div>
                )}

                <span className="font-mono text-sm font-semibold text-primary flex-shrink-0">
                  {(todoMode ? row.remaining : row.needed).toLocaleString()}
                </span>
              </div>
            );
          })}

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between px-3">
            <span className="text-xs text-muted-foreground">Total types</span>
            <span className="font-mono text-sm font-bold text-primary">
              {sortedRows.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
