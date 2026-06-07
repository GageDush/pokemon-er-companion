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

The Save Manager accepts local `.sav`/`.srm` files and shows file name, file size, likely format, SHA-256, first 256 bytes as hex preview, and debug JSON export. Party/PC parsing remains disabled/low-confidence until clean and played save fixtures prove offsets and checksums.
