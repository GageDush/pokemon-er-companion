# AI and Build Recommender Rules

## AI Is Not the Source of Truth

The source of truth is:

1. Parsed game data
2. Parsed save data
3. Confirmed mechanics from source documents
4. User-selected constraints

AI may explain and rank options, but it must not invent facts.

## Recommendation Inputs

The recommender should use:

- Current level cap
- Player's current party
- Player's PC
- Species/form data
- Current moves from save
- Legal learnsets from game data
- Main ability and sub-abilities from save/source
- Items available if known
- Trainer/boss target if selected
- Randomizer settings if detected

## Recommendation Output

Each recommendation should include:

```ts
export interface BuildRecommendation {
  pokemonId: string;
  speciesName: string;
  role: string;
  levelCap?: number;
  nature?: string;
  evSpread?: Record<string, number>;
  item?: string;
  mainAbility?: string;
  subAbilities?: string[];
  moves: string[];
  legality: {
    status: "confirmed" | "partial" | "uncertain" | "illegal";
    basis: string[];
    warnings: string[];
  };
  reasoning: string;
  confidence: "low" | "medium" | "high";
}
```

## Hard Recommendation Rules

- Do not recommend a move unless confirmed legal or currently present in the save.
- Do not recommend an ability unless confirmed legal or currently present in the save.
- Do not recommend a sub-ability unless confirmed legal or currently present in the save.
- If random moves are enabled, normal learnsets may not apply.
- If random abilities/sub-abilities are enabled, source defaults may not apply.
- If item availability is unknown, mark item suggestion as theoretical.
- If progression is unknown, avoid assuming access to late-game moves/items.

## AI/RAG Design

If AI is added:

- Use local JSON/markdown retrieval.
- Return citations/links to local pages or source records.
- Show confidence.
- Show legal/uncertain flags.
- Keep all core features functional without AI.

## Good AI Prompts Inside the App

- "Explain why this build is recommended."
- "Compare these two legal movesets."
- "What does my team lose to?"
- "Prepare me for this trainer with only my current box."
- "What is the safest change at level cap 20?"

## Bad AI Behavior to Prevent

- Hallucinating mechanics
- Using Smogon/vanilla data as source of truth
- Ignoring Elite Redux sub-abilities
- Ignoring level cap
- Ignoring randomized save settings
- Recommending unavailable moves
- Recommending unavailable items
