# Main Thread Continuation Prompt

Continue the Pokemon Elite Redux Companion app from the current repository state.

Use the latest committed progress as your working baseline and do not undo prior implementation. Treat the app as a mobile-first, local-first Elite Redux field companion, not a generic Pokemon site and not a save editor.

## Product Priorities

1. Mobile-first UX on iPhone-sized screens.
2. Local-first, read-only trust model.
3. Source-confidence visibility everywhere uncertainty exists.
4. Fast in-hand gameplay companion flows: Dex, Team, Save, Wiki.
5. Premium visual polish without weakening operational clarity.

## Primary Design References

Use these as the priority visual references:

- `C:\Users\gaged\Downloads\Factory _ Agent-Native Software Development.html`
- `C:\Users\gaged\Downloads\Biosphere77.html`

Use these as supporting visual assets and reference material:

- `C:\Users\gaged\Downloads\Fonts & Colors.png`
- `C:\Users\gaged\Downloads\Cover.png`
- `C:\Users\gaged\Downloads\Hubble's UI KIT (Community).zip`

## Design Synthesis

Blend the references instead of copying either one literally.

### Take from Factory.ai

- disciplined information hierarchy
- premium product-tool feeling
- clean typography
- restrained, confident composition
- crisp spacing and strong section framing
- minimal-but-intentional motion

### Take from Biosphere77

- atmospheric loading/entrance motion
- immersive dark surfaces
- layered glow, blur, depth, and cinematic transition feel
- subtle noise/grain and environmental texture
- a feeling that the product is alive when booting

### Keep the app itself grounded

- not a marketing landing page
- not long cinematic blocking intros
- not decorative filler
- not generic SaaS dashboard styling
- not a fake-complete UI that hides confidence or safety warnings

## Visual System Direction

Use the palette and typography cues from `Fonts & Colors.png` as the core system:

- Accent highlight: `#FFB444`
- Positive/supportive: `#B2FFE2`
- Informational/system: `#ADDAEE`
- Dark neutral: `#232323`
- True black: `#000000`
- White: `#FFFFFF`

Typography direction:

- display/headline tone inspired by Clash Display from the reference
- clean readable body text for operational surfaces
- preserve strong readability on mobile

## Loader / Motion Direction

Implement a short premium loader inspired by Biosphere77, but tailored to this product.

The loader should feel like:

- Dex link establishing
- local data sync coming online
- read-only field companion boot
- sprite signal / scanner activation

Requirements:

- cold-load sequence only, around 1 to 2 seconds max
- atmospheric motion with depth, glow, and subtle noise
- no long blocking intro
- fast handoff into the real UI
- after first load, use lighter transitions and loading states

Possible visual ingredients:

- soft gradient drift
- scanner sweep or ring pulse
- sprite silhouette reveal
- terminal / field-device activation language
- subtle grain overlay

## UX Requirements

The app should feel like a premium Elite Redux field device:

- bottom navigation is primary on mobile
- cards remain compact and touch-friendly
- species detail stays sprite-forward
- Team and Save surfaces feel operational, dense, and trustworthy
- confidence/source badges remain visible and easy to scan
- read-only save safety language is always preserved

## Continue Building These Screens First

1. Home
2. Pokedex
3. Species Detail
4. Team + Save dashboard

## Existing Product Rules That Must Survive

- local-first only
- no hosted backend required for core use
- no NPC editing
- no generated Pokemon
- no creating Pokemon from nothing
- no save writing
- save parsing remains read-only
- recommendations must be constrained by parsed game data and parsed save/current-owned data
- if data is uncertain, show uncertainty

## Implementation Guidance

- Prefer polishing the existing React app rather than replacing structure.
- Keep source-confidence UI explicit.
- Keep the main shell usable during development on desktop, but optimize the actual UX for mobile.
- Use sprites and game-native content where available from local generated assets.
- If you add a loader, verify it does not slow repeated use or obscure app state.

## Resume Point

Read `docs/RESUME_PROGRESS_2026-06-07.md` first, then continue from the latest committed state.
