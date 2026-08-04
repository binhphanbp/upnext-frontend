import { describe, expect, it } from "vitest";

import { isValidPhoneNumber, normalizePhoneNumber } from "./phone";

describe("phone validation", () => {
  it("accepts local Vietnamese and international phone formats", () => {
    expect(isValidPhoneNumber("0382 823 609")).toBe(true);
    expect(isValidPhoneNumber("+84 (382) 823-609")).toBe(true);
    expect(isValidPhoneNumber("+1 415 555 2671")).toBe(true);
    expect(isValidPhoneNumber("+44 20 7946 0018")).toBe(true);
    expect(isValidPhoneNumber("0044 20 7946 0018")).toBe(true);
  });

  it("rejects incomplete and malformed phone numbers", () => {
    expect(isValidPhoneNumber("0")).toBe(false);
    expect(isValidPhoneNumber("03828236")).toBe(false);
    expect(isValidPhoneNumber("1234567890")).toBe(false);
    expect(isValidPhoneNumber("+999 123 456")).toBe(false);
  });

  it("keeps a normalized contact number suitable for persistence", () => {
    expect(normalizePhoneNumber("+84 (382) 823-609")).toBe("+84382823609");
    expect(normalizePhoneNumber("0382 823 609")).toBe("+84382823609");
    expect(normalizePhoneNumber("+1 415 555 2671")).toBe("+14155552671");
    expect(normalizePhoneNumber("0044 20 7946 0018")).toBe("+442079460018");
  });
});
