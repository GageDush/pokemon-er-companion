---

# FILE: README_START_HERE.md

# START HERE — Pokémon Elite Redux Companion Codex Packet

Created: 2026-06-07

This packet is the project memory file set for starting the **Pokémon Elite Redux Companion App** in Codex without losing the original scope, source list, safety rules, and build constraints.

## How to use this packet

1. Create/open your new project repo, for example:

   ```txt
   pokemon-elite-redux-companion/
   ```

2. Copy every file from this packet into the repo root.

3. Put the raw source files listed in `docs/SOURCE_MANIFEST.md` into:

   ```txt
   data/raw/
   ```

4. Paste the contents of `CODEX_BOOTSTRAP_PROMPT.txt` into Codex as the first task.

5. Keep `AGENTS.md` at the repo root. Codex should treat it as standing project instructions.

## What this packet protects against

- Forgetting source files
- Forgetting the no-NPC-editing / no-generated-Pokémon rule
- Building a hosted backend when the project is supposed to be local-first
- Recommending illegal builds
- Guessing save structure before it is proven
- Mixing vanilla Emerald assumptions into Elite Redux mechanics
- Losing the desktop + mobile target

## Absolute non-negotiables

- Local-first app. Core functionality must run on device.
- Desktop and mobile target.
- Read-only save parsing first.
- No NPC editing.
- No generated Pokémon.
- Player-owned Pokémon only: party and PC.
- Recommendations must be constrained by parsed game data and parsed save data.
- If legality is uncertain, show uncertainty instead of pretending.

## First implementation goal

Build a prototype that can:

1. Load normalized static game data.
2. Display a searchable Pokédex/wiki shell.
3. Upload a save file read-only.
4. Show save metadata, hash, file size, and hex preview.
5. Export debug JSON.
6. Establish the data pipeline from raw sources into generated JSON.

Do **not** start by writing save data back. Do **not** start by implementing cheats.


---

# FILE: AGENTS.md

# AGENTS.md — Pokémon Elite Redux Companion

## Project Identity

Build a local-first desktop/mobile companion app for **Pokémon Elite Redux**.

The app should eventually include:

- Complete wiki for Pokémon Elite Redux mechanics and content
- Pokédex rebuilt from ER NextDex/source data
- Move, ability, sub-ability, item, location, and trainer lookup
- Save-file upload and read-only parsing
- Current party and PC tracking
- Team analysis
- Legal build recommendations constrained by the save and game data
- ROM/save comparison tools for research/debugging
- Optional AI-assisted explanations over local data

## Hard Scope Rules

These rules override convenience or user-interface ideas.

1. **No NPC editing.**
2. **No generated Pokémon.**
3. **No creating Pokémon from nothing.**
4. **Player-owned Pokémon only:** current party and PC.
5. **Read-only save parsing first.**
6. **No save writing until save structure, checksums, backups, and tests are proven.**
7. **No hosted backend for core functionality.**
8. **No guessing legality.** Mark uncertain data as uncertain.
9. **Do not assume vanilla Emerald mechanics where Elite Redux differs.**
10. **Do not recommend moves, abilities, sub-abilities, items, or builds unless supported by parsed game data or the current save.**

## Target Platforms

The build should keep a path open for:

- Desktop: Windows first, then macOS/Linux if feasible
- Mobile: iOS and Android

Preferred approach for early work:

- TypeScript-first app prototype
- React + Vite for fast iteration
- Parser/data modules kept framework-neutral
- Later wrap with Tauri/Electron for desktop and Capacitor/React Native/Flutter pathway for mobile if needed

## Local-First Requirements

Core app features must run locally:

- Search wiki/dex data
- Load bundled generated JSON
- Upload/read save files
- Parse party/PC when implemented
- Recommend legal builds from local data
- Export debug JSON

Network features may be optional, but must not be required for core usage.

## Data Discipline

Generated data should come from raw sources and scripts.

Raw sources go in:

```txt
/data/raw/
```

Generated normalized data goes in:

```txt
/data/generated/
```

Every parser/transformer should be documented and testable.

## Save Parser Rules

- Never mutate the original save file during parsing.
- Treat save loading as binary input.
- Start with file size, hash, and hex preview.
- Use fixtures for clean save and played save comparison.
- Any discovered save offset must be documented in `docs/SAVE_STRUCTURE.md`.
- Use confidence levels: low, medium, high.
- Unknown bytes/fields remain unknown until proven.
- Save writing must stay disabled until explicitly authorized later.

