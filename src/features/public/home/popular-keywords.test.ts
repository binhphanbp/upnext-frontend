import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPopularKeywordSlides,
  fetchPopularKeywords,
  getPopularKeywordsForLocale,
  normalizePopularKeywords,
  type PopularKeyword,
} from "@/features/public/home/popular-keywords";

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

describe("fetchPopularKeywords", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(response: unknown, ok = true) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => response,
        text: async () => JSON.stringify(response),
      }),
    );
  }

  it("maps the API payload onto the keyword shape", async () => {
    stubFetch({
      items: [
        {
          label: "Kubernetes",
          shortLabel: "K8s",
          query: "Kubernetes",
          priority: 200,
          category: "skill",
        },
      ],
    });

    const keywords = await fetchPopularKeywords("HOME_HERO", "vi", 24);

    expect(keywords).toEqual([
      {
        label: "Kubernetes",
        shortLabel: "K8s",
        query: "Kubernetes",
        locale: "vi",
        priority: 200,
        category: "skill",
      },
    ]);
  });

  it("leaves shortLabel and category off when the API sends null", async () => {
    stubFetch({
      items: [
        { label: "Frontend", shortLabel: null, query: "Frontend", priority: 10, category: null },
      ],
    });

    const [keyword] = await fetchPopularKeywords("JOBS_SEARCH", "en", 8);

    // `PopularKeyword` khai báo hai field này là optional, dùng `undefined` chứ không phải null.
    expect(keyword).not.toHaveProperty("shortLabel");
    expect(keyword).not.toHaveProperty("category");
  });

  it("returns nothing when the request fails, so the caller can keep its current chips", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    // Chip là thành phần điều hướng; API lỗi không được làm trống ô tìm kiếm.
    await expect(fetchPopularKeywords("HOME_HERO", "vi")).resolves.toEqual([]);
  });
});
