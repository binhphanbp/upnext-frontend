import { describe, expect, it } from "vitest";

import type { CandidateProfileApi } from "@/features/candidate/api/profile";

import type { PublicJob } from "./api";
import {
  countCandidateSignals,
  selectRecommendedJobs,
  type HomeCandidateContext,
} from "./home-personalization";

const now = Date.parse("2026-07-31T00:00:00.000Z");

function job(id: string, overrides: Partial<PublicJob> = {}): PublicJob {
  return {
    id,
    title: id,
    description: "",
    requirements: null,
    benefits: null,
    salaryMin: 20_000_000,
    salaryMax: 35_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt: "2026-07-30T00:00:00.000Z",
    expiredAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-07-30T00:00:00.000Z",
    company: { id: `${id}-company`, name: `${id} company` },
    ...overrides,
  };
}

function context(overrides: Partial<HomeCandidateContext> = {}): HomeCandidateContext {
  return {
    profile: {
      skills: [{ skill: { id: "react", name: "React" } }],
      jobPreference: {
        desiredPosition: "Frontend Developer",
        desiredSalaryMin: 18_000_000,
        desiredSalaryMax: 40_000_000,
        salaryCurrency: "VND",
        workingModel: "HYBRID",
        desiredLevelId: "mid",
        desiredLevel: { id: "mid", name: "Middle" },
      },
    } as CandidateProfileApi,
    savedJobIds: new Set(),
    followedCompanyIds: new Set(),
    appliedJobIds: new Set(),
    ...overrides,
  };
}

describe("homepage candidate personalization", () => {
  it("counts independent profile and activity signals", () => {
    expect(countCandidateSignals(context())).toBe(5);
    expect(
      countCandidateSignals(
        context({ profile: { skills: [], jobPreference: null } as unknown as CandidateProfileApi }),
      ),
    ).toBe(0);
  });

  it("returns explainable matches and excludes applied jobs", () => {
    const selected = selectRecommendedJobs(
      [
        job("frontend", {
          title: "Frontend Developer",
          jobPostSkills: [{ skill: { id: "react", name: "React" } }],
          jobPostLocations: [{ jobLocation: { city: "Hà Nội", workingModel: "HYBRID" } }],
          experienceLevel: { name: "Middle" },
        }),
        job("applied", {
          title: "Frontend Developer",
          jobPostSkills: [{ skill: { id: "react", name: "React" } }],
        }),
      ],
      { context: context({ appliedJobIds: new Set(["applied"]) }), now },
    );

    expect(selected.map((item) => item.job.id)).toEqual(["frontend"]);
    expect(selected[0]?.reasonCodes).toEqual(
      expect.arrayContaining(["skill", "position", "workingModel", "level", "salary"]),
    );
  });
});
