"use client";

import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { ItemSearch } from "@/components/item-search";
import { ItemImage } from "@/components/item-image";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import type { RecipesData } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";

export interface ItemListEntry {
  itemId: string;
  quantity: number;
}

export interface ItemListManagerProps {
  items: ItemListEntry[];
  onItemsChange: (items: ItemListEntry[]) => void;
  recipes: RecipesData;
  itemsData: RecipesData;
  selectedItemId?: string | null;
  onItemClick?: (itemId: string) => void;
}

export function ItemListManager({
  items,
  onItemsChange,
  recipes,
  itemsData,
  selectedItemId,
  onItemClick,
}: ItemListManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [tempSearch, setTempSearch] = useState("");
  const [tempQuantity, setTempQuantity] = useState(1);

  const handleAddItem = (itemId: string) => {
    // Check if item already exists
    const existingIndex = items.findIndex((item) => item.itemId === itemId);
    if (existingIndex >= 0) {
      // Update quantity
      const newItems = [...items];
      const existingItem = newItems[existingIndex];
      if (existingItem) {
        existingItem.quantity += tempQuantity;
      }
      onItemsChange(newItems);
      onItemClick?.(itemId);
    } else {
      // Add new item
      onItemsChange([...items, { itemId, quantity: tempQuantity }]);
      onItemClick?.(itemId);
    }
    setIsAdding(false);
    setTempSearch("");
    setTempQuantity(1);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
    onItemsChange(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const handleClearAll = () => {
    onItemsChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Item List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Items ({items.length})</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item, index) => {
              const entry = recipes[item.itemId];
              const displayName = getDisplayName(entry, item.itemId, itemsData);
              const isSelected = selectedItemId === item.itemId;
              return (
                <div
                  key={`${item.itemId}-${index}`}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/50 border-border/50 hover:bg-muted/70"
                  } ${onItemClick ? "cursor-pointer" : ""}`}
                  onClick={() => onItemClick?.(item.itemId)}
                >
                  <ItemImage
                    entry={entry}
                    internalname={item.itemId}
                    alt={displayName}
                    width={32}
                    height={32}
                    itemsData={itemsData}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {displayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQuantity(index, Number(e.target.value))
                      }
                      className="w-20 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Item Section */}
      {isAdding ? (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
          <div>
            <Label htmlFor="add-item-search" className="text-sm mb-2 block">
              Search Item
            </Label>
            <ItemSearch
              searchValue={tempSearch}
              onSearchChange={setTempSearch}
              onSelect={handleAddItem}
            />
          </div>
          <div>
            <Label htmlFor="add-item-quantity" className="text-sm mb-2 block">
              Quantity
            </Label>
            <Input
              id="add-item-quantity"
              type="number"
              min={1}
              value={tempQuantity}
              onChange={(e) =>
                setTempQuantity(Math.max(1, Number(e.target.value)))
              }
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setTempSearch("");
              setTempQuantity(1);
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      )}
    </div>
  );
}
