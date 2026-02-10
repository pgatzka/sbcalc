"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Search, Settings, X } from "lucide-react";
import { ForgeSettings } from "@/components/forge-settings";
import { ItemSearch } from "@/components/item-search";
import { ShareRecipeDialog } from "@/components/share-recipe-dialog";

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Search className="w-5 h-5" />
              Search Items
            </CardTitle>
            {selectedItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="hover:bg-destructive hover:text-destructive-foreground"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ItemSearch
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSelect={(item) => {
              onSelectItem(item);
              onMultiplierChange(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Amount Controls */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="quantity"
                  className="text-muted-foreground mb-2 block"
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
                />
              </div>

              {/* Forge Settings */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Forge Settings
                </h4>
                <ForgeSettings />
              </div>

              {/* Share Recipe */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Share Recipe
                </h4>
                <ShareRecipeDialog recipeState={recipeState} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
