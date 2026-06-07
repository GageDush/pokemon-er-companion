import { Item, Move, ParsedPokemon, ParsedSave, SaveMetadata, Species } from "../types";
import { SaveParserLookupContext } from "../app/dataClient";
import { buildSaveResearch, detectSaveSizeFamily } from "./saveResearch";

export const HEX_PREVIEW_BYTES = 256;
const SAVE_SECTOR_SIZE = 4096;
const SAVE_FOOTER_OFFSET = 4084;
const TEAM_SECTOR_ID = 2;
const TEAM_COUNT_OFFSET = 564;
const TEAM_START_OFFSET = 568;
const PARTY_SLOT_SIZE = 76;

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
  const party = lookups ? parseEliteReduxParty(bytes, lookups) : [];
  const parserConfidence = party.length > 0 ? "medium" : "low";
  metadata.parserConfidence = parserConfidence;
  const warnings = [
    "Read-only metadata parsed. Party and PC offsets are not fixture-confirmed for Elite Redux in this repository yet.",
    party.length > 0
      ? "Party rows were parsed from source-backed NextDex save scripts. Treat them as medium confidence until clean/played fixtures confirm the structure."
      : "No source-backed party rows were detected in this save. Clean/played fixtures are still needed before party parsing can be treated as confirmed.",
    "No save bytes were mutated."
  ];

  return {
    metadata,
    research: buildSaveResearch(bytes, "none"),
    party,
    boxes: [],
    warnings
  };
}

export async function analyzeSaveFile(file: File, lookups?: SaveParserLookupContext): Promise<ParsedSave> {
  const buffer = await file.arrayBuffer();
  return parseSaveReadOnly(file.name, new Uint8Array(buffer), lookups);
}

export function exportSaveDebugJson(save: ParsedSave): string {
  return JSON.stringify(save, null, 2);
}

function parseEliteReduxParty(bytes: Uint8Array, lookups: SaveParserLookupContext): ParsedPokemon[] {
  const footer = getEliteReduxFooterData(bytes);
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

function buildPartyWarnings(raw: RawPartyMon, species: Species | undefined, resolvedMoves: number): string[] {
  const warnings: string[] = [
    "Parsed from source-backed NextDex save scripts without fixture validation."
  ];
  if (!species) warnings.push(`Species raw ID ${raw.species} did not resolve against generated species data.`);
  if (resolvedMoves < raw.moves.filter((moveId) => moveId > 0).length) warnings.push("One or more move IDs did not resolve against generated move data.");
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

function readPartyMon(start: number, bytes: Uint8Array): RawPartyMon {
  return {
    ...readBoxedMon(start, bytes),
    level: readNbytes(start + 60, 1, bytes)
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

function readNbytes(start: number, nBytes: number, bytes: Uint8Array): number {
  let result = bytes[start] ?? 0;
  for (let index = 1; index < nBytes; index += 1) {
    result |= (bytes[start + index] ?? 0) << (index * 8);
  }
  return result >>> 0;
}
