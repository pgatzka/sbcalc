"use client";

import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { ItemImage } from "@/components/item-image";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { TexturePackSettings } from "@/components/texture-pack-settings";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

const ITEMS_PER_PAGE = 200;

export default function DemoPage() {
  const { recipes, itemsData } = useRecipeData();
  const [search, setSearch] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PER_PAGE);
  const loaderRef = React.useRef<HTMLDivElement>(null);

  const allItems = React.useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; displayName: string }[] = [];

    for (const id of Object.keys(recipes)) {
      seen.add(id);
      result.push({
        id,
        displayName: getDisplayName(recipes[id], id, itemsData),
      });
    }
    for (const id of Object.keys(itemsData)) {
      if (seen.has(id)) continue;
      seen.add(id);
      result.push({
        id,
        displayName: getDisplayName(itemsData[id], id, itemsData),
      });
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

  React.useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [search]);

  React.useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, filtered.length),
          );
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loader);
    return () => observer.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/" title="Back to Calculator">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="font-display text-lg font-semibold tracking-wide">
              Item Gallery
            </h1>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {filtered.length.toLocaleString()} items
          </span>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-6 py-6 space-y-5 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-4">
            <TexturePackSettings inline />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {visible.map((item) => {
            const entry = recipes[item.id] || itemsData[item.id];
            const plain = item.displayName.replace(/§./g, "");
            return (
              <div
                key={item.id}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border/40 bg-card/40 hover:bg-card/80 transition-colors"
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
                  className="text-[10px] text-center truncate w-full leading-tight"
                />
              </div>
            );
          })}
        </div>

        {visibleCount < filtered.length && (
          <div ref={loaderRef} className="flex justify-center py-6">
            <p className="text-xs font-mono text-muted-foreground">
              {visibleCount.toLocaleString()} /{" "}
              {filtered.length.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
