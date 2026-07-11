import { describe, expect, it } from "vitest";

import type { CandidateProfileApi } from "@/features/candidate/api/profile";

import { getInitials, getProfileReadiness, isProfileSectionId } from "./profile-model";

function createProfile(overrides: Partial<CandidateProfileApi> = {}): CandidateProfileApi {
  return {
    account: { email: "candidate@example.com", fullName: "Candidate", id: "account-1" },
    address: null,
    birthdate: null,
    candidateAccountId: "account-1",
    certifications: [],
    description: null,
    educations: [],
    experiences: [],
    gender: null,
    id: "profile-1",
    jobPreference: null,
    jobSearchStatus: "NOT_LOOKING",
    languages: [],
    links: [],
    phoneNumber: null,
    profileVisibility: "PRIVATE",
    projects: [],
    skills: [],
    ...overrides,
  };
}

describe("getProfileReadiness", () => {
  it("does not manufacture completion for an empty profile", () => {
    const readiness = getProfileReadiness(createProfile(), false);

    expect(readiness.completed).toBe(0);
    expect(readiness.percentage).toBe(0);
    expect(readiness.items.every((item) => !item.complete)).toBe(true);
  });

  it("uses one transparent set of real profile criteria", () => {
    const profile = createProfile({
      address: "Ho Chi Minh City",
      certifications: [
        {
          credentialUrl: null,
          expiredDate: null,
          id: "cert-1",
          issuedDate: null,
          name: "Cloud certification",
          organization: null,
          sortOrder: 0,
        },
      ],
      description: "A".repeat(80),
      educations: [
        {
          degree: null,
          description: null,
          endDate: null,
          gpa: null,
          id: "education-1",
          isCurrent: false,
          major: null,
          schoolName: "University",
          sortOrder: 0,
          startDate: null,
        },
      ],
      experiences: [
        {
          companyName: "UpNext",
          description: null,
          employmentType: null,
          endDate: null,
          id: "experience-1",
          isCurrent: true,
          positionTitle: "Engineer",
          sortOrder: 0,
          startDate: null,
          technologies: null,
        },
      ],
      jobPreference: {
        desiredLevel: null,
        desiredLevelId: null,
        desiredPosition: "Frontend Engineer",
        desiredSalaryMax: null,
        desiredSalaryMin: null,
        id: "preference-1",
        isRelocate: false,
        noticePeriodDays: null,
        salaryCurrency: "VND",
        workingModel: "HYBRID",
      },
      phoneNumber: "0900000000",
      skills: Array.from({ length: 3 }, (_, index) => ({
        id: `candidate-skill-${index}`,
        proficiencyLevel: "INTERMEDIATE" as const,
        skill: { id: `skill-${index}`, name: `Skill ${index}` },
        skillId: `skill-${index}`,
        sortOrder: index,
        yearsOfExperience: null,
      })),
    });

    const readiness = getProfileReadiness(profile, true);

    expect(readiness.completed).toBe(readiness.total);
    expect(readiness.percentage).toBe(100);
  });
});

describe("profile helpers", () => {
  it("validates deep-linked sections", () => {
    expect(isProfileSectionId("projects")).toBe(true);
    expect(isProfileSectionId("unknown")).toBe(false);
  });

  it("builds initials without assuming a western name order", () => {
    expect(getInitials("Nguyễn Minh Anh")).toBe("NA");
    expect(getInitials("Alex")).toBe("AL");
  });
});
