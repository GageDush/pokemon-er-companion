# Parser Confidence

## High

- Named moves, abilities, items, species, trainer parties, map encounter data, and sprites extracted from `ER-nextdex-main/static/js/data/gameDataV2.65beta.json` and `ER-nextdex-main/static/sprites`.
- Data cross-validated by tests or multiple structured sources can also be promoted to high.

## Medium

- Source-derived relationships whose target labels are not fully resolved, such as evolution method kind IDs.
- PDF wiki text extraction when text is present.
- Species detail build previews that use source-derived learnsets but not parsed save ownership.

## Low

- Location rows from the earliest-location workbook until headers/columns are mapped per sheet.
- Trainer rows from the trainer workbook until team columns are mapped per sheet.
- Save metadata parser confidence beyond file size/hash/hex preview.
- Recommender output when based on mock owned Pokemon or unresolved numeric references.
- Any numeric ID or inferred value that cannot be resolved to a named source table.

## UI Rules

- Detail pages must show confidence/source metadata when a field is not fully proven.
- Evolution `kind:*` values are visible as raw source data until enum mapping is implemented.
- Build tabs may use parsed learnsets, but save-specific legality remains uncertain until save fixtures prove ownership/randomizer settings.

## Rules

- Low-confidence data may be searched and displayed with confidence labels.
- Low-confidence data must not be presented as confirmed legality.
- Unknown save fields remain unknown until clean/played fixtures prove them.
