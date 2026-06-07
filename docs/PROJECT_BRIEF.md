# Project Brief — Pokémon Elite Redux Companion App

## One-Sentence Goal

Build a local-first companion app that turns Pokémon Elite Redux game data and the user's save file into a searchable wiki, Pokédex, save/team tracker, and legal build recommender.

## User Intent

The user wants a PokéRogue-style companion app for Pokémon Elite Redux, but focused on the specific game, its mechanics, and the player’s actual save state.

The app should help answer:

- What does this Pokémon do in Elite Redux?
- What moves/abilities/sub-abilities are legal?
- Where do I find this Pokémon/item/trainer/content?
- What is my current team and PC?
- What builds are possible from my current save?
- What should I run for the current level cap?
- What changed between a clean save and a played save?

## Core Modules

### 1. Wiki

A structured knowledge base for:

- Game mechanics
- Feature explanations
- FAQ answers
- Version changes
- Abilities
- Sub-abilities
- Moves
- Items
- Locations
- Trainers
- Progression notes

### 2. Pokédex

A full Pokédex remake based on ER NextDex/source data:

- Species/forms
- Typing
- Base stats
- Abilities
- Sub-abilities
- Learnsets
- Evolutions
- Locations
- Build roles
- Search and filters

### 3. Save Manager

Read-only first:

- Load save file locally
- Show file size/hash/hex preview
- Parse party when structure is confirmed
- Parse PC boxes when structure is confirmed
- Detect progression/badges if feasible
- Detect randomizer/settings if feasible
- Export debug JSON

### 4. Team Builder

Uses current party/PC and legal data to provide:

- Team overview
- Type matchup checks
- Role coverage
- Legal moveset options
- Item/nature/EV suggestions
- Boss/trainer prep eventually

### 5. Debug/Compare

Research tooling for:

- Clean save vs played save comparison
- ROM/save structure clues
- Offset mapping
- Unknown field tracking
- Exporting annotated binary ranges

## Explicit Exclusions

- No NPC editing
- No generated Pokémon
- No cheating Pokémon into the save
- No online-only backend requirement
- No save writing during early milestones
- No blind save mutation

## Success Criteria

The project is successful when:

1. A user can search game data locally.
2. A user can open a Pokémon page and see Elite Redux-specific data.
3. A user can upload a save locally.
4. The app can identify party/PC Pokémon from the save with high confidence.
5. The app can recommend builds only from legal/currently possible options.
6. The app clearly flags uncertain or unparsed data.
7. The app works without requiring a hosted server.
