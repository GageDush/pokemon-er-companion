import { Item, Move, ParsedPokemon, ParsedSave, SaveMetadata, Species } from "../types";
import { SaveParserLookupContext } from "../app/dataClient";
import { buildSaveResearch, detectSaveSizeFamily } from "./saveResearch";
import { loadSaveCandidates } from "./saveImport";

export const HEX_PREVIEW_BYTES = 256;
const SAVE_SECTOR_SIZE = 4096;
const SAVE_FOOTER_OFFSET = 4084;
const TEAM_SECTOR_ID = 2;
const TEAM_COUNT_OFFSET = 564;
const TEAM_START_OFFSET = 568;
const PARTY_SLOT_SIZE = 76;
const BOX_SLOT_SIZE = 80;
const BOX_COUNT = 14;
const BOX_CAPACITY = 30;
const DIRECT_PC_SECTOR_COUNT = 9;
const DIRECT_PC_FIRST_SECTOR_SKIP = 4;
const DIRECT_PC_SECTOR_DATA_BYTES = 3968;
const DIRECT_PC_LAST_SECTOR_DATA_BYTES = 2000;

interface PcLayoutCandidate {
  id: string;
  label: string;
  startSectorId: number;
}

const PC_LAYOUT_CANDIDATES: PcLayoutCandidate[] = [
  { id: "new-layout", label: "new layout sectors 8..16", startSectorId: 8 },
  { id: "legacy-layout", label: "legacy layout sectors 5..13", startSectorId: 5 },
  { id: "test-layout", label: "test structure sectors 12..20", startSectorId: 12 }
];

interface EliteReduxFooterData {
  teamSectorOffset?: number;
  pcSectorOffsets: number[];
  sectorOffsets: number[];
}

interface RawPartyMon {
  species: number;
  heldItem: number;
  moves: number[];
  level: number;
  abilitySlot: number;
}

interface RawBoxMon {
  species: number;
  heldItem: number;
  moves: number[];
  abilitySlot: number;
}

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
  const sizeFamily = detectSaveSizeFamily(bytes.byteLength);
  return {
    fileName,
    fileSize: bytes.byteLength,
    sha256: await sha256Hex(bytes),
    hexPreview: toHexPreview(bytes),
    likelyFormat: detectLikelySaveFormat(bytes.byteLength),
    sizeFamily: sizeFamily.label,
    checksumStatus: "unknown",
    parserConfidence: "low"
  };
}

export async function parseSaveReadOnly(fileName: string, bytes: Uint8Array, lookups?: SaveParserLookupContext): Promise<ParsedSave> {
  const metadata = await analyzeSaveBytes(fileName, bytes);
  const parsed = lookups ? parseEliteReduxSave(bytes, lookups) : { party: [], boxes: [], warnings: [] };
  const parserConfidence = deriveParserConfidence(parsed.party, parsed.boxes);
  metadata.parserConfidence = parserConfidence;
  const partyResolved = parsed.party.filter((pokemon) => Boolean(pokemon.speciesId)).length;
  const flatBoxes = parsed.boxes.flat();
  const pcResolved = flatBoxes.filter((pokemon) => Boolean(pokemon.speciesId)).length;
  const warnings = [
    "Read-only metadata parsed. Party and PC offsets are not fixture-confirmed for Elite Redux in this repository yet.",
    parsed.party.length > 0
      ? "Party rows were parsed from source-backed NextDex save scripts. Treat them as medium confidence until clean/played fixtures confirm the structure."
      : "No source-backed party rows were detected in this save. Clean/played fixtures are still needed before party parsing can be treated as confirmed.",
    parsed.boxes.some((box) => box.length > 0)
      ? "PC box rows were parsed from source-backed NextDex save scripts. Treat them as medium confidence until clean/played fixtures confirm the storage layout."
      : "No source-backed PC box rows were detected in this save.",
    parsed.party.length > 0 || flatBoxes.length > 0
      ? `Current resolution quality: party ${partyResolved}/${parsed.party.length}, PC ${pcResolved}/${flatBoxes.length}.`
      : "Current resolution quality: no source-backed rows resolved.",
    "No save bytes were mutated."
  ];

  return {
    metadata,
    research: buildSaveResearch(bytes, "none"),
    party: parsed.party,
    boxes: parsed.boxes,
    warnings: warnings.concat(parsed.warnings)
  };
}

