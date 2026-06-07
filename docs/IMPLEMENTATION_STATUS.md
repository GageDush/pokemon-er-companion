# Implementation Status

## Working Features

- React + Vite local-first app shell with mobile-first bottom navigation.
- Searchable pages for Wiki, Pokedex, Moves, Abilities, Sub-Abilities, Items, Locations, and Trainers.
- Pokedex cards display locally extracted NextDex sprites when generated assets exist.
- Species detail view with Overview, Stats, Learnset, Evolution, Locations, Builds, and Source tabs.
- Pokedex filters for type, confidence, and source.
- Read-only save metadata loader: file size, likely format, SHA-256, hex preview, debug JSON export.
- Read-only save byte comparison.
- Team Builder mock-owned flow with defensive coverage analysis and legality warnings.
- Team Builder owned preview uses sprites and an advanced legality toggle.
- Tauri v2 and Capacitor configuration files.

## Generated Data

Latest extraction uses `ER-nextdex-main/static/js/data/gameDataV2.65beta.json` as the primary structured source.

- Species: 1906
- Learnsets: 1906
- Evolutions: 1035
- Moves: 1031
- Abilities: 1033
- Sub-abilities: 1033
- Items: 928
- Locations: 373
- Trainers: 1690
- Wiki/mechanics pages: 7
- Search documents: 3976
- Local sprites copied: 1906

## Parsed Successfully

- `ER-nextdex-main.zip`: structured game data and local sprites.
- `Pokémon Elite Redux V2.65 beta — Mono Earliest Locations.xlsx`: supplemental low-confidence location rows.
- `ER Trainer Locations 2.5.xlsx`: supplemental low-confidence trainer rows.
- PDF docs: searchable wiki text via `pypdf`.

## Needs Deeper Extraction

- Evolution method labels are visible in detail pages but still source-derived numeric/kind references and need enum mapping.
- Spreadsheet workbook columns need per-sheet semantic mapping.
- Trainer levels are absent from some structured trainer records and need source-table verification.
- ROM extraction remains verification-only until table layouts are proven.

## Confidence Rules

- High: extracted from named structured source files such as `gameDataV2.65beta.json`, or cross-validated by multiple sources/tests.
- Medium: source-derived references whose target relationship is not fully resolved.
- Low: numeric IDs, inferred rows, spreadsheet rows without mapped headers, or save fields without fixture proof.

## Save Parser Status

- Metadata/debug and byte comparison work.
- Party, PC, progression, badges, level cap, randomizer settings, and checksums are not parsed.
- Save writing is disabled.
- Fixture instructions exist in `test/fixtures/saves/README.md`.
- Fixture research plan exists in `docs/SAVE_FIXTURE_RESEARCH.md`.

## Packaging Blockers

- Tauri desktop builds require Rust/Cargo.
- Android builds require Java and Android SDK.
- iOS builds require macOS, Xcode, and signing.

## Exact Next Tasks

1. Map evolution kind enums and source trainer level fields from structured files.
2. Provide clean/played save fixtures and start offset comparison research.
3. Add Playwright UI smoke tests if browser automation dependencies are approved and stable.
4. Add persistent local tags/favorites outside save files.
