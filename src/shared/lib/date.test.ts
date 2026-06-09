import { describe, expect, it } from "vitest";

import { formatAppDate, toDate } from "./date";

describe("date helpers", () => {
  it("formats dates with the app date format", () => {
    expect(formatAppDate(new Date(2026, 0, 2), "vi")).toBe("02/01/2026");
  });

  it("throws on invalid date values", () => {
    expect(() => toDate("not-a-date")).toThrow("Invalid date value");
  });
});
