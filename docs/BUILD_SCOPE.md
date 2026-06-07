# Build Scope

## In Scope

### Wiki

- Mechanics pages
- Feature explanations
- FAQ-derived help pages
- Changelog/version pages
- Searchable move/ability/sub-ability/item/location/trainer pages

### Pokédex

- Full species list
- Forms and variants if present in source
- Stats/types
- Evolutions
- Abilities and sub-abilities
- Learnsets
- Locations/availability
- Search/filter/sort

### Save File Tools

- Local upload
- Read-only binary load
- File size
- SHA-256 hash
- Hex preview
- Export debug JSON
- Clean vs played save comparison
- Party parser once confirmed
- PC parser once confirmed
- Progression/badge/level cap parser if feasible
- Randomizer/mode detection if feasible

### Team/Build Tools

- Current team page
- PC browser
- Legal build recommender
- Team weakness analysis
- Role coverage
- Level-cap-aware recommendations
- Boss/trainer prep eventually

### ROM/Game Data Tools

- ROM/package loading for research if legally/technically feasible
- Extracting/normalizing game data from provided source packages
- Version-aware data generation
- Cross-checking source files against generated JSON

### App Platforms

- Desktop-first local prototype
- Mobile path preserved
- No hosted backend dependency

## Out of Scope

- NPC editing
- Creating Pokémon from nothing
- Save cheating/generation tools
- Online-only app architecture
- Hosted database as required infrastructure
- Recommending illegal builds
- Blind binary patching
- ROM distribution
- Copyright-infringing redistribution of game/ROM files

## Later/Conditional Scope

These are allowed only after the read-only foundation is solid.

### Safe Save Writing

Only consider after:

- Save format is documented
- Checksums are understood
- Backups are automatic
- Unit tests exist
- App warns the user
- The feature is limited to player-owned Pokémon
- No Pokémon generation is implemented

Potential safe edits later:

- Notes/tags stored outside the save
- Team planning metadata stored in app DB
- Possibly player-owned Pokémon edits only if explicitly authorized and legal/safe

### AI Assistant

Allowed as optional feature if it uses local retrieval and cites/links local data internally.

## Build Philosophy

Build in this order:

1. Static data is reliable.
2. Search and UI are useful.
3. Save loading is safe.
4. Save parsing is proven.
5. Recommendations are legal.
6. AI explains, but never invents.
7. Save writing only after strong safety boundaries.
