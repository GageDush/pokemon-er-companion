# Parser Confidence

## High

None yet. No save offsets or game-data cross-references have been fixture-proven.

## Medium

- Species identity, types, stats, descriptions, learnset buckets, and evolution references from `ER-nextdex-main/out/gameDataVVanilla.json`.
- PDF wiki text extraction when text is present.

## Low

- Move names, because the bundled NextDex JSON did not include move-name tables. Numeric move IDs are preserved.
- Ability/sub-ability names, because the bundled NextDex JSON did not include ability-name tables. Numeric ability IDs are preserved.
- Location rows from the earliest-location workbook until headers/columns are mapped per sheet.
- Trainer rows from the trainer workbook until team columns are mapped per sheet.
- Save metadata parser confidence beyond file size/hash/hex preview.
- Recommender output when based on mock owned Pokemon or unresolved numeric references.

## Rules

- Low-confidence data may be searched and displayed with confidence labels.
- Low-confidence data must not be presented as confirmed legality.
- Unknown save fields remain unknown until clean/played fixtures prove them.
