import { describe, expect, it } from "vitest";

import { isValidPhoneNumber, normalizePhoneNumber } from "./phone";

describe("phone validation", () => {
  it("accepts reachable local and international formats", () => {
    expect(isValidPhoneNumber("0382 823 609")).toBe(true);
    expect(isValidPhoneNumber("+84 (382) 823-609")).toBe(true);
    expect(isValidPhoneNumber("+1 202 555 0123")).toBe(true);
  });

  it("rejects incomplete and malformed phone numbers", () => {
    expect(isValidPhoneNumber("0")).toBe(false);
    expect(isValidPhoneNumber("038282")).toBe(false);
    expect(isValidPhoneNumber("+0123456789")).toBe(false);
    expect(isValidPhoneNumber("call me")).toBe(false);
  });

  it("keeps a normalized contact number suitable for persistence", () => {
    expect(normalizePhoneNumber("+84 (382) 823-609")).toBe("+84382823609");
  });
});
