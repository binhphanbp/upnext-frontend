import { describe, expect, it } from "vitest";

import type { CandidateProfileApi } from "@/features/candidate/api/profile";

import {
  evaluateContentSignals,
  evaluateCv,
  evaluateJobMatch,
  isCvEmpty,
  isValidEmail,
  isValidExternalUrl,
  isValidGpa,
  isValidPhone,
  mapProfileToCvData,
  toEditableText,
  toExternalHref,
  toPlainText,
} from "./logic";
import { createInitialCvData } from "./store";

describe("CV Builder business rules", () => {
  it("blocks export when required contact details are missing", () => {
    const result = evaluateCv(createInitialCvData());

    expect(result.score).toBe(0);
    expect(result.blockingIssues.map((issue) => issue.code)).toEqual([
      "fullNameRequired",
      "jobTitleRequired",
      "emailRequired",
      "phoneRequired",
      "careerEvidenceRequired",
    ]);
    expect(result.exportReady).toBe(false);
    expect(result.sections.personal.status).toBe("empty");
  });

  it("validates contact URLs, email and chronological date ranges", () => {
    const cvData = createInitialCvData();
    cvData.personalInfo = {
      ...cvData.personalInfo,
      fullName: "Minh Anh",
      title: "Frontend Developer",
      email: "invalid-email",
      phoneNumber: "0901234567",
      website: "not a url",
    };
    cvData.experiences = [
      {
        id: "experience-1",
        companyName: "UpNext",
        positionTitle: "Frontend Developer",
        startDate: "2026-06",
        endDate: "2025-01",
        isCurrent: false,
        description: "Built and maintained accessible product interfaces with measurable outcomes.",
        technologies: "React, TypeScript",
      },
    ];

    const result = evaluateCv(cvData);

    expect(result.blockingIssues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["emailInvalid", "websiteInvalid", "endBeforeStart"]),
    );
    expect(isValidEmail("candidate@upnext.works")).toBe(true);
    expect(isValidPhone("+84 901 234 567")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidExternalUrl("github.com/upnext")).toBe(true);
    expect(toExternalHref("github.com/upnext")).toBe("https://github.com/upnext");
  });

  it("validates GPA as a number or fraction, not arbitrary text", () => {
    expect(isValidGpa("")).toBe(true); // trường tuỳ chọn, để trống là hợp lệ
    expect(isValidGpa("3.5/4.0")).toBe(true); // đúng placeholder gợi ý
    expect(isValidGpa("8.5")).toBe(true); // thang điểm 10
    expect(isValidGpa("90/100")).toBe(true); // thang điểm 100
    expect(isValidGpa("3,5 / 4,0")).toBe(true); // chấp nhận dấu phẩy thập phân
    expect(isValidGpa("5/4")).toBe(false); // tử số không thể lớn hơn mẫu số
    expect(isValidGpa("2/0")).toBe(false); // không có thang điểm bằng 0
    expect(isValidGpa("A+")).toBe(false);
    expect(isValidGpa("giỏi")).toBe(false);
  });

  it("flags an invalid GPA as a warning, not a blocking error", () => {
    const cvData = createInitialCvData();
    cvData.educations = [
      {
        id: "education-1",
        schoolName: "Đại học Bách Khoa",
        degree: "Kỹ sư",
        major: "Công nghệ thông tin",
        startDate: "2020-09",
        endDate: "2024-06",
        isCurrent: false,
        gpa: "giỏi",
        description: "",
      },
    ];

    const result = evaluateCv(cvData);
    const gpaIssue = result.issues.find((issue) => issue.code === "gpaInvalid");

    expect(gpaIssue).toBeDefined();
    expect(gpaIssue?.severity).toBe("warning");
    expect(result.blockingIssues.map((issue) => issue.code)).not.toContain("gpaInvalid");
  });

  it("normalizes the score to the sections the candidate chooses to show", () => {
    const cvData = createInitialCvData();
    cvData.personalInfo = {
      ...cvData.personalInfo,
      fullName: "Minh Anh",
      title: "Frontend Developer",
      email: "minhanh@example.com",
      phoneNumber: "0901234567",
    };
    cvData.experiences = [
      {
        id: "hidden-invalid-experience",
        companyName: "",
        positionTitle: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
        technologies: "",
      },
    ];
    cvData.hiddenSections = ["summary", "experience", "projects", "education", "skills"];

    const result = evaluateCv(cvData);

    // Khi ứng viên chủ động ẩn các phần tùy chọn, 100% nghĩa là phần đang
    // hiển thị đã hoàn thiện. `exportReady` vẫn chặn xuất CV vì chưa có bằng
    // chứng nghề nghiệp — hai khái niệm không nên bị trộn lẫn.
    expect(result.score).toBe(100);
    expect(result.exportReady).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(["careerEvidenceRequired"]);
    expect(result.blockingIssues.map((issue) => issue.code)).toEqual(["careerEvidenceRequired"]);

    cvData.hiddenSections = ["summary", "projects", "education", "skills"];
    const visibleExperienceResult = evaluateCv(cvData);
    expect(visibleExperienceResult.blockingIssues.map((issue) => issue.section)).toContain(
      "experience",
    );
    expect(visibleExperienceResult.blockingIssues.map((issue) => issue.code)).not.toContain(
      "careerEvidenceRequired",
    );
  });

  it("shows transparent target-job keyword evidence without pretending to predict ATS results", () => {
    const cvData = createInitialCvData();
    cvData.targetJob.description =
      "We are hiring a React React TypeScript Playwright Docker engineer to build reliable frontend systems with React, TypeScript, Playwright, and Docker.";
    cvData.personalInfo.title = "Docker Engineer";
    cvData.experiences = [
      {
        id: "experience-1",
        companyName: "UpNext",
        positionTitle: "Software Engineer",
        startDate: "2024-01",
        endDate: "",
        isCurrent: true,
        description:
          "Built React interfaces and TypeScript components for customers with measurable improvements.",
        technologies: "React, TypeScript",
      },
    ];

    const result = evaluateJobMatch(cvData);
    const reactEvidence = result.matched.find(
      ({ keyword }) => keyword.toLocaleLowerCase() === "react",
    );
    const missingKeywords = result.missing.map((keyword) => keyword.toLocaleLowerCase());

    expect(result.hasDescription).toBe(true);
    expect(result.total).toBeGreaterThan(0);
    expect(result.score).toBe(Math.round((result.matched.length / result.total) * 100));
    expect(reactEvidence?.sections).toContain("experience");
    expect(missingKeywords).toEqual(expect.arrayContaining(["playwright", "docker"]));

    expect(evaluateJobMatch(createInitialCvData())).toEqual({
      hasDescription: false,
      matched: [],
      missing: [],
      score: null,
      total: 0,
    });

    const descriptionWithoutKeywords = createInitialCvData();
    descriptionWithoutKeywords.targetJob.description =
      "The candidate and the company and your role and our team and the job";
    expect(evaluateJobMatch(descriptionWithoutKeywords).hasDescription).toBe(false);
  });

  it("counts action-led, quantified and skill-backed evidence in CV content", () => {
    const cvData = createInitialCvData();
    cvData.experiences = [
      {
        id: "experience-1",
        companyName: "UpNext",
        positionTitle: "Frontend Developer",
        startDate: "2024-01",
        endDate: "",
        isCurrent: true,
        description:
          "Built a React checkout flow that reduced completion time for 35 users.\nMaintained internal documentation for customer support teams.",
        technologies: "React",
      },
    ];
    cvData.skills = [
      { id: "skill-react", name: "React", level: "ADVANCED" },
      { id: "skill-typescript", name: "TypeScript", level: "ADVANCED" },
    ];

    expect(evaluateContentSignals(cvData)).toEqual({
      actionLedBullets: 1,
      quantifiedBullets: 1,
      skillsWithEvidence: 1,
      skillsWithoutEvidence: ["TypeScript"],
      totalBullets: 2,
      totalSkills: 2,
    });
  });

  it("does not treat partial technology names as skill evidence", () => {
    const cvData = createInitialCvData();
    cvData.summary = "Built JavaScript services with NoSQL storage for an ongoing Django project.";
    cvData.skills = [
      { id: "skill-java", name: "Java", level: "INTERMEDIATE" },
      { id: "skill-sql", name: "SQL", level: "INTERMEDIATE" },
      { id: "skill-go", name: "Go", level: "INTERMEDIATE" },
    ];

    expect(evaluateContentSignals(cvData).skillsWithoutEvidence).toEqual(["Java", "SQL", "Go"]);
  });

  it("keeps a complete-looking section in progress while it has a blocking error", () => {
    const cvData = createInitialCvData();
    cvData.personalInfo = {
      ...cvData.personalInfo,
      fullName: "Minh Anh",
      title: "Frontend Developer",
      email: "minhanh@example.com",
      phoneNumber: "0901234567",
      website: "not a url",
    };

    const result = evaluateCv(cvData);

    expect(result.sections.personal.completion).toBe(1);
    expect(result.sections.personal.errors).toBe(1);
    expect(result.sections.personal.status).toBe("inProgress");
  });

  it("preserves a local draft containing any contact-only value", () => {
    const phoneDraft = createInitialCvData();
    phoneDraft.personalInfo.phoneNumber = "0901234567";
    expect(isCvEmpty(phoneDraft)).toBe(false);

    const addressDraft = createInitialCvData();
    addressDraft.personalInfo.address = "Hà Nội";
    expect(isCvEmpty(addressDraft)).toBe(false);

    const websiteDraft = createInitialCvData();
    websiteDraft.personalInfo.website = "github.com/minhanh";
    expect(isCvEmpty(websiteDraft)).toBe(false);

    const visuallyEmptyDraft = createInitialCvData();
    visuallyEmptyDraft.summary = "<p>&nbsp;</p>";
    expect(isCvEmpty(visuallyEmptyDraft)).toBe(true);
  });

  it("turns legacy rich HTML into safe plain text", () => {
    expect(toPlainText("<p>Hello <strong>UpNext</strong></p><ul><li>Built UI</li></ul>")).toBe(
      "Hello UpNext\n• Built UI",
    );
  });

  describe("text bound to an input", () => {
    // A textarea whose value is trimmed on every render can never hold a trailing space:
    // the space is stripped the moment it is typed, so no space can be entered between
    // two words and the field looks like it rejects input. TC_CAN_031.
    it("keeps a space the author just typed", () => {
      expect(toEditableText("Kỹ sư ")).toBe("Kỹ sư ");
      expect(toPlainText("Kỹ sư ")).toBe("Kỹ sư");
    });

    it("keeps indentation and blank lines while the author is still writing", () => {
      expect(toEditableText("  Thành tựu:\n\n\n- Tăng 20% doanh thu")).toBe(
        "  Thành tựu:\n\n\n- Tăng 20% doanh thu",
      );
    });

    it("still unwraps legacy HTML so imported CVs stay editable", () => {
      expect(toEditableText("<p>Hello <strong>UpNext</strong></p><ul><li>Built UI</li></ul>")).toBe(
        "Hello UpNext\n• Built UI\n",
      );
    });

    it("drops carriage returns so a pasted Windows line ending is not doubled", () => {
      expect(toEditableText("Dòng 1\r\nDòng 2")).toBe("Dòng 1\nDòng 2");
    });
  });

  it("maps and sorts real profile data while preserving design preferences", () => {
    const current = createInitialCvData("en");
    current.selectedTemplate = "minimalist";
    current.style.themeColor = "indigo";
    const profile: CandidateProfileApi = {
      id: "profile-1",
      candidateAccountId: "candidate-1",
      phoneNumber: "0901234567",
      gender: null,
      address: "Ho Chi Minh City",
      birthdate: null,
      description: "<p>Frontend engineer focused on accessible products.</p>",
      jobSearchStatus: "OPEN_TO_WORK",
      profileVisibility: "PUBLIC",
      account: {
        id: "candidate-1",
        fullName: "Minh Anh",
        email: "minhanh@example.com",
      },
      educations: [],
      experiences: [
        {
          id: "experience-later",
          companyName: "Second",
          positionTitle: "Senior Engineer",
          employmentType: null,
          startDate: "2024-02-10",
          endDate: null,
          isCurrent: true,
          description: "<ul><li>Led a product team</li></ul>",
          technologies: "React",
          sortOrder: 2,
        },
        {
          id: "experience-first",
          companyName: "First",
          positionTitle: "Engineer",
          employmentType: null,
          startDate: "2022-01-01",
          endDate: "2024-01-01",
          isCurrent: false,
          description: null,
          technologies: null,
          sortOrder: 1,
        },
      ],
      projects: [],
      certifications: [],
      skills: [],
      languages: [],
      links: [{ id: "link-1", type: "GITHUB", url: "github.com/minhanh" }],
      jobPreference: {
        id: "preference-1",
        desiredPosition: "Frontend Developer",
        desiredSalaryMin: null,
        desiredSalaryMax: null,
        salaryCurrency: "VND",
        workingModel: null,
        desiredLevelId: null,
        noticePeriodDays: null,
        isRelocate: false,
      },
    };

    const mapped = mapProfileToCvData(profile, current);

    expect(mapped.selectedTemplate).toBe("minimalist");
    expect(mapped.style.themeColor).toBe("indigo");
    expect(mapped.summary).toBe("Frontend engineer focused on accessible products.");
    expect(mapped.experiences.map((experience) => experience.id)).toEqual([
      "experience-first",
      "experience-later",
    ]);
    expect(mapped.experiences[1]?.startDate).toBe("2024-02");
    expect(mapped.experiences[1]?.description).toBe("• Led a product team");
  });
});
