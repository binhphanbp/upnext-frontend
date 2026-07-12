import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => () => "",
}));

vi.mock("@/i18n/navigation", () => ({ Link: () => null }));

import { getCandidateCvTitle } from "./profile-documents";

describe("getCandidateCvTitle", () => {
  it("removes the supported extension and trims the title", () => {
    expect(getCandidateCvTitle("  Senior Frontend Engineer.PDF  ")).toBe(
      "Senior Frontend Engineer",
    );
  });

  it("uses a safe fallback for an extension-only filename", () => {
    expect(getCandidateCvTitle(".docx")).toBe("CV");
  });

  it("limits titles to the backend maximum", () => {
    expect(getCandidateCvTitle(`${"A".repeat(180)}.pdf`)).toHaveLength(150);
  });
});