## Build Recommendation Rules

Every build recommendation must show:

- Pokémon species/form
- Level cap assumption
- Main ability
- Sub-abilities
- Moves
- Nature
- EV spread
- Held item
- Role
- Legality basis
- Confidence
- Reasoning

The recommender must only use:

- Parsed game data
- Parsed save data
- Current Pokémon state from save
- Confirmed mechanics from source/docs

If the save has randomized moves, abilities, or sub-abilities, recommendations must prioritize what the save says is possible.

## AI Rules

AI is optional and supportive. It must not be the source of truth.

AI may:

- Explain builds
- Summarize team weaknesses
- Answer wiki-style questions from local data
- Help compare options

AI may not:

- Invent game data
- Invent legality
- Ignore randomizer settings
- Recommend unavailable moves/abilities/sub-abilities
- Require a hosted backend for core app operation

## Expected Repo Structure

```txt
pokemon-elite-redux-companion/
  AGENTS.md
  README.md
  CODEX_BOOTSTRAP_PROMPT.txt
  docs/
    PROJECT_BRIEF.md
    SOURCE_MANIFEST.md
    BUILD_SCOPE.md
    DATA_PIPELINE.md
    SAVE_PARSING_PLAN.md
    AI_AND_RECOMMENDER_RULES.md
    TASKS.md
    QA_CHECKLIST.md
    SAVE_STRUCTURE.md
  data/
    raw/
      _PUT_SOURCE_FILES_HERE.md
    generated/
      _GENERATED_DATA_GOES_HERE.md
  scripts/
  src/
    app/
    components/
    dex/
    save/
    parsers/
    search/
    team-builder/
    types/
```

## Completion Response Expectations

When Codex completes a task, it should summarize:

- Files created/changed
- Commands run
- Tests run
- Parser assumptions
- Known limitations
- Next recommended task


---

# FILE: CODEX_BOOTSTRAP_PROMPT.txt

Start a new local-first project for the Pokémon Elite Redux Companion App.

Read AGENTS.md and all files in docs/ before coding.

Important: this project is a local-first companion app for Pokémon Elite Redux. It is not a hosted website. It must preserve a path to desktop and mobile support.

Hard restrictions:
- Do not implement NPC editing.
- Do not implement generated Pokémon.
- Do not create Pokémon from nothing.
- Do not implement save writing yet.
- Do not recommend illegal builds.
- Do not assume vanilla Emerald mechanics when Elite Redux differs.

Task 1:

1. Initialize a TypeScript project suitable for a local-first app prototype.
2. Use React + Vite unless an existing stack is already present.
3. Create this structure:

   src/app
   src/components
   src/parsers
   src/save
   src/dex
   src/team-builder
   src/search
   src/types
   scripts
   docs
   data/raw
   data/generated

4. Create placeholder pages/components for:

   - Home
   - Wiki
   - Pokédex
   - Save Manager
   - Team Builder
   - Debug/Compare

5. Create TypeScript schemas/types for:

   - Species
   - Move
   - Ability
   - SubAbility
   - Learnset
   - Location
   - Trainer
   - ParsedSave
   - ParsedPokemon
   - BuildRecommendation

6. Create a read-only save loader utility that accepts a binary file and returns:

   - file size
   - SHA-256 hash
   - first 256 bytes as hex preview
   - parserConfidence: "low"

7. Add README instructions for running the project.
8. Add basic tests for the save loader utility.
9. Do not implement save editing.
10. Do not implement NPC editing.
11. Do not implement generated Pokémon.

After completing, summarize:

- files created
- commands run
- tests run
- next recommended task


---

# FILE: docs/PROJECT_BRIEF.md

# Project Brief — Pokémon Elite Redux Companion App

## One-Sentence Goal

Build a local-first companion app that turns Pokémon Elite Redux game data and the user's save file into a searchable wiki, Pokédex, save/team tracker, and legal build recommender.

## User Intent

The user wants a PokéRogue-style companion app for Pokémon Elite Redux, but focused on the specific game, its mechanics, and the player’s actual save state.

The app should help answer:

