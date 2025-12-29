"use client";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@workspace/ui/components/card";

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

    const formattedTime = (() => {
        const seconds = totalForgeTimeSeconds;
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    })();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
    );
}
