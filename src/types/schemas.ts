import { z } from "zod";

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const SourceProvenanceSchema = z.object({
  sourceFile: z.string(),
  parser: z.string(),
  sourcePath: z.string().optional(),
  extractedAt: z.string().optional(),
  confidence: ConfidenceSchema,
  notes: z.array(z.string()).default([])
});
export type SourceProvenance = z.infer<typeof SourceProvenanceSchema>;

const provenanceArray = z.array(SourceProvenanceSchema).default([]);

export const StatBlockSchema = z.object({
  hp: z.number(),
  attack: z.number(),
  defense: z.number(),
  speed: z.number(),
  spAttack: z.number(),
  spDefense: z.number()
});
export type StatBlock = z.infer<typeof StatBlockSchema>;

export const AbilityReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceKind: z.enum(["parsed", "numeric-reference", "save-current"]).default("parsed"),
  confidence: ConfidenceSchema.default("medium")
});
export type AbilityReference = z.infer<typeof AbilityReferenceSchema>;

export const MoveReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  learnMethod: z.enum(["level-up", "tmhm", "tutor", "egg", "save-current", "unknown"]).default("unknown"),
  level: z.number().optional(),
  confidence: ConfidenceSchema.default("medium")
});
export type MoveReference = z.infer<typeof MoveReferenceSchema>;

