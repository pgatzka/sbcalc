"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

/**
 * Manages the selected item in multi-tree mode,
 * including persistence and restoration from localStorage.
 */
export function useMultiTreeSelection(
  mode: "single" | "multi",
  itemList: Array<{ itemId: string; quantity: number }>,
) {
  const [multiTreeSelectedItem, setMultiTreeSelectedItem] = useState<
    string | null
  >(null);
  const [lastMultiSelectedItem, setLastMultiSelectedItem] = useLocalStorage<
    string | null
  >("sbcalc_lastMultiSelectedItem", null);
  const [hasRestored, setHasRestored] = useState(false);

  // Reset restoration flag when switching to single mode
  useEffect(() => {
    if (mode === "single") {
      setHasRestored(false);
    }
  }, [mode]);

  // Restore last selected item when entering multi mode
  useEffect(() => {
    if (
      mode === "multi" &&
      lastMultiSelectedItem &&
      itemList.length > 0 &&
      !hasRestored
    ) {
      const itemExists = itemList.some(
        (item) => item.itemId === lastMultiSelectedItem,
      );
      if (itemExists) {
        setMultiTreeSelectedItem(lastMultiSelectedItem);
        setHasRestored(true);
      }
    }
  }, [mode, hasRestored, itemList, lastMultiSelectedItem]);

  // Persist selected item
  useEffect(() => {
    if (mode === "multi" && multiTreeSelectedItem) {
      setLastMultiSelectedItem(multiTreeSelectedItem);
    }
  }, [mode, multiTreeSelectedItem, setLastMultiSelectedItem]);

  return {
    multiTreeSelectedItem,
    setMultiTreeSelectedItem,
  };
}
