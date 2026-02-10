/** A legacy crafting grid recipe (the old `recipe` field with no type discriminator) */
export interface LegacyCraftingGrid {
  A1?: string;
  A2?: string;
  A3?: string;
  B1?: string;
  B2?: string;
  B3?: string;
  C1?: string;
  C2?: string;
  C3?: string;
  [key: string]: string | undefined;
}

/** A crafting recipe from the `recipes` array */
export interface CraftingRecipe {
  type: "crafting";
  A1?: string;
  A2?: string;
  A3?: string;
  B1?: string;
  B2?: string;
  B3?: string;
  C1?: string;
  C2?: string;
  C3?: string;
  count?: number;
  overrideOutputId?: string;
}

/** A forge recipe with inputs and duration */
export interface ForgeRecipe {
  type: "forge";
  inputs?: string[];
  count?: number;
  duration?: number;
  overrideOutputId?: string;
}

/** Any other recipe type (drops, etc.) — not used for crafting, filtered out */
export type OtherRecipe = { type: string; [key: string]: unknown };

/** Union of all recipe array entry types */
export type NeuRecipeEntry = CraftingRecipe | ForgeRecipe | OtherRecipe;

/** A NEU item as stored in the repo JSON files */
export interface NeuItem {
  internalname: string;
  displayname?: string;
  itemid?: string;
  nbttag?: string;
  damage?: number;
  lore?: string[];
  clickcommand?: string;
  crafttext?: string;
  modver?: string;
  infoType?: string;
  info?: string[];
  parent?: string;
  recipe?: LegacyCraftingGrid;
  recipes?: NeuRecipeEntry[];
  [key: string]: unknown;
}

/** The merged output format: items keyed by internalname */
export type MergedItems = Record<string, NeuItem>;
