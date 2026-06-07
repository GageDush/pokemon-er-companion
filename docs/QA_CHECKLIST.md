# QA Checklist

## Source Coverage

- [ ] Every raw source from `SOURCE_MANIFEST.md` is present or explicitly marked unavailable.
- [ ] Generated data includes source provenance.
- [ ] No generated file silently mixes sources without metadata.
- [ ] Warnings are emitted for unresolved references.

## App Architecture

- [ ] Core features run locally.
- [ ] No required hosted backend.
- [ ] Parser modules are framework-neutral.
- [ ] Generated data can be bundled with the app.

## Save Safety

- [ ] Save loader is read-only.
- [ ] Original save bytes are never mutated.
- [ ] SHA-256 hash is shown.
- [ ] Hex preview is shown.
- [ ] Save writing is disabled.
- [ ] Fixtures are not overwritten.

## Legality

- [ ] Moves are checked against source/save data.
- [ ] Abilities are checked against source/save data.
- [ ] Sub-abilities are checked against source/save data.
- [ ] Randomized settings are respected when known.
- [ ] Uncertain legality is labeled uncertain.
- [ ] No illegal recommendations are shown as confirmed.

## Scope Guardrails

- [ ] No NPC editing.
- [ ] No generated Pokémon.
- [ ] No Pokémon creation from nothing.
- [ ] Player-owned Pokémon only.
- [ ] No blind binary save patches.

## Tests

- [ ] Save loader tests pass.
- [ ] Data parser tests pass.
- [ ] Generated data validation passes.
- [ ] Search index builds.
- [ ] UI smoke test passes.

## Codex Completion Checklist

Every Codex task should end with:

- [ ] Files changed
- [ ] Commands run
- [ ] Tests run
- [ ] Assumptions
- [ ] Known limitations
- [ ] Next task
