import { describe, expect, it } from "vitest";

import { createBalancedPages } from "./job-carousel-pagination";

describe("createBalancedPages", () => {
  it("chunks eight desktop cards into 6 + 2 pages", () => {
    expect(
      createBalancedPages(
        Array.from({ length: 8 }, (_, index) => index),
        6,
      ),
    ).toEqual([
      [0, 1, 2, 3, 4, 5],
      [6, 7],
    ]);
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

  it("creates pages of exactly preferredPageSize", () => {
    expect(
      createBalancedPages(
        Array.from({ length: 13 }, (_, index) => index),
        6,
      ),
    ).toEqual([[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11], [12]]);
  });
});
