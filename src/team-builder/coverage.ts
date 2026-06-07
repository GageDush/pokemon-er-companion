import { Species } from "../types";
import { TYPE_EFFECTIVENESS } from "../dex/typeChart";

export interface TeamCoverageRow {
  type: string;
  weak: number;
  resist: number;
  immune: number;
}

export function analyzeDefensiveCoverage(species: Species[]): TeamCoverageRow[] {
  const attackingTypes = Object.keys(TYPE_EFFECTIVENESS);
  return attackingTypes.map((type) => {
    let weak = 0;
    let resist = 0;
    let immune = 0;

    for (const member of species) {
      const multiplier = defensiveMultiplier(type, member.types);
      if (multiplier === 0) immune += 1;
      else if (multiplier > 1) weak += 1;
      else if (multiplier < 1) resist += 1;
    }

    return { type, weak, resist, immune };
  });
}

function defensiveMultiplier(attackingType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  for (const defenderType of defenderTypes) {
    const chart = TYPE_EFFECTIVENESS[defenderType];
    if (!chart) continue;
    if (chart.immuneTo.includes(attackingType)) multiplier *= 0;
    else if (chart.weakTo.includes(attackingType)) multiplier *= 2;
    else if (chart.resists.includes(attackingType)) multiplier *= 0.5;
  }
  return multiplier;
}