export async function analyzeSaveFile(file: File, lookups?: SaveParserLookupContext): Promise<ParsedSave> {
  const buffer = await file.arrayBuffer();
  return parseSaveReadOnly(file.name, new Uint8Array(buffer), lookups);
}

export interface SaveAnalysisResult {
  selected: ParsedSave;
  candidates: ParsedSave[];
  warnings: string[];
}

export async function analyzeSaveArtifact(file: File, lookups?: SaveParserLookupContext): Promise<SaveAnalysisResult> {
  const imported = await loadSaveCandidates(file);
  const candidates = await Promise.all(
    imported.candidates.map(async (candidate) => {
      const parsed = await parseSaveReadOnly(candidate.fileName, candidate.bytes, lookups);
      return {
        ...parsed,
        warnings: Array.from(new Set([...candidate.notes, ...imported.warnings, ...parsed.warnings]))
      };
    })
  );

  if (candidates.length === 0) {
    throw new Error("No readable save candidates were found in that file.");
  }

  candidates.sort((left, right) => scoreParsedSave(right) - scoreParsedSave(left));
  return {
    selected: candidates[0],
    candidates,
    warnings: imported.warnings
  };
}

export function exportSaveDebugJson(save: ParsedSave): string {
  return JSON.stringify(save, null, 2);
}

function parseEliteReduxSave(bytes: Uint8Array, lookups: SaveParserLookupContext): Pick<ParsedSave, "party" | "boxes" | "warnings"> {
  const footer = getEliteReduxFooterData(bytes);
  return {
    party: parseEliteReduxParty(bytes, lookups, footer),
    boxes: parseEliteReduxBoxes(bytes, lookups, footer),
    warnings: buildLayoutWarnings(footer)
  };
}

function parseEliteReduxParty(bytes: Uint8Array, lookups: SaveParserLookupContext, footer: EliteReduxFooterData): ParsedPokemon[] {
  if (footer.teamSectorOffset === undefined) return [];

  const teamCount = readNbytes(footer.teamSectorOffset + TEAM_COUNT_OFFSET, 4, bytes);
  if (teamCount < 1 || teamCount > 6) return [];

  const party: ParsedPokemon[] = [];
  for (let slot = 0; slot < teamCount; slot += 1) {
    const start = footer.teamSectorOffset + TEAM_START_OFFSET + slot * PARTY_SLOT_SIZE;
    if (start + PARTY_SLOT_SIZE > bytes.byteLength) break;
    const raw = readPartyMon(start, bytes);
    const species = lookups.speciesByRawId.get(raw.species);
    const moves = raw.moves
      .map((moveId) => resolveMoveName(moveId, lookups.movesByRawId))
      .filter((moveName): moveName is string => Boolean(moveName));
    const heldItem = resolveItemName(raw.heldItem, lookups.itemsByRawId);
    const mainAbility = resolveAbilityName(raw.abilitySlot, species);

    party.push({
      id: `party-slot-${slot + 1}`,
      source: "party",
      slot: slot + 1,
      speciesId: species?.id,
      speciesName: species?.name ?? `Species #${raw.species}`,
      level: raw.level,
      heldItem: heldItem ?? (raw.heldItem > 0 ? `Item #${raw.heldItem}` : undefined),
      mainAbility,
      subAbilities: [],
      moves,
      confidence: species ? "medium" : "low",
      warnings: buildPartyWarnings(raw, species, moves.length)
    });
  }
  return party;
}

function parseEliteReduxBoxes(bytes: Uint8Array, lookups: SaveParserLookupContext, footer: EliteReduxFooterData): ParsedPokemon[][] {
  const candidates = PC_LAYOUT_CANDIDATES
    .map((layout) => ({
      layout,
      boxes: parsePcBoxesForLayout(bytes, lookups, footer, layout),
    }))
    .map((candidate) => ({
      ...candidate,
      score: scorePcBoxes(candidate.boxes)
    }))
    .filter((candidate) => candidate.boxes.length > 0);

  if (candidates.length === 0) return [];
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0].boxes;
}

function deriveParserConfidence(party: ParsedPokemon[], boxes: ParsedPokemon[][]): SaveMetadata["parserConfidence"] {
  const partyResolved = party.filter((pokemon) => Boolean(pokemon.speciesId)).length;
  const partyRatio = party.length > 0 ? partyResolved / party.length : 0;
  const flatBoxes = boxes.flat();
  const boxResolved = flatBoxes.filter((pokemon) => Boolean(pokemon.speciesId)).length;
  const boxRatio = flatBoxes.length > 0 ? boxResolved / flatBoxes.length : 0;

  if ((party.length > 0 && partyRatio >= 0.75) || (flatBoxes.length > 0 && boxRatio >= 0.75)) {
    return "medium";
  }
  return "low";
}

