"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { List, Search } from "lucide-react";

export function ModeSwitcher({
  mode,
  onSwitch,
}: {
  mode: "single" | "multi";
  onSwitch: (m: "single" | "multi") => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant={mode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => onSwitch("single")}
            className="flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Single Item
          </Button>
          <Button
            variant={mode === "multi" ? "default" : "outline"}
            size="sm"
            onClick={() => onSwitch("multi")}
            className="flex-1"
          >
            <List className="w-4 h-4 mr-2" />
            Multi Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
