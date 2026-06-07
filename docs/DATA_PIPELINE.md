# Data Pipeline Plan

## Goal

Convert raw Pokémon Elite Redux sources into normalized, app-friendly JSON that can be bundled locally.

## Input Sources

Raw files live in:

```txt
data/raw/
```

Important inputs:

- `ER-nextdex-main.zip`
- `Elite Redux (2.65.3b).zip`
- `Pokémon Elite Redux V2.65 beta — Mono Earliest Locations.xlsx`
- `ER Trainer Locations 2.5.xlsx`
- Mechanics/FAQ/changelog PDFs

## Output Folder

Generated files live in:

```txt
data/generated/
```

Expected outputs:

```txt
data/generated/
  species.json
  forms.json
  moves.json
  abilities.json
  subabilities.json
  learnsets.json
  evolutions.json
  locations.json
  trainers.json
  items.json
  mechanics.json
  changelog.json
  search-index.json
  manifest.json
```

## Normalized Types

### Species

Should include:

- id
- dex number
- display name
- form
- types
- base stats
- abilities
- sub-abilities
- evolutions
- learnset references
- location references
- source provenance

### Move

Should include:

- id
- name
- type
- category
- power
- accuracy
- PP
- priority
- flags
- effect text
- source provenance

### Ability/Sub-Ability

Should include:

- id
- name
- effect text
- category if known
- compatible species/forms
- source provenance

### Location

Should include:

- id
- name
- area/route
- earliest availability
- encounters
- notes
- source provenance

### Trainer

Should include:

- id
- trainer name
- location
- team
- level range
- items/abilities/moves if available
- source provenance

## Parser Scripts Needed

```txt
scripts/
  inspect-raw-sources.ts
  extract-nextdex.ts
  extract-game-package.ts
  parse-earliest-locations.ts
  parse-trainer-locations.ts
  parse-pdf-docs.ts
  build-search-index.ts
  validate-generated-data.ts
```

## Pipeline Steps

1. Inspect archives without assuming layout.
2. Print discovered file tree into `docs/RAW_SOURCE_TREE.md`.
3. Identify source files for species/moves/abilities/learnsets/evolutions.
4. Write extraction scripts with tests.
5. Normalize IDs and names.
6. Parse XLSX files into structured JSON.
7. Convert useful PDF documentation into markdown/JSON pages.
8. Build a search index.
9. Validate cross-references.
10. Generate `data/generated/manifest.json`.

## Validation Rules

- Every species reference must resolve.
- Every move reference must resolve.
- Every ability/sub-ability reference must resolve or be marked unresolved.
- Every generated file must include source provenance.
- Extraction warnings should be saved to `data/generated/warnings.json`.

## Important Warning

Do not use generic public Pokémon data as the primary source. Pokémon Elite Redux changes mechanics, abilities, sub-abilities, learnsets, stats, and availability.
