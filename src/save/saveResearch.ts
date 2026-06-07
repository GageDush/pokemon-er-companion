import { Confidence, SaveBlockCandidate, SaveOffsetGroup, SaveResearch } from "../types";

export interface SaveSizeFamily {
  id: string;
  label: string;
  blockSize: number;
  blockCount: number;
  bankSize?: number;
  banks: 1 | 2;
  confidence: Confidence;
  notes: string[];
}

export function detectSaveSizeFamily(fileSize: number): SaveSizeFamily {
  if (fileSize === 128 * 1024) {
    return {
      id: "gba-128k",
      label: "128 KiB dual-bank candidate",
      blockSize: 0x1000,
      blockCount: 32,
      bankSize: 64 * 1024,
      banks: 2,
      confidence: "medium",
      notes: [
        "128 KiB saves are often organized as two 64 KiB banks with 4 KiB-aligned sections.",
        "This is a family-level heuristic only; no Elite Redux save offsets are proven from size alone."
      ]
    };
  }

  if (fileSize === 64 * 1024) {
    return {
      id: "gba-64k",
      label: "64 KiB single-bank candidate",
      blockSize: 0x1000,
      blockCount: 16,
      bankSize: 64 * 1024,
      banks: 1,
      confidence: "low",
      notes: [
        "64 KiB saves are compatible with block-aligned GBA save families.",
        "Elite Redux-specific block meaning remains unproven until fixture comparison exists."
      ]
    };
  }

  if (fileSize === 136 * 1024) {
    return {
      id: "gba-136k",
      label: "136 KiB save plus footer/RTC candidate",
      blockSize: 0x1000,
      blockCount: Math.floor(fileSize / 0x1000),
      bankSize: 64 * 1024,
      banks: 2,
      confidence: "low",
      notes: [
        "The trailing bytes may represent RTC or emulator-side footer data.",
        "Treat footer structure as unproven until fixture-backed comparison is available."
      ]
    };
  }

  const blockCount = Math.floor(fileSize / 0x1000);
  return {
    id: "unknown",
    label: fileSize > 0 && fileSize % 0x1000 === 0 ? "Aligned binary save candidate" : "Unknown binary save shape",
    blockSize: fileSize > 0 && fileSize % 0x1000 === 0 ? 0x1000 : Math.max(256, Math.min(fileSize || 256, 0x1000)),
    blockCount: blockCount || 1,
    banks: 1,
    confidence: "low",
    notes: [
      "No structured save-family match was detected from size alone.",
      "Use byte comparison across fixtures before trusting any offset grouping."
    ]
  };
}

export function buildSaveResearch(bytes: Uint8Array, fixtureStatus: SaveResearch["fixtureStatus"] = "none"): SaveResearch {
  const family = detectSaveSizeFamily(bytes.byteLength);
  const blockCandidates = buildBlockCandidates(bytes, family);
  const offsetGroups = buildOffsetGroups(bytes, family, blockCandidates);

  return {
    sizeFamilyId: family.id,
    sizeFamilyLabel: family.label,
    blockSize: family.blockSize,
    blockCount: family.blockCount,
    fixtureStatus,
    provenPartyFields: [],
    blockCandidates,
    offsetGroups,
    notes: family.notes
  };
}

