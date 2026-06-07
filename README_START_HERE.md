# START HERE — Pokémon Elite Redux Companion Codex Packet

Created: 2026-06-07

This packet is the project memory file set for starting the **Pokémon Elite Redux Companion App** in Codex without losing the original scope, source list, safety rules, and build constraints.

## How to use this packet

1. Create/open your new project repo, for example:

   ```txt
   pokemon-elite-redux-companion/
   ```

2. Copy every file from this packet into the repo root.

3. Put the raw source files listed in `docs/SOURCE_MANIFEST.md` into:

   ```txt
   data/raw/
   ```

4. Paste the contents of `CODEX_BOOTSTRAP_PROMPT.txt` into Codex as the first task.

5. Keep `AGENTS.md` at the repo root. Codex should treat it as standing project instructions.

## What this packet protects against

- Forgetting source files
- Forgetting the no-NPC-editing / no-generated-Pokémon rule
- Building a hosted backend when the project is supposed to be local-first
- Recommending illegal builds
- Guessing save structure before it is proven
- Mixing vanilla Emerald assumptions into Elite Redux mechanics
- Losing the desktop + mobile target

## Absolute non-negotiables

- Local-first app. Core functionality must run on device.
- Desktop and mobile target.
- Read-only save parsing first.
- No NPC editing.
- No generated Pokémon.
- Player-owned Pokémon only: party and PC.
- Recommendations must be constrained by parsed game data and parsed save data.
- If legality is uncertain, show uncertainty instead of pretending.

## First implementation goal

Build a prototype that can:

1. Load normalized static game data.
2. Display a searchable Pokédex/wiki shell.
3. Upload a save file read-only.
4. Show save metadata, hash, file size, and hex preview.
5. Export debug JSON.
6. Establish the data pipeline from raw sources into generated JSON.

Do **not** start by writing save data back. Do **not** start by implementing cheats.
