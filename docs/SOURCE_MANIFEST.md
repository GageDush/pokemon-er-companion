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