- What does this Pokémon do in Elite Redux?
- What moves/abilities/sub-abilities are legal?
- Where do I find this Pokémon/item/trainer/content?
- What is my current team and PC?
- What builds are possible from my current save?
- What should I run for the current level cap?
- What changed between a clean save and a played save?

## Core Modules

### 1. Wiki

A structured knowledge base for:

- Game mechanics
- Feature explanations
- FAQ answers
- Version changes
- Abilities
- Sub-abilities
- Moves
- Items
- Locations
- Trainers
- Progression notes

### 2. Pokédex

A full Pokédex remake based on ER NextDex/source data:

- Species/forms
- Typing
- Base stats
- Abilities
- Sub-abilities
- Learnsets
- Evolutions
- Locations
- Build roles
- Search and filters

### 3. Save Manager

Read-only first:

- Load save file locally
- Show file size/hash/hex preview
- Parse party when structure is confirmed
- Parse PC boxes when structure is confirmed
- Detect progression/badges if feasible
- Detect randomizer/settings if feasible
- Export debug JSON

### 4. Team Builder

Uses current party/PC and legal data to provide:

- Team overview
- Type matchup checks
- Role coverage
- Legal moveset options
- Item/nature/EV suggestions
- Boss/trainer prep eventually

### 5. Debug/Compare

Research tooling for:

- Clean save vs played save comparison
- ROM/save structure clues
- Offset mapping
- Unknown field tracking
- Exporting annotated binary ranges

## Explicit Exclusions

- No NPC editing
- No generated Pokémon
- No cheating Pokémon into the save
- No online-only backend requirement
- No save writing during early milestones
- No blind save mutation

## Success Criteria

The project is successful when:

1. A user can search game data locally.
2. A user can open a Pokémon page and see Elite Redux-specific data.
3. A user can upload a save locally.
4. The app can identify party/PC Pokémon from the save with high confidence.
5. The app can recommend builds only from legal/currently possible options.
6. The app clearly flags uncertain or unparsed data.
7. The app works without requiring a hosted server.


---

# FILE: docs/SOURCE_MANIFEST.md

# Source Manifest — Do Not Forget These Files

Put all raw sources into:

```txt
data/raw/
```

This file is the checklist for source coverage. Do not delete it.

## Uploaded Source Files From ChatGPT Session

| Required | Source File | Type | Purpose | Target Location |
|---|---|---:|---|---|
| [ ] | `ER-nextdex-main.zip` | ZIP | Primary NextDex/source data for Pokédex, species, abilities, moves, learnsets, evolutions, forms, and related structured game data. | `data/raw/ER-nextdex-main.zip` |
| [ ] | `Elite Redux (2.65.3b).zip` | ZIP | Game/package/source reference for Elite Redux v2.65.3b. Use for mechanics, constants, ROM/package clues, and cross-checking data. | `data/raw/Elite Redux (2.65.3b).zip` |
| [ ] | `Pokémon Elite Redux V2.65 beta — Mono Earliest Locations.xlsx` | XLSX | Location/earliest availability data. Use for encounter/location pages and progression-aware recommendations. | `data/raw/Pokémon Elite Redux V2.65 beta — Mono Earliest Locations.xlsx` |
| [ ] | `ER Trainer Locations 2.5.xlsx` | XLSX | Trainer/boss/location data. Use for trainer search, boss prep, and progression planning. | `data/raw/ER Trainer Locations 2.5.xlsx` |
| [ ] | `Pokemon Elite Redux Full Features Explained.pdf` | PDF | Feature/mechanics documentation. Use for wiki/mechanics extraction. | `data/raw/Pokemon Elite Redux Full Features Explained.pdf` |
| [ ] | `Pokemon Elite Redux FAQ.pdf` | PDF | FAQ and common mechanics/rules. Use for wiki Q&A and user-facing help. | `data/raw/Pokemon Elite Redux FAQ.pdf` |
| [ ] | `Pokemon Elite Redux Full Changelog.pdf` | PDF | Version history and changes. Use for changelog pages and version-specific notes. | `data/raw/Pokemon Elite Redux Full Changelog.pdf` |
| [ ] | `Pokemon Elite Redux - (v2.65.3b) GBA Game.pdf` | PDF | Game page/reference. Use for metadata, overview, version notes, and download-page cross-checks. | `data/raw/Pokemon Elite Redux - (v2.65.3b) GBA Game.pdf` |
| [ ] | `Pokemon Elite Redux - (v2.65.3b) GBA Download.pdf` | PDF | Download/install/reference page. Use for version/source traceability. | `data/raw/Pokemon Elite Redux - (v2.65.3b) GBA Download.pdf` |
| [ ] | `Pokemon Elite Redux Game Gallery.pdf` | PDF | Visual/UI/gallery reference. Lower priority; may help with UI/theme or documentation screenshots. | `data/raw/Pokemon Elite Redux Game Gallery.pdf` |
| [ ] | `IMG_5893.jpeg` | JPEG | User-provided screenshot/reference. Treat as contextual, not canonical structured data. | `data/raw/IMG_5893.jpeg` |