function scoreParsedSave(save: ParsedSave): number {
  const confidenceWeight = save.metadata.parserConfidence === "medium" ? 500 : save.metadata.parserConfidence === "high" ? 1000 : 0;
  const resolvedParty = save.party.filter((pokemon) => Boolean(pokemon.speciesId)).length;
  const resolvedBoxes = save.boxes.flat().filter((pokemon) => Boolean(pokemon.speciesId)).length;
  return confidenceWeight + resolvedParty * 40 + resolvedBoxes * 4 + save.party.length * 2 + save.boxes.flat().length;
}

function buildPartyWarnings(raw: RawPartyMon, species: Species | undefined, resolvedMoves: number): string[] {
  const warnings: string[] = [
    "Parsed from source-backed NextDex save scripts without fixture validation."
  ];
  if (!species) warnings.push(`Species raw ID ${raw.species} did not resolve against generated species data.`);
  if (resolvedMoves < raw.moves.filter((moveId) => moveId > 0).length) warnings.push("One or more move IDs did not resolve against generated move data.");
  return warnings;
}

function buildBoxWarnings(raw: RawBoxMon, species: Species | undefined, resolvedMoves: number): string[] {
  const warnings: string[] = [
    "Parsed from source-backed NextDex PC storage scripts without fixture validation."
  ];
  if (!species) warnings.push(`Species raw ID ${raw.species} did not resolve against generated species data.`);
  if (resolvedMoves < raw.moves.filter((moveId) => moveId > 0).length) warnings.push("One or more move IDs did not resolve against generated move data.");
  return warnings;
}

function buildLayoutWarnings(footer: EliteReduxFooterData): string[] {
  const warnings: string[] = [];
  if (footer.teamSectorOffset === undefined) {
    warnings.push("Could not identify the expected team sector candidate from source-backed save scripts.");
  }
  const candidateCounts = PC_LAYOUT_CANDIDATES
    .map((layout) => ({
      layout,
      count: getPcSectorOffsetsForLayout(footer, layout).length
    }))
    .filter((entry) => entry.count > 0);
  if (candidateCounts.length > 0) {
    warnings.push(
      `Observed PC sector candidates: ${candidateCounts.map((entry) => `${entry.layout.label} (${entry.count}/${DIRECT_PC_SECTOR_COUNT})`).join("; ")}.`
    );
  }
  return warnings;
}

function getEliteReduxFooterData(bytes: Uint8Array): EliteReduxFooterData {
  const pcSectorOffsets: number[] = [];
  const sectorOffsets: number[] = [];
  let teamSectorOffset: number | undefined;

  for (let offset = 0; offset + SAVE_SECTOR_SIZE <= Math.min(bytes.byteLength, 114688); offset += SAVE_SECTOR_SIZE) {
    const sectorId = readNbytes(offset + SAVE_FOOTER_OFFSET, 2, bytes);
    if (sectorId === TEAM_SECTOR_ID) {
      teamSectorOffset = offset;
    } else if (sectorId >= 5 && sectorId <= 13) {
      pcSectorOffsets[sectorId - 5] = offset;
    }
    sectorOffsets[sectorId] = offset;
  }

  return {
    teamSectorOffset,
    pcSectorOffsets,
    sectorOffsets
  };
}

function readDirectPcSector(
  offset: number,
  bytes: Uint8Array,
  missedBytes: Uint8Array | undefined,
  remainingUnread: number,
  maxOffset: number,
  parsedOffset: number,
  lookups: SaveParserLookupContext
) {
  const parsed: ParsedPokemon[] = [];
  let currentOffset = offset;
  let carry = missedBytes;
  let remaining = remainingUnread;

  if (carry && carry.length > 0) {
    const bytesNeeded = BOX_SLOT_SIZE - carry.length;
    const merged = new Uint8Array(BOX_SLOT_SIZE);
    merged.set(carry);
    merged.set(bytes.slice(currentOffset, currentOffset + bytesNeeded), carry.length);
    currentOffset += bytesNeeded;
    const raw = readDirectBoxMon(0, merged);
    const pokemon = raw ? mapBoxMon(raw, parsedOffset + parsed.length, lookups) : undefined;
    if (pokemon) parsed.push(pokemon);
    remaining -= 1;
    carry = undefined;
  }

  while (currentOffset + BOX_SLOT_SIZE <= maxOffset && remaining > 0) {
    const raw = readDirectBoxMon(currentOffset, bytes);
    const pokemon = raw ? mapBoxMon(raw, parsedOffset + parsed.length, lookups) : undefined;
    if (pokemon) parsed.push(pokemon);
    currentOffset += BOX_SLOT_SIZE;
    remaining -= 1;
  }

  if (currentOffset < maxOffset) {
    carry = bytes.slice(currentOffset, maxOffset);
  }

  return {
    parsed,
    missedBytes: carry,
    remainingUnread: remaining
  };
}

