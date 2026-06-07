import { describe, expect, it } from "vitest";
import { analyzeDefensiveCoverage } from "./coverage";
import { Species } from "../types";

const charizard: Species = {
  id: "species-charizard",
  dexNumber: 6,
  name: "Charizard",
  types: ["Fire", "Flying"],
  baseStats: null,
  abilities: [],
  subAbilities: [],
  evolutionIds: [],
  locationIds: [],
  confidence: "high",
  source: []
};

describe("analyzeDefensiveCoverage", () => {
  it("counts weaknesses, resistances, and immunities for team members", () => {
    const rows = analyzeDefensiveCoverage([charizard]);
    expect(rows.find((row) => row.type === "Rock")?.weak).toBe(1);
    expect(rows.find((row) => row.type === "Ground")?.immune).toBe(1);
    expect(rows.find((row) => row.type === "Fire")?.resist).toBe(1);
  });
});
