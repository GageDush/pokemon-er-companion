# AGENTS.md — Pokémon Elite Redux Companion

## Project Identity

Build a local-first desktop/mobile companion app for **Pokémon Elite Redux**.

The app should eventually include:

- Complete wiki for Pokémon Elite Redux mechanics and content
- Pokédex rebuilt from ER NextDex/source data
- Move, ability, sub-ability, item, location, and trainer lookup
- Save-file upload and read-only parsing
- Current party and PC tracking
- Team analysis
- Legal build recommendations constrained by the save and game data
- ROM/save comparison tools for research/debugging
- Optional AI-assisted explanations over local data

## Hard Scope Rules

These rules override convenience or user-interface ideas.

1. **No NPC editing.**
2. **No generated Pokémon.**
3. **No creating Pokémon from nothing.**
4. **Player-owned Pokémon only:** current party and PC.
5. **Read-only save parsing first.**
6. **No save writing until save structure, checksums, backups, and tests are proven.**
7. **No hosted backend for core functionality.**
8. **No guessing legality.** Mark uncertain data as uncertain.
9. **Do not assume vanilla Emerald mechanics where Elite Redux differs.**
10. **Do not recommend moves, abilities, sub-abilities, items, or builds unless supported by parsed game data or the current save.**

## Target Platforms

The build should keep a path open for:

- Desktop: Windows first, then macOS/Linux if feasible
- Mobile: iOS and Android

Preferred approach for early work:

- TypeScript-first app prototype
- React + Vite for fast iteration
- Parser/data modules kept framework-neutral
- Later wrap with Tauri/Electron for desktop and Capacitor/React Native/Flutter pathway for mobile if needed

## Local-First Requirements

Core app features must run locally:

- Search wiki/dex data
- Load bundled generated JSON
- Upload/read save files
- Parse party/PC when implemented
- Recommend legal builds from local data
- Export debug JSON

Network features may be optional, but must not be required for core usage.

## Data Discipline

Generated data should come from raw sources and scripts.

Raw sources go in:

```txt
/data/raw/
```

Generated normalized data goes in:

```txt
/data/generated/
```

Every parser/transformer should be documented and testable.

## Save Parser Rules

- Never mutate the original save file during parsing.
- Treat save loading as binary input.
- Start with file size, hash, and hex preview.
- Use fixtures for clean save and played save comparison.
- Any discovered save offset must be documented in `docs/SAVE_STRUCTURE.md`.
- Use confidence levels: low, medium, high.
- Unknown bytes/fields remain unknown until proven.
- Save writing must stay disabled until explicitly authorized later.

## Build Recommendation Rules

Every build recommendation must show:

- Pokémon species/form
- Level cap assumption
- Main ability
- Sub-abilities
- Moves
- Nature
- EV spread
- Held item
- Role
- Legality basis
- Confidence
- Reasoning

The recommender must only use:

- Parsed game data
- Parsed save data
- Current Pokémon state from save
- Confirmed mechanics from source/docs

If the save has randomized moves, abilities, or sub-abilities, recommendations must prioritize what the save says is possible.

## AI Rules

AI is optional and supportive. It must not be the source of truth.

AI may:

- Explain builds
- Summarize team weaknesses
- Answer wiki-style questions from local data
- Help compare options

AI may not:

- Invent game data
- Invent legality
- Ignore randomizer settings
- Recommend unavailable moves/abilities/sub-abilities
- Require a hosted backend for core app operation

## Expected Repo Structure

```txt
pokemon-elite-redux-companion/
  AGENTS.md
  README.md
  CODEX_BOOTSTRAP_PROMPT.txt
  docs/
    PROJECT_BRIEF.md
    SOURCE_MANIFEST.md
    BUILD_SCOPE.md
    DATA_PIPELINE.md
    SAVE_PARSING_PLAN.md
    AI_AND_RECOMMENDER_RULES.md
    TASKS.md
    QA_CHECKLIST.md
    SAVE_STRUCTURE.md
  data/
    raw/
      _PUT_SOURCE_FILES_HERE.md
    generated/
      _GENERATED_DATA_GOES_HERE.md
  scripts/
  src/
    app/
    components/
    dex/
    save/
    parsers/
    search/
    team-builder/
    types/
```

## Completion Response Expectations

When Codex completes a task, it should summarize:

- Files created/changed
- Commands run
- Tests run
- Parser assumptions
- Known limitations
- Next recommended task
