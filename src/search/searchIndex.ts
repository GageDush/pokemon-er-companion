import { SearchDocument } from "../types";

export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function searchDocuments(documents: SearchDocument[], query: string, kinds: string[] = []): SearchDocument[] {
  const normalized = normalizeQuery(query);
  const allowedKinds = new Set(kinds);

  return documents
    .filter((document) => allowedKinds.size === 0 || allowedKinds.has(document.kind))
    .filter((document) => {
      if (!normalized) return true;
      return `${document.title} ${document.summary} ${document.tokens}`.toLowerCase().includes(normalized);
    })
    .slice(0, 200);
}

export function buildSearchDocumentsFromRecords(records: {
  species?: Array<{ id: string; name: string; description?: string; types?: string[]; confidence: SearchDocument["confidence"]; source?: SearchDocument["source"] }>;
  locations?: Array<{ id: string; name: string; notes?: string[]; earliestAvailability?: string; confidence: SearchDocument["confidence"]; source?: SearchDocument["source"] }>;
  trainers?: Array<{ id: string; name: string; location?: string; notes?: string[]; confidence: SearchDocument["confidence"]; source?: SearchDocument["source"] }>;
  wiki?: Array<{ id: string; title: string; summary: string; text?: string; confidence: SearchDocument["confidence"]; source?: SearchDocument["source"] }>;
}): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const species of records.species ?? []) {
    docs.push({
      id: `species:${species.id}`,
      kind: "species",
      title: species.name,
      summary: species.description ?? "Elite Redux species record",
      tokens: [species.name, ...(species.types ?? [])].join(" "),
      href: `/pokedex/${species.id}`,
      source: species.source ?? [],
      confidence: species.confidence
    });
  }
  for (const location of records.locations ?? []) {
    docs.push({
      id: `location:${location.id}`,
      kind: "location",
      title: location.name,
      summary: location.earliestAvailability ?? location.notes?.[0] ?? "Location record",
      tokens: [location.name, ...(location.notes ?? [])].join(" "),
      href: `/locations/${location.id}`,
      source: location.source ?? [],
      confidence: location.confidence
    });
  }
  for (const trainer of records.trainers ?? []) {
    docs.push({
      id: `trainer:${trainer.id}`,
      kind: "trainer",
      title: trainer.name,
      summary: trainer.location ?? trainer.notes?.[0] ?? "Trainer record",
      tokens: [trainer.name, trainer.location ?? "", ...(trainer.notes ?? [])].join(" "),
      href: `/trainers/${trainer.id}`,
      source: trainer.source ?? [],
      confidence: trainer.confidence
    });
  }
  for (const page of records.wiki ?? []) {
    docs.push({
      id: `wiki:${page.id}`,
      kind: "wiki",
      title: page.title,
      summary: page.summary,
      tokens: [page.title, page.summary, page.text ?? ""].join(" "),
      href: `/wiki/${page.id}`,
      source: page.source ?? [],
      confidence: page.confidence
    });
  }
  return docs;
}
