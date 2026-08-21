import { describe, expect, it } from "vitest";

import { isBlankRange, measureInkedHeight, pickPageBreak } from "./pdf-capture";

/** `findBlankRows` output: 1 = no ink on that row. */
function blankRows(pattern: readonly number[]) {
  return Uint8Array.from(pattern);
}

describe("pickPageBreak", () => {
  it("breaks on the lowest blank row inside the page", () => {
    // Rows 0-9; the page can hold 10 and rows 8 and 4 carry no ink.
    const rows = blankRows([0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);

    expect(pickPageBreak(rows, 0, 9, 10)).toBe(8);
  });

  it("cuts hard when a solid block is taller than the page", () => {
    // No blank row can stall the loop, or a dense CV would never finish paginating.
    const rows = blankRows([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    expect(pickPageBreak(rows, 0, 9, 10)).toBe(9);
  });

  it("ignores a blank row that would leave most of the page empty", () => {
    // A break at row 1 wastes 90% of the sheet, so the hard cut is preferred.
    const rows = blankRows([0, 1, 0, 0, 0, 0, 0, 0, 0, 0]);

    expect(pickPageBreak(rows, 0, 9, 10)).toBe(9);
  });
});

describe("measureInkedHeight", () => {
  it("drops the min-height padding below the last inked row", () => {
    const canvas = { height: 8 } as HTMLCanvasElement;

    expect(measureInkedHeight(canvas, blankRows([0, 0, 0, 1, 1, 1, 1, 1]))).toBe(3);
  });

  it("keeps at least one row for an entirely blank capture", () => {
    const canvas = { height: 4 } as HTMLCanvasElement;

    expect(measureInkedHeight(canvas, blankRows([1, 1, 1, 1]))).toBe(1);
  });
});

describe("isBlankRange", () => {
  it("clamps a negative start instead of reading out of bounds", () => {
    expect(isBlankRange(blankRows([1, 1, 0]), -5, 2)).toBe(true);
  });

  it("reports any ink in the range", () => {
    expect(isBlankRange(blankRows([1, 1, 0]), 0, 3)).toBe(false);
  });
});
