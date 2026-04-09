"use client";

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
    <div className="space-y-4">
      <ItemListManager
        items={itemList}
        onItemsChange={onItemsChange}
        selectedItemId={selectedItemId}
        onItemClick={onItemClick}
      />

      {itemList.length > 0 && (
        <div className="space-y-4">
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
