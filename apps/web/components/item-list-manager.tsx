"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemImage } from "@/components/item-image";
import { ItemSearch } from "@/components/item-search";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useRecipeData } from "@/lib/recipe-data-context";
import type { ItemListEntry } from "@/lib/types";
import { getDisplayName } from "@/lib/utils";

interface SortableItemProps {
  item: ItemListEntry;
  index: number;
  isSelected: boolean;
  onItemClick?: (itemId: string) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

function SortableItem({
  item,
  index,
  isSelected,
  onItemClick,
  onUpdateQuantity,
  onRemove,
}: SortableItemProps) {
  const { recipes, itemsData } = useRecipeData();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.itemId });

  const style = {
    transform: transform
      ? CSS.Transform.toString({ ...transform, x: 0 })
      : undefined,
    transition,
  };

  const entry = recipes[item.itemId];
  const displayName = getDisplayName(entry, item.itemId, itemsData);
  const plainDisplayName = displayName.replace(/§./g, "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm ${
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/50 border border-transparent"
      } ${isDragging ? "opacity-50 z-10" : ""} ${onItemClick ? "cursor-pointer" : ""}`}
      onClick={() => onItemClick?.(item.itemId)}
    >
      <button
        type="button"
        className="flex items-center justify-center w-5 h-5 hover:bg-muted rounded cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground/50" />
      </button>
      <div title={plainDisplayName} className="flex-shrink-0">
        <ItemImage
          entry={entry}
          internalname={item.itemId}
          alt={plainDisplayName}
          width={24}
          height={24}
        />
      </div>
      <div className="flex-1 min-w-0">
        <MinecraftColoredText
          text={displayName}
          className="text-xs font-medium truncate block"
          title={plainDisplayName}
        />
      </div>
      <div
        className="flex items-center gap-1 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(index, Number(e.target.value))}
          className="w-16 h-7 text-xs"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export interface ItemListManagerProps {
  items: ItemListEntry[];
  onItemsChange: (items: ItemListEntry[]) => void;
  selectedItemId?: string | null;
  onItemClick?: (itemId: string) => void;
}

export function ItemListManager({
  items,
  onItemsChange,
  selectedItemId,
  onItemClick,
}: ItemListManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [tempSearch, setTempSearch] = useState("");
  const [tempQuantity, setTempQuantity] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(() => items.map((i) => i.itemId), [items]);

  const handleAddItem = (itemId: string) => {
    const existingIndex = items.findIndex((item) => item.itemId === itemId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      const existingItem = newItems[existingIndex];
      if (existingItem) {
        existingItem.quantity += tempQuantity;
      }
      onItemsChange(newItems);
      onItemClick?.(itemId);
    } else {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.itemId === active.id);
    const newIndex = items.findIndex((i) => i.itemId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [moved] = newItems.splice(oldIndex, 1);
    if (moved) {
      newItems.splice(newIndex, 0, moved);
      onItemsChange(newItems);
    }
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Items ({items.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1 max-h-[350px] overflow-y-auto overflow-x-hidden pr-1">
                {items.map((item, index) => (
                  <SortableItem
                    key={item.itemId}
                    item={item}
                    index={index}
                    isSelected={selectedItemId === item.itemId}
                    onItemClick={onItemClick}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Item Section */}
      {isAdding ? (
        <div className="space-y-2.5 p-3 bg-muted/20 rounded-lg border border-border/40">
          <div>
            <Label
              htmlFor="add-item-search"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
              Search Item
            </Label>
            <ItemSearch
              searchValue={tempSearch}
              onSearchChange={setTempSearch}
              onSelect={handleAddItem}
            />
          </div>
          <div>
            <Label
              htmlFor="add-item-quantity"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
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
              className="w-full h-8 text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setTempSearch("");
              setTempQuantity(1);
            }}
            className="w-full text-xs text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full h-8 text-xs"
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Add Item
        </Button>
      )}
    </div>
  );
}
