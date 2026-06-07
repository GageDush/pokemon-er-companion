# Parser Confidence

## High

- Named moves, abilities, items, species, trainer parties, map encounter data, and sprites extracted from `ER-nextdex-main/static/js/data/gameDataV2.65beta.json` and `ER-nextdex-main/static/sprites`.
- Data cross-validated by tests or multiple structured sources can also be promoted to high.

## Medium

- Source-derived relationships whose target labels are not fully resolved, such as evolution method kind IDs.
- UI summaries that are formatted from structured source records without adding new mechanics, such as grouped encounter methods or provenance facts.
- Save size-family identification and aligned bank/block research based on file-size heuristics only.
- PDF wiki text extraction when text is present.
- Species detail build previews that use source-derived learnsets but not parsed save ownership.

## Low

- Candidate offset groups and active block clusters when no clean/played fixtures exist yet.
- Location rows from the earliest-location workbook until headers/columns are mapped per sheet.
- Trainer rows from the trainer workbook until team columns are mapped per sheet.
- Save metadata parser confidence beyond file size/hash/hex preview.
- Recommender output when based on mock owned Pokemon or unresolved numeric references.
- Any numeric ID or inferred value that cannot be resolved to a named source table.

## UI Rules

- Detail pages must show confidence/source metadata when a field is not fully proven.
- Evolution `kind:*` values are visible as raw source data until enum mapping is implemented; source-shaped `EVO_*` labels may be humanized without changing their meaning.
- Build tabs may use parsed learnsets, but save-specific legality remains uncertain until save fixtures prove ownership/randomizer settings.
- Save Manager and Team Builder should explicitly say when a loaded save only provides metadata and not confirmed party/PC parsing.
- Team Builder may render partial parsed-party rows only when they truly exist; unresolved rows must remain visibly uncertain.

## Rules

- Low-confidence data may be searched and displayed with confidence labels.
- Low-confidence data must not be presented as confirmed legality.
- Unknown save fields remain unknown until clean/played fixtures prove them.