## Additional Sources Still Needed

These were discussed as required or strongly useful but may not yet be present.

| Required | Missing/Needed Source | Why It Matters | Notes |
|---|---|---|---|
| [ ] | Clean/new-game `.sav` file | Baseline for save comparison. | Must be from same Elite Redux version if possible. |
| [ ] | Played `.sav` file with caught Pokémon and at least one gym completed | Required to map party, PC, progression, badges, flags, and changed save blocks. | User specifically wanted clean vs played comparison. |
| [ ] | Played save with randomized moves enabled, if using that mode | Needed so recommender does not assume normal learnsets when random moves exist. | Optional if user does not play random moves. |
| [ ] | Played save with randomized abilities/sub-abilities enabled, if using that mode | Needed so recommender can constrain builds to actual save possibilities. | Optional if user does not use those modes. |
| [ ] | Emulator name/version and save format details | Helps with `.sav`, `.srm`, RTC, and file-size differences. | Useful for mobile/iOS emulator workflow. |
| [ ] | Any official upstream repository links used for ER or NextDex | Provides provenance and update path. | Add to this manifest once known. |

## Source Priority

1. `ER-nextdex-main.zip`
2. `Elite Redux (2.65.3b).zip`
3. Save fixtures: clean and played
4. XLSX location/trainer files
5. Mechanics/FAQ/changelog PDFs
6. Gallery/screenshots

## Provenance Rule

Generated app data must record where it came from.

Every generated JSON file should include or be accompanied by metadata:

```json
{
  "sourceFiles": ["data/raw/ER-nextdex-main.zip"],
  "gameVersion": "2.65.3b",
  "generatedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "parserVersion": "0.1.0"
}
```

## Do Not Do This

- Do not manually copy game facts into code without tracking source.
- Do not let AI invent missing source data.
- Do not use outdated vanilla Pokémon data as the source of truth.
- Do not treat screenshots as authoritative structured data.


---

# FILE: docs/BUILD_SCOPE.md

# Build Scope

## In Scope

### Wiki

- Mechanics pages
- Feature explanations
- FAQ-derived help pages
- Changelog/version pages
- Searchable move/ability/sub-ability/item/location/trainer pages

### Pokédex

- Full species list
- Forms and variants if present in source
- Stats/types
- Evolutions
- Abilities and sub-abilities
- Learnsets
- Locations/availability
- Search/filter/sort

### Save File Tools

- Local upload
- Read-only binary load
- File size
- SHA-256 hash
- Hex preview
- Export debug JSON
- Clean vs played save comparison
- Party parser once confirmed
- PC parser once confirmed
- Progression/badge/level cap parser if feasible
- Randomizer/mode detection if feasible

### Team/Build Tools

- Current team page
- PC browser
- Legal build recommender
- Team weakness analysis
- Role coverage
- Level-cap-aware recommendations
- Boss/trainer prep eventually

### ROM/Game Data Tools

- ROM/package loading for research if legally/technically feasible
- Extracting/normalizing game data from provided source packages
- Version-aware data generation
- Cross-checking source files against generated JSON

### App Platforms

- Desktop-first local prototype
- Mobile path preserved
- No hosted backend dependency

## Out of Scope

- NPC editing
- Creating Pokémon from nothing
- Save cheating/generation tools
- Online-only app architecture
- Hosted database as required infrastructure
- Recommending illegal builds
- Blind binary patching
- ROM distribution
- Copyright-infringing redistribution of game/ROM files

## Later/Conditional Scope

