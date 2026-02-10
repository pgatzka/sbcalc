"use client";

import { parseMinecraftColors } from "@/lib/utils";

interface MinecraftColoredTextProps {
  text: string;
  className?: string;
  title?: string;
  enabled?: boolean;
}

export function MinecraftColoredText({
  text,
  className,
  title,
  enabled = true,
}: MinecraftColoredTextProps) {
  const plain = text.replace(/§./g, "");

  if (!enabled) {
    return (
      <span className={className} title={title ?? plain}>
        {plain}
      </span>
    );
  }

  const segments = parseMinecraftColors(text);

  return (
    <span className={className} title={title ?? plain}>
      {segments.map((segment, idx) => (
        <span key={idx} style={{ color: segment.color }}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}
