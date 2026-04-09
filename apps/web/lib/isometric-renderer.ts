import sharp from "sharp";

// 3D isometric head rendering ported from SkyCrypt
// https://github.com/SkyCryptWebsite/SkyCrypt-Backend/blob/dev/src/lib/renderer.go

const SKEW_A = 26 / 45;
const SKEW_B = SKEW_A * 2;
const SECTION_SIZE = 8;

type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const TRANSFORM_TOP_BOTTOM: Matrix = [1, 1, 0, -SKEW_A, SKEW_A, 0, 0, 0, 1];

const TRANSFORM_FRONT_BACK: Matrix = [
  1,
  0,
  0,
  -SKEW_A,
  SKEW_B,
  SKEW_A,
  0,
  0,
  1,
];

const TRANSFORM_RIGHT_LEFT: Matrix = [1, 0, 0, SKEW_A, SKEW_B, 0, 0, 0, 1];

interface SectionOpts {
  x: number;
  y: number;
  matrix: Matrix;
  translateX: number;
  translateY: number;
  flip: boolean;
  scale: number;
  isOverlay?: boolean;
}

function matMultiply(a: Matrix, b: Matrix): Matrix {
  const r = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        r[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!;
      }
    }
  }
  return r as Matrix;
}

function matTransform(m: Matrix, px: number, py: number): [number, number] {
  const x = m[0] * px + m[1] * py + m[2];
  const y = m[3] * px + m[4] * py + m[5];
  const w = m[6] * px + m[7] * py + m[8];
  if (w !== 0) return [x / w, y / w];
  return [x, y];
}

function cropSection(
  pixels: Buffer,
  skinW: number,
  sx: number,
  sy: number,
): Buffer {
  const out = Buffer.alloc(SECTION_SIZE * SECTION_SIZE * 4);
  const x0 = sx * SECTION_SIZE;
  const y0 = sy * SECTION_SIZE;
  for (let dy = 0; dy < SECTION_SIZE; dy++) {
    for (let dx = 0; dx < SECTION_SIZE; dx++) {
      const srcIdx = ((y0 + dy) * skinW + (x0 + dx)) * 4;
      const dstIdx = (dy * SECTION_SIZE + dx) * 4;
      out[dstIdx] = pixels[srcIdx]!;
      out[dstIdx + 1] = pixels[srcIdx + 1]!;
      out[dstIdx + 2] = pixels[srcIdx + 2]!;
      out[dstIdx + 3] = pixels[srcIdx + 3]!;
    }
  }
  return out;
}

function isSectionFullyOpaque(section: Buffer): boolean {
  for (let i = 3; i < section.length; i += 4) {
    if (section[i] !== 255) return false;
  }
  return true;
}

function overlay3DSection(
  output: Buffer,
  outputSize: number,
  skin: Buffer,
  skinW: number,
  opts: SectionOpts,
): void {
  const section = cropSection(skin, skinW, opts.x, opts.y);
  if (opts.isOverlay && isSectionFullyOpaque(section)) return;

  const baseMatrix = opts.matrix;
  const translateMatrix: Matrix = [
    1,
    0,
    opts.translateX,
    0,
    1,
    opts.translateY,
    0,
    0,
    1,
  ];
  const scaleX = opts.flip ? -opts.scale : opts.scale;
  const scaleMatrix: Matrix = [scaleX, 0, 0, 0, opts.scale, 0, 0, 0, 1];

  const finalMatrix = matMultiply(
    matMultiply(baseMatrix, translateMatrix),
    scaleMatrix,
  );

  const det =
    finalMatrix[0] *
      (finalMatrix[4] * finalMatrix[8] - finalMatrix[5] * finalMatrix[7]) -
    finalMatrix[1] *
      (finalMatrix[3] * finalMatrix[8] - finalMatrix[5] * finalMatrix[6]) +
    finalMatrix[2] *
      (finalMatrix[3] * finalMatrix[7] - finalMatrix[4] * finalMatrix[6]);

  if (Math.abs(det) < 1e-10) return;

  const inv: Matrix = [
    (finalMatrix[4] * finalMatrix[8] - finalMatrix[5] * finalMatrix[7]) / det,
    (finalMatrix[2] * finalMatrix[7] - finalMatrix[1] * finalMatrix[8]) / det,
    (finalMatrix[1] * finalMatrix[5] - finalMatrix[2] * finalMatrix[4]) / det,
    (finalMatrix[5] * finalMatrix[6] - finalMatrix[3] * finalMatrix[8]) / det,
    (finalMatrix[0] * finalMatrix[8] - finalMatrix[2] * finalMatrix[6]) / det,
    (finalMatrix[2] * finalMatrix[3] - finalMatrix[0] * finalMatrix[5]) / det,
    (finalMatrix[3] * finalMatrix[7] - finalMatrix[4] * finalMatrix[6]) / det,
    (finalMatrix[1] * finalMatrix[6] - finalMatrix[0] * finalMatrix[7]) / det,
    (finalMatrix[0] * finalMatrix[4] - finalMatrix[1] * finalMatrix[3]) / det,
  ];

  for (let y = 0; y < outputSize; y++) {
    for (let x = 0; x < outputSize; x++) {
      const [srcXf, srcYf] = matTransform(inv, x, y);
      const srcX = Math.round(srcXf);
      const srcY = Math.round(srcYf);

      if (srcX < 0 || srcX >= SECTION_SIZE || srcY < 0 || srcY >= SECTION_SIZE)
        continue;

      const srcIdx = (srcY * SECTION_SIZE + srcX) * 4;
      const topA = section[srcIdx + 3]!;
      if (topA === 0) continue;

      const dstIdx = (y * outputSize + x) * 4;

      if (topA === 255) {
        output[dstIdx] = section[srcIdx]!;
        output[dstIdx + 1] = section[srcIdx + 1]!;
        output[dstIdx + 2] = section[srcIdx + 2]!;
        output[dstIdx + 3] = 255;
      } else {
        const alpha = topA / 255;
        const invAlpha = 1 - alpha;
        output[dstIdx] = Math.round(
          section[srcIdx]! * alpha + output[dstIdx]! * invAlpha,
        );
        output[dstIdx + 1] = Math.round(
          section[srcIdx + 1]! * alpha + output[dstIdx + 1]! * invAlpha,
        );
        output[dstIdx + 2] = Math.round(
          section[srcIdx + 2]! * alpha + output[dstIdx + 2]! * invAlpha,
        );
        output[dstIdx + 3] = Math.min(
          255,
          Math.round(topA + output[dstIdx + 3]! * invAlpha),
        );
      }
    }
  }
}

