import { describe, expect, it } from "vitest";

import {
  countFacetOption,
  type FacetableJob,
  type FacetGroupMatchers,
  matchesAllFacetGroups,
  matchesEmploymentTypeFilter,
  matchesExperienceRange,
  matchesLevelFilter,
  matchesModeFilter,
  matchesSalaryFilter,
  matchesTechnologyFilter,
  parseSalaryRange,
} from "./jobs-facets";

function job(overrides: Partial<FacetableJob> = {}): FacetableJob {
  return {
    title: "Developer",
    level: "Middle",
    mode: "Hybrid",
    salary: "20 - 30 triệu",
    categories: ["backend"],
    ...overrides,
  };
}

/** Matchers with nothing selected: every group is a pass-through. */
function noSelection(): FacetGroupMatchers {
  return {
    category: () => true,
    level: () => true,
    mode: () => true,
    employmentType: () => true,
    salary: () => true,
    experience: () => true,
    technology: () => true,
  };
}

describe("parseSalaryRange", () => {
  it("reads both bounds from a range", () => {
    expect(parseSalaryRange({ salary: "20 - 30 triệu" })).toEqual({ min: 20, max: 30 });
  });

  it("treats a single number as a closed range", () => {
    expect(parseSalaryRange({ salary: "25 triệu" })).toEqual({ min: 25, max: 25 });
  });

  it("falls back to zero when the salary is not disclosed", () => {
    expect(parseSalaryRange({ salary: "Thương lượng" })).toEqual({ min: 0, max: 0 });
  });
});

describe("option predicates", () => {
  it("matches employment type filters correctly", () => {
    expect(matchesEmploymentTypeFilter({ employmentType: "Full-time" }, "full-time")).toBe(true);
    expect(matchesEmploymentTypeFilter({ employmentType: "Part-time" }, "part-time")).toBe(true);
    expect(matchesEmploymentTypeFilter({ employmentType: "Contract" }, "contract")).toBe(true);
    expect(matchesEmploymentTypeFilter({ employmentType: "Internship" }, "internship")).toBe(true);
    expect(matchesEmploymentTypeFilter({ employmentType: "Full-time" }, "part-time")).toBe(false);
  });
  it("groups junior, fresher and intern under the same level option", () => {
    expect(matchesLevelFilter({ level: "Intern" }, "fresher")).toBe(true);
    expect(matchesLevelFilter({ level: "Junior" }, "fresher")).toBe(true);
    expect(matchesLevelFilter({ level: "Senior" }, "fresher")).toBe(false);
  });

  it("counts lead roles as senior", () => {
    expect(matchesLevelFilter({ level: "Tech Lead" }, "senior")).toBe(true);
  });

  it("treats office as onsite", () => {
    expect(matchesModeFilter({ mode: "Office" }, "onsite")).toBe(true);
    expect(matchesModeFilter({ mode: "Remote" }, "onsite")).toBe(false);
  });

  it("matches every salary bracket a range genuinely straddles", () => {
    const straddling = { salary: "30 - 55 triệu" };
    expect(matchesSalaryFilter(straddling, "sal-25-40")).toBe(true);
    expect(matchesSalaryFilter(straddling, "sal-40-60")).toBe(true);
    expect(matchesSalaryFilter(straddling, "sal-15-25")).toBe(false);
  });

  it("does not push a range into the next bracket it merely touches", () => {
    // A 22-40 posting pays at most 40, so "40 - 60" must not claim it.
    const upToForty = { salary: "22 - 40 triệu" };
    expect(matchesSalaryFilter(upToForty, "sal-15-25")).toBe(true);
    expect(matchesSalaryFilter(upToForty, "sal-25-40")).toBe(true);
    expect(matchesSalaryFilter(upToForty, "sal-40-60")).toBe(false);
  });

  it("does not treat a ceiling of exactly 60 as above 60", () => {
    const upToSixty = { salary: "40 - 60 triệu" };
    expect(matchesSalaryFilter(upToSixty, "sal-40-60")).toBe(true);
    expect(matchesSalaryFilter(upToSixty, "sal-60")).toBe(false);
  });

  it("excludes undisclosed salaries from every bracket", () => {
    const undisclosed = { salary: "Thương lượng" };
    expect(matchesSalaryFilter(undisclosed, "sal-0-15")).toBe(false);
    expect(matchesSalaryFilter(undisclosed, "sal-15-25")).toBe(false);
    expect(matchesSalaryFilter(undisclosed, "sal-60")).toBe(false);
  });

  it("ignores an unknown bracket instead of matching everything", () => {
    expect(matchesSalaryFilter({ salary: "20 - 30 triệu" }, "sal-unknown")).toBe(false);
  });

  it("matches a technology by skill or by title", () => {
    expect(matchesTechnologyFilter({ title: "Developer", skills: ["React"] }, "react")).toBe(true);
    expect(matchesTechnologyFilter({ title: "React Developer" }, "react")).toBe(true);
    expect(matchesTechnologyFilter({ title: "Developer", skills: ["Vue"] }, "react")).toBe(false);
  });

  it("keeps experience buckets non-overlapping at the boundary", () => {
    expect(matchesExperienceRange([2], "exp-1-2")).toBe(false);
    expect(matchesExperienceRange([2], "exp-2-4")).toBe(true);
  });
});

