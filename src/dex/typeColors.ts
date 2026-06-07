export const TYPE_COLORS: Record<string, string> = {
  Normal: "#7c7f74",
  Fire: "#d64f31",
  Water: "#3478c7",
  Grass: "#2ab76f",
  Electric: "#d5a827",
  Ice: "#50a8b7",
  Fighting: "#a74438",
  Poison: "#8b5ab6",
  Ground: "#a8733d",
  Flying: "#6d86c7",
  Psychic: "#c24e7c",
  Bug: "#7b9334",
  Rock: "#8f7f4a",
  Ghost: "#615496",
  Dragon: "#5962b8",
  Dark: "#4d433f",
  Steel: "#687986",
  Fairy: "#c76d9f"
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#6b7280";
}

export function typeWash(type: string): string {
  return `${typeColor(type)}24`;
}
