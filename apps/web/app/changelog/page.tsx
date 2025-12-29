import { Metadata } from "next";
import { Megaphone, History } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import CHANGELOG from "@/lib/changelog";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog | Skyblock Calculator",
  description: "Release notes and updates for the Skyblock Calculator.",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Banner */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="px-4 md:px-8 py-10 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Changelog</h1>
            </div>
            <Button variant="outline" asChild>
              <Link href="/" title="Back to Calculator">
                Return Home
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Release notes and recent improvements.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-8 space-y-6">
        {CHANGELOG.map((entry) => (
          <Card key={entry.date}>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5" />
                <CardTitle>{entry.title ?? entry.date}</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {entry.date}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {entry.items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
