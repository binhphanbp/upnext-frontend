import { describe, expect, it } from "vitest";

import type { CandidateApplicationApi } from "@/features/candidate/api/profile";

import {
  canWithdrawApplication,
  filterApplications,
  getApplicationStatusGroup,
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
    expect(getApplicationStatusGroup("HIRED")).toBe("offer");
    expect(getApplicationStatusGroup("WITHDRAWN")).toBe("closed");
  });

  it("allows withdrawal while a hiring process is active and blocks terminal states", () => {
    expect(canWithdrawApplication("SHORTLISTED")).toBe(true);
    expect(canWithdrawApplication("INTERVIEWING")).toBe(true);
    expect(canWithdrawApplication("OFFERED")).toBe(true);
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
