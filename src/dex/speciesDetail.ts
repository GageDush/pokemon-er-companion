import { BuildRecommendation, Evolution, Learnset, Location, MoveReference, ParsedPokemon, Species } from "../types";
import { recommendBuilds } from "../team-builder/recommender";

export interface SpeciesDetailData {
  species: Species;
  learnset?: Learnset;
  groupedLearnset: Array<{ label: string; moves: MoveReference[] }>;
  evolutions: Array<Evolution & { toSpeciesName?: string }>;
  locations: Array<Location & { matchingEncounters: Location["encounters"] }>;
  recommendation: BuildRecommendation;
  statRows: Array<{ key: string; label: string; value: number; percent: number }>;
  statTotal?: number;
}

export interface SpeciesDetailInput {
  speciesId: string;
  species: Species[];
  learnsets: Learnset[];
  evolutions: Evolution[];
  locations: Location[];
}

export function buildSpeciesDetailData(input: SpeciesDetailInput): SpeciesDetailData | undefined {
  const species = input.species.find((record) => record.id === input.speciesId);
  if (!species) return undefined;

  const speciesById = new Map(input.species.map((record) => [record.id, record]));
  const learnset = input.learnsets.find((record) => record.id === species.learnsetId || record.speciesId === species.id);
  const groupedLearnset = groupLearnset(learnset);
  const evolutions = input.evolutions
    .filter((record) => record.fromSpeciesId === species.id || record.toSpeciesId === species.id)
    .map((record) => ({ ...record, toSpeciesName: record.toSpeciesId ? speciesById.get(record.toSpeciesId)?.name : undefined }));
  const locations = input.locations
    .map((location) => ({
      ...location,
      matchingEncounters: location.encounters.filter((encounter) => encounter.speciesId === species.id || encounter.speciesName.toLowerCase() === species.name.toLowerCase())
    }))
    .filter((location) => location.matchingEncounters.length > 0)
    .slice(0, 24);

  const owned: ParsedPokemon = {
    id: `detail-${species.id}`,
    source: "mock",
    speciesId: species.id,
    speciesName: species.name,
    moves: [],
    subAbilities: [],
    confidence: species.confidence,
    warnings: ["Build preview uses parsed species data only; save ownership and randomizer settings are not confirmed."]
  };
  const [recommendation] = recommendBuilds({ ownedPokemon: [owned], species: input.species, learnsets: input.learnsets, levelCap: 20 });

  return {
    species,
    learnset,
    groupedLearnset,
    evolutions,
    locations,
    recommendation,
    statRows: buildStatRows(species),
    statTotal: species.baseStats ? Object.values(species.baseStats).reduce((sum, value) => sum + value, 0) : undefined
  };
}

export function groupLearnset(learnset?: Learnset): Array<{ label: string; moves: MoveReference[] }> {
  if (!learnset) return [];
  return [
    { label: "Level-up", moves: [...learnset.levelUp].sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)) },
    { label: "TM/HM", moves: learnset.tmhm },
    { label: "Tutor", moves: learnset.tutor },
    { label: "Egg", moves: learnset.egg }
  ].filter((group) => group.moves.length > 0);
}

export function buildStatRows(species: Species): Array<{ key: string; label: string; value: number; percent: number }> {
  if (!species.baseStats) return [];
  const rows = [
    ["hp", "HP", species.baseStats.hp],
    ["attack", "Atk", species.baseStats.attack],
    ["defense", "Def", species.baseStats.defense],
    ["spAttack", "SpA", species.baseStats.spAttack],
    ["spDefense", "SpD", species.baseStats.spDefense],
    ["speed", "Spe", species.baseStats.speed]
  ] as const;
  return rows.map(([key, label, value]) => ({ key, label, value, percent: Math.min(100, Math.round((value / 180) * 100)) }));
}
