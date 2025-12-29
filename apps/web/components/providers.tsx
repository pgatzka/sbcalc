"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SettingsProvider } from "@/lib/settings-context";
import { CookieConsent } from "@/components/cookie-consent";

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
