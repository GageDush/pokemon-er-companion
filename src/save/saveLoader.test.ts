import { describe, expect, it } from "vitest";
import { analyzeSaveBytes, detectLikelySaveFormat, parseSaveReadOnly, toHexPreview } from "./saveLoader";

describe("saveLoader", () => {
  it("detects common GBA save sizes", () => {
    expect(detectLikelySaveFormat(128 * 1024)).toBe("GBA 128 KiB save");
    expect(detectLikelySaveFormat(64 * 1024)).toBe("GBA 64 KiB save");
    expect(detectLikelySaveFormat(123)).toBe("Unknown binary save");
  });

  it("creates a fixed-width hex preview", () => {
    const preview = toHexPreview(new Uint8Array([0, 1, 65, 66, 255]));
    expect(preview).toContain("00000000");
    expect(preview).toContain("00 01 41 42 ff");
    expect(preview).toContain("..AB.");
  });

  it("hashes save bytes without mutating them", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const original = Array.from(bytes);
    const metadata = await analyzeSaveBytes("synthetic.sav", bytes);
    expect(metadata.fileName).toBe("synthetic.sav");
    expect(metadata.sha256).toBe("9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a");
    expect(Array.from(bytes)).toEqual(original);
    expect(metadata.parserConfidence).toBe("low");
  });

  it("wraps read-only save research without claiming party parsing", async () => {
    const bytes = new Uint8Array(128 * 1024);
    const parsed = await parseSaveReadOnly("fixtureless.sav", bytes);
    expect(parsed.research?.sizeFamilyId).toBe("gba-128k");
    expect(parsed.party).toEqual([]);
    expect(parsed.warnings.join(" ")).toContain("party parsing remains disabled");
  });
});
