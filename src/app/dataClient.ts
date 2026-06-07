import {
  Ability,
  GeneratedManifest,
  Item,
  Learnset,
  Location,
  Move,
  Evolution,
  SearchDocument,
  Species,
  Trainer
} from "../types";

export interface AppData {
  manifest?: GeneratedManifest;
  species: Species[];
  learnsets: Learnset[];
  evolutions: Evolution[];
  moves: Move[];
  abilities: Ability[];
  subabilities: Ability[];
  items: Item[];
  locations: Location[];
  trainers: Trainer[];
  wiki: Array<{ id: string; title: string; summary: string; text?: string; confidence: string }>;
  searchIndex: SearchDocument[];
  warnings: string[];
}

export interface SaveParserLookupContext {
  speciesByRawId: Map<number, Species>;
  movesByRawId: Map<number, Move>;
  itemsByRawId: Map<number, Item>;
}

export const emptyData: AppData = {
  species: [],
  learnsets: [],
  evolutions: [],
  moves: [],
  abilities: [],
  subabilities: [],
  items: [],
  locations: [],
  trainers: [],
  wiki: [],
  searchIndex: [],
  warnings: ["Generated data has not been loaded yet. Run npm.cmd run data:generate."]
};

async function loadJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`/generated/${name}`);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function loadAppData(): Promise<AppData> {
  const [manifest, species, learnsets, evolutions, moves, abilities, subabilities, items, locations, trainers, wiki, searchIndex, warnings] =
    await Promise.all([
      loadJson<GeneratedManifest | undefined>("manifest.json", undefined),
      loadJson<Species[]>("species.json", []),
      loadJson<Learnset[]>("learnsets.json", []),
      loadJson<Evolution[]>("evolutions.json", []),
      loadJson<Move[]>("moves.json", []),
      loadJson<Ability[]>("abilities.json", []),
      loadJson<Ability[]>("subabilities.json", []),
      loadJson<Item[]>("items.json", []),
      loadJson<Location[]>("locations.json", []),
      loadJson<Trainer[]>("trainers.json", []),
      loadJson<AppData["wiki"]>("mechanics.json", []),
      loadJson<SearchDocument[]>("search-index.json", []),
      loadJson<string[]>("warnings.json", [])
    ]);

  return {
    manifest,
    species,
    learnsets,
    evolutions,
    moves,
    abilities,
    subabilities,
    items,
    locations,
    trainers,
    wiki,
    searchIndex,
    warnings
  };
}

export function buildSaveParserLookupContext(data: AppData): SaveParserLookupContext {
  return {
    speciesByRawId: new Map(data.species.filter((species) => typeof species.rawId === "number").map((species) => [species.rawId as number, species])),
    movesByRawId: new Map(data.moves.filter((move) => typeof move.rawId === "number").map((move) => [move.rawId as number, move])),
    itemsByRawId: new Map(data.items.filter((item) => typeof item.rawId === "number").map((item) => [item.rawId as number, item]))
  };
}
