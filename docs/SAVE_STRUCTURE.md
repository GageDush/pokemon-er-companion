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

## Candidate Findings

None yet.

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

Party, PC, progression, randomizer settings, and checksums are not parsed yet. They remain blocked on clean/played save fixtures and documented offset evidence.
