"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Minus, Package, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { trackBaseRequirementsView } from "@/lib/analytics";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getItemCheckoffs, getSubtreeCheckPaths } from "@/lib/recipe-utils";
import { getDisplayName } from "@/lib/utils";
import { ItemImage } from "./item-image";

interface BaseRequirementsListProps {
  internalname: string;
  multiplier: number;
  checkedItems?: Map<string, number>;
  /** Set an item's total checked count, distributed across its appearances. */
  onSetItemCheckedCount?: (
    paths: Array<{ path: string; needed: number }>,
    totalCount: number,
  ) => void;
  /** Fully check/clear a set of paths at once (item + its whole subtree). */
  onSetPathsChecked?: (
    paths: Array<{ path: string; needed: number }>,
    checked: boolean,
  ) => void;
}

export function BaseRequirementsList({
  internalname,
  multiplier,
  checkedItems,
  onSetItemCheckedCount,
  onSetPathsChecked,
}: BaseRequirementsListProps) {
  const { recipes, itemsData } = useRecipeData();

  // The checklist is every product in the tree (intermediate craftables + base
  // materials) grouped by item, with each appearance's path for the controls.
  const itemCheckoffs = useMemo(
    () => getItemCheckoffs(internalname, recipes, multiplier, itemsData),
    [internalname, recipes, multiplier, itemsData],
  );

  const rows = useMemo(() => {
    return Array.from(itemCheckoffs, ([name, c]) => {
      const checked = c.paths.reduce(
        (sum, p) => sum + (checkedItems?.get(p.path) ?? 0),
        0,
      );
      return {
        name,
        needed: c.needed,
        checked,
        remaining: c.needed - checked,
        paths: c.paths,
      };
    }).sort((a, b) => b.remaining - a.remaining || b.needed - a.needed);
  }, [itemCheckoffs, checkedItems]);

  useEffect(() => {
    if (rows.length > 0) {
      trackBaseRequirementsView(internalname, rows.length, multiplier);
    }
  }, [internalname, rows.length, multiplier]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No products required</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rows.map((row) => {
        const entry = recipes[row.name] ?? itemsData[row.name];
        const displayName = getDisplayName(entry, row.name, itemsData);
        const plainDisplayName = displayName.replace(/§./g, "");
        const isFullyChecked = row.checked >= row.needed && row.needed > 0;
        const isPartiallyChecked = row.checked > 0 && row.checked < row.needed;

        return (
          <div
            key={row.name}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group ${
              isFullyChecked ? "opacity-40" : ""
            }`}
          >
            <Checkbox
              checked={
                isFullyChecked
                  ? true
                  : isPartiallyChecked
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() =>
                onSetPathsChecked?.(
                  getSubtreeCheckPaths(itemCheckoffs, row.paths),
                  !isFullyChecked,
                )
              }
              className="flex-shrink-0"
            />
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

            {row.needed > 1 && (
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
                  {row.checked.toLocaleString()}/{row.needed.toLocaleString()}
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
              {row.remaining.toLocaleString()}
            </span>
          </div>
        );
      })}

      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between px-3">
        <span className="text-xs text-muted-foreground">Total types</span>
        <span className="font-mono text-sm font-bold text-primary">
          {rows.length}
        </span>
      </div>
    </div>
  );
}
