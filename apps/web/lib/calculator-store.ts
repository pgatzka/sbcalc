import { create } from "zustand";
import { DEFAULT_FORGE_SETTINGS } from "@/lib/constants";
import type { ItemListEntry, Settings } from "@/lib/types";

interface CalculatorState {
  // Mode
  mode: "single" | "multi";
  setMode: (mode: "single" | "multi") => void;
  handleModeSwitch: (mode: "single" | "multi") => void;

  // Single-item selection
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
  multiplier: number;
  setMultiplier: (n: number) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;

  // Multi-item list
  itemList: ItemListEntry[];
  setItemList: (items: ItemListEntry[]) => void;
  multiTreeSelectedItem: string | null;
  setMultiTreeSelectedItem: (id: string | null) => void;

  // Material depth (Crafting vs Raw toggle)
  materialDepth: number;
  setMaterialDepth: (depth: number) => void;

  // Settings (forge)
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;

  // Hydration
  hydrated: boolean;
  hydrate: () => void;

  // Helpers
  getRecipeState: () => Record<string, number>;
}

const LOCAL_KEYS = {
  mode: "sbcalc_mode",
  selectedItem: "sbcalc_selectedItem",
  multiplier: "sbcalc_multiplier",
  itemList: "sbcalc_itemList",
  lastMultiSelectedItem: "sbcalc_lastMultiSelectedItem",
  settings: "sbcalc-settings",
} as const;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  // Defaults (pre-hydration)
  mode: "single",
  selectedItem: null,
  multiplier: 1,
  searchValue: "",
  itemList: [],
  multiTreeSelectedItem: null,
  materialDepth: Number.POSITIVE_INFINITY,
  settings: { ...DEFAULT_FORGE_SETTINGS },
  hydrated: false,

  // Mode
  setMode: (mode) => {
    set({ mode });
    saveJson(LOCAL_KEYS.mode, mode);
  },
  handleModeSwitch: (newMode) => {
    if (newMode === "single") {
      set({ mode: newMode, itemList: [], multiTreeSelectedItem: null });
      saveJson(LOCAL_KEYS.mode, newMode);
      saveJson(LOCAL_KEYS.itemList, []);
    } else {
      set({
        mode: newMode,
        selectedItem: null,
        multiplier: 1,
        searchValue: "",
      });
      saveJson(LOCAL_KEYS.mode, newMode);
      saveJson(LOCAL_KEYS.selectedItem, null);
      saveJson(LOCAL_KEYS.multiplier, 1);
    }
  },

  // Single item
  setSelectedItem: (item) => {
    set({ selectedItem: item });
    saveJson(LOCAL_KEYS.selectedItem, item);
  },
  setMultiplier: (n) => {
    set({ multiplier: n });
    saveJson(LOCAL_KEYS.multiplier, n);
  },
  setSearchValue: (v) => set({ searchValue: v }),

  // Multi item
  setItemList: (items) => {
    set({ itemList: items });
    saveJson(LOCAL_KEYS.itemList, items);
  },
  setMultiTreeSelectedItem: (id) => {
    set({ multiTreeSelectedItem: id });
    if (id) saveJson(LOCAL_KEYS.lastMultiSelectedItem, id);
  },

  // Material depth
  setMaterialDepth: (depth) => set({ materialDepth: depth }),

  // Settings
  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    saveJson(LOCAL_KEYS.settings, next);
  },

  // Hydration from localStorage
  hydrate: () => {
    if (get().hydrated) return;

    const mode = loadJson<"single" | "multi">(LOCAL_KEYS.mode, "single");
    const selectedItem = loadJson<string | null>(LOCAL_KEYS.selectedItem, null);
    const multiplier = loadJson<number>(LOCAL_KEYS.multiplier, 1);
    const itemList = loadJson<ItemListEntry[]>(LOCAL_KEYS.itemList, []);
    const settings = {
      ...DEFAULT_FORGE_SETTINGS,
      ...loadJson<Partial<Settings>>(LOCAL_KEYS.settings, {}),
    };

    // Restore multi-tree selection
    const lastMulti = loadJson<string | null>(
      LOCAL_KEYS.lastMultiSelectedItem,
      null,
    );
    const multiTreeSelectedItem =
      mode === "multi" &&
      lastMulti &&
      itemList.some((i) => i.itemId === lastMulti)
        ? lastMulti
        : null;

    set({
      mode,
      selectedItem,
      multiplier,
      itemList,
      settings,
      multiTreeSelectedItem,
      hydrated: true,
    });
  },

  // Helpers
  getRecipeState: () => {
    const { mode, selectedItem, multiplier, itemList } = get();
    if (mode === "single" && selectedItem)
      return { [selectedItem]: multiplier };
    if (mode === "multi")
      return Object.fromEntries(
        itemList.map((item) => [item.itemId, item.quantity]),
      );
    return {};
  },
}));
