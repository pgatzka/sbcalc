"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === "dark";
  const plain = text.replace(/§./g, "");
  const segments = parseMinecraftColors(text, isDark);

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
