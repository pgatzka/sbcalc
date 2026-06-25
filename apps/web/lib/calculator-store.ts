import { create } from "zustand";
import { DEFAULT_FORGE_SETTINGS } from "@/lib/constants";
import type { Settings } from "@/lib/types";

interface CalculatorState {
  // Single-item selection
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
  multiplier: number;
  setMultiplier: (n: number) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;

  // Settings (forge)
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;

  // Checklist: map of checked-off node PATH (root->node internalname chain) ->
  // how many of that node's needed quantity are gathered/crafted. A node is
  // fully checked when its count reaches its needed amount; partial counts are
  // supported. Driven entirely by the materials list (the tree is read-only).
  checkedItems: Map<string, number>;
  // Set an item's TOTAL checked count, distributed across all of its
  // appearances (paths). Used by the list's aggregated +/- stepper.
  setItemCheckedCount: (
    paths: Array<{ path: string; needed: number }>,
    totalCount: number,
  ) => void;
  // Fully check (each path -> its needed) or clear a set of paths at once. Used
  // by the list checkbox to cascade a product and its whole subtree.
  setPathsChecked: (
    paths: Array<{ path: string; needed: number }>,
    checked: boolean,
  ) => void;
  // Clear every checked-off amount in the checklist.
  clearChecked: () => void;

  // Hydration
  hydrated: boolean;
  hydrate: () => void;

  // Helpers
  getRecipeState: () => Record<string, number>;
}

const LOCAL_KEYS = {
  selectedItem: "sbcalc_selectedItem",
  multiplier: "sbcalc_multiplier",
  settings: "sbcalc-settings",
  checkedItems: "sbcalc_checkedItems",
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
  selectedItem: null,
  multiplier: 1,
  searchValue: "",
  settings: { ...DEFAULT_FORGE_SETTINGS },
  hydrated: false,
  checkedItems: new Map<string, number>(),

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

  // Checklist
  setPathsChecked: (paths, checked) => {
    const next = new Map(get().checkedItems);
    for (const { path, needed } of paths) {
      if (checked) next.set(path, needed);
      else next.delete(path);
    }
    set({ checkedItems: next });
    saveJson(LOCAL_KEYS.checkedItems, Array.from(next.entries()));
  },
  clearChecked: () => {
    set({ checkedItems: new Map<string, number>() });
    saveJson(LOCAL_KEYS.checkedItems, []);
  },
  setItemCheckedCount: (paths, totalCount) => {
    const next = new Map(get().checkedItems);
    // Fill the item's appearances in order until the requested total is met,
    // capping each path at its own needed amount.
    let left = totalCount;
    for (const { path, needed } of paths) {
      const give = Math.max(0, Math.min(needed, left));
      if (give <= 0) next.delete(path);
      else next.set(path, give);
      left -= give;
    }
    set({ checkedItems: next });
    saveJson(LOCAL_KEYS.checkedItems, Array.from(next.entries()));
  },

  // Settings
  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    saveJson(LOCAL_KEYS.settings, next);
  },

  // Hydration from localStorage
  hydrate: () => {
    if (get().hydrated) return;

    const selectedItem = loadJson<string | null>(LOCAL_KEYS.selectedItem, null);
    const multiplier = loadJson<number>(LOCAL_KEYS.multiplier, 1);
    const settings = {
      ...DEFAULT_FORGE_SETTINGS,
      ...loadJson<Partial<Settings>>(LOCAL_KEYS.settings, {}),
    };

    // Stored as [path, count][]. An older (binary) format was a string[] of
    // paths — detect it (array of strings, not tuples) and discard, since we
    // can't recover per-node counts. Checklist progress isn't critical state.
    const storedChecked = loadJson<unknown[]>(LOCAL_KEYS.checkedItems, []);
    const isOldFormat =
      storedChecked.length > 0 && !Array.isArray(storedChecked[0]);
    const checkedItems = isOldFormat
      ? new Map<string, number>()
      : new Map(storedChecked as Array<[string, number]>);

    set({
      selectedItem,
      multiplier,
      settings,
      checkedItems,
      hydrated: true,
    });
  },

  // Helpers
  getRecipeState: () => {
    const { selectedItem, multiplier } = get();
    return selectedItem ? { [selectedItem]: multiplier } : {};
  },
}));
