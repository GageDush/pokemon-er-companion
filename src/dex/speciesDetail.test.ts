import { describe, expect, it } from "vitest";
import { buildSpeciesDetailData, groupLearnset } from "./speciesDetail";
import { Evolution, Learnset, Location, Species } from "../types";

const bulbasaur: Species = {
  id: "species-bulbasaur",
  dexNumber: 1,
  name: "Bulbasaur",
  types: ["Grass", "Poison"],
  baseStats: { hp: 47, attack: 49, defense: 49, speed: 65, spAttack: 65, spDefense: 45 },
  abilities: [],
  subAbilities: [],
  learnsetId: "learnset-species-bulbasaur",
  evolutionIds: ["evolution-species-bulbasaur-0"],
  locationIds: [],
  confidence: "high",
  source: []
};

const ivysaur: Species = {
  ...bulbasaur,
  id: "species-ivysaur",
  dexNumber: 2,
  name: "Ivysaur",
  learnsetId: "learnset-species-ivysaur",
  evolutionIds: []
};

const learnset: Learnset = {
  id: "learnset-species-bulbasaur",
  speciesId: "species-bulbasaur",
  levelUp: [
    { id: "move-45", name: "Growl", learnMethod: "level-up", level: 1, confidence: "high" },
    { id: "move-33", name: "Tackle", learnMethod: "level-up", level: 1, confidence: "high" }
  ],
  tmhm: [],
  tutor: [{ id: "move-188", name: "Sludge Bomb", learnMethod: "tutor", confidence: "high" }],
  egg: [],
  source: []
};

const evolution: Evolution = {
  id: "evolution-species-bulbasaur-0",
  fromSpeciesId: "species-bulbasaur",
  toSpeciesId: "species-ivysaur",
  method: "kind:0",
  condition: "16",
  confidence: "medium",
  source: []
};

const location: Location = {
  id: "map-1",
  name: "Route 101",
  encounters: [{ speciesId: "species-bulbasaur", speciesName: "Bulbasaur", method: "land", notes: "Level 2-2", confidence: "high" }],
  notes: [],
  confidence: "high",
  source: []
};

describe("species detail helpers", () => {
  it("groups learnsets by supported buckets", () => {
    expect(groupLearnset(learnset).map((group) => group.label)).toEqual(["Level-up", "Tutor"]);
  });

  it("builds a detail model with stats, evolutions, locations, and recommendations", () => {
    const detail = buildSpeciesDetailData({
      speciesId: "species-bulbasaur",
      species: [bulbasaur, ivysaur],
      learnsets: [learnset],
      evolutions: [evolution],
      locations: [location]
    });

    expect(detail?.statTotal).toBe(320);
    expect(detail?.evolutions[0].toSpeciesName).toBe("Ivysaur");
    expect(detail?.locations[0].matchingEncounters[0].speciesName).toBe("Bulbasaur");
    expect(detail?.recommendation.moves).toContain("Tackle");
  });
});
