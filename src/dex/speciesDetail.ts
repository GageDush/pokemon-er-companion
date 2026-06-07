import { BuildRecommendation, Evolution, Learnset, Location, MoveReference, ParsedPokemon, Species } from "../types";
import { recommendBuilds } from "../team-builder/recommender";

export interface SpeciesDetailSourceFact {
  label: string;
  value: string;
  confidence: "low" | "medium" | "high";
}

export interface SpeciesDetailEvolution {
  record: Evolution & { toSpeciesName?: string };
  heading: string;
  methodLabel: string;
  conditionLabel?: string;
  note?: string;
}

export interface SpeciesDetailLocation {
  location: Location;
  matchingEncounters: Location["encounters"];
  methods: string[];
  notes: string[];
  encounterCount: number;
}

export interface SpeciesDetailData {
  species: Species;
  learnset?: Learnset;
  groupedLearnset: Array<{ label: string; moves: MoveReference[] }>;
  evolutions: SpeciesDetailEvolution[];
  locations: SpeciesDetailLocation[];
  recommendation: BuildRecommendation;
  statRows: Array<{ key: string; label: string; value: number; percent: number }>;
  statTotal?: number;
  sourceFacts: SpeciesDetailSourceFact[];
  sourceWarnings: string[];
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
    .map((record) => describeEvolution(record, species, speciesById));
  const locations = input.locations
    .map((location) => ({
      location,
      matchingEncounters: location.encounters.filter((encounter) => encounter.speciesId === species.id || encounter.speciesName.toLowerCase() === species.name.toLowerCase())
    }))
    .filter((entry) => entry.matchingEncounters.length > 0)
    .map(({ location, matchingEncounters }) => ({
      location,
      matchingEncounters,
      methods: Array.from(new Set(matchingEncounters.map((encounter) => titleCaseMethod(encounter.method)))).filter(Boolean),
      notes: Array.from(new Set(matchingEncounters.map((encounter) => encounter.notes).filter((note): note is string => Boolean(note)))),
      encounterCount: matchingEncounters.length
    }))
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
    statTotal: species.baseStats ? Object.values(species.baseStats).reduce((sum, value) => sum + value, 0) : undefined,
    sourceFacts: buildSourceFacts(species, learnset, evolutions, locations),
    sourceWarnings: buildSourceWarnings(species, learnset, evolutions, locations)
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

export function describeEvolution(record: Evolution, species: Species, speciesById: Map<string, Species>): SpeciesDetailEvolution {
  const toSpeciesName = record.toSpeciesId ? speciesById.get(record.toSpeciesId)?.name : undefined;
  const fromSpeciesName = speciesById.get(record.fromSpeciesId)?.name ?? record.fromSpeciesId;
  const heading =
    record.fromSpeciesId === species.id
      ? `${species.name} -> ${toSpeciesName ?? record.toSpeciesId ?? "Unknown"}`
      : `${fromSpeciesName} -> ${species.name}`;

  return {
    record: { ...record, toSpeciesName },
    heading,
    methodLabel: humanizeEvolutionMethod(record.method),
    conditionLabel: record.condition ? `Specifier: ${record.condition}` : undefined,
    note: record.method.startsWith("kind:") ? "Numeric evolution kinds still need direct enum mapping from structured source/decomp tables." : undefined
  };
}

export function humanizeEvolutionMethod(method: string): string {
  if (method.startsWith("EVO_")) {
    return method
      .replace(/^EVO_/, "")
      .toLowerCase()
      .split("_")
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(" ");
  }
  if (method.startsWith("kind:")) {
    return `Raw evolution kind ${method.replace("kind:", "")}`;
  }
  return method;
}

function titleCaseMethod(method?: string): string {
  if (!method) return "Unknown method";
  return method
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSourceFacts(
  species: Species,
  learnset: Learnset | undefined,
  evolutions: SpeciesDetailEvolution[],
  locations: SpeciesDetailLocation[]
): SpeciesDetailSourceFact[] {
  const facts: SpeciesDetailSourceFact[] = [
    {
      label: "Species confidence",
      value: species.confidence,
      confidence: species.confidence
    },
    {
      label: "Source files",
      value: Array.from(new Set(species.source.map((source) => source.sourceFile))).join(", ") || "No source file recorded",
      confidence: species.source.every((source) => source.confidence === "high") ? "high" : species.confidence
    }
  ];

  if (learnset) {
    facts.push({
      label: "Learnset buckets",
      value: `${groupLearnset(learnset).length} populated bucket(s)`,
      confidence: learnset.source.every((source) => source.confidence === "high") ? "high" : "medium"
    });
  }
  if (evolutions.length > 0) {
    facts.push({
      label: "Evolution rows",
      value: `${evolutions.length} related evolution record(s)`,
      confidence: evolutions.some((entry) => entry.record.confidence === "medium") ? "medium" : "high"
    });
  }
  if (locations.length > 0) {
    facts.push({
      label: "Encounter references",
      value: `${locations.length} mapped location(s)`,
      confidence: locations.every((entry) => entry.location.confidence === "high") ? "high" : "medium"
    });
  }

  return facts;
}

function buildSourceWarnings(
  species: Species,
  learnset: Learnset | undefined,
  evolutions: SpeciesDetailEvolution[],
  locations: SpeciesDetailLocation[]
): string[] {
  const warnings = new Set<string>();
  if (species.source.some((source) => source.notes.length > 0)) {
    warnings.add("Species provenance includes parser notes; inspect the source tab before treating every field as final.");
  }
  if (learnset && groupLearnset(learnset).some((group) => group.moves.some((move) => move.confidence !== "high"))) {
    warnings.add("Some learnset entries are not high confidence and should be treated as provisional.");
  }
  if (evolutions.some((entry) => entry.note)) {
    warnings.add("Evolution method enum names are not fully mapped yet for numeric kind values.");
  }
  if (locations.some((entry) => entry.location.confidence !== "high")) {
    warnings.add("At least one location reference comes from supplemental or partially mapped source data.");
  }
  return [...warnings];
}
