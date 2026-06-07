export interface ByteRangeDiff {
  start: number;
  end: number;
  length: number;
  beforePreview: string;
  afterPreview: string;
}

export interface SaveCompareResult {
  fileSizeA: number;
  fileSizeB: number;
  comparedBytes: number;
  changedByteCount: number;
  ranges: ByteRangeDiff[];
  warnings: string[];
}

function preview(bytes: Uint8Array, start: number, end: number): string {
  return Array.from(bytes.slice(start, Math.min(end, start + 16)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

export function compareSaveBytes(a: Uint8Array, b: Uint8Array, maxRanges = 200): SaveCompareResult {
  const comparedBytes = Math.min(a.byteLength, b.byteLength);
  const ranges: ByteRangeDiff[] = [];
  let changedByteCount = Math.abs(a.byteLength - b.byteLength);
  let index = 0;

  while (index < comparedBytes) {
    if (a[index] === b[index]) {
      index += 1;
      continue;
    }

    const start = index;
    while (index < comparedBytes && a[index] !== b[index]) {
      changedByteCount += 1;
      index += 1;
    }
    const end = index;
    if (ranges.length < maxRanges) {
      ranges.push({
        start,
        end,
        length: end - start,
        beforePreview: preview(a, start, end),
        afterPreview: preview(b, start, end)
      });
    }
  }

  const warnings: string[] = [];
  if (a.byteLength !== b.byteLength) {
    warnings.push("Files have different sizes; trailing bytes are counted as changed.");
  }
  if (ranges.length === maxRanges) {
    warnings.push("Range output was truncated. Export full debug data after parser confidence improves.");
  }

  return {
    fileSizeA: a.byteLength,
    fileSizeB: b.byteLength,
    comparedBytes,
    changedByteCount,
    ranges,
    warnings
  };
}
