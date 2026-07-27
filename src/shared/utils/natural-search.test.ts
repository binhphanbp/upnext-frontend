import { describe, expect, it } from "vitest";

import {
  analyzeNaturalLanguageQuery,
  matchNaturalLanguageSearch,
  scoreNaturalLanguageSearch,
} from "./natural-search";

const reactJob = {
  title: "Senior React Platform Engineer",
  company: "UpNext Labs",
  location: "TP. Hồ Chí Minh",
  mode: "Remote",
  level: "Senior",
  tags: ["React", "TypeScript", "Next.js"],
  salaryMinMillions: 35,
  salaryMaxMillions: 50,
  experienceYears: [3],
};

describe("analyzeNaturalLanguageQuery", () => {
  it("extracts transparent job-search intent from Vietnamese natural language", () => {
    const intent = analyzeNaturalLanguageQuery(
      "Tìm việc senior React remote ở Hồ Chí Minh lương từ 30 triệu",
      {
        knownLocations: ["TP. Hồ Chí Minh", "Hà Nội"],
        knownSkills: ["React", "TypeScript", "Java"],
      },
    );

    expect(intent.locations).toEqual(["TP. Hồ Chí Minh"]);
    expect(intent.workModes).toEqual(["remote"]);
    expect(intent.seniority).toEqual(["senior"]);
    expect(intent.skills).toEqual(["React"]);
    expect(intent.salary).toEqual({ min: 30 });
    expect(intent.facets.map((facet) => facet.label)).toEqual(
      expect.arrayContaining(["Senior", "React", "Remote", "TP. Hồ Chí Minh", "Từ 30 triệu"]),
    );
  });

  it("understands English constraints and a salary range", () => {
    const intent = analyzeNaturalLanguageQuery("middle Java hybrid in Hanoi salary 25-40 million", {
      knownLocations: ["Hà Nội", "Đà Nẵng"],
      knownSkills: ["Java", "React"],
    });

    expect(intent.locations).toEqual(["Hà Nội"]);
    expect(intent.workModes).toEqual(["hybrid"]);
    expect(intent.seniority).toEqual(["middle"]);
    expect(intent.skills).toEqual(["Java"]);
    expect(intent.salary).toEqual({ min: 25, max: 40 });
  });

  it("recognizes plain and decimal experience values without requiring filler words", () => {
    const exactIntent = analyzeNaturalLanguageQuery("React 3 năm kinh nghiệm", {
      knownSkills: ["React"],
    });
    const decimalIntent = analyzeNaturalLanguageQuery("Java từ 2,5 năm kinh nghiệm", {
      knownSkills: ["Java"],
    });

    expect(exactIntent.experience).toEqual({ min: 3, max: 3 });
    expect(decimalIntent.experience).toEqual({ min: 2.5 });
  });
});

describe("matchNaturalLanguageSearch", () => {
  it("matches every recognized constraint instead of only title keywords", () => {
    const matchingQuery =
      "Tìm senior React remote ở Hồ Chí Minh lương trên 30 triệu, khoảng 3 năm kinh nghiệm";
    const wrongLocation = { ...reactJob, location: "Hà Nội" };
    const hiddenSalary = {
      ...reactJob,
      salaryMinMillions: undefined,
      salaryMaxMillions: undefined,
    };

    expect(matchNaturalLanguageSearch(matchingQuery, reactJob)).toBe(true);
    expect(matchNaturalLanguageSearch(matchingQuery, wrongLocation)).toBe(false);
    expect(matchNaturalLanguageSearch(matchingQuery, hiddenSalary)).toBe(false);
  });

  it("keeps accent-insensitive keyword and synonym fallback", () => {
    expect(matchNaturalLanguageSearch("viec frontend", reactJob)).toBe(true);
    expect(matchNaturalLanguageSearch("Java backend", reactJob)).toBe(false);
  });

  it("scores direct title and skill matches above broad synonym matches", () => {
    const direct = scoreNaturalLanguageSearch(
      analyzeNaturalLanguageQuery("React", { knownSkills: ["React"] }),
      reactJob,
    );
    const broad = scoreNaturalLanguageSearch(analyzeNaturalLanguageQuery("frontend"), reactJob);

    expect(direct.matches).toBe(true);
    expect(broad.matches).toBe(true);
    expect(direct.score).toBeGreaterThan(broad.score);
  });
});
