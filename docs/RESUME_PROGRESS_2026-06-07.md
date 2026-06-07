# Resume Progress - 2026-06-07

This file is a resume note for the next Codex pass.

## Latest Commits

- `238be73` - Polish mobile shell and save context scaffolding
- `d12c51a` - Add species detail view and save fixture research plan
- `1677734` - Improve data confidence and mobile sprite UI

## Current Working State

The app already has:

- mobile-first shell and bottom primary navigation
- utility navigation for secondary pages
- local generated data loading
- sprite-forward Pokedex
- species detail tabs:
  - Overview
  - Stats
  - Learnset
  - Evolution
  - Locations
  - Builds
  - Source
- Team Builder with legality-aware recommendation display
- Save Manager with read-only metadata flow
- save compare/debug flow
- confidence/source badges and warnings

## Current Data Position

Primary structured source is:

- `ER-nextdex-main/static/js/data/gameDataV2.65beta.json`

High-confidence generated data currently includes named:

- species
- moves
- abilities
- sub-abilities
- items
- learnsets
- many encounter/location rows
- many trainer rows
- local sprites extracted from NextDex source

## Current UX Position

The app is already moving in the right direction for mobile, but it still needs a stronger premium identity.

The next polish pass should focus on:

1. stronger dark premium shell
2. more deliberate visual hierarchy
3. more immersive but short loading/boot motion
4. cleaner Team + Save dashboard feeling
5. better visual synthesis of sprite-forward game content with premium product UI

## What Was Just Discussed

Design references to prioritize:

- `Factory _ Agent-Native Software Development.html`
- `Biosphere77.html`

Supporting assets:

- `Fonts & Colors.png`
- `Cover.png`
- `Hubble's UI KIT (Community).zip`

The user specifically likes the Biosphere-style loading animation and wants something similarly cool, but appropriate for this app.

Recommended interpretation:

- short cinematic cold-load only
- field companion boot / dex scanner / local sync feeling
- subtle glow, blur, gradient drift, noise, and reveal motion
- do not let it become a long blocking landing-page intro

## Most Important Constraints

- local-first
- read-only save parsing only
- no save writing
- no cheat features
- no invented legality
- no hiding uncertain data

## Known Blockers

- save party/PC parsing still needs real fixture-backed validation
- evolution enum mapping is still incomplete for raw numeric `kind:*` rows
- Browser / Computer Use workflows were unstable in the parent thread, so do not depend on them unless needed and working
- native Tauri / Android / iOS packaging still depends on environment setup outside the repo

## Best Next Engineering Slice

1. introduce premium loader / boot transition for cold data load
2. deepen Factory/Biosphere visual pass across Home, Pokedex, Species Detail, Team, and Save
3. unify dark shell styling and surface system
4. keep confidence/read-only/source language highly visible
5. after UX pass, continue save fixture research and real parsed-party integration

## Verification Baseline From The Last Main Pass

Last verified in the parent thread:

- `npm.cmd run typecheck` passed
- `npm.cmd run lint` passed
- `npm.cmd test` passed
- `npm.cmd run build` passed

## Current Local Git State At Side Conversation Start

- only `design-mockups/` was untracked
- no staged source edits were pending in the project worktree

## Instruction For The Next Main-Thread Pass

Read `docs/MAIN_THREAD_UI_DIRECTION_PROMPT.md` first, then continue implementation from the latest commit without reverting prior work.