export const EvolutionSchema = z.object({
  id: z.string(),
  fromSpeciesId: z.string(),
  toSpeciesId: z.string().optional(),
  method: z.string(),
  condition: z.string().optional(),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Evolution = z.infer<typeof EvolutionSchema>;

export const LearnsetSchema = z.object({
  id: z.string(),
  speciesId: z.string(),
  levelUp: z.array(MoveReferenceSchema).default([]),
  tmhm: z.array(MoveReferenceSchema).default([]),
  tutor: z.array(MoveReferenceSchema).default([]),
  egg: z.array(MoveReferenceSchema).default([]),
  source: provenanceArray
});
export type Learnset = z.infer<typeof LearnsetSchema>;

export const SpeciesSchema = z.object({
  id: z.string(),
  dexNumber: z.number().nullable(),
  name: z.string(),
  form: z.string().optional(),
  types: z.array(z.string()).default([]),
  baseStats: StatBlockSchema.nullable(),
  abilities: z.array(AbilityReferenceSchema).default([]),
  subAbilities: z.array(AbilityReferenceSchema).default([]),
  learnsetId: z.string().optional(),
  evolutionIds: z.array(z.string()).default([]),
  locationIds: z.array(z.string()).default([]),
  description: z.string().optional(),
  spriteKey: z.string().optional(),
  spritePath: z.string().optional(),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Species = z.infer<typeof SpeciesSchema>;

export const MoveSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  category: z.string().optional(),
  power: z.number().nullable().optional(),
  accuracy: z.number().nullable().optional(),
  pp: z.number().nullable().optional(),
  priority: z.number().nullable().optional(),
  flags: z.array(z.string()).default([]),
  effectText: z.string().optional(),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Move = z.infer<typeof MoveSchema>;

export const AbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  effectText: z.string().optional(),
  category: z.string().optional(),
  compatibleSpeciesIds: z.array(z.string()).default([]),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Ability = z.infer<typeof AbilitySchema>;

export const SubAbilitySchema = AbilitySchema.extend({
  kind: z.literal("subAbility").default("subAbility")
});
export type SubAbility = z.infer<typeof SubAbilitySchema>;

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Item = z.infer<typeof ItemSchema>;

export const EncounterSchema = z.object({
  speciesId: z.string().optional(),
  speciesName: z.string(),
  method: z.string().optional(),
  earliestMilestone: z.string().optional(),
  notes: z.string().optional(),
  confidence: ConfidenceSchema
});
export type Encounter = z.infer<typeof EncounterSchema>;

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string().optional(),
  earliestAvailability: z.string().optional(),
  encounters: z.array(EncounterSchema).default([]),
  notes: z.array(z.string()).default([]),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Location = z.infer<typeof LocationSchema>;

export const TrainerPokemonSchema = z.object({
  speciesName: z.string(),
  speciesId: z.string().optional(),
  level: z.number().optional(),
  item: z.string().optional(),
  ability: z.string().optional(),
  subAbilities: z.array(z.string()).default([]),
  moves: z.array(z.string()).default([]),
  confidence: ConfidenceSchema
});
export type TrainerPokemon = z.infer<typeof TrainerPokemonSchema>;

export const TrainerSchema = z.object({
  id: z.string(),
  name: z.string(),
  className: z.string().optional(),
  location: z.string().optional(),
  team: z.array(TrainerPokemonSchema).default([]),
  levelRange: z.tuple([z.number(), z.number()]).optional(),
  notes: z.array(z.string()).default([]),
  confidence: ConfidenceSchema,
  source: provenanceArray
});
export type Trainer = z.infer<typeof TrainerSchema>;

export const SaveMetadataSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  sha256: z.string(),
  hexPreview: z.string(),
  likelyFormat: z.string(),
  checksumStatus: z.enum(["valid", "invalid", "unknown"]).default("unknown"),
  parserConfidence: ConfidenceSchema
});
export type SaveMetadata = z.infer<typeof SaveMetadataSchema>;

export const ParsedPokemonSchema = z.object({
  id: z.string(),
  source: z.enum(["party", "pc", "mock", "unknown"]),
  box: z.number().optional(),
  slot: z.number().optional(),
  speciesId: z.string().optional(),
  speciesName: z.string(),
  level: z.number().optional(),
  heldItem: z.string().optional(),
  nature: z.string().optional(),
  mainAbility: z.string().optional(),
  subAbilities: z.array(z.string()).default([]),
  moves: z.array(z.string()).default([]),
  confidence: ConfidenceSchema,
  warnings: z.array(z.string()).default([])
});
export type ParsedPokemon = z.infer<typeof ParsedPokemonSchema>;

export const ParsedSaveSchema = z.object({
  metadata: SaveMetadataSchema,
  party: z.array(ParsedPokemonSchema).default([]),
  boxes: z.array(z.array(ParsedPokemonSchema)).default([]),
  progression: z
    .object({
      badges: z.number().optional(),
      currentLevelCap: z.number().optional(),
      flags: z.record(z.boolean()).optional()
    })
    .optional(),
  settings: z
    .object({
      randomMoves: z.boolean().optional(),
      randomAbilities: z.boolean().optional(),
      randomSubAbilities: z.boolean().optional()
    })
    .optional(),
  warnings: z.array(z.string()).default([])
});
export type ParsedSave = z.infer<typeof ParsedSaveSchema>;

export const RecommendationLegalitySchema = z.object({
  status: z.enum(["confirmed", "partial", "uncertain", "illegal"]),
  basis: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([])
});
export type RecommendationLegality = z.infer<typeof RecommendationLegalitySchema>;

export const BuildRecommendationSchema = z.object({
  pokemonId: z.string(),
  speciesName: z.string(),
  role: z.string(),
  levelCap: z.number().optional(),
  nature: z.string().optional(),
  evSpread: z.record(z.number()).optional(),
  item: z.string().optional(),
  mainAbility: z.string().optional(),
  subAbilities: z.array(z.string()).default([]),
  moves: z.array(z.string()).default([]),
  legality: RecommendationLegalitySchema,
  reasoning: z.string(),
  confidence: ConfidenceSchema
});
export type BuildRecommendation = z.infer<typeof BuildRecommendationSchema>;

export const SearchDocumentSchema = z.object({
  id: z.string(),
  kind: z.enum(["species", "move", "ability", "subAbility", "item", "location", "trainer", "wiki"]),
  title: z.string(),
  summary: z.string(),
  tokens: z.string(),
  href: z.string(),
  source: provenanceArray,
  confidence: ConfidenceSchema
});
export type SearchDocument = z.infer<typeof SearchDocumentSchema>;

export const GeneratedManifestSchema = z.object({
  gameVersion: z.string(),
  generatedAt: z.string(),
  parserVersion: z.string(),
  sources: z.array(
    z.object({
      sourceFile: z.string(),
      parser: z.string(),
      recordCounts: z.record(z.number()).default({}),
      warnings: z.array(z.string()).default([]),
      confidence: ConfidenceSchema
    })
  ),
  totals: z.record(z.number()).default({}),
  warnings: z.array(z.string()).default([])
});
export type GeneratedManifest = z.infer<typeof GeneratedManifestSchema>;