export function renderHead(
  skin: Buffer,
  skinW: number,
  outputSize: number,
): Buffer {
  const size = outputSize;
  const scale = size / 20;
  const output = Buffer.alloc(size * size * 4);

  const sections: SectionOpts[] = [
    // Bottom overlay
    {
      x: 6,
      y: 0,
      matrix: TRANSFORM_TOP_BOTTOM,
      translateX: size * (-145 / 256),
      translateY: size * (177 / 256),
      flip: false,
      scale,
      isOverlay: true,
    },
    // Back overlay
    {
      x: 7,
      y: 1,
      matrix: TRANSFORM_FRONT_BACK,
      translateX: size * (26 / 256),
      translateY: size * (70 / 256),
      flip: false,
      scale: scale * (9 / 8),
      isOverlay: true,
    },
    // Left overlay
    {
      x: 6,
      y: 1,
      matrix: TRANSFORM_RIGHT_LEFT,
      translateX: size * (231 / 256) * (8 / 8.1),
      translateY: size * (-56 / 256),
      flip: true,
      scale: scale * (9 / 8),
      isOverlay: true,
    },
    // Bottom base
    {
      x: 2,
      y: 0,
      matrix: TRANSFORM_TOP_BOTTOM,
      translateX: (size * (-145 / 256)) / (8 / 8.1) + size * (10 / 256),
      translateY: size * (177 / 256),
      flip: false,
      scale,
    },
    // Back base
    {
      x: 3,
      y: 1,
      matrix: TRANSFORM_FRONT_BACK,
      translateX: size * (26 / 256) * (8 / 9) + 10,
      translateY: size * (70 / 256) * (8 / 9) + 12,
      flip: false,
      scale,
    },
    // Left base
    {
      x: 0,
      y: 1,
      matrix: TRANSFORM_RIGHT_LEFT,
      translateX: (size * (231 / 256)) / (8 / 8.1) - size * (10 / 256) - 45,
      translateY: size * (-56 / 256) + 6,
      flip: false,
      scale,
    },
    // Top base
    {
      x: 1,
      y: 0,
      matrix: TRANSFORM_TOP_BOTTOM,
      translateX: size * (-40 / 256),
      translateY: size * (83 / 256),
      flip: false,
      scale,
    },
    // Front base
    {
      x: 1,
      y: 1,
      matrix: TRANSFORM_FRONT_BACK,
      translateX: size * (132.5 / 256),
      translateY: size * (177.5 / 256),
      flip: false,
      scale,
    },
    // Right base
    {
      x: 2,
      y: 1,
      matrix: TRANSFORM_RIGHT_LEFT,
      translateX: size * (121 / 256),
      translateY: size * (52 / 256),
      flip: true,
      scale,
    },
    // Front overlay
    {
      x: 5,
      y: 1,
      matrix: TRANSFORM_FRONT_BACK,
      translateX: size * (132.5 / 256) * (8.1 / 8),
      translateY: size * (177.5 / 256),
      flip: false,
      scale: scale * (9 / 8),
      isOverlay: true,
    },
    // Right overlay
    {
      x: 4,
      y: 1,
      matrix: TRANSFORM_RIGHT_LEFT,
      translateX: size * (26 / 256) * (8 / 8.1),
      translateY: size * (52 / 256),
      flip: false,
      scale: scale * (9 / 8),
      isOverlay: true,
    },
    // Top overlay
    {
      x: 5,
      y: 0,
      matrix: TRANSFORM_TOP_BOTTOM,
      translateX: size * (-40 / 256) * (8 / 8.1),
      translateY: size * (83 / 256) * (8 / 9),
      flip: false,
      scale: scale * (9 / 8),
      isOverlay: true,
    },
  ];

  for (const section of sections) {
    overlay3DSection(output, outputSize, skin, skinW, section);
  }

  return output;
}

export async function renderToPng(
  rawPixels: Buffer,
  size: number,
): Promise<Buffer> {
  return sharp(rawPixels, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function loadTextureRaw(
  pngBuffer: Buffer,
): Promise<{ pixels: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { pixels: data, width: info.width, height: info.height };
}
