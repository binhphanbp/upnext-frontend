import { describe, expect, it } from "vitest";

import { toCvPdfFileName } from "./cv-pdf-export";

describe("toCvPdfFileName", () => {
  it("keeps a readable Vietnamese CV title", () => {
    expect(toCvPdfFileName("Product Data Analyst")).toBe("Product Data Analyst.pdf");
    expect(toCvPdfFileName("Trần Minh Anh · Kỹ sư")).toBe("Trần Minh Anh · Kỹ sư.pdf");
  });

  it("strips path separators so the download cannot escape the downloads folder", () => {
    expect(toCvPdfFileName("../../etc/passwd")).toBe(".. .. etc passwd.pdf");
    expect(toCvPdfFileName("C:\\Windows\\cv")).toBe("C Windows cv.pdf");
  });

  it("falls back to a generic name when nothing usable is left", () => {
    expect(toCvPdfFileName("   ")).toBe("UpNext-CV.pdf");
    expect(toCvPdfFileName("///")).toBe("UpNext-CV.pdf");
  });

  it("caps the length so the filesystem accepts it", () => {
    expect(toCvPdfFileName("a".repeat(300))).toBe(`${"a".repeat(120)}.pdf`);
  });
});
