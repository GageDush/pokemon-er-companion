# Save Parsing Plan

## Prime Directive

Start read-only. Do not write to the save file.

## Required Fixtures

Put fixtures in a safe test folder, never overwrite them:

```txt
test/fixtures/saves/
  clean_v2_65_3b.sav
  played_v2_65_3b_one_gym.sav
  randomized_moves_sample.sav
  randomized_abilities_sample.sav
```

Only include fixtures in the repo if legally/private-data safe. Otherwise keep local and document paths.

## Phase 1 — File Loader

Implement:

- Load binary file
- File size
- SHA-256 hash
- First 256 bytes hex preview
- Export raw metadata JSON
- Parser confidence = low

No mutation.

## Phase 2 — Binary Compare

Implement comparison of:

- Clean save vs played save
- Played save before/after catching one Pokémon
- Played save before/after gym badge
- Played save before/after PC deposit

Outputs:

- Changed byte ranges
- Repeated block patterns
- Candidate party block ranges
- Candidate PC block ranges
- Candidate progression flag ranges

## Phase 3 — Known GBA/Emerald Structure Research

Elite Redux is based on GBA Pokémon conventions, but do not assume exact vanilla layout.

Document every assumption in:

```txt
docs/SAVE_STRUCTURE.md
```

Track:

- Save block sizes
- Save indices
- Checksums
- Party offsets
- PC storage offsets
- Pokémon data encryption/ordering if applicable
- Elite Redux-specific extensions

## Phase 4 — Party Parser

Only when offsets are confirmed:

- Read party count
- Decode party Pokémon
- Validate species IDs
- Validate level/HP/stats if available
- Validate moves
- Validate abilities/sub-abilities if stored
- Set parser confidence

## Phase 5 — PC Parser

Only when storage layout is confirmed:

- Decode boxes
- Preserve box names if available
- Decode Pokémon fields
- Do not mutate

## Phase 6 — Progression and Settings

Attempt only after party/PC parser is stable:

- Badges
- Flags
- Level cap
- Game mode
- Random moves setting
- Random abilities setting
- Random sub-abilities setting

## ParsedSave Shape

```ts
export type ParserConfidence = "low" | "medium" | "high";

export interface ParsedSave {
  metadata: {
    game: string;
    version?: string;
    fileSize: number;
    sha256: string;
    checksumStatus?: "valid" | "invalid" | "unknown";
    parserConfidence: ParserConfidence;
  };
  party: ParsedPokemon[];
  boxes: ParsedPokemon[][];
  progression?: {
    badges?: number;
    currentLevelCap?: number;
    flags?: Record<string, boolean>;
  };
  settings?: {
    randomMoves?: boolean;
    randomAbilities?: boolean;
    randomSubAbilities?: boolean;
  };
  warnings: string[];
}
```

## Safety Requirements Before Any Future Save Writing

All must be true:

- Automatic backup exists
- Dry-run diff exists
- Checksum recalculation proven
- Tests pass against fixtures
- User confirmation exists
- Scope excludes NPCs
- Scope excludes generated Pokémon
- App can restore backup

Until then, save writing remains disabled.
