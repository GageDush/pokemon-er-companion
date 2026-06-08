import { describe, expect, it } from "vitest";
import { buildFixtureLabSummary } from "./saveFixtureLab";

describe("saveFixtureLab", () => {
  it("highlights changed sectors and party overlap from synthetic saves", () => {
    const a = buildSyntheticSave();
    const b = buildSyntheticSave();

    const teamSectorOffset = 2 * 4096;
    b[teamSectorOffset + 564] = 0x03;
    b[teamSectorOffset + 568] = 0x2a;

    const pcSectorOffset = 8 * 4096;
    b[pcSectorOffset + 4] = 0x77;

    const summary = buildFixtureLabSummary(a, b);
    expect(summary.compare.changedByteCount).toBeGreaterThan(0);
    expect(summary.partyOverlap).toBe(true);
    expect(summary.changedSectors.some((sector) => sector.sectorIdA === 2)).toBe(true);
    expect(summary.pcLayoutOverlaps.find((layout) => layout.id === "new-layout")?.overlap).toBe(true);
  });
});

function buildSyntheticSave() {
  const bytes = new Uint8Array(128 * 1024);
  for (let sectorId = 0; sectorId < 20; sectorId += 1) {
    const offset = sectorId * 4096;
    bytes[offset + 4084] = sectorId & 0xff;
    bytes[offset + 4085] = (sectorId >>> 8) & 0xff;
    writeWord(bytes, offset + 4088, 0x08012025);
  }
  return bytes;
}

function writeWord(bytes: Uint8Array, start: number, value: number) {
  bytes[start] = value & 0xff;
  bytes[start + 1] = (value >>> 8) & 0xff;
  bytes[start + 2] = (value >>> 16) & 0xff;
  bytes[start + 3] = (value >>> 24) & 0xff;
}
