import { describe, expect, it } from "vitest";

import { toComparableName } from "./comparable-name";

describe("toComparableName", () => {
  it("treats case, separators and diacritics as noise", () => {
    expect(toComparableName("ReactJS")).toBe("reactjs");
    expect(toComparableName("React JS")).toBe("reactjs");
    expect(toComparableName("  react.js ")).toBe("reactjs");
    expect(toComparableName("Lập trình Web")).toBe(toComparableName("lap trinh web"));
  });

  it("keeps the characters that distinguish real technologies", () => {
    expect(new Set(["C", "C++", "C#"].map(toComparableName)).size).toBe(3);
  });
});
