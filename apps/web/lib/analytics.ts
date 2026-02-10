import { sendGTMEvent } from "@next/third-parties/google";

// Track base requirements viewing
export function trackBaseRequirementsView(
  itemName: string,
  requirementsCount: number,
  multiplier: number,
) {
  sendGTMEvent({
    event: "base_requirements_view",
    event_category: "recipe_interaction",
    event_label: itemName,
    item_name: itemName,
    requirements_count: requirementsCount,
    multiplier: multiplier,
    timestamp: new Date().toISOString(),
  });
}

// Track recipe summary viewing
export function trackRecipeSummaryView(
  itemName: string,
  itemDisplayName: string,
  multiplier: number,
  totalMaterials: number,
  totalForgeTime: number,
  forgeSlots: number,
  useMultipleSlots: boolean,
) {
  sendGTMEvent({
    event: "recipe_summary_view",
    event_category: "recipe_interaction",
    event_label: itemName,
    item_name: itemName,
    item_display_name: itemDisplayName,
    multiplier: multiplier,
    total_materials: totalMaterials,
    total_forge_time: totalForgeTime,
    forge_slots: forgeSlots,
    use_multiple_slots: useMultipleSlots,
    timestamp: new Date().toISOString(),
  });
}

// Track forge setting changes (direct UI interaction)
export function trackForgeSettingChange(settingName: string, newValue: any) {
  sendGTMEvent({
    event: "forge_setting_change",
    event_category: "settings",
    event_label: settingName,
    setting_name: settingName,
    new_value: newValue,
    timestamp: new Date().toISOString(),
  });
}

// Track recipe tree item clicks
export function trackRecipeTreeItemClick(
  itemName: string,
  itemDisplayName: string,
  depth: number,
  multiplier: number,
  isForgeRecipe: boolean,
  isExpanded: boolean,
) {
  sendGTMEvent({
    event: "recipe_tree_item_click",
    event_category: "recipe_interaction",
    event_label: itemName,
    item_name: itemName,
    item_display_name: itemDisplayName,
    depth: depth,
    multiplier: multiplier,
    is_forge_recipe: isForgeRecipe,
    is_expanded: isExpanded,
    timestamp: new Date().toISOString(),
  });
}
