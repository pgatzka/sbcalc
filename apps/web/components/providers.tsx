"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { CookieConsent } from "@/components/cookie-consent";
import { RecipeDataProvider } from "@/lib/recipe-data-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <RecipeDataProvider>
        {children}
        <CookieConsent variant="default" />
      </RecipeDataProvider>
    </NextThemesProvider>
  );
}
