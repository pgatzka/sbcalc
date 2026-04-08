"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { formatForgeTime } from "@/lib/forge-time-utils";

export function CombinedSummaryCards(props: {
  itemListCount: number;
  totalItemQuantity: number;
  totalMaterials: number;
  totalForgeTimeSeconds: number;
  forgeSlots: number;
}) {
  const {
    itemListCount,
    totalItemQuantity,
    totalMaterials,
    totalForgeTimeSeconds,
    forgeSlots,
  } = props;

  const formattedTime = formatForgeTime(totalForgeTimeSeconds);

  return (
    <div
      className={`grid grid-cols-1 gap-4 ${totalForgeTimeSeconds > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItemQuantity}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {itemListCount} types
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Base Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMaterials}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Unique materials needed
          </p>
        </CardContent>
      </Card>

      {totalForgeTimeSeconds > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Forge Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTime}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With {forgeSlots} slot{forgeSlots > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
