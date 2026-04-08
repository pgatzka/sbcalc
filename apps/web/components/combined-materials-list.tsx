"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Clipboard, Layers, Pickaxe } from "lucide-react";
import { ItemImage } from "@/components/item-image";
import { MinecraftColoredText } from "@/components/minecraft-colored-text";
import { useRecipeData } from "@/lib/recipe-data-context";
import { getDisplayName } from "@/lib/utils";

export function CombinedMaterialsList(props: {
  baseRequirements: Record<string, number>;
  materialDepth: number;
  onMaterialDepthChange: (depth: number) => void;
}) {
  const { baseRequirements, materialDepth, onMaterialDepthChange } = props;
  const { recipes, itemsData } = useRecipeData();

  const isBase = !Number.isFinite(materialDepth);

  return (
    <Card className="flex-1 flex flex-col mb-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Clipboard className="w-5 h-5" />
            Combined Materials Needed
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={!isBase ? "default" : "outline"}
              size="sm"
              onClick={() => onMaterialDepthChange(1)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Crafting
            </Button>
            <Button
              variant={isBase ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onMaterialDepthChange(Number.POSITIVE_INFINITY)
              }
            >
              <Pickaxe className="w-4 h-4 mr-2" />
              Raw
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(baseRequirements)
            .sort(([, a], [, b]) => b - a)
            .map(([materialName, count]) => {
              const entry = recipes[materialName] || itemsData[materialName];
              const displayName = entry
                ? getDisplayName(entry, materialName, itemsData)
                : materialName;
              const plainDisplayName = displayName.replace(/§./g, "");
              return (
                <div
                  key={materialName}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <ItemImage
                    entry={entry}
                    internalname={materialName}
                    alt={plainDisplayName}
                    width={32}
                    height={32}
                  />
                  <div className="flex-1 min-w-0">
                    <MinecraftColoredText
                      text={displayName}
                      className="text-sm font-medium truncate block"
                      title={plainDisplayName}
                    />
                    <p className="text-xs text-muted-foreground">
                      {count.toLocaleString()}x
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
