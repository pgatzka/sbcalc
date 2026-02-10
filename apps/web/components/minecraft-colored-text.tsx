"use client";

import { parseMinecraftColors } from "@/lib/utils";

interface MinecraftColoredTextProps {
  text: string;
  className?: string;
  title?: string;
}

export function MinecraftColoredText({
  text,
  className,
  title,
}: MinecraftColoredTextProps) {
  const plain = text.replace(/§./g, "");
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
