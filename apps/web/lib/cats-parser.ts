// CATS v1 binary archive parser
// Spec: https://github.com/meowdding/cats-file-format/blob/main/format.md

const CATS_MAGIC = 0x43415453; // "CATS"
const CATS_VERSION = 0x01;
const COMPRESSION_NONE = 0xff;
const COMPRESSION_GZIP = 0xfe;

interface CatsFileEntry {
  offset: number;
  size: number;
  compression: number;
}

class CatsReader {
  private view: DataView;
  private pos = 0;

  constructor(private buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  readByte(): number {
    const v = this.view.getUint8(this.pos);
    this.pos += 1;
    return v;
  }

  readUShort(): number {
    const v = this.view.getUint16(this.pos, false); // big-endian
    this.pos += 2;
    return v;
  }

  readInt(): number {
    const v = this.view.getInt32(this.pos, false); // big-endian
    this.pos += 4;
    return v;
  }

  readUInt(): number {
    const v = this.view.getUint32(this.pos, false); // big-endian
    this.pos += 4;
    return v;
  }

  readString(): string {
    const len = this.readByte();
    const bytes = new Uint8Array(this.buffer, this.pos, len);
    this.pos += len;
    return new TextDecoder("ascii").decode(bytes);
  }

  get position(): number {
    return this.pos;
  }
}

function readEntry(
  reader: CatsReader,
  prefix: string,
  flat: Map<string, CatsFileEntry>,
): void {
  const type = reader.readByte();
  const name = reader.readString();

  if (type === 0x00) {
    const offset = reader.readInt();
    const size = reader.readInt();
    const compression = reader.readByte();
    flat.set(`${prefix}${name}`, { offset, size, compression });
    return;
  }

  if (type === 0x01) {
    const count = reader.readUShort();
    const dirPath = `${prefix}${name}/`;
    for (let i = 0; i < count; i++) {
      readEntry(reader, dirPath, flat);
    }
    return;
  }

  throw new Error(`Unknown CATS entry type: 0x${type.toString(16)}`);
}

export interface CatsArchive {
  files: Map<string, CatsFileEntry>;
  headerSize: number;
  data: ArrayBuffer;
}

export function parseCats(buffer: ArrayBuffer): CatsArchive {
  const reader = new CatsReader(buffer);

  const magic = reader.readUInt();
  if (magic !== CATS_MAGIC) {
    throw new Error(
      `Invalid CATS magic: 0x${magic.toString(16)} (expected 0x${CATS_MAGIC.toString(16)})`,
    );
  }

  const version = reader.readByte();
  if (version !== CATS_VERSION) {
    throw new Error(`Unsupported CATS version: ${version}`);
  }

  // Read root directory (no type byte or name at root level)
  const rootCount = reader.readUShort();
  const flat = new Map<string, CatsFileEntry>();
  for (let i = 0; i < rootCount; i++) {
    readEntry(reader, "/", flat);
  }

  return { files: flat, headerSize: reader.position, data: buffer };
}

export async function extractFile(
  archive: CatsArchive,
  path: string,
): Promise<Uint8Array | null> {
  const entry = archive.files.get(path);
  if (!entry) return null;

  const raw = new Uint8Array(
    archive.data,
    archive.headerSize + entry.offset,
    entry.size,
  );

  if (entry.compression === COMPRESSION_NONE) {
    return raw;
  }

  if (entry.compression === COMPRESSION_GZIP) {
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(raw);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  throw new Error(
    `Unknown compression type: 0x${entry.compression.toString(16)}`,
  );
}

export async function extractFileAsText(
  archive: CatsArchive,
  path: string,
): Promise<string | null> {
  const bytes = await extractFile(archive, path);
  if (!bytes) return null;
  return new TextDecoder("utf-8").decode(bytes);
}

export async function extractFileAsBlob(
  archive: CatsArchive,
  path: string,
  mimeType = "application/octet-stream",
): Promise<Blob | null> {
  const bytes = await extractFile(archive, path);
  if (!bytes) return null;
  return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: mimeType });
}

export async function extractFileAsObjectURL(
  archive: CatsArchive,
  path: string,
  mimeType = "image/png",
): Promise<string | null> {
  const blob = await extractFileAsBlob(archive, path, mimeType);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export function listFiles(archive: CatsArchive): string[] {
  return Array.from(archive.files.keys());
}

export function listFilesInDir(
  archive: CatsArchive,
  dir: string,
): string[] {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  return Array.from(archive.files.keys()).filter((p) =>
    p.startsWith(prefix),
  );
}
