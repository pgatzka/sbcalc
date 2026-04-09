"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { List } from "lucide-react";
import { ForgeSettings } from "@/components/forge-settings";
import { ItemListManager } from "@/components/item-list-manager";
import { ShareRecipeDialog } from "@/components/share-recipe-dialog";
import { TexturePackSettings } from "@/components/texture-pack-settings";
import type { ItemListEntry } from "@/lib/types";

export function MultiItemPanel(props: {
  itemList: ItemListEntry[];
  onItemsChange: (items: ItemListEntry[]) => void;
  selectedItemId: string | null;
  onItemClick: (id: string | null) => void;
  recipeState: {
    recipes: Record<string, number>;
    forgeSettings: {
      forgeSlots: number;
      useMultipleSlots: boolean;
      quickForgeLevel: number;
    };
  };
}) {
  const { itemList, onItemsChange, selectedItemId, onItemClick, recipeState } =
    props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <List className="w-5 h-5" />
          Item List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ItemListManager
          items={itemList}
          onItemsChange={onItemsChange}
          selectedItemId={selectedItemId}
          onItemClick={onItemClick}
        />

        {/* Forge Settings for Multi Mode */}
        {itemList.length > 0 && (
          <>
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Forge Settings
              </h4>
              <ForgeSettings />
            </div>

            {/* Texture Packs */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Texture Packs
              </h4>
              <TexturePackSettings />
            </div>

            {/* Share Recipe */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Share Recipe
              </h4>
              <ShareRecipeDialog recipeState={recipeState} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
