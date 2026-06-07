# Implementation Status

## Working Features

- Short cold-load boot animation for initial data load with a Dex scanner / local-sync feel.
- Premium dark UI system using the Factory/Biosphere-inspired palette and mobile-first bottom navigation.
- React + Vite local-first app shell with mobile-first bottom navigation for Home, Pokedex, Team, and Save plus utility-page chip navigation.
- Searchable pages for Wiki, Pokedex, Moves, Abilities, Sub-Abilities, Items, Locations, and Trainers.
- Pokedex cards display locally extracted NextDex sprites when generated assets exist.
- Species detail view with Overview, Stats, Learnset, Evolution, Locations, Builds, and Source tabs.
- Species detail source facts, source warnings, and richer evolution/location summaries.
- Pokedex filters for type, confidence, and source.
- Read-only save metadata loader: file size, likely format, SHA-256, hex preview, debug JSON export.
- Read-only save research inspector: size-family detection, aligned block candidates, generic offset groups, and richer debug export structure.
- Source-backed read-only party preview using Elite Redux NextDex save scripts, with explicit medium-confidence warnings.
- Source-backed read-only PC box preview using the direct-layout sector walk from local NextDex save scripts.
- Read-only save byte comparison.
- Team Builder can consume parsed party rows when available, otherwise it falls back to the clearly marked mock-owned flow.
- Team Builder owned preview uses sprites and an advanced legality toggle.
- Save Manager fixture-readiness panel tied to the read-only parser roadmap.
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

- Evolution method labels are visible in detail pages and now clearly separate source-shaped `EVO_*` labels from unresolved numeric `kind:*` values, but direct enum mapping is still needed.
- Spreadsheet workbook columns need per-sheet semantic mapping.
- Trainer levels are absent from some structured trainer records and need source-table verification.
- ROM extraction remains verification-only until table layouts are proven.

## Confidence Rules

- High: extracted from named structured source files such as `gameDataV2.65beta.json`, or cross-validated by multiple sources/tests.
- Medium: source-derived references whose target relationship is not fully resolved.
- Low: numeric IDs, inferred rows, spreadsheet rows without mapped headers, or save fields without fixture proof.

## Save Parser Status

- Metadata/debug, aligned block research, and byte comparison work.
- Source-backed party preview now uses local NextDex save scripts as a parser basis.
- Source-backed PC preview now uses the direct-layout NextDex storage-sector walk as a parser basis.
- Confirmed UI flow: Save Manager can show parsed party rows, and Team Builder can consume them when present.
- Progression, badges, level cap, randomizer settings, and checksums are not parsed.
- Save writing is disabled.
- Fixture instructions exist in `test/fixtures/saves/README.md`.
- Fixture research plan exists in `docs/SAVE_FIXTURE_RESEARCH.md`.
- No sanitized local `.sav` or `.srm` fixtures are currently present in the repository.
- A local search across common user folders did not surface obvious Elite Redux save fixtures yet, so fixture-backed validation is still pending.
- A later local search did surface one private `128 KiB` `.sav` outside the repository. Verification against that save showed the parser is only partially correct right now: some party species resolved, but many party/PC rows remained unresolved numeric species IDs.

## Packaging Blockers

- Tauri desktop builds require Rust/Cargo.
- Android builds require Java and Android SDK.
- iOS builds require macOS, Xcode, and signing.

## Exact Next Tasks

1. Provide clean/played save fixtures and start offset comparison research against the new block/group inspector.
2. Prove the first stable party slot boundaries against real fixture saves so the current source-backed party preview can be promoted or corrected.
3. Parse or extract direct evolution enum names from local NextDex/source files so numeric `kind:*` rows stop showing raw placeholders.
4. Add Playwright UI smoke tests if browser automation dependencies are approved and stable.
