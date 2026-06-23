"use client";

import { ListTree, Workflow } from "lucide-react";

export type CraftView = "tree" | "flow";

/** Segmented control to switch the crafting breakdown between Tree and Flow. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: CraftView;
  onChange: (view: CraftView) => void;
}) {
  return (
    <div className="flex rounded-md bg-muted/60 p-0.5 border border-border/40 w-fit">
      <button
        type="button"
        onClick={() => onChange("tree")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
          view === "tree"
            ? "bg-card text-foreground shadow-sm border border-border/40"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ListTree className="w-3 h-3" />
        Tree
      </button>
      <button
        type="button"
        onClick={() => onChange("flow")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
          view === "flow"
            ? "bg-card text-foreground shadow-sm border border-border/40"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Workflow className="w-3 h-3" />
        Flow
      </button>
    </div>
  );
}
