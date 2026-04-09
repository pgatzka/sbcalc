"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemImage } from "@/components/item-image";
import { useRecipeData } from "@/lib/recipe-data-context";
import { parseMinecraftColors } from "@/lib/utils";

export interface ItemSearchProps {
  onSelect?: (itemValue: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function ItemSearch({
  onSelect,
  searchValue,
  onSearchChange,
}: ItemSearchProps) {
  const { recipes } = useRecipeData();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const currentSearch = searchValue !== undefined ? searchValue : search;

  const items = useMemo(
    () =>
      Object.entries(recipes).map(([key, value]) => {
        let label =
          value.displayname?.replace(/{LVL}/g, "100") ||
          value.internalname ||
          key;
        let searchLabel = label.replace(/§./g, "");

        if (value.itemid === "minecraft:enchanted_book") {
          const loreLine = value.lore?.[0];
          if (loreLine) {
            label = loreLine.replace(/{LVL}/g, "100");
            searchLabel = label.replace(/§./g, "");
          }
        }

        return {
          label,
          searchLabel,
          displayNode: parseMinecraftColors(label),
          value: value.internalname || key,
        };
      }),
    [recipes],
  );

  const filteredItems = useMemo(() => {
    if (!currentSearch) return items.slice(0, 10);
    const filtered = items.filter((item) =>
      item.searchLabel.toLowerCase().includes(currentSearch.toLowerCase()),
    );
    return filtered.slice(0, 10);
  }, [items, currentSearch]);

  const handleSelect = (itemValue: string) => {
    const selectedItem = items.find((item) => item.value === itemValue);
    const newSearchValue = selectedItem?.searchLabel || "";

    if (onSearchChange) {
      onSearchChange(newSearchValue);
    } else {
      setSearch(newSearchValue);
    }

    setIsOpen(false);
    if (onSelect) onSelect(itemValue);
  };

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setSearch(value);
    }
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border/60 rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          placeholder="Search items..."
          value={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {isOpen && currentSearch && filteredItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border/60 rounded-lg max-h-72 overflow-y-auto z-50 shadow-lg">
          {filteredItems.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer text-foreground border-b border-border/30 last:border-b-0 hover:bg-accent/50 transition-colors"
              onClick={() => handleSelect(item.value)}
            >
              <ItemImage
                entry={recipes[item.value]}
                internalname={item.value}
                alt={item.label}
                width={24}
                height={24}
              />
              <span className="text-sm truncate">
                {item.displayNode.map((segment, idx) => (
                  <span key={idx} style={{ color: segment.color }}>
                    {segment.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
