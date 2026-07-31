import { describe, expect, it } from "vitest";

import {
  compareJobsByRecency,
  compareJobsBySalary,
  DEFAULT_JOB_PAGE_SIZE,
  DEFAULT_JOB_SORT,
  getResultRange,
  isJobSort,
  isJobView,
  JOB_SORTS,
  jobSalaryCeiling,
  parseJobPageSize,
  parseJobSort,
  type SortableJob,
  sortJobs,
} from "./jobs-results-view";

function job(overrides: Partial<SortableJob> & { id: string }): SortableJob {
  return { salary: "20 - 30 triệu/tháng", ...overrides };
}

/** Days before a fixed instant, so assertions never drift with the clock. */
const now = new Date("2026-07-31T00:00:00.000Z");
function daysAgo(days: number) {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

describe("sort and page-size parsing", () => {
  it("accepts only the orders the toolbar offers", () => {
    expect(isJobSort("newest")).toBe(true);
    expect(isJobSort("oldest")).toBe(true);
    expect(isJobSort("salary-desc")).toBe(true);
    expect(isJobSort("salary-asc")).toBe(true);
    expect(isJobSort("cheapest")).toBe(false);
    expect(isJobSort(null)).toBe(false);
  });

  /** Every dimension is offered both ways, so no half-dimension can creep back in. */
  it("offers each dimension in both directions", () => {
    expect([...JOB_SORTS]).toEqual(["relevant", "newest", "oldest", "salary-desc", "salary-asc"]);
  });

  it("keeps links that were shared before the salary orders were split working", () => {
    expect(parseJobSort("salary")).toBe("salary-desc");
  });

  it("falls back to the default for anything it does not recognise", () => {
    expect(parseJobSort("nonsense")).toBe(DEFAULT_JOB_SORT);
    expect(parseJobSort(null)).toBe(DEFAULT_JOB_SORT);
    expect(parseJobSort("")).toBe(DEFAULT_JOB_SORT);
  });

  it("accepts only the layouts the toolbar offers", () => {
    expect(isJobView("grid")).toBe(true);
    expect(isJobView("list")).toBe(true);
    expect(isJobView("table")).toBe(false);
  });

  it("falls back to the default for an unsupported page size", () => {
    expect(parseJobPageSize("24")).toBe(24);
    expect(parseJobPageSize("7")).toBe(DEFAULT_JOB_PAGE_SIZE);
    expect(parseJobPageSize("abc")).toBe(DEFAULT_JOB_PAGE_SIZE);
    expect(parseJobPageSize(null)).toBe(DEFAULT_JOB_PAGE_SIZE);
    // A hand-edited URL must not be able to request the whole table in one page.
    expect(parseJobPageSize("100000")).toBe(DEFAULT_JOB_PAGE_SIZE);
  });
});

describe("compareJobsByRecency", () => {
  /**
   * The shipped bug: ordering compared the formatted label, so "8 ngày trước" sorted after
   * "26 ngày trước" and the newest posting on the board came last.
   */
  it("orders by instant, not by how the date reads", () => {
    const ordered = [
      job({ id: "old", publishedAt: daysAgo(26) }),
      job({ id: "new", publishedAt: daysAgo(8) }),
    ]
      .toSorted(compareJobsByRecency)
      .map((entry) => entry.id);

    expect(ordered).toEqual(["new", "old"]);
  });

  it("sends an undated posting to the end rather than treating it as brand new", () => {
    const ordered = [
      job({ id: "undated", publishedAt: null }),
      job({ id: "ancient", publishedAt: daysAgo(400) }),
    ]
      .toSorted(compareJobsByRecency)
      .map((entry) => entry.id);

    expect(ordered).toEqual(["ancient", "undated"]);
  });

  it("ignores an unparseable date instead of ordering by NaN", () => {
    const ordered = [
      job({ id: "broken", publishedAt: "not-a-date" }),
      job({ id: "dated", publishedAt: daysAgo(5) }),
    ]
      .toSorted(compareJobsByRecency)
      .map((entry) => entry.id);

    expect(ordered).toEqual(["dated", "broken"]);
  });

  it("reverses for the oldest-first order", () => {
    const jobs = [
      job({ id: "new", publishedAt: daysAgo(1) }),
      job({ id: "old", publishedAt: daysAgo(9) }),
    ];

    expect(jobs.toSorted((a, b) => compareJobsByRecency(a, b, "asc")).map((e) => e.id)).toEqual([
      "old",
      "new",
    ]);
  });

  /** An absent date is not evidence of being old either, so it must not lead "cũ nhất". */
  it("keeps an undated posting last even when asking for the oldest", () => {
    const jobs = [
      job({ id: "undated", publishedAt: null }),
      job({ id: "old", publishedAt: daysAgo(9) }),
    ];

    expect(jobs.toSorted((a, b) => compareJobsByRecency(a, b, "asc")).map((e) => e.id)).toEqual([
      "old",
      "undated",
    ]);
  });
});

describe("compareJobsBySalary", () => {
  it("reverses for the cheapest-first order", () => {
    const jobs = [job({ id: "high", salary: "60 triệu" }), job({ id: "low", salary: "10 triệu" })];

    expect(jobs.toSorted((a, b) => compareJobsBySalary(a, b, "asc")).map((e) => e.id)).toEqual([
      "low",
      "high",
    ]);
  });

  /**
   * "Thỏa thuận" states no pay at all, so it is not the cheapest job on the board — treating it as 0
   * would head the whole "lương thấp nhất" list with postings that answer nothing.
   */
  it("keeps undisclosed pay last in both directions", () => {
    const jobs = [
      job({ id: "undisclosed", salary: "Thỏa thuận" }),
      job({ id: "low", salary: "10 triệu" }),
    ];

    expect(jobs.toSorted((a, b) => compareJobsBySalary(a, b, "asc")).map((e) => e.id)).toEqual([
      "low",
      "undisclosed",
    ]);
    expect(jobs.toSorted((a, b) => compareJobsBySalary(a, b, "desc")).map((e) => e.id)).toEqual([
      "low",
      "undisclosed",
    ]);
  });
});

describe("jobSalaryCeiling", () => {
  it("reads the top of a stated range", () => {
    expect(jobSalaryCeiling({ salary: "30 - 55 triệu/tháng" })).toBe(55);
    expect(jobSalaryCeiling({ salary: "Từ 25 triệu/tháng" })).toBe(25);
  });

  it("treats undisclosed pay as zero so it sorts last", () => {
    expect(jobSalaryCeiling({ salary: "Thỏa thuận" })).toBe(0);
  });
});

describe("sortJobs", () => {
  const jobs = [
    job({ id: "b", publishedAt: daysAgo(10), salary: "40 - 60 triệu" }),
    job({ id: "a", publishedAt: daysAgo(2), salary: "10 - 20 triệu" }),
    job({ id: "c", publishedAt: daysAgo(30), salary: "Thỏa thuận" }),
  ];

  it("does not mutate the input", () => {
    sortJobs(jobs, "newest");
    expect(jobs.map((entry) => entry.id)).toEqual(["b", "a", "c"]);
  });

  it("puts the newest first", () => {
    expect(sortJobs(jobs, "newest").map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });

  it("puts the oldest first, exactly reversing the newest order here", () => {
    expect(sortJobs(jobs, "oldest").map((entry) => entry.id)).toEqual(["c", "b", "a"]);
  });

  it("puts the best paid first and undisclosed pay last", () => {
    expect(sortJobs(jobs, "salary-desc").map((entry) => entry.id)).toEqual(["b", "a", "c"]);
  });

  it("puts the cheapest first while still keeping undisclosed pay last", () => {
    expect(sortJobs(jobs, "salary-asc").map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });

  it("ranks by relevance score before anything else", () => {
    const scores = new Map([
      ["c", 10],
      ["b", 5],
    ]);
    const ordered = sortJobs(jobs, "relevant", (entry) => scores.get(entry.id) ?? 0);

    expect(ordered.map((entry) => entry.id)).toEqual(["c", "b", "a"]);
  });

  it("promotes featured over urgent when relevance ties", () => {
    const promoted = [
      job({ id: "plain", publishedAt: daysAgo(1) }),
      job({ id: "urgent", publishedAt: daysAgo(1), urgent: true }),
      job({ id: "featured", publishedAt: daysAgo(1), featured: true }),
    ];

    expect(sortJobs(promoted, "relevant").map((entry) => entry.id)).toEqual([
      "featured",
      "urgent",
      "plain",
    ]);
  });

  /** Without a total order, tied jobs reshuffle on unrelated re-renders. */
  it("breaks a full tie deterministically", () => {
    const tied = [
      job({ id: "z", publishedAt: daysAgo(3) }),
      job({ id: "a", publishedAt: daysAgo(3) }),
    ];

    expect(sortJobs(tied, "newest").map((entry) => entry.id)).toEqual(["a", "z"]);
    expect(sortJobs(tied.toReversed(), "newest").map((entry) => entry.id)).toEqual(["a", "z"]);
  });
});

describe("getResultRange", () => {
  it("describes a full page", () => {
    expect(getResultRange(1, 12, 40)).toEqual({ from: 1, to: 12, totalPages: 4, page: 1 });
    expect(getResultRange(2, 12, 40)).toEqual({ from: 13, to: 24, totalPages: 4, page: 2 });
  });

  it("stops the last page at the true total", () => {
    expect(getResultRange(4, 12, 40)).toEqual({ from: 37, to: 40, totalPages: 4, page: 4 });
  });

  /** The reference design this replaces displayed "1–12 của 3 việc làm". */
  it("never claims a range wider than the result set", () => {
    expect(getResultRange(1, 12, 3)).toEqual({ from: 1, to: 3, totalPages: 1, page: 1 });
  });

  it("clamps a page beyond the end back onto the last page", () => {
    // Filters can shrink the result set while the URL still carries the old page number.
    expect(getResultRange(99, 12, 40)).toEqual({ from: 37, to: 40, totalPages: 4, page: 4 });
  });

  it("reports an empty range for no results instead of 1-0", () => {
    expect(getResultRange(1, 12, 0)).toEqual({ from: 0, to: 0, totalPages: 1, page: 1 });
  });

  it("survives a junk page number from the URL", () => {
    expect(getResultRange(Number.NaN, 12, 40).page).toBe(1);
    expect(getResultRange(-5, 12, 40).page).toBe(1);
  });
});
