"use client";

import { Label } from "@workspace/ui/components/label";
import { useTexturePackStore } from "@/lib/texture-pack-store";

export function TexturePackSettings() {
  const packs = useTexturePackStore((s) => s.packs);
  const selectPack = useTexturePackStore((s) => s.selectPack);

  if (packs.length === 0) return null;

  const anyEnabled = packs.some((p) => p.enabled);

  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <input
          type="radio"
          name="texture-pack"
          id="pack-none"
          checked={!anyEnabled}
          onChange={() => selectPack(null)}
          className="mt-0.5 accent-primary"
        />
        <Label htmlFor="pack-none" className="cursor-pointer">
          None
        </Label>
      </div>
      {packs.map((pack) => (
        <div key={pack.id} className="flex items-start space-x-3">
          <input
            type="radio"
            name="texture-pack"
            id={`pack-${pack.id}`}
            checked={pack.enabled}
            onChange={() => selectPack(pack.id)}
            disabled={pack.loading}
            className="mt-0.5 accent-primary"
          />
          <div className="grid gap-0.5 leading-none">
            <Label htmlFor={`pack-${pack.id}`} className="cursor-pointer">
              {pack.name}
              {pack.loading && (
                <span className="text-muted-foreground ml-2 text-xs">
                  Loading...
                </span>
              )}
            </Label>
            {pack.error && (
              <p className="text-xs text-destructive">{pack.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
