import { describe, expect, it } from "vitest";
import { SaveParserLookupContext } from "../app/dataClient";
import { analyzeSaveBytes, detectLikelySaveFormat, parseSaveReadOnly, toHexPreview } from "./saveLoader";

describe("saveLoader", () => {
  it("detects common GBA save sizes", () => {
    expect(detectLikelySaveFormat(128 * 1024)).toBe("GBA 128 KiB save");
    expect(detectLikelySaveFormat(64 * 1024)).toBe("GBA 64 KiB save");
    expect(detectLikelySaveFormat(123)).toBe("Unknown binary save");
  });

  it("creates a fixed-width hex preview", () => {
    const preview = toHexPreview(new Uint8Array([0, 1, 65, 66, 255]));
    expect(preview).toContain("00000000");
    expect(preview).toContain("00 01 41 42 ff");
    expect(preview).toContain("..AB.");
  });

  it("hashes save bytes without mutating them", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const original = Array.from(bytes);
    const metadata = await analyzeSaveBytes("synthetic.sav", bytes);
    expect(metadata.fileName).toBe("synthetic.sav");
    expect(metadata.sha256).toBe("9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a");
    expect(Array.from(bytes)).toEqual(original);
    expect(metadata.parserConfidence).toBe("low");
  });

  it("wraps read-only save research without claiming party parsing", async () => {
    const bytes = new Uint8Array(128 * 1024);
    const parsed = await parseSaveReadOnly("fixtureless.sav", bytes);
    expect(parsed.research?.sizeFamilyId).toBe("gba-128k");
    expect(parsed.party).toEqual([]);
    expect(parsed.warnings.join(" ")).toContain("No source-backed party rows were detected");
  });

  it("parses source-backed party rows when synthetic save sectors match Elite Redux scripts", async () => {
    const bytes = new Uint8Array(128 * 1024);
    bytes[4084] = 0x02;
    bytes[4085] = 0x00;
    bytes[564] = 0x01;

    const partyStart = 568;
    writeSyntheticPartyMon(bytes, partyStart, {
      species: 1,
      heldItem: 2,
      move1: 1,
      move2: 2,
      move3: 0,
      move4: 0,
      abilityNum: 1,
      level: 17
    });

    const lookups: SaveParserLookupContext = {
      speciesByRawId: new Map([
        [1, {
          id: "species-bulbasaur",
          rawId: 1,
          dexNumber: 1,
          name: "Bulbasaur",
          types: ["Grass", "Poison"],
          baseStats: null,
          abilities: [
            { id: "ability-overgrow", name: "Overgrow", sourceKind: "parsed", confidence: "high" },
            { id: "ability-chlorophyll", name: "Chlorophyll", sourceKind: "parsed", confidence: "high" }
          ],
          subAbilities: [],
          evolutionIds: [],
          locationIds: [],
          confidence: "high",
          source: []
        }]
      ]),
      movesByRawId: new Map([
        [1, { id: "move-tackle", rawId: 1, name: "Tackle", flags: [], confidence: "high", source: [] }],
        [2, { id: "move-growl", rawId: 2, name: "Growl", flags: [], confidence: "high", source: [] }]
      ]),
      itemsByRawId: new Map([
        [2, { id: "item-potion", rawId: 2, name: "Potion", confidence: "high", source: [] }]
      ])
    };

    const parsed = await parseSaveReadOnly("synthetic-party.sav", bytes, lookups);
    expect(parsed.metadata.parserConfidence).toBe("medium");
    expect(parsed.party).toHaveLength(1);
    expect(parsed.party[0]).toMatchObject({
      source: "party",
      slot: 1,
      speciesId: "species-bulbasaur",
      speciesName: "Bulbasaur",
      level: 17,
      heldItem: "Potion",
      mainAbility: "Chlorophyll",
      moves: ["Tackle", "Growl"],
      confidence: "medium"
    });
    expect(parsed.warnings.join(" ")).toContain("source-backed NextDex save scripts");
  });
});

type SyntheticMonValues = {
  species: number;
  heldItem: number;
  move1: number;
  move2: number;
  move3: number;
  move4: number;
  abilityNum: number;
  level: number;
};

function writeSyntheticPartyMon(bytes: Uint8Array, start: number, values: SyntheticMonValues) {
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

  let bitOffset = 0;
  for (const [fieldName, bitLength] of fields) {
    const fieldValue = values[fieldName as keyof SyntheticMonValues] ?? 0;
    writeBits(bytes, start, bitOffset, bitLength, fieldValue);
    bitOffset += bitLength;
  }

  bytes[start + 60] = values.level;
}

function writeBits(bytes: Uint8Array, start: number, bitOffset: number, bitLength: number, value: number) {
  for (let bit = 0; bit < bitLength; bit += 1) {
    const absoluteBit = bitOffset + bit;
    const byteOffset = start + Math.floor(absoluteBit / 8);
    const bitInByte = absoluteBit % 8;
    const bitValue = (value >>> bit) & 1;
    if (bitValue) {
      bytes[byteOffset] |= 1 << bitInByte;
    }
  }
}
