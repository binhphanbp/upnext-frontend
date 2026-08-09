import { describe, expect, it } from "vitest";

import type {
  CandidateActivityJobPostApi,
  CandidateApplicationApi,
} from "@/features/candidate/api/profile";

import {
  canWithdrawApplication,
  compareSavedJobDeadline,
  compareSavedJobSalary,
  filterApplications,
  getApplicationStatusGroup,
  getJobSalaryCeiling,
  getSavedJobDeadline,
  groupSavedJobsByUrgency,
  isSavedJobFilter,
  matchesSavedJobFilter,
  SAVED_JOB_SOON_DAYS,
} from "./job-activity-model";

function application(
  id: string,
  status: CandidateApplicationApi["status"],
  title: string,
): CandidateApplicationApi {
  return {
    candidateProfileId: "candidate-profile",
    coverLetter: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    cvVersion: {
      createdAt: "2026-07-01T00:00:00.000Z",
      cvId: "cv",
      fileName: "resume.pdf",
      id: "version",
      sourceFileId: null,
      versionNo: 1,
    },
    cvVersionId: "version",
    hiredAt: null,
    id,
    jobPost: {
      company: { id: "company", name: "UpNext" },
      description: "",
      expiredAt: null,
      id: `job-${id}`,
      publishedAt: "2026-07-01T00:00:00.000Z",
      salaryCurrency: "VND",
      salaryIsNegotiable: false,
      salaryIsVisible: false,
      salaryMax: null,
      salaryMin: null,
      slug: `job-${id}`,
      status: "PUBLISHED",
      title,
    },
    jobPostId: `job-${id}`,
    rejectedAt: null,
    status,
    submittedAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    viewedAt: null,
  };
}

describe("candidate job activity model", () => {
  it("maps backend application statuses into candidate-facing groups", () => {
    expect(getApplicationStatusGroup("SUBMITTED")).toBe("active");
    expect(getApplicationStatusGroup("INTERVIEWING")).toBe("interview");
    // An offer's response state is supplied by the activity API. A terminal hire is closed,
    // rather than a candidate action still waiting to be taken.
    expect(getApplicationStatusGroup("HIRED")).toBe("closed");
    expect(getApplicationStatusGroup("WITHDRAWN")).toBe("closed");
  });

  it("allows withdrawal while a hiring process is active and blocks terminal states", () => {
    expect(canWithdrawApplication("SHORTLISTED")).toBe(true);
    expect(canWithdrawApplication("INTERVIEWING")).toBe(true);
    // An offer has its own explicit accept/decline decision, so it cannot be withdrawn.
    expect(canWithdrawApplication("OFFERED")).toBe(false);
    expect(canWithdrawApplication("HIRED")).toBe(false);
    expect(canWithdrawApplication("REJECTED")).toBe(false);
    expect(canWithdrawApplication("WITHDRAWN")).toBe(false);
  });

  it("filters by status group and normalized job or company text", () => {
    const applications = [
      application("one", "SUBMITTED", "Frontend Engineer"),
      application("two", "REJECTED", "Backend Engineer"),
    ];

    expect(filterApplications(applications, "active", "frontend")).toHaveLength(1);
    expect(filterApplications(applications, "closed", "upnext")).toHaveLength(1);
  });
});

/** A fixed clock, because a relative deadline read from the real time would drift the assertions. */
const now = new Date("2026-07-30T00:00:00.000Z");

function savedJobPost(overrides: Partial<CandidateActivityJobPostApi> = {}) {
  return { ...application("saved", "SUBMITTED", "Frontend Engineer").jobPost, ...overrides };
}

function closingInDays(days: number) {
  return savedJobPost({
    expiredAt: new Date(now.getTime() + days * 86_400_000).toISOString(),
  });
}