function parsePcBoxesForLayout(
  bytes: Uint8Array,
  lookups: SaveParserLookupContext,
  footer: EliteReduxFooterData,
  layout: PcLayoutCandidate
): ParsedPokemon[][] {
  const directPcSectors = getPcSectorOffsetsForLayout(footer, layout);
  if (directPcSectors.length < DIRECT_PC_SECTOR_COUNT) return [];

  const flattened: ParsedPokemon[] = [];
  let missedBytes: Uint8Array | undefined;
  let remainingUnread = BOX_COUNT * BOX_CAPACITY;

  for (let sectorIndex = 0; sectorIndex < DIRECT_PC_SECTOR_COUNT && remainingUnread > 0; sectorIndex += 1) {
    let sectorOffset = directPcSectors[sectorIndex];
    let maxOffset = sectorOffset + DIRECT_PC_SECTOR_DATA_BYTES;
    if (sectorIndex === 0) {
      sectorOffset += DIRECT_PC_FIRST_SECTOR_SKIP;
    }
    if (sectorIndex === DIRECT_PC_SECTOR_COUNT - 1) {
      maxOffset = directPcSectors[sectorIndex] + DIRECT_PC_LAST_SECTOR_DATA_BYTES;
    }

    const result = readDirectPcSector(sectorOffset, bytes, missedBytes, remainingUnread, maxOffset, flattened.length, lookups);
    missedBytes = result.missedBytes;
    remainingUnread = result.remainingUnread;
    flattened.push(...result.parsed);
  }

  if (flattened.length === 0) return [];
  const boxes: ParsedPokemon[][] = [];
  for (let boxIndex = 0; boxIndex < BOX_COUNT; boxIndex += 1) {
    const start = boxIndex * BOX_CAPACITY;
    const members = flattened.slice(start, start + BOX_CAPACITY);
    if (members.length > 0) boxes.push(members);
  }
  return boxes;
}

function getPcSectorOffsetsForLayout(footer: EliteReduxFooterData, layout: PcLayoutCandidate): number[] {
  const offsets: number[] = [];
  for (let sectorId = layout.startSectorId; sectorId < layout.startSectorId + DIRECT_PC_SECTOR_COUNT; sectorId += 1) {
    const offset = footer.sectorOffsets[sectorId];
    if (typeof offset === "number") offsets.push(offset);
  }
  return offsets;
}

function scorePcBoxes(boxes: ParsedPokemon[][]): number {
  let score = 0;
  for (const pokemon of boxes.flat()) {
    if (pokemon.speciesId) score += 4;
    if (pokemon.moves.length > 0) score += 1;
    if (pokemon.heldItem) score += 1;
  }
  return score;
}

function readPartyMon(start: number, bytes: Uint8Array): RawPartyMon {
  return {
    ...readBoxedMon(start, bytes),
    level: readNbytes(start + 60, 1, bytes)
  };
}

function readDirectBoxMon(start: number, bytes: Uint8Array): RawBoxMon | undefined {
  const personality = readNbytes(start, 4, bytes);
  if (!personality) return undefined;

  const word5 = readNbytes(start + 8, 4, bytes);
  const word6 = readNbytes(start + 12, 4, bytes);
  const word7 = readNbytes(start + 16, 4, bytes);
  const word8 = readNbytes(start + 20, 4, bytes);

  return {
    moves: [
      readBits(word5, 0, 11),
      readBits(word6, 0, 11),
      readBits(word6, 11, 11),
      readBits(word7, 16, 11)
    ],
    species: readBits(word7, 0, 16),
    heldItem: readBits(word8, 0, 10),
    abilitySlot: readBits(word8, 30, 2)
  };
}