describe("countFacetOption", () => {
  const jobs = [
    job({ level: "Middle", mode: "Hybrid", salary: "20 - 30 triệu" }),
    job({ level: "Senior", mode: "Hybrid", salary: "40 - 50 triệu" }),
    job({ level: "Senior", mode: "Remote", salary: "45 - 55 triệu" }),
  ];

  it("counts within the whole scope when nothing is selected", () => {
    const matchers = noSelection();

    expect(countFacetOption(jobs, matchers, "level", (j) => matchesLevelFilter(j, "senior"))).toBe(
      2,
    );
    expect(countFacetOption(jobs, matchers, "mode", (j) => matchesModeFilter(j, "hybrid"))).toBe(2);
  });

  it("narrows other groups once a selection is made", () => {
    // "Hybrid" picked: the level counts must describe hybrid jobs only.
    const matchers: FacetGroupMatchers = {
      ...noSelection(),
      mode: (j) => matchesModeFilter(j, "hybrid"),
    };

    expect(countFacetOption(jobs, matchers, "level", (j) => matchesLevelFilter(j, "senior"))).toBe(
      1,
    );
    expect(countFacetOption(jobs, matchers, "level", (j) => matchesLevelFilter(j, "middle"))).toBe(
      1,
    );
  });

  it("ignores a group's own selection so siblings stay reachable", () => {
    // "Middle" picked. Senior must still report what it would yield, not collapse to zero.
    const matchers: FacetGroupMatchers = {
      ...noSelection(),
      level: (j) => matchesLevelFilter(j, "middle"),
    };

    expect(countFacetOption(jobs, matchers, "level", (j) => matchesLevelFilter(j, "senior"))).toBe(
      2,
    );
  });

  it("stays consistent with the result list it describes", () => {
    // Picking an option must yield exactly the number its count promised.
    const before: FacetGroupMatchers = {
      ...noSelection(),
      mode: (j) => matchesModeFilter(j, "hybrid"),
    };
    const promised = countFacetOption(jobs, before, "level", (j) =>
      matchesLevelFilter(j, "senior"),
    );

    const after: FacetGroupMatchers = {
      ...before,
      level: (j) => matchesLevelFilter(j, "senior"),
    };
    const actual = jobs.filter((j) => matchesAllFacetGroups(j, after)).length;

    expect(actual).toBe(promised);
  });

  it("reports zero for an option that no job in scope can satisfy", () => {
    const matchers: FacetGroupMatchers = {
      ...noSelection(),
      mode: (j) => matchesModeFilter(j, "remote"),
    };

    expect(countFacetOption(jobs, matchers, "level", (j) => matchesLevelFilter(j, "middle"))).toBe(
      0,
    );
  });
});
