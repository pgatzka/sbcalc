"use client";

import Link from "next/link";
import { Github, History, Heart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export function HeaderBar() {
    return (
        <div className="text-center py-8 px-4 relative">
            <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href="/changelog"
                            title="View Changelog"
                            className="flex items-center gap-2"
                        >
                            <History className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Changelog</span>
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href="https://github.com/Hexeption/sbcalc"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on GitHub"
                            className="flex items-center gap-2"
                        >
                            <Github className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">GitHub</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
                Skyblock Calculator
            </h1>
            <p className="text-muted-foreground text-lg">
                Calculate crafting recipes, forge times, and base material requirements
                for any Hypixel Skyblock item.
            </p>
        </div>
    );
}
