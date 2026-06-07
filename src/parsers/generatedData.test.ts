import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AbilitySchema, GeneratedManifestSchema, MoveSchema, SpeciesSchema } from "../types";

function readGenerated<T>(name: string): T {
  return JSON.parse(readFileSync(resolve("data", "generated", name), "utf-8")) as T;
}

describe("generated data", () => {
  it("records high-confidence named move and ability tables", () => {
    const manifest = GeneratedManifestSchema.parse(readGenerated("manifest.json"));
    expect(manifest.totals.moves).toBeGreaterThan(1000);
    expect(manifest.totals.abilities).toBeGreaterThan(1000);
    expect(manifest.sources[0].confidence).toBe("high");

    const moves = readGenerated<unknown[]>("moves.json");
    const pound = MoveSchema.parse(moves.find((move) => (move as { name?: string }).name === "Pound"));
    expect(pound.confidence).toBe("high");

    const abilities = readGenerated<unknown[]>("abilities.json");
    const stench = AbilitySchema.parse(abilities.find((ability) => (ability as { name?: string }).name === "Stench"));
    expect(stench.confidence).toBe("high");
  });

  it("adds sprite paths to generated species records", () => {
    const species = readGenerated<unknown[]>("species.json");
    const bulbasaur = SpeciesSchema.parse(species.find((record) => (record as { name?: string }).name === "Bulbasaur"));
    expect(bulbasaur.spritePath).toBe("/generated/sprites/BULBASAUR.png");
  });
});
