"use client";

import { List, Search } from "lucide-react";

export function ModeSwitcher({
  mode,
  onSwitch,
}: {
  mode: "single" | "multi";
  onSwitch: (m: "single" | "multi") => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted/60 p-1 border border-border/50">
      <button
        type="button"
        onClick={() => onSwitch("single")}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
          mode === "single"
            ? "bg-card text-foreground shadow-sm border border-border/50"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Search className="w-3.5 h-3.5" />
        Single
      </button>
      <button
        type="button"
        onClick={() => onSwitch("multi")}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
          mode === "multi"
            ? "bg-card text-foreground shadow-sm border border-border/50"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="w-3.5 h-3.5" />
        Multi
      </button>
    </div>
  );
}
