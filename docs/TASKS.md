# Task Roadmap

## Milestone 0 - Repo and Source Setup

- [x] Create repo structure
- [x] Add AGENTS.md
- [x] Add docs from this packet
- [x] Copy raw source files into `data/raw/`
- [x] Confirm source manifest checklist
- [x] Add README

## Milestone 1 - App Scaffold

- [x] Initialize TypeScript app
- [x] React + Vite prototype
- [x] Add pages: Home, Wiki, Pokedex, Moves, Abilities, Sub-Abilities, Items, Locations, Trainers, Save Manager, Team Builder, Debug/Compare, Settings/About
- [x] Add basic layout/nav
- [x] Add tests

## Milestone 2 - Type Schemas

- [x] Species
- [x] Move
- [x] Ability
- [x] SubAbility
- [x] Learnset
- [x] Evolution
- [x] Item
- [x] Location
- [x] Encounter
- [x] Trainer
- [x] TrainerPokemon
- [x] ParsedSave
- [x] ParsedPokemon
- [x] SaveMetadata
- [x] BuildRecommendation
- [x] RecommendationLegality
- [x] SearchDocument
- [x] SourceProvenance

## Milestone 3 - Raw Source Inspection

- [x] Inspect `ER-nextdex-main.zip`
- [x] Inspect `Elite Redux (2.65.3b).zip`
- [x] Save file trees to `docs/RAW_SOURCE_TREE.md`
- [x] Identify source files for species/moves/abilities/learnsets/evolutions
- [x] Identify XLSX sheets/columns
- [x] Identify useful PDF sections

## Milestone 4 - Static Data Extraction

- [x] Extract species
- [x] Extract low-confidence numeric moves
- [x] Extract low-confidence numeric abilities
- [x] Extract low-confidence numeric sub-abilities
- [x] Extract learnsets
- [x] Extract evolutions
- [x] Generate empty items dataset with manifest warning path
- [x] Parse earliest locations XLSX
- [x] Parse trainer XLSX
- [x] Parse PDF docs
- [x] Generate manifest/warnings

## Milestone 5 - Searchable Wiki/Dex

- [x] Build search index
- [x] Species list page
- [ ] Species detail page
- [x] Move list/search page
- [x] Ability list/search page
- [x] Location list/search page
- [x] Trainer list/search page
- [x] Wiki/mechanics page

## Milestone 6 - Read-Only Save Loader

- [x] Upload save locally
- [x] File size
- [x] SHA-256
- [x] Hex preview
- [x] Export debug JSON
- [x] Tests

## Milestone 7 - Save Compare Tools

- [x] Two-save byte comparison
- [x] Byte range diff
- [ ] Candidate block detection
- [ ] Annotated notes
- [ ] Export compare report

## Milestone 8 - Party/PC Parser

- [x] Document assumptions in `docs/SAVE_STRUCTURE.md`
- [ ] Parse party only after confirmed
- [ ] Parse PC only after confirmed
- [ ] Validate species/moves/abilities against generated data
- [ ] Confidence and warnings

## Milestone 9 - Build Recommender

- [x] Mock current party/team analysis
- [ ] Real PC browser after save parsing is proven
- [x] Legal guardrails for moves/abilities/sub-abilities
- [x] Level-cap-aware suggestion field
- [x] EV/nature suggestions from parsed stats
- [x] Explain reasoning
- [x] Flag uncertainty

## Milestone 10 - Packaging

- [x] Tauri v2 config
- [x] Capacitor config
- [x] Local data bundling path
- [ ] Native desktop build after Rust install
- [ ] Android project generation after Java/Android SDK install
- [ ] iOS project generation on macOS/Xcode

## Milestone 11 - Optional AI

- [ ] Local retrieval index for AI context
- [ ] Build explainer
- [ ] Team weakness explainer
- [ ] Trainer prep assistant
- [ ] Strict no-hallucination guardrails
