import { describe, expect, it } from "vitest";

import { normalizeSearchCity } from "./location-preference";

describe("normalizeSearchCity", () => {
  it("normalizes common city aliases", () => {
    expect(normalizeSearchCity("HCM")).toBe("TP. Hồ Chí Minh");
    expect(normalizeSearchCity("Thành phố Hà Nội")).toBe("Hà Nội");
    expect(normalizeSearchCity("Da Nang")).toBe("Đà Nẵng");
  });

  it("extracts the city from an existing free-form profile address", () => {
    expect(normalizeSearchCity("123 Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh")).toBe(
      "TP. Hồ Chí Minh",
    );
  });

  it("returns an unknown province without its administrative prefix", () => {
    expect(normalizeSearchCity("Tỉnh Bình Dương")).toBe("Bình Dương");
  });
});