These are allowed only after the read-only foundation is solid.

### Safe Save Writing

Only consider after:

- Save format is documented
- Checksums are understood
- Backups are automatic
- Unit tests exist
- App warns the user
- The feature is limited to player-owned Pokémon
- No Pokémon generation is implemented

Potential safe edits later:

- Notes/tags stored outside the save
- Team planning metadata stored in app DB
- Possibly player-owned Pokémon edits only if explicitly authorized and legal/safe

### AI Assistant

Allowed as optional feature if it uses local retrieval and cites/links local data internally.

## Build Philosophy

Build in this order:

1. Static data is reliable.
2. Search and UI are useful.
3. Save loading is safe.
4. Save parsing is proven.
5. Recommendations are legal.
6. AI explains, but never invents.
7. Save writing only after strong safety boundaries.


---

# FILE: docs/DATA_PIPELINE.md

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


---

# FILE: docs/SAVE_PARSING_PLAN.md

# Save Parsing Plan

## Prime Directive

Start read-only. Do not write to the save file.

## Required Fixtures

Put fixtures in a safe test folder, never overwrite them:

```txt
test/fixtures/saves/
  clean_v2_65_3b.sav
  played_v2_65_3b_one_gym.sav
  randomized_moves_sample.sav
  randomized_abilities_sample.sav
```

Only include fixtures in the repo if legally/private-data safe. Otherwise keep local and document paths.

## Phase 1 — File Loader

Implement:

- Load binary file
- File size
- SHA-256 hash
- First 256 bytes hex preview
- Export raw metadata JSON
- Parser confidence = low

No mutation.

## Phase 2 — Binary Compare

Implement comparison of:

- Clean save vs played save
- Played save before/after catching one Pokémon
- Played save before/after gym badge
- Played save before/after PC deposit

Outputs:

- Changed byte ranges
- Repeated block patterns
- Candidate party block ranges
- Candidate PC block ranges
- Candidate progression flag ranges

## Phase 3 — Known GBA/Emerald Structure Research

Elite Redux is based on GBA Pokémon conventions, but do not assume exact vanilla layout.

Document every assumption in:

```txt
docs/SAVE_STRUCTURE.md
```

Track:

- Save block sizes
- Save indices
- Checksums
- Party offsets
- PC storage offsets
- Pokémon data encryption/ordering if applicable
- Elite Redux-specific extensions

## Phase 4 — Party Parser

Only when offsets are confirmed:

- Read party count
- Decode party Pokémon
- Validate species IDs
- Validate level/HP/stats if available
- Validate moves
- Validate abilities/sub-abilities if stored
- Set parser confidence

## Phase 5 — PC Parser

Only when storage layout is confirmed:

- Decode boxes
- Preserve box names if available
- Decode Pokémon fields
- Do not mutate

## Phase 6 — Progression and Settings

Attempt only after party/PC parser is stable:

- Badges
- Flags
- Level cap
- Game mode
- Random moves setting
- Random abilities setting
- Random sub-abilities setting

## ParsedSave Shape

```ts
export type ParserConfidence = "low" | "medium" | "high";

export interface ParsedSave {
  metadata: {
    game: string;
    version?: string;
    fileSize: number;
    sha256: string;
    checksumStatus?: "valid" | "invalid" | "unknown";
    parserConfidence: ParserConfidence;
  };
  party: ParsedPokemon[];
  boxes: ParsedPokemon[][];
  progression?: {
    badges?: number;
    currentLevelCap?: number;
    flags?: Record<string, boolean>;
  };
  settings?: {
    randomMoves?: boolean;
    randomAbilities?: boolean;
    randomSubAbilities?: boolean;
  };
  warnings: string[];
}
```

## Safety Requirements Before Any Future Save Writing

All must be true:

- Automatic backup exists
- Dry-run diff exists
- Checksum recalculation proven
- Tests pass against fixtures
- User confirmation exists
- Scope excludes NPCs
- Scope excludes generated Pokémon
- App can restore backup

Until then, save writing remains disabled.


---

# FILE: docs/AI_AND_RECOMMENDER_RULES.md

# AI and Build Recommender Rules

## AI Is Not the Source of Truth

The source of truth is:

1. Parsed game data
2. Parsed save data
3. Confirmed mechanics from source documents
4. User-selected constraints

