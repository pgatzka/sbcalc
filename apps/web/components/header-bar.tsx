"use client";

import { Button } from "@workspace/ui/components/button";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ChangelogDialog } from "@/components/changelog-dialog";

export function HeaderBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-wide text-foreground">
              Skyblock Calculator
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={
              mounted
                ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
                : "Toggle theme"
            }
          >
            {!mounted ? (
              <Sun className="w-4 h-4" />
            ) : theme === "dark" || theme === "system" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <ChangelogDialog />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <Link
              href="https://github.com/Hexeption/sbcalc"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
            >
              <SiGithub className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
