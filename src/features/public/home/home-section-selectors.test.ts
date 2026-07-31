import { describe, expect, it } from "vitest";

import type { PublicCompany, PublicJob } from "./api";
import {
  getDeadlineTone,
  getDaysUntilExpiration,
  hasRemoteWorkingModel,
  selectExpiringJobs,
  selectLatestJobs,
  selectTopCompanies,
} from "./home-section-selectors";

const now = Date.parse("2026-07-31T00:00:00.000Z");

function job(id: string, overrides: Partial<PublicJob> = {}): PublicJob {
  return {
    id,
    title: id,
    description: "",
    requirements: null,
    benefits: null,
    salaryMin: 20_000_000,
    salaryMax: 30_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt: "2026-07-20T00:00:00.000Z",
    expiredAt: "2026-08-20T00:00:00.000Z",
    createdAt: "2026-07-20T00:00:00.000Z",
    company: { id: `${id}-company`, name: `${id} company` },
    ...overrides,
  };
}

function company(id: string, activeJobsCount: number, name = id): PublicCompany {
  return {
    id,
    name,
    type: "PRODUCT",
    activeJobsCount,
  };
}

describe("homepage section selectors", () => {
  it("selects only available jobs within the real 14-day deadline window", () => {
    const selected = selectExpiringJobs(
      [
        job("seven-days", { expiredAt: "2026-08-07T00:00:00.000Z" }),
        job("fourteen-days", { expiredAt: "2026-08-14T00:00:00.000Z" }),
        job("fifteen-days", { expiredAt: "2026-08-15T00:00:00.000Z" }),
        job("expired", { expiredAt: "2026-07-30T00:00:00.000Z" }),
        job("no-deadline", { expiredAt: null }),
      ],
      { now },
    );

    expect(selected.map((item) => item.id)).toEqual(["seven-days", "fourteen-days"]);
  });

  it("sorts latest jobs by published date and respects de-duplication", () => {
    const selected = selectLatestJobs(
      [
        job("old", { publishedAt: "2026-07-20T00:00:00.000Z" }),
        job("new", { publishedAt: "2026-07-30T00:00:00.000Z" }),
        job("middle", { publishedAt: "2026-07-25T00:00:00.000Z" }),
      ],
      { now, excludedIds: new Set(["new"]) },
    );

    expect(selected.map((item) => item.id)).toEqual(["middle", "old"]);
  });

  it("sorts companies by active jobs and uses a stable name tie-break", () => {
    const selected = selectTopCompanies([
      company("zeta", 3, "Zeta"),
      company("alpha", 3, "Alpha"),
      company("seven", 7),
      company("closed", 0),
    ]);

    expect(selected.map((item) => item.id)).toEqual(["seven", "alpha", "zeta"]);
  });

  it("derives deadline tones from actual remaining days", () => {
    expect(getDeadlineTone(2)).toBe("critical");
    expect(getDeadlineTone(7)).toBe("warning");
    expect(getDeadlineTone(14)).toBe("neutral");
    expect(getDaysUntilExpiration(job("job", { expiredAt: "2026-08-07T00:00:00.000Z" }), now)).toBe(
      7,
    );
  });

  it("only marks a job remote when its location model is REMOTE", () => {
    expect(
      hasRemoteWorkingModel(
        job("remote", {
          jobPostLocations: [{ jobLocation: { city: "Hà Nội", workingModel: "REMOTE" } }],
        }),
      ),
    ).toBe(true);
    expect(
      hasRemoteWorkingModel(
        job("onsite", {
          jobPostLocations: [{ jobLocation: { city: "Hà Nội", workingModel: "ONSITE" } }],
        }),
      ),
    ).toBe(false);
  });
});
