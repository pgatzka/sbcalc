"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { X } from "lucide-react";
import { ForgeSettings } from "@/components/forge-settings";
import { ItemSearch } from "@/components/item-search";
import { ShareRecipeDialog } from "@/components/share-recipe-dialog";
import { TexturePackSettings } from "@/components/texture-pack-settings";

export function SingleItemPanel(props: {
  selectedItem: string | null;
  searchValue: string;
  multiplier: number;
  onSearchChange: (v: string) => void;
  onSelectItem: (id: string) => void;
  onMultiplierChange: (n: number) => void;
  onClear: () => void;
  recipeState: {
    recipes: Record<string, number>;
    forgeSettings: {
      forgeSlots: number;
      useMultipleSlots: boolean;
      quickForgeLevel: number;
    };
  };
}) {
  const {
    selectedItem,
    searchValue,
    multiplier,
    onSearchChange,
    onSelectItem,
    onMultiplierChange,
    onClear,
    recipeState,
  } = props;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Search
          </label>
          {selectedItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <ItemSearch
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSelect={(item) => {
            onSelectItem(item);
            onMultiplierChange(1);
          }}
        />
      </div>

      {selectedItem && (
        <div className="space-y-4 pt-2">
          <div>
            <Label
              htmlFor="quantity"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block"
            >
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={multiplier}
              onChange={(e) =>
                onMultiplierChange(Math.max(1, Number(e.target.value)))
              }
              className="h-9"
            />
          </div>

          <div className="border-t border-border/40 pt-4">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Forge
            </h4>
            <ForgeSettings />
          </div>

          <div className="border-t border-border/40 pt-4">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Texture Pack
            </h4>
            <TexturePackSettings />
          </div>

          <div className="border-t border-border/40 pt-4">
            <ShareRecipeDialog recipeState={recipeState} />
          </div>
        </div>
      )}
    </div>
  );
}
