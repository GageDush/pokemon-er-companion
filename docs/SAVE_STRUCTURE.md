# Save Structure Notes

This file starts blank on purpose.

Do not fill this with guesses. Only document findings from:

- Clean save vs played save comparisons
- Known GBA/Emerald structure research that is verified against Elite Redux
- Confirmed offsets from tests
- Confirmed checksums
- Confirmed parser results

## Confirmed Findings

- The current app can read save files as binary input without mutation.
- The current app can calculate file size, SHA-256, likely save-size family, and a 256-byte hex preview.
- The current app can compare two save byte arrays and group changed byte ranges.
- The current app can segment a save into aligned research blocks and generic candidate offset groups for fixture comparison.
- The current app can ingest mobile GBA `.gz` / `.zip` exports read-only and extract an embedded 20-sector Elite Redux save candidate when a full rotated `0..19` sector sequence with the expected signature is present.

## Candidate Findings

- 128 KiB saves are treated as a dual-bank candidate with 4 KiB-aligned blocks for research purposes only.
- 64 KiB saves are treated as single-bank aligned candidates for research purposes only.
- Active non-zero block clusters are exposed as fixture-diff targets, not as proven field maps.
- Local NextDex save scripts indicate a party/team sector candidate with:
  - 4 KiB sectors
  - sector footer near offset `4084`
  - team sector candidate `id = 2`
  - party count candidate at offset `564`
  - party start candidate at offset `568`
  - 76-byte party slots
- Local NextDex save scripts also indicate a direct-layout PC storage walk with:
  - sectors `5..13`
  - first storage sector data starting at `+4`
  - normal sector data window `3968` bytes
  - final storage sector data window `2000` bytes
  - 80-byte boxed-row stride
  - 14 x 30 boxed slots as the current target shape
- These offsets are source-backed candidates only. They are useful enough for a medium-confidence read-only preview, but not yet proven against repository fixtures.
- A provided mobile export archive contained five state exports that reconstructed into two distinct embedded battery-save candidates:
  - one newer candidate duplicated across four states
  - one older candidate represented by a PC/box-management state
- Those imported candidates are useful for diff research, but they still do not promote party or PC offsets above candidate status.

## Research Notes

- The local NextDex archive contains source parsing files such as `src/species/evolutions.ts`, which are useful for understanding named source concepts and parser intent.
- These source files help explain data shape, but they do not by themselves prove Elite Redux save offsets. Save-field confidence still requires fixture-backed byte comparison.

## Unknowns

- Party offset
- PC storage offset
- Badge/progression flags
- Level cap storage
- Randomizer/mode settings
- Elite Redux-specific Pokémon fields
- Ability/sub-ability storage
- Checksums/save block rotation behavior

## Rule

If it is not proven, label it candidate or unknown.

## Current Implementation Boundary

The app now exposes a source-backed party preview and a source-backed PC preview when a loaded save matches the local NextDex script layout. Those previews are still medium confidence until clean/played fixture comparison confirms the offsets and field meanings.

Progression, randomizer settings, and checksums are not parsed yet. They remain blocked on clean/played save fixtures and documented offset evidence.

See `docs/SAVE_FIXTURE_RESEARCH.md` for the fixture plan.
