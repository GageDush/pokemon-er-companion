import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildSaveParserLookupContext } from "../src/app/dataClient";
import { parseSaveReadOnly } from "../src/save/saveLoader";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Usage: vite-node scripts/verify_save.ts <path-to-sav>");
  }

  const root = process.cwd();
  const data = {
    species: await readJson(path.join(root, "data/generated/species.json")),
    moves: await readJson(path.join(root, "data/generated/moves.json")),
    items: await readJson(path.join(root, "data/generated/items.json")),
    abilities: [],
    subabilities: [],
    learnsets: [],
    evolutions: [],
    locations: [],
    trainers: [],
    wiki: [],
    searchIndex: [],
    warnings: []
  };

  const bytes = new Uint8Array(await readFile(filePath));
  const parsed = await parseSaveReadOnly(path.basename(filePath), bytes, buildSaveParserLookupContext(data));

  const preview = {
    file: filePath,
    parserConfidence: parsed.metadata.parserConfidence,
    likelyFormat: parsed.metadata.likelyFormat,
    sizeFamily: parsed.metadata.sizeFamily,
    partyCount: parsed.party.length,
    pcRowCount: parsed.boxes.reduce((sum, box) => sum + box.length, 0),
    warnings: parsed.warnings,
    party: parsed.party.slice(0, 6),
    boxes: parsed.boxes.slice(0, 3).map((box, index) => ({
      box: index + 1,
      count: box.length,
      sample: box.slice(0, 5)
    }))
  };

  console.log(JSON.stringify(preview, null, 2));
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
