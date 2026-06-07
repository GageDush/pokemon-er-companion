import { describe, expect, it } from "vitest";
import { SpeciesSchema } from "./schemas";

describe("schemas", () => {
  it("validates a minimal generated species record", () => {
    const parsed = SpeciesSchema.parse({
      id: "species-bulbasaur",
      dexNumber: 1,
      name: "Bulbasaur",
      types: ["Grass", "Poison"],
      baseStats: { hp: 45, attack: 49, defense: 49, speed: 45, spAttack: 65, spDefense: 65 },
      confidence: "medium",
      source: []
    });
    expect(parsed.name).toBe("Bulbasaur");
    expect(parsed.abilities).toEqual([]);
  });
});