function readBoxedMon(start: number, bytes: Uint8Array): Omit<RawPartyMon, "level"> {
  const fields = [
    ["personality", 32],
    ["otId", 32],
    ["nickname", 96],
    ["move1", 10],
    ["experience", 21],
    ["attackDown", 1],
    ["move2", 10],
    ["move3", 10],
    ["language", 3],
    ["isAlpha", 1],
    ["friendship", 8],
    ["species", 16],
    ["move4", 10],
    ["hpType", 5],
    ["isEventMon", 1],
    ["hpEV", 8],
    ["attackEV", 8],
    ["defenseEV", 8],
    ["speedEV", 8],
    ["spAttackEV", 8],
    ["spDefenseEV", 8],
    ["heldItem", 10],
    ["nature", 5],
    ["isEgg", 1],
    ["metLevel", 7],
    ["pokeball", 5],
    ["isShiny", 3],
    ["filler", 1],
    ["metLocation", 8],
    ["otName", 56],
    ["markings", 4],
    ["abilityNum", 2],
    ["speedDown", 1],
    ["otGender", 1]
  ] as const;

  const values: Record<string, number | number[]> = {};
  let wordIndex = 0;
  let currentWord: number | undefined;
  let bitsRead = 0;

  const nextWord = () => {
    const word = readNbytes(start + wordIndex * 4, 4, bytes);
    wordIndex += 1;
    return word;
  };

  for (const [name, bitLength] of fields) {
    let remaining = bitLength;
    const collected: number[] = [];
    while (remaining > 0) {
      if (currentWord === undefined) {
        currentWord = nextWord();
        bitsRead = 0;
      }
      const available = 32 - bitsRead;
      const take = Math.min(available, remaining);
      const mask = take === 32 ? 0xffffffff : (1 << take) - 1;
      collected.push((currentWord >>> bitsRead) & mask);
      bitsRead += take;
      remaining -= take;
      if (bitsRead === 32) {
        currentWord = undefined;
      }
    }
    values[name] = collected.length === 1 ? collected[0] : collected;
  }

  return {
    species: numberValue(values.species),
    heldItem: numberValue(values.heldItem),
    moves: [values.move1, values.move2, values.move3, values.move4].map(numberValue),
    abilitySlot: numberValue(values.abilityNum)
  };
}

function mapBoxMon(raw: RawBoxMon, flatIndex: number, lookups: SaveParserLookupContext): ParsedPokemon {
  const species = lookups.speciesByRawId.get(raw.species);
  const moves = raw.moves
    .map((moveId) => resolveMoveName(moveId, lookups.movesByRawId))
    .filter((moveName): moveName is string => Boolean(moveName));
  const heldItem = resolveItemName(raw.heldItem, lookups.itemsByRawId);
  const mainAbility = resolveAbilityName(raw.abilitySlot, species);
  return {
    id: `pc-slot-${flatIndex + 1}`,
    source: "pc",
    box: Math.floor(flatIndex / BOX_CAPACITY) + 1,
    slot: (flatIndex % BOX_CAPACITY) + 1,
    speciesId: species?.id,
    speciesName: species?.name ?? `Species #${raw.species}`,
    heldItem: heldItem ?? (raw.heldItem > 0 ? `Item #${raw.heldItem}` : undefined),
    mainAbility,
    subAbilities: [],
    moves,
    confidence: species ? "medium" : "low",
    warnings: buildBoxWarnings(raw, species, moves.length)
  };
}

function resolveAbilityName(abilitySlot: number, species?: Species): string | undefined {
  if (!species) return undefined;
  const ability = species.abilities[abilitySlot] ?? species.abilities[0];
  return ability?.name;
}

function resolveMoveName(moveId: number, moveMap: Map<number, Move>): string | undefined {
  if (moveId <= 0) return undefined;
  return moveMap.get(moveId)?.name ?? `Move #${moveId}`;
}

function resolveItemName(itemId: number, itemMap: Map<number, Item>): string | undefined {
  if (itemId <= 0) return undefined;
  return itemMap.get(itemId)?.name;
}

function numberValue(value: number | number[]): number {
  return Array.isArray(value) ? value[0] ?? 0 : value;
}

function readBits(value: number, startPos: number, width: number): number {
  const mask = (1 << width) - 1;
  return (value >>> startPos) & mask;
}

function readNbytes(start: number, nBytes: number, bytes: Uint8Array): number {
  let result = bytes[start] ?? 0;
  for (let index = 1; index < nBytes; index += 1) {
    result |= (bytes[start + index] ?? 0) << (index * 8);
  }
  return result >>> 0;
}
