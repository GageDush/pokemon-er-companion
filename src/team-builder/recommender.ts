import { BuildRecommendation, Learnset, ParsedPokemon, Species } from "../types";

export interface RecommendationContext {
  ownedPokemon: ParsedPokemon[];
  species: Species[];
  learnsets?: Learnset[];
  levelCap?: number;
  randomizerSuspected?: boolean;
}

export function recommendBuilds(context: RecommendationContext): BuildRecommendation[] {
  const speciesByName = new Map(context.species.map((record) => [record.name.toLowerCase(), record]));

  return context.ownedPokemon.map((pokemon) => {
    const species = pokemon.speciesId
      ? context.species.find((record) => record.id === pokemon.speciesId)
      : speciesByName.get(pokemon.speciesName.toLowerCase());
    const sourceMoves = species ? collectKnownMoves(species, context.learnsets, context.levelCap) : [];
    const saveMoves = pokemon.moves;
    const moves = unique([...saveMoves, ...sourceMoves]).slice(0, 4);
    const warnings: string[] = [];
    const basis: string[] = [];

    if (saveMoves.length > 0) basis.push("Current save move list");
    if (sourceMoves.length > 0) basis.push("Parsed species learnset references");
    if (!species) warnings.push("Species was not found in parsed game data; recommendation is limited to current save data.");
    if (context.randomizerSuspected) warnings.push("Randomizer settings are suspected or unknown; save-observed options are prioritized.");
    if (moves.length === 0) warnings.push("No confirmed move options are available.");

    const mainAbility = pokemon.mainAbility ?? species?.abilities[0]?.name;
    const subAbilities = pokemon.subAbilities.length > 0 ? pokemon.subAbilities : species?.subAbilities.map((ability) => ability.name).slice(0, 3) ?? [];
    if (mainAbility) basis.push(pokemon.mainAbility ? "Current save ability" : "Parsed species ability reference");
    if (subAbilities.length > 0) basis.push(pokemon.subAbilities.length > 0 ? "Current save sub-abilities" : "Parsed species sub-ability references");

    const legalityStatus = warnings.length > 0 || moves.length === 0 ? "uncertain" : saveMoves.length > 0 ? "partial" : "confirmed";

    return {
      pokemonId: pokemon.id,
      speciesName: pokemon.speciesName,
      role: inferRole(species),
      levelCap: context.levelCap,
      nature: inferNature(species),
      evSpread: inferEvSpread(species),
      item: undefined,
      mainAbility,
      subAbilities,
      moves,
      legality: {
        status: legalityStatus,
        basis,
        warnings
      },
      reasoning: buildReasoning(pokemon, species, moves),
      confidence: legalityStatus === "confirmed" ? "medium" : "low"
    };
  });
}

function collectKnownMoves(species: Species, learnsets: Learnset[] = [], levelCap?: number): string[] {
  if (!species.learnsetId) return [];
  const learnset = learnsets.find((record) => record.id === species.learnsetId || record.speciesId === species.id);
  if (!learnset) return [];
  const levelUp = learnset.levelUp.filter((move) => move.confidence === "high" && (levelCap === undefined || (move.level ?? 0) <= levelCap));
  const other = [...learnset.tmhm, ...learnset.tutor, ...learnset.egg].filter((move) => move.confidence === "high");
  return [...levelUp, ...other].map((move) => move.name);
}

function inferRole(species?: Species): string {
  if (!species?.baseStats) return "Flexible";
  const { attack, spAttack, defense, spDefense, speed } = species.baseStats;
  if (speed >= 100 && Math.max(attack, spAttack) >= 100) return "Fast attacker";
  if (defense + spDefense >= attack + spAttack + 40) return "Defensive pivot";
  if (attack >= spAttack) return "Physical attacker";
  return "Special attacker";
}

function inferNature(species?: Species): string | undefined {
  if (!species?.baseStats) return undefined;
  return species.baseStats.attack >= species.baseStats.spAttack ? "Adamant or Jolly" : "Modest or Timid";
}

function inferEvSpread(species?: Species): Record<string, number> | undefined {
  if (!species?.baseStats) return undefined;
  const offensive = species.baseStats.attack >= species.baseStats.spAttack ? "attack" : "spAttack";
  return { [offensive]: 252, speed: 252, hp: 4 };
}

function buildReasoning(pokemon: ParsedPokemon, species: Species | undefined, moves: string[]): string {
  if (!species) return `${pokemon.speciesName} is owned, but parsed game data did not resolve the species. Keeping recommendations limited and uncertain.`;
  return `${pokemon.speciesName} is matched to parsed Elite Redux species data. Suggested role and EVs come from parsed base stats; moves remain constrained to save-observed or parsed references. ${moves.length} move option(s) are available.`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
