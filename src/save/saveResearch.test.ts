import { describe, expect, it } from "vitest";
import { buildBlockCandidates, buildOffsetGroups, buildSaveResearch, detectSaveSizeFamily } from "./saveResearch";

describe("saveResearch", () => {
  it("detects a 128 KiB dual-bank candidate family without claiming proven offsets", () => {
    const family = detectSaveSizeFamily(128 * 1024);
    expect(family.id).toBe("gba-128k");
    expect(family.blockSize).toBe(0x1000);
    expect(family.banks).toBe(2);
    expect(family.confidence).toBe("medium");
  });

  it("builds aligned block candidates and pair matching for dual-bank saves", () => {
    const bytes = new Uint8Array(128 * 1024);
    bytes[0] = 1;
    bytes[0x1000] = 2;
    bytes[0x10000] = 1;
    bytes[0x11000] = 9;

    const family = detectSaveSizeFamily(bytes.byteLength);
    const blocks = buildBlockCandidates(bytes, family);

    expect(blocks).toHaveLength(32);
    expect(blocks[0].pairMatch).toBe(true);
    expect(blocks[1].pairMatch).toBe(false);
    expect(blocks[0].bank).toBe("a");
    expect(blocks[16].bank).toBe("b");
  });

  it("builds generic offset groups for research without inventing field meaning", () => {
    const bytes = new Uint8Array(64 * 1024);
    bytes[0] = 1;
    bytes[0x1000] = 1;
    bytes[0x4000] = 1;

    const family = detectSaveSizeFamily(bytes.byteLength);
    const blocks = buildBlockCandidates(bytes, family);
    const groups = buildOffsetGroups(bytes, family, blocks);

    expect(groups.some((group) => group.label.includes("Active block cluster"))).toBe(true);
    expect(groups.some((group) => group.label === "Front-matter preview range")).toBe(true);
  });

  it("wraps save research into a serializable structure", () => {
    const research = buildSaveResearch(new Uint8Array(128 * 1024));
    expect(research.sizeFamilyId).toBe("gba-128k");
    expect(research.blockCandidates.length).toBe(32);
    expect(research.provenPartyFields).toEqual([]);
  });
});