describe("saved job deadlines", () => {
  it("counts the whole days left to apply", () => {
    expect(getSavedJobDeadline(closingInDays(12), now)).toEqual({ urgency: "open", daysLeft: 12 });
  });

  it("flags a posting closing inside the warning window", () => {
    expect(getSavedJobDeadline(closingInDays(3), now).urgency).toBe("soon");
    expect(getSavedJobDeadline(closingInDays(SAVED_JOB_SOON_DAYS), now).urgency).toBe("soon");
    // One day past the window is not urgent yet.
    expect(getSavedJobDeadline(closingInDays(SAVED_JOB_SOON_DAYS + 1), now).urgency).toBe("open");
  });

  it("reports a lapsed deadline as closed with no countdown", () => {
    expect(getSavedJobDeadline(closingInDays(-1), now)).toEqual({
      urgency: "closed",
      daysLeft: null,
    });
  });

  it("treats a posting the employer pulled as closed even with time left", () => {
    const pulled = savedJobPost({
      status: "CLOSED",
      expiredAt: new Date(now.getTime() + 20 * 86_400_000).toISOString(),
    });

    expect(getSavedJobDeadline(pulled, now).urgency).toBe("closed");
  });

  it("counts a posting with no deadline as open rather than urgent", () => {
    expect(getSavedJobDeadline(savedJobPost({ expiredAt: null }), now)).toEqual({
      urgency: "open",
      daysLeft: null,
    });
  });

  it("matches a filter against the posting's own urgency", () => {
    expect(matchesSavedJobFilter(closingInDays(2), "soon", now)).toBe(true);
    expect(matchesSavedJobFilter(closingInDays(2), "open", now)).toBe(false);
    expect(matchesSavedJobFilter(closingInDays(2), "all", now)).toBe(true);
    expect(matchesSavedJobFilter(closingInDays(-5), "closed", now)).toBe(true);
  });

  it("orders by what closes first and sinks closed postings", () => {
    const order = [closingInDays(-2), closingInDays(30), closingInDays(1)]
      .toSorted((left, right) => compareSavedJobDeadline(left, right, now))
      .map((jobPost) => getSavedJobDeadline(jobPost, now));

    expect(order.map((deadline) => deadline.daysLeft)).toEqual([1, 30, null]);
    expect(order.at(-1)!.urgency).toBe("closed");
  });

  it("accepts only the filters the page offers", () => {
    expect(isSavedJobFilter("soon")).toBe(true);
    expect(isSavedJobFilter("all")).toBe(true);
    expect(isSavedJobFilter("urgent")).toBe(false);
    expect(isSavedJobFilter(null)).toBe(false);
  });
});

describe("saved job grouping and comparison", () => {
  it("puts the closing group first and the closed group last", () => {
    const groups = groupSavedJobsByUrgency(
      [closingInDays(30), closingInDays(-1), closingInDays(2)],
      (jobPost) => jobPost,
      now,
    );

    expect(groups.map((group) => group.urgency)).toEqual(["soon", "open", "closed"]);
    expect(groups.map((group) => group.items.length)).toEqual([1, 1, 1]);
  });

  it("drops an empty group so no heading announces nothing", () => {
    const groups = groupSavedJobsByUrgency([closingInDays(30)], (jobPost) => jobPost, now);

    expect(groups.map((group) => group.urgency)).toEqual(["open"]);
  });

  it("reads the salary ceiling from the top of the range", () => {
    expect(
      getJobSalaryCeiling(savedJobPost({ salaryIsVisible: true, salaryMin: 20, salaryMax: 40 })),
    ).toBe(40);
    // Only a floor published: that figure is the best available.
    expect(
      getJobSalaryCeiling(savedJobPost({ salaryIsVisible: true, salaryMin: 25, salaryMax: null })),
    ).toBe(25);
    expect(getJobSalaryCeiling(savedJobPost({ salaryIsVisible: false, salaryMax: 90 }))).toBeNull();
  });

  it("sorts the best paid first and sinks undisclosed pay", () => {
    const jobs = [
      savedJobPost({ salaryIsVisible: false, title: "Hidden" }),
      savedJobPost({ salaryIsVisible: true, salaryMax: 30, title: "Thirty" }),
      savedJobPost({ salaryIsVisible: true, salaryMax: 60, title: "Sixty" }),
    ];

    expect(jobs.toSorted(compareSavedJobSalary).map((jobPost) => jobPost.title)).toEqual([
      "Sixty",
      "Thirty",
      "Hidden",
    ]);
  });
});