AI may explain and rank options, but it must not invent facts.

## Recommendation Inputs

The recommender should use:

- Current level cap
- Player's current party
- Player's PC
- Species/form data
- Current moves from save
- Legal learnsets from game data
- Main ability and sub-abilities from save/source
- Items available if known
- Trainer/boss target if selected
- Randomizer settings if detected

## Recommendation Output

Each recommendation should include:

```ts
export interface BuildRecommendation {
  pokemonId: string;
  speciesName: string;
  role: string;
  levelCap?: number;
  nature?: string;
  evSpread?: Record<string, number>;
  item?: string;
  mainAbility?: string;
  subAbilities?: string[];
  moves: string[];
  legality: {
    status: "confirmed" | "partial" | "uncertain" | "illegal";
    basis: string[];
    warnings: string[];
  };
  reasoning: string;
  confidence: "low" | "medium" | "high";
}
```

## Hard Recommendation Rules

- Do not recommend a move unless confirmed legal or currently present in the save.
- Do not recommend an ability unless confirmed legal or currently present in the save.
- Do not recommend a sub-ability unless confirmed legal or currently present in the save.
- If random moves are enabled, normal learnsets may not apply.
- If random abilities/sub-abilities are enabled, source defaults may not apply.
- If item availability is unknown, mark item suggestion as theoretical.
- If progression is unknown, avoid assuming access to late-game moves/items.

## AI/RAG Design

If AI is added:

- Use local JSON/markdown retrieval.
- Return citations/links to local pages or source records.
- Show confidence.
- Show legal/uncertain flags.
- Keep all core features functional without AI.

## Good AI Prompts Inside the App

- "Explain why this build is recommended."
- "Compare these two legal movesets."
- "What does my team lose to?"
- "Prepare me for this trainer with only my current box."
- "What is the safest change at level cap 20?"

## Bad AI Behavior to Prevent

- Hallucinating mechanics
- Using Smogon/vanilla data as source of truth
- Ignoring Elite Redux sub-abilities
- Ignoring level cap
- Ignoring randomized save settings
- Recommending unavailable moves
- Recommending unavailable items


---

# FILE: docs/TASKS.md

# Task Roadmap

## Milestone 0 — Repo and Source Setup

- [ ] Create repo structure
- [ ] Add AGENTS.md
- [ ] Add docs from this packet
- [ ] Copy raw source files into `data/raw/`
- [ ] Confirm source manifest checklist
- [ ] Add README

## Milestone 1 — App Scaffold

- [ ] Initialize TypeScript app
- [ ] React + Vite prototype unless another stack is chosen
- [ ] Add routes/pages:
  - [ ] Home
  - [ ] Wiki
  - [ ] Pokédex
  - [ ] Save Manager
  - [ ] Team Builder
  - [ ] Debug/Compare
- [ ] Add basic layout/nav
- [ ] Add tests

## Milestone 2 — Type Schemas

- [ ] Species
- [ ] Move
- [ ] Ability
- [ ] SubAbility
- [ ] Learnset
- [ ] Evolution
- [ ] Location
- [ ] Trainer
- [ ] ParsedSave
- [ ] ParsedPokemon
- [ ] BuildRecommendation
- [ ] SourceProvenance

## Milestone 3 — Raw Source Inspection

- [ ] Inspect `ER-nextdex-main.zip`
- [ ] Inspect `Elite Redux (2.65.3b).zip`
- [ ] Save file trees to `docs/RAW_SOURCE_TREE.md`
- [ ] Identify source files for species/moves/abilities/learnsets/evolutions
- [ ] Identify XLSX sheets/columns
- [ ] Identify useful PDF sections

## Milestone 4 — Static Data Extraction

- [ ] Extract species
- [ ] Extract moves
- [ ] Extract abilities
- [ ] Extract sub-abilities
- [ ] Extract learnsets
- [ ] Extract evolutions
- [ ] Extract items if available
- [ ] Parse earliest locations XLSX
- [ ] Parse trainer XLSX
- [ ] Generate manifest/warnings

## Milestone 5 — Searchable Wiki/Dex

- [ ] Build search index
- [ ] Species list page
- [ ] Species detail page
- [ ] Move detail page
- [ ] Ability detail page
- [ ] Location page
- [ ] Trainer page
- [ ] Wiki/mechanics pages

