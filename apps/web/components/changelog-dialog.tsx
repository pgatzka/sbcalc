"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Clock, History } from "lucide-react";
import CHANGELOG from "@/lib/changelog";

export function ChangelogDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Changelog"
        >
          <History className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-lg tracking-wide">
            Changelog
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="relative border-l border-border/60 ml-3 space-y-6 pb-2">
            {CHANGELOG.map((entry) => (
              <div key={entry.date} className="relative pl-7">
                <div className="absolute left-0 top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-display font-semibold text-sm">
                      {entry.title ?? entry.date}
                    </h2>
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.date}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {entry.items.map((item, idx) => (
                      <div
                        key={`${entry.date}-${idx}`}
                        className="rounded-md bg-muted/40 border border-border/30 px-3 py-2"
                      >
                        <p className="text-xs font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
      </DialogContent>
    </Dialog>
  );
}
