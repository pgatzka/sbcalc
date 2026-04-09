"use client";

import React from "react";
import { Input } from "@workspace/ui/components/input";
import { ItemImage } from "@/components/item-image";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

const ITEMS_PER_PAGE = 200;

export default function DemoPage() {
  const { recipes, itemsData } = useRecipeData();
  const [search, setSearch] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PER_PAGE);
  const loaderRef = React.useRef<HTMLDivElement>(null);

  // Merge all items: recipes first, then items-only entries
  const allItems = React.useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; displayName: string }[] = [];

    for (const id of Object.keys(recipes)) {
      seen.add(id);
      result.push({ id, displayName: getDisplayName(recipes[id], id, itemsData) });
    }
    for (const id of Object.keys(itemsData)) {
      if (seen.has(id)) continue;
      seen.add(id);
      result.push({ id, displayName: getDisplayName(itemsData[id], id, itemsData) });
    }

    result.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return result;
  }, [recipes, itemsData]);

  const filtered = React.useMemo(() => {
    if (!search) return allItems;
    const lower = search.toLowerCase();
    return allItems.filter(
      (item) =>
        item.id.toLowerCase().includes(lower) ||
        item.displayName.replace(/§./g, "").toLowerCase().includes(lower),
    );
  }, [allItems, search]);

  // Reset visible count when search changes
  React.useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [search]);

  // Infinite scroll via IntersectionObserver
  React.useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filtered.length));
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loader);
    return () => observer.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Item Gallery</h1>
          <span className="text-sm text-muted-foreground">
            {filtered.length.toLocaleString()} items
          </span>
        </div>

        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {visible.map((item) => {
            const entry = recipes[item.id] || itemsData[item.id];
            const plain = item.displayName.replace(/§./g, "");
            return (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50"
                title={`${plain}\n${item.id}`}
              >
                <ItemImage
                  entry={entry}
                  internalname={item.id}
                  alt={plain}
                  width={32}
                  height={32}
                />
                <MinecraftColoredText
                  text={item.displayName}
                  className="text-xs text-center truncate w-full"
                />
              </div>
            );
          })}
        </div>

        {visibleCount < filtered.length && (
          <div ref={loaderRef} className="flex justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Showing {visibleCount.toLocaleString()} of {filtered.length.toLocaleString()} — scroll for more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
