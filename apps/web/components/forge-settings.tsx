"use client";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { trackForgeSettingChange } from "@/lib/analytics";
import { useCalculatorStore } from "@/lib/calculator-store";
import { calculateQuickForgeReduction } from "@/lib/forge-time-utils";
import { parseAndClampNumber } from "@/lib/input-utils";

export function ForgeSettings() {
  const settings = useCalculatorStore((s) => s.settings);
  const updateSettings = useCalculatorStore((s) => s.updateSettings);

  const quickForgeReduction = calculateQuickForgeReduction(
    settings.quickForgeLevel,
  );

  const handleForgeSlotChange = (value: string) => {
    const newValue = parseAndClampNumber(value, 1, 20);
    updateSettings({ forgeSlots: newValue });

    // Track forge slot change
    trackForgeSettingChange("forge_slots", newValue);
  };

  const handleQuickForgeLevelChange = (value: string) => {
    const newValue = parseAndClampNumber(value, 0, 20);
    updateSettings({ quickForgeLevel: newValue });

    // Track quick forge level change
    trackForgeSettingChange("quick_forge_level", newValue);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label
          htmlFor="forge-slots"
          className="text-xs text-muted-foreground mb-1.5 block"
        >
          Forge Slots (2-7)
        </Label>
        <Input
          id="forge-slots"
          type="number"
          min={2}
          max={7}
          value={settings.forgeSlots}
          onChange={(e) => handleForgeSlotChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div>
        <Label
          htmlFor="quick-forge-level"
          className="text-xs text-muted-foreground mb-1.5 block"
        >
          Quick Forge (0-20) &mdash; {quickForgeReduction}% reduction
        </Label>
        <Input
          id="quick-forge-level"
          type="number"
          min={0}
          max={20}
          value={settings.quickForgeLevel}
          onChange={(e) => handleQuickForgeLevelChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="flex items-start space-x-2.5">
        <Checkbox
          id="use-multiple-slots"
          checked={settings.useMultipleSlots}
          onCheckedChange={(checked) => {
            const newValue = checked === true;
            updateSettings({ useMultipleSlots: newValue });
            trackForgeSettingChange("use_multiple_slots", newValue);
          }}
          className="mt-0.5"
        />
        <div className="grid gap-1 leading-none">
          <Label
            htmlFor="use-multiple-slots"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Parallel Forging
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Forge duplicates simultaneously across slots
          </p>
        </div>
      </div>
    </div>
  );
}
