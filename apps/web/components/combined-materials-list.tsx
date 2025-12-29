"use client";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@workspace/ui/components/card";
import { Clipboard } from "lucide-react";
import { ItemImage } from "@/components/item-image";
import { getDisplayName } from "@/lib/utils";
import type { RecipesData } from "@/lib/types";

export function CombinedMaterialsList(props: {
    baseRequirements: Record<string, number>;
    recipes: RecipesData;
    itemsData: RecipesData;
}) {
    const { baseRequirements, recipes, itemsData } = props;

    return (
        <Card className="flex-1 flex flex-col mb-20">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Clipboard className="w-5 h-5" />
                    Combined Materials Needed
                </CardTitle>
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
                            return (
                                <div
                                    key={materialName}
                                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
                                >
                                    <ItemImage
                                        entry={entry}
                                        internalname={materialName}
                                        alt={displayName}
                                        width={32}
                                        height={32}
                                        itemsData={itemsData}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {displayName}
                                        </p>
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
