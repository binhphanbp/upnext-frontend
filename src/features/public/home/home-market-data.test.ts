import { describe, expect, it } from "vitest";

import { getSalaryBandIndex, parseMarketPointDate } from "./home-market-data";

describe("homepage market aggregate adapters", () => {
  it("parses the backend dd/MM labels in the aggregate date range", () => {
    const julyPoint = parseMarketPointDate(
      "29/07",
      "2026-07-04T00:00:00.000Z",
      "2026-08-01T00:00:00.000Z",
    );
    const augustPoint = parseMarketPointDate(
      "01/08",
      "2026-07-04T00:00:00.000Z",
      "2026-08-01T00:00:00.000Z",
    );

    expect([julyPoint?.getFullYear(), julyPoint?.getMonth(), julyPoint?.getDate()]).toEqual([
      2026, 6, 29,
    ]);
    expect([augustPoint?.getFullYear(), augustPoint?.getMonth(), augustPoint?.getDate()]).toEqual([
      2026, 7, 1,
    ]);
  });

  it("maps localized salary labels without depending on their array position", () => {
    expect(getSalaryBandIndex("Dưới 10 triệu", 4)).toBe(0);
    expect(getSalaryBandIndex("30 - 50 triệu", 0)).toBe(3);
    expect(getSalaryBandIndex("Trên 50 triệu", 0)).toBe(4);
  });
});
