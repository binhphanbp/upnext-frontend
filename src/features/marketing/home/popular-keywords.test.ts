import { describe, expect, it } from "vitest";

import {
  buildPopularKeywordSlides,
  getPopularKeywordsForLocale,
  normalizePopularKeywords,
  type PopularKeyword,
} from "./popular-keywords";

const fallback: PopularKeyword[] = [
  { label: "Frontend", query: "Frontend", locale: "vi", priority: 20, category: "role" },
  { label: "React", query: "React", locale: "vi", priority: 10, category: "skill" },
];

describe("popular keywords", () => {
  it("uses fallback keywords when source is empty", () => {
    expect(normalizePopularKeywords([], { locale: "vi", fallback })).toEqual([
      fallback[1],
      fallback[0],
    ]);
  });

  it("filters by locale, sorts by priority, and removes duplicate queries", () => {
    const source: PopularKeyword[] = [
      { label: "Backend", query: "Backend", locale: "vi", priority: 30 },
      { label: "Frontend", query: "Frontend", locale: "en", priority: 10 },
      { label: "React Duplicate", query: "react", locale: "vi", priority: 5 },
      { label: "React", query: "React", locale: "vi", priority: 10 },
    ];

    expect(normalizePopularKeywords(source, { locale: "vi", fallback })).toEqual([
      { label: "React Duplicate", query: "react", locale: "vi", priority: 5 },
      { label: "Backend", query: "Backend", locale: "vi", priority: 30 },
    ]);
  });

  it("chunks keywords into slides and duplicates the first slide for smooth looping", () => {
    const keywords = getPopularKeywordsForLocale("vi").slice(0, 10);
    const slides = buildPopularKeywordSlides(keywords, { itemsPerSlide: 4 });

    expect(slides).toHaveLength(4);
    expect(slides[0]).toHaveLength(4);
    expect(slides[1]).toHaveLength(4);
    expect(slides[2]).toHaveLength(2);
    expect(slides[3]).toEqual(slides[0]);
  });

  it("keeps full labels available while preferring short labels for display", () => {
    const [keyword] = normalizePopularKeywords(
      [
        {
          label: "Business Analyst",
          shortLabel: "BA",
          query: "Business Analyst",
          locale: "vi",
          priority: 1,
        },
      ],
      { locale: "vi", fallback },
    );

    expect(keyword).toMatchObject({
      label: "Business Analyst",
      shortLabel: "BA",
      query: "Business Analyst",
    });
  });
});
