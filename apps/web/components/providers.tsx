"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { CookieConsent } from "@/components/cookie-consent";
import { SettingsProvider } from "@/lib/settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <SettingsProvider>
        {children}
        <CookieConsent variant="default" />
      </SettingsProvider>
    </NextThemesProvider>
  );
}
