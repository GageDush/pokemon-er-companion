# Save Fixture Research Plan

Save parsing remains read-only. This plan is for confidence-building only; it does not authorize save writing.

## Fixture Set Needed

- `clean_v2_65_3b.sav`: new game baseline.
- `after_starter_v2_65_3b.sav`: after choosing starter.
- `after_catch_v2_65_3b.sav`: after catching one Pokemon.
- `after_pc_deposit_v2_65_3b.sav`: after depositing one Pokemon in PC.
- `after_badge1_v2_65_3b.sav`: after earning first badge.
- Randomized move/ability samples only if those modes matter for the user's playthrough.

## Research Flow

1. Hash every fixture and keep originals immutable.
2. Compare clean vs milestone saves with the existing byte-range tool.
3. Document candidate changed ranges in `docs/SAVE_STRUCTURE.md`.
4. Add tests for any candidate parser before exposing fields in UI.
5. Promote fields to high confidence only after repeated fixture-backed validation.

## Emulator Use

An emulator can help create milestone saves, but it is optional and should be approved before setup. Use only the provided local Elite Redux ROM, and use emulator output only for controlled read-only fixture generation and spot checks.

Do not manually transcribe large game datasets from emulator screens. Game data should continue to come from named structured source files.
