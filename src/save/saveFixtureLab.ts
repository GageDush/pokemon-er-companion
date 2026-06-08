import { compareSaveBytes, SaveCompareResult } from "./saveCompare";

const SAVE_SECTOR_SIZE = 4096;
const SAVE_FOOTER_OFFSET = 4084;
const SAVE_SIGNATURE = 0x08012025;
const TEAM_SECTOR_ID = 2;
const TEAM_COUNT_OFFSET = 564;
const PARTY_SLOT_SIZE = 76;
const MAX_PARTY_SIZE = 6;
const DIRECT_PC_SECTOR_COUNT = 9;

const PC_LAYOUTS = [
  { id: "new-layout", label: "new layout sectors 8..16", startSectorId: 8 },
  { id: "legacy-layout", label: "legacy layout sectors 5..13", startSectorId: 5 },
  { id: "test-layout", label: "test structure sectors 12..20", startSectorId: 12 }
] as const;

export interface FixtureSectorSummary {
  offset: number;
  sectorIdA?: number;
  sectorIdB?: number;
}

export interface FixtureLayoutOverlap {
  id: string;
  label: string;
  overlap: boolean;
  sectorCountA: number;
  sectorCountB: number;
}

export interface FixtureLabSummary {
  compare: SaveCompareResult;
  changedSectors: FixtureSectorSummary[];
  partyOverlap: boolean;
  partyRangeA?: { start: number; end: number };
  partyRangeB?: { start: number; end: number };
  pcLayoutOverlaps: FixtureLayoutOverlap[];
}

export function buildFixtureLabSummary(a: Uint8Array, b: Uint8Array): FixtureLabSummary {
  const compare = compareSaveBytes(a, b);
  const sectorsA = scanSectorOffsets(a);
  const sectorsB = scanSectorOffsets(b);
  const changedOffsets = Array.from(
    new Set(compare.ranges.map((range) => Math.floor(range.start / SAVE_SECTOR_SIZE) * SAVE_SECTOR_SIZE))
  ).sort((left, right) => left - right);

  const changedSectors = changedOffsets.map((offset) => ({
    offset,
    sectorIdA: sectorsA.sectorIdsByOffset.get(offset),
    sectorIdB: sectorsB.sectorIdsByOffset.get(offset)
  }));

  const partyRangeA = sectorsA.sectorOffsetsById.has(TEAM_SECTOR_ID)
    ? buildPartyRange(sectorsA.sectorOffsetsById.get(TEAM_SECTOR_ID)!)
    : undefined;
  const partyRangeB = sectorsB.sectorOffsetsById.has(TEAM_SECTOR_ID)
    ? buildPartyRange(sectorsB.sectorOffsetsById.get(TEAM_SECTOR_ID)!)
    : undefined;

  const partyOverlap = compare.ranges.some((range) =>
    overlaps(range.start, range.end, partyRangeA?.start, partyRangeA?.end)
    || overlaps(range.start, range.end, partyRangeB?.start, partyRangeB?.end)
  );

  const pcLayoutOverlaps = PC_LAYOUTS.map((layout) => {
    const sectorsForA = getLayoutOffsets(sectorsA.sectorOffsetsById, layout.startSectorId);
    const sectorsForB = getLayoutOffsets(sectorsB.sectorOffsetsById, layout.startSectorId);
    const overlap = compare.ranges.some((range) =>
      sectorsForA.some((offset) => overlaps(range.start, range.end, offset, offset + SAVE_SECTOR_SIZE))
      || sectorsForB.some((offset) => overlaps(range.start, range.end, offset, offset + SAVE_SECTOR_SIZE))
    );

    return {
      id: layout.id,
      label: layout.label,
      overlap,
      sectorCountA: sectorsForA.length,
      sectorCountB: sectorsForB.length
    };
  });

  return {
    compare,
    changedSectors,
    partyOverlap,
    partyRangeA,
    partyRangeB,
    pcLayoutOverlaps
  };
}

function scanSectorOffsets(bytes: Uint8Array) {
  const sectorOffsetsById = new Map<number, number>();
  const sectorIdsByOffset = new Map<number, number>();

  for (let offset = 0; offset + SAVE_SECTOR_SIZE <= Math.min(bytes.length, 114688); offset += SAVE_SECTOR_SIZE) {
    const signature = readU32(bytes, offset + SAVE_FOOTER_OFFSET + 4);
    const sectorId = readU16(bytes, offset + SAVE_FOOTER_OFFSET);
    if (signature !== SAVE_SIGNATURE || sectorId >= 32) continue;
    sectorOffsetsById.set(sectorId, offset);
    sectorIdsByOffset.set(offset, sectorId);
  }

  return { sectorOffsetsById, sectorIdsByOffset };
}

function buildPartyRange(teamSectorOffset: number) {
  const start = teamSectorOffset + TEAM_COUNT_OFFSET;
  const end = teamSectorOffset + TEAM_COUNT_OFFSET + 4 + MAX_PARTY_SIZE * PARTY_SLOT_SIZE;
  return { start, end };
}

function getLayoutOffsets(sectorOffsetsById: Map<number, number>, startSectorId: number): number[] {
  const offsets: number[] = [];
  for (let sectorId = startSectorId; sectorId < startSectorId + DIRECT_PC_SECTOR_COUNT; sectorId += 1) {
    const offset = sectorOffsetsById.get(sectorId);
    if (typeof offset === "number") offsets.push(offset);
  }
  return offsets;
}

function overlaps(rangeStart: number, rangeEnd: number, candidateStart?: number, candidateEnd?: number) {
  if (candidateStart === undefined || candidateEnd === undefined) return false;
  return rangeStart < candidateEnd && rangeEnd > candidateStart;
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
