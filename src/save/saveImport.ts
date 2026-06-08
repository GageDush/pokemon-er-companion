import { gunzipSync, unzipSync } from "fflate";

const RAW_SAVE_SIZES = new Set([64 * 1024, 128 * 1024, 136 * 1024]);
const SAVE_SECTOR_SIZE = 4096;
const SAVE_FOOTER_OFFSET = 4084;
const SAVE_SIGNATURE = 0x08012025;
const EMBEDDED_SAVE_SECTOR_COUNT = 20;
const EMBEDDED_SAVE_BYTES = SAVE_SECTOR_SIZE * EMBEDDED_SAVE_SECTOR_COUNT;
const PADDED_SAVE_BYTES = 128 * 1024;

export interface SaveImportCandidate {
  fileName: string;
  bytes: Uint8Array;
  notes: string[];
}

export interface SaveImportResult {
  candidates: SaveImportCandidate[];
  warnings: string[];
}

export async function loadSaveCandidates(file: File): Promise<SaveImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return extractSaveCandidatesFromBytes(file.name, bytes);
}

export function extractSaveCandidatesFromBytes(fileName: string, bytes: Uint8Array): SaveImportResult {
  const lowered = fileName.toLowerCase();
  if (looksLikeRawSave(lowered, bytes)) {
    return {
      candidates: [{ fileName, bytes, notes: ["Loaded as direct raw save bytes."] }],
      warnings: []
    };
  }

  if (lowered.endsWith(".zip")) {
    return extractFromZip(fileName, bytes);
  }

  if (lowered.endsWith(".gz")) {
    return extractFromGzip(fileName, bytes);
  }

  const embedded = extractEmbeddedSaveCandidate(fileName, bytes);
  if (embedded) {
    return {
      candidates: [embedded],
      warnings: ["Loaded a save-state-like binary and extracted an embedded Elite Redux save candidate read-only."]
    };
  }

  return {
    candidates: [{ fileName, bytes, notes: ["Loaded as generic binary input because no archive or embedded save layout was detected."] }],
    warnings: ["Could not positively identify this file as a raw save or known mobile export. Parsing continues read-only with low confidence."]
  };
}

function extractFromZip(fileName: string, bytes: Uint8Array): SaveImportResult {
  const archive = unzipSync(bytes);
  const collected: SaveImportCandidate[] = [];
  const warnings = [`Archive import: ${Object.keys(archive).length} file(s) inspected read-only from ${fileName}.`];

  for (const [entryName, entryBytes] of Object.entries(archive)) {
    const normalized = entryName.replace(/\\/g, "/");
    if (normalized.endsWith("/")) continue;
    if (shouldIgnoreArchiveEntry(normalized)) continue;
    const nested = extractSaveCandidatesFromBytes(normalized.split("/").pop() ?? normalized, entryBytes);
    for (const candidate of nested.candidates) {
      collected.push({
        ...candidate,
        fileName: `${stripExtension(fileName)}__${candidate.fileName}`,
        notes: [`Extracted from archive entry ${normalized}.`, ...candidate.notes]
      });
    }
    warnings.push(...nested.warnings.map((warning) => `${normalized}: ${warning}`));
  }

  return {
    candidates: dedupeCandidates(collected),
    warnings
  };
}

function extractFromGzip(fileName: string, bytes: Uint8Array): SaveImportResult {
  const inflated = gunzipSync(bytes);
  const innerName = stripExtension(fileName);

  if (looksLikeRawSave(innerName, inflated)) {
    return {
      candidates: [{
        fileName: `${innerName}.sav`,
        bytes: inflated,
        notes: ["Gunzip-expanded to direct raw save bytes."]
      }],
      warnings: [`Expanded gzip save artifact from ${fileName}.`]
    };
  }

  const embedded = extractEmbeddedSaveCandidate(innerName, inflated);
  if (embedded) {
    return {
      candidates: [embedded],
      warnings: [`Expanded gzip mobile GBA state export from ${fileName} and extracted an embedded save candidate.`]
    };
  }

  return {
    candidates: [{
      fileName: `${innerName}.bin`,
      bytes: inflated,
      notes: ["Gunzip-expanded binary did not match a proven raw save layout."]
    }],
    warnings: [`Expanded gzip artifact from ${fileName}, but no embedded Elite Redux save layout was proven.`]
  };
}

