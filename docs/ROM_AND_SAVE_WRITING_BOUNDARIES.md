# ROM and Save Writing Boundaries

## ROM Loading

ROM/package loading can be used for:

- Research
- Data extraction
- Version verification
- Comparing expected structures
- Local parsing experiments

Do not redistribute ROMs or bundled copyrighted game files through the app.

## Save Loading

Allowed immediately:

- Read local save file
- Hash save file
- Preview bytes
- Compare saves
- Parse party/PC once confirmed
- Export debug report

## Save Writing

Not allowed in early milestones.

Before any save writing exists, all of this must be true:

- Save structure is documented
- Checksums are understood
- Automatic backup exists
- Dry-run diff exists
- Tests pass
- User sees exact changes
- User confirms writing
- Changes are limited to player-owned Pokémon if ever allowed
- NPC editing remains blocked
- Pokémon generation remains blocked

## ROM Writing

Treat ROM writing as out of scope unless the user explicitly redefines the project later.

Current app goal is companion/wiki/save reader, not ROM patcher.
