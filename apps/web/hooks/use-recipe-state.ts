import { useLocalStorage } from "@/hooks/use-local-storage";

export interface ItemListEntry {
  itemId: string;
  quantity: number;
}

/**
 * Hook to manage recipe selection state (mode, selected item, multiplier, item list).
 * All state is persisted to localStorage for hydration safety.
 */
export function useRecipeState() {
  const [mode, setMode] = useLocalStorage<"single" | "multi">(
    "sbcalc_mode",
    "single",
  );
  const [selectedItem, setSelectedItem] = useLocalStorage<string | null>(
    "sbcalc_selectedItem",
    null,
  );
  const [multiplier, setMultiplier] = useLocalStorage<number>(
    "sbcalc_multiplier",
    1,
  );
  const [itemList, setItemList] = useLocalStorage<ItemListEntry[]>(
    "sbcalc_itemList",
    [],
  );
  const [lastMultiSelectedItem, setLastMultiSelectedItem] = useLocalStorage<
    string | null
  >("sbcalc_lastMultiSelectedItem", null);

  const handleModeSwitch = (newMode: "single" | "multi") => {
    setMode(newMode);
    if (newMode === "single") {
      setItemList([]);
    } else {
      setSelectedItem(null);
      setMultiplier(1);
    }
  };

  const getRecipeState = () => {
    if (mode === "single" && selectedItem) {
      return { [selectedItem]: multiplier };
    } else if (mode === "multi") {
      return Object.fromEntries(
        itemList.map((item) => [item.itemId, item.quantity]),
      );
    }
    return {};
  };

  return {
    mode,
    setMode,
    selectedItem,
    setSelectedItem,
    multiplier,
    setMultiplier,
    itemList,
    setItemList,
    lastMultiSelectedItem,
    setLastMultiSelectedItem,
    handleModeSwitch,
    getRecipeState,
  };
}
