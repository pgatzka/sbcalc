"use client";

import { createContext, useContext } from "react";
import { itemsData, recipes } from "@/lib/data";
import type { RecipesData } from "@/lib/types";

interface RecipeDataContextValue {
  recipes: RecipesData;
  itemsData: RecipesData;
}

const RecipeDataContext = createContext<RecipeDataContextValue>({
  recipes,
  itemsData,
});

export function RecipeDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RecipeDataContext.Provider value={{ recipes, itemsData }}>
      {children}
    </RecipeDataContext.Provider>
  );
}

export function useRecipeData() {
  return useContext(RecipeDataContext);
}
