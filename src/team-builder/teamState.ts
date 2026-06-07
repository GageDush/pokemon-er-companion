import { ParsedPokemon, ParsedSave } from "../types";

export interface TeamDataResolution {
  ownedPokemon: ParsedPokemon[];
  reservePokemon: ParsedPokemon[];
  source: "parsed-save" | "mock-fallback";
  partial: boolean;
  warnings: string[];
}

export function resolveOwnedTeam(currentSave: ParsedSave | undefined, mockOwned: ParsedPokemon[]): TeamDataResolution {
  if (!currentSave || currentSave.party.length === 0) {
    return {
      ownedPokemon: mockOwned,
      reservePokemon: [],
      source: "mock-fallback",
      partial: false,
      warnings: [
        "No confirmed parsed party rows are available yet. Team Builder is using the mock fallback roster.",
        "Load fixture-backed save evidence before treating the team preview as a real save view."
      ]
    };
  }

  const partial = currentSave.party.some((pokemon) => !pokemon.speciesId || pokemon.confidence !== "high");
  return {
    ownedPokemon: currentSave.party,
    reservePokemon: currentSave.boxes.flat(),
    source: "parsed-save",
    partial,
    warnings: partial
      ? ["Parsed party data is partial or low-confidence. Missing species or slot fields remain visibly uncertain."]
      : ["Parsed party data is being used, but save-field confidence still depends on fixture-backed validation."]
  };
}
