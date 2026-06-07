import { describe, expect, it } from "vitest";
import { ParsedSave } from "../types";
import { resolveOwnedTeam } from "./teamState";

const mockOwned = [
  {
    id: "mock-1",
    source: "mock" as const,
    speciesId: "species-bulbasaur",
    speciesName: "Bulbasaur",
    moves: [],
    subAbilities: [],
    confidence: "low" as const,
    warnings: []
  }
];

describe("resolveOwnedTeam", () => {
  it("falls back to mock data when save party is absent", () => {
    const result = resolveOwnedTeam(undefined, mockOwned);
    expect(result.source).toBe("mock-fallback");
    expect(result.ownedPokemon).toEqual(mockOwned);
  });

  it("uses parsed save party when present and marks partial uncertainty", () => {
    const save: ParsedSave = {
      metadata: {
        fileName: "partial.sav",
        fileSize: 128 * 1024,
        sha256: "abc",
        hexPreview: "",
        likelyFormat: "GBA 128 KiB save",
        checksumStatus: "unknown",
        parserConfidence: "low"
      },
      party: [
        {
          id: "party-1",
          source: "party",
          speciesName: "Unknown",
          moves: [],
          subAbilities: [],
          confidence: "low",
          warnings: ["Slot boundary inferred only."]
        }
      ],
      boxes: [],
      warnings: []
    };

    const result = resolveOwnedTeam(save, mockOwned);
    expect(result.source).toBe("parsed-save");
    expect(result.partial).toBe(true);
    expect(result.ownedPokemon[0].source).toBe("party");
  });
});
