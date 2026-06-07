import { describe, expect, it } from "vitest";
import { compareSaveBytes } from "./saveCompare";

describe("saveCompare", () => {
  it("groups contiguous changed bytes into ranges", () => {
    const before = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const after = new Uint8Array([0, 9, 9, 3, 4, 8]);
    const result = compareSaveBytes(before, after);
    expect(result.changedByteCount).toBe(3);
    expect(result.ranges).toHaveLength(2);
    expect(result.ranges[0]).toMatchObject({ start: 1, end: 3, length: 2 });
    expect(result.ranges[1]).toMatchObject({ start: 5, end: 6, length: 1 });
  });

  it("counts size differences as changed trailing bytes", () => {
    const result = compareSaveBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]));
    expect(result.changedByteCount).toBe(1);
    expect(result.warnings[0]).toContain("different sizes");
  });
});