function extractEmbeddedSaveCandidate(fileName: string, bytes: Uint8Array): SaveImportCandidate | undefined {
  const bestStart = findEmbeddedSaveOffset(bytes);
  if (bestStart === undefined) return undefined;

  const extracted = new Uint8Array(PADDED_SAVE_BYTES);
  extracted.fill(0xff);
  extracted.set(bytes.slice(bestStart, bestStart + EMBEDDED_SAVE_BYTES));
  const ids = Array.from({ length: EMBEDDED_SAVE_SECTOR_COUNT }, (_, index) => readU16(bytes, bestStart + index * SAVE_SECTOR_SIZE + SAVE_FOOTER_OFFSET));

  return {
    fileName: `${stripExtension(fileName)}.sav`,
    bytes: extracted,
    notes: [
      `Embedded 20-sector save candidate extracted at 0x${bestStart.toString(16)} from a state export.`,
      `Observed sector ID order: ${ids.join(", ")}.`,
      "Tail bytes were padded with 0xFF to reconstruct a 128 KiB read-only save candidate."
    ]
  };
}

function findEmbeddedSaveOffset(bytes: Uint8Array): number | undefined {
  let bestStart: number | undefined;
  let bestScore = -1;

  for (let start = 0; start <= bytes.length - EMBEDDED_SAVE_BYTES; start += 4) {
    let score = 0;
    const ids: number[] = [];
    for (let sectorIndex = 0; sectorIndex < EMBEDDED_SAVE_SECTOR_COUNT; sectorIndex += 1) {
      const sectorStart = start + sectorIndex * SAVE_SECTOR_SIZE;
      const sectorId = readU16(bytes, sectorStart + SAVE_FOOTER_OFFSET);
      const signature = readU32(bytes, sectorStart + SAVE_FOOTER_OFFSET + 4);
      if (signature === SAVE_SIGNATURE && sectorId < EMBEDDED_SAVE_SECTOR_COUNT) {
        score += 1;
        ids.push(sectorId);
      } else {
        ids.push(-1);
      }
    }

    if (score < EMBEDDED_SAVE_SECTOR_COUNT) {
      continue;
    }

    const uniqueIds = new Set(ids);
    const isRotatingSequence = ids.every((id, index) => id === (ids[0] + index) % EMBEDDED_SAVE_SECTOR_COUNT);
    if (uniqueIds.size === EMBEDDED_SAVE_SECTOR_COUNT) score += 10;
    if (isRotatingSequence) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestStart = start;
    }
  }

  return bestStart;
}

function dedupeCandidates(candidates: SaveImportCandidate[]): SaveImportCandidate[] {
  const seen = new Map<string, SaveImportCandidate>();
  for (const candidate of candidates) {
    const key = fingerprintBytes(candidate.bytes);
    if (!seen.has(key)) {
      seen.set(key, candidate);
      continue;
    }
    const existing = seen.get(key);
    if (existing) {
      existing.notes = Array.from(new Set(existing.notes.concat(candidate.notes)));
    }
  }
  return Array.from(seen.values());
}

function fingerprintBytes(bytes: Uint8Array): string {
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return `${bytes.length}:${hash >>> 0}`;
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function looksLikeRawSave(fileName: string, bytes: Uint8Array): boolean {
  return /\.(sav|srm)$/i.test(fileName) || RAW_SAVE_SIZES.has(bytes.length);
}

function shouldIgnoreArchiveEntry(fileName: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|txt|json)$/i.test(fileName);
}

function readU16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readU32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0)
    | ((bytes[offset + 1] ?? 0) << 8)
    | ((bytes[offset + 2] ?? 0) << 16)
    | ((bytes[offset + 3] ?? 0) << 24)) >>> 0;
}
