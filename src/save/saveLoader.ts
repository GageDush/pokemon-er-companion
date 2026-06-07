import { ParsedSave, SaveMetadata } from "../types";

export const HEX_PREVIEW_BYTES = 256;

export function detectLikelySaveFormat(fileSize: number): string {
  if (fileSize === 128 * 1024) return "GBA 128 KiB save";
  if (fileSize === 64 * 1024) return "GBA 64 KiB save";
  if (fileSize === 136 * 1024) return "GBA save with RTC/footer data";
  if (fileSize > 0 && fileSize % 0x1000 === 0) return "Block-aligned binary save";
  return "Unknown binary save";
}

export function toHexPreview(bytes: Uint8Array, limit = HEX_PREVIEW_BYTES): string {
  const preview = bytes.slice(0, limit);
  const lines: string[] = [];
  for (let offset = 0; offset < preview.length; offset += 16) {
    const chunk = preview.slice(offset, offset + 16);
    const hex = Array.from(chunk)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(chunk)
      .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
      .join("");
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(47, " ")}  ${ascii}`);
  }
  return lines.join("\n");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function analyzeSaveBytes(fileName: string, bytes: Uint8Array): Promise<SaveMetadata> {
  return {
    fileName,
    fileSize: bytes.byteLength,
    sha256: await sha256Hex(bytes),
    hexPreview: toHexPreview(bytes),
    likelyFormat: detectLikelySaveFormat(bytes.byteLength),
    checksumStatus: "unknown",
    parserConfidence: "low"
  };
}

export async function parseSaveReadOnly(fileName: string, bytes: Uint8Array): Promise<ParsedSave> {
  const metadata = await analyzeSaveBytes(fileName, bytes);
  return {
    metadata,
    party: [],
    boxes: [],
    warnings: [
      "Read-only metadata parsed. Party and PC offsets are not confirmed for Elite Redux in this repository yet.",
      "No save bytes were mutated."
    ]
  };
}

export async function analyzeSaveFile(file: File): Promise<ParsedSave> {
  const buffer = await file.arrayBuffer();
  return parseSaveReadOnly(file.name, new Uint8Array(buffer));
}

export function exportSaveDebugJson(save: ParsedSave): string {
  return JSON.stringify(save, null, 2);
}
