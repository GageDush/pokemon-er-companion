# Pokemon Elite Redux Companion

Local-first companion app for Pokemon Elite Redux. The app bundles generated JSON from local raw sources and provides a searchable wiki/Pokedex shell, read-only save metadata tools, byte comparison, team tracking placeholders, and legality-constrained build recommendation guardrails.

## Safety Boundaries

- No NPC editing.
- No generated Pokemon.
- No Pokemon creation from nothing.
- No save writing.
- Save files are read locally in browser memory only.
- Build recommendations must use parsed game data or current save observations.
- Unknown legality is shown as uncertain.

## Source Files

Place raw files in `data/raw/`. Raw archives, ROMs, PDFs, spreadsheets, screenshots, and saves are ignored by Git. The current local folder includes the expected source files, but they should not be committed.

Expected inputs:

- `ER-nextdex-main.zip`
- `Elite Redux (2.65.3b).zip`
- `Pokemon Elite Redux - (v2.65.3b) GBA Download.pdf`
- `Pokemon Elite Redux - (v2.65.3b) GBA Game.pdf`
- `Pokemon Elite Redux FAQ.pdf`
- `Pokemon Elite Redux Game Gallery.pdf`
- `Pokemon Elite Redux Full Changelog.pdf`
- `Pokemon Elite Redux Full Features Explained.pdf`
- `Pokémon Elite Redux V2.65 beta — Mono Earliest Locations.xlsx`
- `ER Trainer Locations 2.5.xlsx`
- `IMG_5893.jpeg`, optional context

## Setup

PowerShell blocks the `npm` shim on this machine, so use `npm.cmd`.

```powershell
npm.cmd install
npm.cmd run data:inspect
npm.cmd run data:generate
npm.cmd run dev
```

The dev server runs at the Vite URL shown in the terminal, usually `http://localhost:5173`.

## GitHub Pages

For a static mobile-viewable build:

```powershell
npm.cmd run build:pages
```

This uses the `/pokemon-er-companion/` base path for GitHub Pages project hosting.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Desktop

Tauri v2 config is included in `src-tauri/`.

```powershell
npm.cmd run tauri:dev
npm.cmd run tauri:build
```

This environment does not currently have `rustc`/`cargo`, so native Tauri commands are expected to fail until Rust is installed.

## Mobile

Capacitor config is included in `capacitor.config.ts`.

```powershell
npm.cmd run build
npm.cmd run cap:sync
npm.cmd run cap:android
npm.cmd run cap:ios
```

This environment does not currently have Java, Android SDK, or Xcode, so native Android/iOS project generation and builds may need to be run on a configured machine.

## Data Generation

Generated JSON is written to both:

- `data/generated/` for source discipline and review
- `public/generated/` for browser loading in Vite

Known extraction notes:

- `ER-nextdex-main/static/js/data/gameDataV2.65beta.json` is the primary structured source for named species, moves, abilities, items, trainers, encounters, and references.
- Local sprites are copied from `ER-nextdex-main/static/sprites` into `public/generated/sprites/` during data generation. This folder is ignored by Git.
- Spreadsheet extraction is useful for supplemental search but remains low-confidence until column semantics are mapped more carefully.
- `Elite Redux (2.65.3b).zip` contains a `.gba`; it is treated as read-only research input and is not redistributed.

## Sprite Policy

Sprites are extracted locally from the provided NextDex archive. The mobile app does not require users to upload the ROM/game file at runtime. For private/local builds, generated sprites may be bundled into the app package. For public distribution, bundled official/game sprites require rights/permission or must be replaced by a user-provided local sprite pack.

## Save Files

The Save Manager accepts local `.sav`/`.srm` files plus mobile GBA export `.gz` / `.zip` bundles and shows file name, file size, likely format, size-family research, SHA-256, aligned block candidates, candidate offset groups, first 256 bytes as hex preview, and debug JSON export.

When a mobile export contains multiple distinct embedded save candidates, the app keeps the import read-only, deduplicates identical candidates, auto-loads the strongest current candidate, and lets you switch between candidates in the Save Manager UI.

The app now also attempts **source-backed, read-only party and PC previews** using Elite Redux NextDex save scripts found in the local raw archive:

- sector scan over 4 KiB save blocks
- team sector candidate `id = 2`
- team count at offset `564`
- party rows from offset `568`
- 76-byte party slot layout
- direct-layout PC sectors `5..13`
- 80-byte boxed rows with a first-sector `+4` byte skip and a shortened last-sector data window

These save previews are still **medium confidence only** until clean/played fixtures confirm the offsets against real saves. Progression, randomizer settings, and checksums remain unproven.

For local verification against a private save file without using the UI:

```powershell
node_modules\.bin\vite-node.cmd scripts\verify_save.ts C:\path\to\your.sav
node_modules\.bin\vite-node.cmd scripts\verify_save.ts "C:\path\to\your-mobile-export.zip"
```

## Current App UX

- Short cinematic cold-load boot for initial local data sync and Dex activation.
- Mobile-first shell with bottom primary navigation, utility page chips, and source/safety status capsules.
- Mobile-first Pokedex with local sprites, type chips, confidence badges, filters, and empty-state guidance.
- Species detail tabs: Overview, Stats, Learnset, Evolution, Locations, Builds, and Source, with provenance facts and source warnings.
- Team Builder preview with local sprites, defensive coverage, save-context awareness, and advanced legality details.
- Save and Debug screens stay read-only and local, with fixture-readiness scaffolding plus aligned block/group save research panels.
- Debug/Compare now includes a Fixture Lab that can load one mobile export bundle, select two extracted save candidates, and summarize changed bytes, sectors, and likely party/PC candidate-region overlap.

## Save Fixture Research

See `docs/SAVE_FIXTURE_RESEARCH.md`. Emulator-created milestone saves can help prove party/PC/progression offsets, but emulator setup is optional and should be approved first. The emulator is not a bulk game-data source; structured NextDex/source files remain the source of truth.
