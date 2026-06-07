import { describe, expect, it } from "vitest";
import { searchDocuments } from "./searchIndex";
import { SearchDocument } from "../types";

const docs: SearchDocument[] = [
  { id: "species:bulbasaur", kind: "species", title: "Bulbasaur", summary: "Grass starter", tokens: "grass poison", href: "/pokedex/bulbasaur", source: [], confidence: "medium" },
  { id: "wiki:faq", kind: "wiki", title: "FAQ", summary: "Difficulty modes", tokens: "elite redux modes", href: "/wiki/faq", source: [], confidence: "medium" }
];

describe("searchDocuments", () => {
  it("filters by query and kind", () => {
    expect(searchDocuments(docs, "grass").map((doc) => doc.id)).toEqual(["species:bulbasaur"]);
    expect(searchDocuments(docs, "", ["wiki"]).map((doc) => doc.id)).toEqual(["wiki:faq"]);
  });
});
