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

  it("climbs from a district-level unit up to its province", () => {
    expect(normalizeSearchCity("Thành phố Thủ Đức, Thành phố Hồ Chí Minh")).toBe("TP. Hồ Chí Minh");
    expect(normalizeSearchCity("Thành phố Biên Hòa, Đồng Nai")).toBe("Đồng Nai");
    expect(normalizeSearchCity("Phường 7, Thành phố Vũng Tàu")).toBe("Bà Rịa - Vũng Tàu");
    expect(normalizeSearchCity("Thành phố Thuận An, Tỉnh Bình Dương")).toBe("Bình Dương");
  });

  it("resolves a full reverse-geocoded address to its province", () => {
    expect(
      normalizeSearchCity(
        "12, Đường Nguyễn Văn Linh, Phường Tân Phong, Quận 7, Thành phố Hồ Chí Minh, 70000, Việt Nam",
      ),
    ).toBe("TP. Hồ Chí Minh");
    expect(normalizeSearchCity("Xã Vĩnh Ngọc, Huyện Đông Anh, Thành phố Hà Nội, Việt Nam")).toBe(
      "Hà Nội",
    );
  });

  it("keeps a province the search dropdowns already list", () => {
    for (const option of ["Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Bình Dương", "Đồng Nai"]) {
      expect(normalizeSearchCity(option)).toBe(option);
    }
    expect(normalizeSearchCity("TP. Hồ Chí Minh")).toBe("TP. Hồ Chí Minh");
  });

  it("ignores values that are not Vietnamese provinces", () => {
    expect(normalizeSearchCity("Remote")).toBe("Remote");
    expect(normalizeSearchCity("   ")).toBeNull();
    expect(normalizeSearchCity(null)).toBeNull();
  });
});
