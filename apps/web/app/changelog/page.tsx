import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CHANGELOG from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog | Skyblock Calculator",
  description: "Release notes and updates for the Skyblock Calculator.",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/" title="Back to Calculator">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="font-display text-lg font-semibold tracking-wide">
              Changelog
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="relative border-l border-border/60 ml-3 space-y-8">
          {CHANGELOG.map((entry) => (
            <div key={entry.date} className="relative pl-8">
              <div className="absolute left-0 top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display font-semibold text-base">
                    {entry.title ?? entry.date}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.date}
                  </span>
                </div>
                <div className="space-y-2">
                  {entry.items.map((item, idx) => (
                    <div
                      key={`${entry.date}-${idx}`}
                      className="rounded-lg bg-card/60 border border-border/40 px-4 py-3"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
