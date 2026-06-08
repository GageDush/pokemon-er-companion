import { gzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { extractSaveCandidatesFromBytes } from "./saveImport";

describe("saveImport", () => {
  it("passes through raw save bytes", () => {
    const bytes = new Uint8Array(128 * 1024);
    const result = extractSaveCandidatesFromBytes("direct.sav", bytes);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].fileName).toBe("direct.sav");
    expect(result.candidates[0].bytes).toEqual(bytes);
  });

  it("extracts an embedded save candidate from a gzipped mobile state export", () => {
    const state = buildSyntheticStateBlob(15);
    const gz = gzipSync(state);
    const result = extractSaveCandidatesFromBytes("mobile-export.gz", gz);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].fileName).toBe("mobile-export.sav");
    expect(result.candidates[0].bytes).toHaveLength(128 * 1024);
    expect(result.candidates[0].notes.join(" ")).toContain("Observed sector ID order: 15, 16, 17, 18, 19, 0");
  });

  it("dedupes identical embedded save candidates inside a zip and keeps distinct ones", () => {
    const duplicateA = gzipSync(buildSyntheticStateBlob(15));
    const duplicateB = gzipSync(buildSyntheticStateBlob(15));
    const older = gzipSync(buildSyntheticStateBlob(19));
    const zip = zipSync({
      "GBA /A.gz": duplicateA,
      "GBA /B.gz": duplicateB,
      "GBA /C.gz": older
    });

    const result = extractSaveCandidatesFromBytes("archive.zip", zip);
    expect(result.candidates).toHaveLength(2);
    expect(result.warnings.join(" ")).toContain("Archive import");
  });
});

function buildSyntheticStateBlob(firstSectorId: number): Uint8Array {
  const bytes = new Uint8Array(700_000);
  const start = 594_460;
  const title = "POKEMON EMERBPEE";
  for (let index = 0; index < title.length; index += 1) {
    bytes[4 + index] = title.charCodeAt(index);
  }

  for (let sectorIndex = 0; sectorIndex < 20; sectorIndex += 1) {
    const sectorStart = start + sectorIndex * 4096;
    const sectorId = (firstSectorId + sectorIndex) % 20;
    bytes[sectorStart] = sectorId + 1;
    bytes[sectorStart + 4084] = sectorId & 0xff;
    bytes[sectorStart + 4085] = (sectorId >>> 8) & 0xff;
    writeWord(bytes, sectorStart + 4088, 0x08012025);
  }

  return bytes;
}

function writeWord(bytes: Uint8Array, start: number, value: number) {
  bytes[start] = value & 0xff;
  bytes[start + 1] = (value >>> 8) & 0xff;
  bytes[start + 2] = (value >>> 16) & 0xff;
  bytes[start + 3] = (value >>> 24) & 0xff;
}
