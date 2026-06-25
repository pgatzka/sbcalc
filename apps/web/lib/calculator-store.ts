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

  // Todo mode
  todoMode: boolean;
  // Map of checked-off node PATH (root->node internalname chain) -> how many of
  // that node's needed quantity are gathered/crafted. A node is fully checked
  // when its count reaches its needed amount; partial counts are supported.
  checkedItems: Map<string, number>;
  toggleTodoMode: () => void;
  // Checkbox: fully checks/unchecks `path` (to `needed`) and cascades the whole
  // sub-branch (each descendant set to its own `needed`, or cleared).
  toggleChecked: (
    path: string,
    needed: number,
    descendants: Array<{ path: string; needed: number }>,
  ) => void;
  // Stepper (+/-): set a single node's checked count (node-only, no cascade).
  setCheckedCount: (path: string, count: number) => void;
  // Materials list: set an item's TOTAL checked count, distributed across all
  // of its appearances (paths). Used by the list's aggregated checkbox/stepper.
  setItemCheckedCount: (
    paths: Array<{ path: string; needed: number }>,
    totalCount: number,
  ) => void;

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
  mode: "single",
  selectedItem: null,
  multiplier: 1,
  searchValue: "",
  itemList: [],
  multiTreeSelectedItem: null,
  materialDepth: Number.POSITIVE_INFINITY,
  settings: { ...DEFAULT_FORGE_SETTINGS },
  hydrated: false,
  todoMode: false,
  checkedItems: new Map<string, number>(),

  // Mode
  setMode: (mode) => {
    set({ mode });
    saveJson(LOCAL_KEYS.mode, mode);
  },
  handleModeSwitch: (newMode) => {
    set({ mode: newMode });
    saveJson(LOCAL_KEYS.mode, newMode);
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

  // Todo mode
  toggleTodoMode: () => {
    const { todoMode } = get();
    const clearing = todoMode;
    set({
      todoMode: !todoMode,
      checkedItems: clearing ? new Map<string, number>() : get().checkedItems,
    });
    if (clearing) saveJson(LOCAL_KEYS.checkedItems, []);
  },
  toggleChecked: (path, needed, descendants) => {
    const next = new Map(get().checkedItems);
    const isFull = (next.get(path) ?? 0) >= needed;
    if (isFull) {
      // Uncheck this node and clear its whole sub-branch.
      next.delete(path);
      for (const d of descendants) next.delete(d.path);
    } else {
      // Fully check this node and cascade each descendant to its own needed.
      next.set(path, needed);
      for (const d of descendants) next.set(d.path, d.needed);
    }
    set({ checkedItems: next });
    saveJson(LOCAL_KEYS.checkedItems, Array.from(next.entries()));
  },
  setCheckedCount: (path, count) => {
    const next = new Map(get().checkedItems);
    if (count <= 0) next.delete(path);
    else next.set(path, count);
    set({ checkedItems: next });
    saveJson(LOCAL_KEYS.checkedItems, Array.from(next.entries()));
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
      lastMulti && itemList.some((i) => i.itemId === lastMulti)
        ? lastMulti
        : null;
    // Stored as [path, count][]. The previous (binary) format was a string[]
    // of paths — detect it (array of strings, not tuples) and discard, since
    // we can't recover per-node counts. Todo progress isn't critical state.
    const storedChecked = loadJson<unknown[]>(LOCAL_KEYS.checkedItems, []);
    const isOldFormat =
      storedChecked.length > 0 && !Array.isArray(storedChecked[0]);
    const checkedItems = isOldFormat
      ? new Map<string, number>()
      : new Map(storedChecked as Array<[string, number]>);
    const todoMode = checkedItems.size > 0;

    set({
      mode,
      selectedItem,
      multiplier,
      itemList,
      settings,
      multiTreeSelectedItem,
      checkedItems,
      todoMode,
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