export function buildBlockCandidates(bytes: Uint8Array, family: SaveSizeFamily): SaveBlockCandidate[] {
  const blocks: SaveBlockCandidate[] = [];
  const blockSize = family.blockSize;
  const firstBankBlockCount = family.bankSize ? Math.floor(family.bankSize / blockSize) : family.blockCount;

  for (let index = 0; index < family.blockCount; index += 1) {
    const start = index * blockSize;
    if (start >= bytes.byteLength) break;
    const end = Math.min(bytes.byteLength, start + blockSize);
    const slice = bytes.slice(start, end);
    const nonZeroBytes = slice.reduce((sum, byte) => sum + (byte !== 0 ? 1 : 0), 0);
    const distinctBytes = new Set(slice).size;
    const printableBytes = slice.reduce((sum, byte) => sum + (byte >= 32 && byte <= 126 ? 1 : 0), 0);
    const bank = family.banks === 2 ? (index < firstBankBlockCount ? "a" : "b") : "single";
    const counterpartIndex = family.banks === 2 ? (index < firstBankBlockCount ? index + firstBankBlockCount : index - firstBankBlockCount) : undefined;
    const pairMatch = counterpartIndex !== undefined && counterpartIndex * blockSize < bytes.byteLength
      ? compareBlock(bytes, start, counterpartIndex * blockSize, blockSize)
      : undefined;

    const notes: string[] = [];
    if (pairMatch === true) notes.push("Matches counterpart block in the other bank.");
    if (pairMatch === false) notes.push("Differs from counterpart block in the other bank.");
    if (nonZeroBytes === 0) notes.push("Entire block is zeroed.");
    if (distinctBytes <= 4) notes.push("Very low byte diversity; useful for comparison but likely not a confirmed data section.");

    blocks.push({
      index,
      label: `Block ${index.toString().padStart(2, "0")}`,
      start,
      end,
      length: end - start,
      nonZeroBytes,
      distinctBytes,
      printableRatio: Number((printableBytes / Math.max(1, slice.length)).toFixed(3)),
      bank,
      counterpartIndex,
      pairMatch,
      confidence: family.confidence,
      notes
    });
  }

  return blocks;
}

export function buildOffsetGroups(bytes: Uint8Array, family: SaveSizeFamily, blocks: SaveBlockCandidate[]): SaveOffsetGroup[] {
  const groups: SaveOffsetGroup[] = [];

  if (family.bankSize && family.banks === 2) {
    groups.push({
      id: "bank-a",
      label: "Candidate Bank A",
      start: 0,
      end: Math.min(bytes.byteLength, family.bankSize),
      confidence: "medium",
      reason: "File size supports a dual-bank layout, but bank meaning is not yet Elite Redux-specific proof."
    });

    groups.push({
      id: "bank-b",
      label: "Candidate Bank B",
      start: family.bankSize,
      end: Math.min(bytes.byteLength, family.bankSize * 2),
      confidence: "medium",
      reason: "Second bank candidate derived from file-size family only. Use fixture diffs before assuming active-save selection."
    });
  }

  const activeBlocks = blocks.filter((block) => block.nonZeroBytes > 0);
  let clusterIndex = 0;
  for (const cluster of groupContiguousBlocks(activeBlocks)) {
    clusterIndex += 1;
    groups.push({
      id: `active-cluster-${clusterIndex}`,
      label: `Active block cluster ${clusterIndex}`,
      start: cluster.start,
      end: cluster.end,
      confidence: "low",
      reason: "Consecutive non-zero aligned blocks make a useful fixture-diff target, but not a proven game-data structure."
    });
  }

  if (bytes.byteLength > 256) {
    groups.push({
      id: "front-preview",
      label: "Front-matter preview range",
      start: 0,
      end: Math.min(bytes.byteLength, 256),
      confidence: "low",
      reason: "Useful for header and checksum scouting only. No Elite Redux field mapping is implied."
    });
  }

  return groups;
}

function compareBlock(bytes: Uint8Array, startA: number, startB: number, blockSize: number): boolean {
  for (let offset = 0; offset < blockSize; offset += 1) {
    if (startA + offset >= bytes.byteLength || startB + offset >= bytes.byteLength) return false;
    if (bytes[startA + offset] !== bytes[startB + offset]) return false;
  }
  return true;
}

function groupContiguousBlocks(blocks: SaveBlockCandidate[]): Array<{ start: number; end: number }> {
  if (blocks.length === 0) return [];

  const groups: Array<{ start: number; end: number }> = [];
  let current = { start: blocks[0].start, end: blocks[0].end };

  for (let index = 1; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.start === current.end) {
      current.end = block.end;
      continue;
    }
    groups.push(current);
    current = { start: block.start, end: block.end };
  }
  groups.push(current);
  return groups;
}
