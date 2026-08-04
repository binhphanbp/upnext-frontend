import { describe, expect, it } from "vitest";

import { isValidVietnamesePhoneNumber, normalizeVietnamesePhoneNumber } from "./phone";

describe("Vietnamese phone validation", () => {
  it("accepts local and international phone formats", () => {
    expect(isValidVietnamesePhoneNumber("0382 823 609")).toBe(true);
    expect(isValidVietnamesePhoneNumber("+84 (382) 823-609")).toBe(true);
    expect(isValidVietnamesePhoneNumber("028 1234 5678")).toBe(true);
  });

  it("rejects incomplete and malformed phone numbers", () => {
    expect(isValidVietnamesePhoneNumber("0")).toBe(false);
    expect(isValidVietnamesePhoneNumber("03828236")).toBe(false);
    expect(isValidVietnamesePhoneNumber("1234567890")).toBe(false);
  });

  it("keeps a normalized contact number suitable for persistence", () => {
    expect(normalizeVietnamesePhoneNumber("+84 (382) 823-609")).toBe("+84382823609");
  });
});
