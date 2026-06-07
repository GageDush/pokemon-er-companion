import { describe, expect, it } from "vitest";
import { recommendBuilds } from "./recommender";
import { Learnset, ParsedPokemon, Species } from "../types";

const bulbasaur: Species = {
  id: "species-bulbasaur",
  dexNumber: 1,
  name: "Bulbasaur",
  types: ["Grass", "Poison"],
  baseStats: { hp: 45, attack: 49, defense: 49, speed: 45, spAttack: 65, spDefense: 65 },
  abilities: [{ id: "ability-1", name: "Ability #1", sourceKind: "numeric-reference", confidence: "low" }],
  subAbilities: [],
  learnsetId: "learnset-species-bulbasaur",
  evolutionIds: [],
  locationIds: [],
  confidence: "medium",
  source: []
};

describe("recommendBuilds", () => {
  it("does not invent moves when only unresolved learnset IDs exist", () => {
    const owned: ParsedPokemon = {
      id: "owned-1",
      source: "mock",
      speciesId: "species-bulbasaur",
      speciesName: "Bulbasaur",
      moves: [],
      subAbilities: [],
      confidence: "low",
      warnings: []
    };
    const [recommendation] = recommendBuilds({ ownedPokemon: [owned], species: [bulbasaur] });
    expect(recommendation.moves).toEqual([]);
    expect(recommendation.legality.status).toBe("uncertain");
    expect(recommendation.legality.warnings.join(" ")).toContain("No confirmed move options");
  });

  it("can use current save-observed moves", () => {
    const owned: ParsedPokemon = {
      id: "owned-1",
      source: "party",
      speciesId: "species-bulbasaur",
      speciesName: "Bulbasaur",
      moves: ["Tackle"],
      subAbilities: [],
      confidence: "medium",
      warnings: []
    };
    const [recommendation] = recommendBuilds({ ownedPokemon: [owned], species: [bulbasaur] });
    expect(recommendation.moves).toEqual(["Tackle"]);
    expect(recommendation.legality.basis).toContain("Current save move list");
  });

  it("uses high-confidence named parsed learnset moves when provided", () => {
    const owned: ParsedPokemon = {
      id: "owned-1",
      source: "mock",
      speciesId: "species-bulbasaur",
      speciesName: "Bulbasaur",
      moves: [],
      subAbilities: [],
      confidence: "medium",
      warnings: []
    };
    const learnset: Learnset = {
      id: "learnset-species-bulbasaur",
      speciesId: "species-bulbasaur",
      levelUp: [
        { id: "move-33", name: "Tackle", learnMethod: "level-up", level: 1, confidence: "high" },
        { id: "move-999", name: "Too Late", learnMethod: "level-up", level: 99, confidence: "high" }
      ],
      tmhm: [],
      tutor: [{ id: "move-188", name: "Sludge Bomb", learnMethod: "tutor", confidence: "high" }],
      egg: [],
      source: []
    };
    const [recommendation] = recommendBuilds({ ownedPokemon: [owned], species: [bulbasaur], learnsets: [learnset], levelCap: 20 });
    expect(recommendation.moves).toEqual(["Tackle", "Sludge Bomb"]);
    expect(recommendation.legality.status).toBe("confirmed");
  });
});