## Milestone 6 — Read-Only Save Loader

- [ ] Upload save locally
- [ ] File size
- [ ] SHA-256
- [ ] Hex preview
- [ ] Export debug JSON
- [ ] Tests

## Milestone 7 — Save Compare Tools

- [ ] Clean vs played comparison
- [ ] Byte range diff
- [ ] Candidate block detection
- [ ] Annotated notes
- [ ] Export compare report

## Milestone 8 — Party/PC Parser

- [ ] Document assumptions in `docs/SAVE_STRUCTURE.md`
- [ ] Parse party only after confirmed
- [ ] Parse PC only after confirmed
- [ ] Validate species/moves/abilities against generated data
- [ ] Confidence and warnings

## Milestone 9 — Build Recommender

- [ ] Current party/team analysis
- [ ] PC browser
- [ ] Legal moveset generator
- [ ] Ability/sub-ability legality checks
- [ ] Level-cap-aware suggestions
- [ ] EV/nature/item suggestions
- [ ] Explain reasoning
- [ ] Flag uncertainty

## Milestone 10 — Packaging

- [ ] Decide desktop wrapper
- [ ] Decide mobile pathway
- [ ] Local data bundling
- [ ] Offline testing
- [ ] Import/export user data

## Milestone 11 — Optional AI

- [ ] Local retrieval index
- [ ] Build explainer
- [ ] Team weakness explainer
- [ ] Trainer prep assistant
- [ ] Strict no-hallucination guardrails


---

# FILE: docs/QA_CHECKLIST.md

# QA Checklist

## Source Coverage

- [ ] Every raw source from `SOURCE_MANIFEST.md` is present or explicitly marked unavailable.
- [ ] Generated data includes source provenance.
- [ ] No generated file silently mixes sources without metadata.
- [ ] Warnings are emitted for unresolved references.

## App Architecture

- [ ] Core features run locally.
- [ ] No required hosted backend.
- [ ] Parser modules are framework-neutral.
- [ ] Generated data can be bundled with the app.

## Save Safety

- [ ] Save loader is read-only.
- [ ] Original save bytes are never mutated.
- [ ] SHA-256 hash is shown.
- [ ] Hex preview is shown.
- [ ] Save writing is disabled.
- [ ] Fixtures are not overwritten.

## Legality

- [ ] Moves are checked against source/save data.
- [ ] Abilities are checked against source/save data.
- [ ] Sub-abilities are checked against source/save data.
- [ ] Randomized settings are respected when known.
- [ ] Uncertain legality is labeled uncertain.
- [ ] No illegal recommendations are shown as confirmed.

## Scope Guardrails

- [ ] No NPC editing.
- [ ] No generated Pokémon.
- [ ] No Pokémon creation from nothing.
- [ ] Player-owned Pokémon only.
- [ ] No blind binary save patches.

## Tests

- [ ] Save loader tests pass.
- [ ] Data parser tests pass.
- [ ] Generated data validation passes.
- [ ] Search index builds.
- [ ] UI smoke test passes.

## Codex Completion Checklist

Every Codex task should end with:

- [ ] Files changed
- [ ] Commands run
- [ ] Tests run
- [ ] Assumptions
- [ ] Known limitations
- [ ] Next task


---

# FILE: docs/ROM_AND_SAVE_WRITING_BOUNDARIES.md

# ROM and Save Writing Boundaries

## ROM Loading

ROM/package loading can be used for:

- Research
- Data extraction
- Version verification
- Comparing expected structures
- Local parsing experiments

Do not redistribute ROMs or bundled copyrighted game files through the app.

## Save Loading

Allowed immediately:

- Read local save file
- Hash save file
- Preview bytes
- Compare saves
- Parse party/PC once confirmed
- Export debug report

## Save Writing

Not allowed in early milestones.

Before any save writing exists, all of this must be true:

- Save structure is documented
- Checksums are understood
- Automatic backup exists
- Dry-run diff exists
- Tests pass
- User sees exact changes
- User confirms writing
- Changes are limited to player-owned Pokémon if ever allowed
- NPC editing remains blocked
- Pokémon generation remains blocked

## ROM Writing

Treat ROM writing as out of scope unless the user explicitly redefines the project later.

Current app goal is companion/wiki/save reader, not ROM patcher.
