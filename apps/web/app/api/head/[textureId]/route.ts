import { type NextRequest, NextResponse } from "next/server";
import {
  loadTextureRaw,
  renderHead,
  renderToPng,
} from "@/lib/isometric-renderer";

const OUTPUT_SIZE = 128;
const MAX_CACHE_SIZE = 500;

// Validate texture IDs to prevent SSRF
const TEXTURE_ID_PATTERN = /^[a-f0-9]{32,128}$/i;

// LRU cache: rendered PNG buffers keyed by texture ID.
// Map preserves insertion order — oldest entries are evicted first.
const cache = new Map<string, ArrayBuffer>();

function getCached(key: string): ArrayBuffer | undefined {
  const value = cache.get(key);
  if (value) {
    // Move to end (most recently used)
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

function setCached(key: string, value: ArrayBuffer) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ textureId: string }> },
) {
  const { textureId } = await params;

  if (!TEXTURE_ID_PATTERN.test(textureId)) {
    return NextResponse.json({ error: "Invalid texture ID" }, { status: 400 });
  }

  const cached = getCached(textureId);
  if (cached) {
    return new NextResponse(new Blob([cached], { type: "image/png" }), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  try {
    const response = await fetch(
      `https://textures.minecraft.net/texture/${textureId}`,
      { next: { revalidate: 86400 } },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Texture not found" }, { status: 404 });
    }

    const skinBuffer = Buffer.from(await response.arrayBuffer());
    const { pixels, width } = await loadTextureRaw(skinBuffer);

    const headPixels = renderHead(pixels, width, OUTPUT_SIZE);
    const png = await renderToPng(headPixels, OUTPUT_SIZE);
    const ab = png.buffer.slice(
      png.byteOffset,
      png.byteOffset + png.byteLength,
    ) as ArrayBuffer;

    setCached(textureId, ab);

    return new NextResponse(new Blob([ab], { type: "image/png" }), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to render head" },
      { status: 500 },
    );
  }
}
