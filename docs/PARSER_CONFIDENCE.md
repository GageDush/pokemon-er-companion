# Parser Confidence

## High

- Named moves, abilities, items, species, trainer parties, map encounter data, and sprites extracted from `ER-nextdex-main/static/js/data/gameDataV2.65beta.json` and `ER-nextdex-main/static/sprites`.
- Data cross-validated by tests or multiple structured sources can also be promoted to high.

## Medium

- Source-derived relationships whose target labels are not fully resolved, such as evolution method kind IDs.
- PDF wiki text extraction when text is present.

## Low

- Location rows from the earliest-location workbook until headers/columns are mapped per sheet.
- Trainer rows from the trainer workbook until team columns are mapped per sheet.
- Save metadata parser confidence beyond file size/hash/hex preview.
- Recommender output when based on mock owned Pokemon or unresolved numeric references.
- Any numeric ID or inferred value that cannot be resolved to a named source table.

## Rules

- Low-confidence data may be searched and displayed with confidence labels.
- Low-confidence data must not be presented as confirmed legality.
- Unknown save fields remain unknown until clean/played fixtures prove them.
