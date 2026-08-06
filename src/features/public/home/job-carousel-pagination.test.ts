import { describe, expect, it } from "vitest";

import { createBalancedPages } from "./job-carousel-pagination";

describe("createBalancedPages", () => {
  it("keeps eight desktop cards together instead of producing a sparse 6 + 2 split", () => {
    expect(
      createBalancedPages(
        Array.from({ length: 8 }, (_, index) => index),
        6,
      ),
    ).toEqual([[0, 1, 2, 3, 4, 5, 6, 7]]);
  });

  it("creates consistent two-card pages for a narrow viewport", () => {
    expect(
      createBalancedPages(
        Array.from({ length: 8 }, (_, index) => index),
        2,
      ),
    ).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
    ]);
  });

  it("distributes a non-even set without a one-item final page when possible", () => {
    expect(
      createBalancedPages(
        Array.from({ length: 9 }, (_, index) => index),
        2,
      ),
    ).toEqual([
      [0, 1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ]);
  });
});
