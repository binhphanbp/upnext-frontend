import { describe, expect, it } from "vitest";

import type { GenerateJobPostDraftPayload, JobPostAiDraftResponse, JobPostCatalogs } from "./api";
import {
  applyPayloadFallbacks,
  buildJobPostSourceText,
  getMissingDraftFields,
  mergeInferredDraft,
} from "./job-post-ai-autofill";

const catalogs: JobPostCatalogs = {
  categories: [{ id: "category-1", name: "Công nghệ thông tin" }],
  employmentTypes: [{ id: "type-1", name: "Toàn thời gian" }],
  experienceLevels: [{ id: "level-1", name: "Senior" }],
  skills: [{ id: "skill-react", name: "React" }],
  specializations: [{ id: "specialization-web", name: "Lập trình web" }],
};

const payload: GenerateJobPostDraftPayload = {
  title: "Senior React Developer",
  outputLanguage: "vi",
  presentationStyle: "skill_focused",
  yearsOfExperience: "4",
};

function makeResponse(
  draft: Partial<JobPostAiDraftResponse["draft"]>,
  suggestions: Partial<JobPostAiDraftResponse["suggestions"]> = {},
): JobPostAiDraftResponse {
  return {
    model: "gemini-test",
    source: "generated",
    draft: {
      title: "Senior React Developer",
      description: "<p>Xây dựng nền tảng tuyển dụng.</p>",
      requirements: "<ul><li>Bốn năm kinh nghiệm React.</li></ul>",
      benefits: "<ul><li>Lương thưởng cạnh tranh.</li></ul>",
      salaryMin: null,
      salaryMax: null,
      salaryPeriod: "MONTH",
      salaryIsNegotiable: true,
      salaryIsVisible: true,
      vacanciesCount: 1,
      educationLevel: "ANY",
      workingDays: null,
      jobCategoryId: null,
      experienceLevelId: null,
      employmentTypeId: null,
      skillIds: [],
      specializationIds: [],
      ...draft,
    },
    suggestions: {
      unmatchedSkillNames: [],
      unmatchedSpecializationNames: [],
      ...suggestions,
    },
  };
}

describe("getMissingDraftFields", () => {
  it("lists every catalog field the generator left blank", () => {
    expect(getMissingDraftFields(makeResponse({}).draft)).toEqual([
      "jobCategoryId",
      "employmentTypeId",
      "experienceLevelId",
      "workingDays",
      "skillIds",
      "specializationIds",
      "educationLevel",
      "salary",
    ]);
  });

  it("reports nothing when the draft is already complete", () => {
    const complete = makeResponse({
      jobCategoryId: "category-1",
      employmentTypeId: "type-1",
      experienceLevelId: "level-1",
      workingDays: "Thứ 2 - Thứ 6",
      skillIds: ["skill-react"],
      specializationIds: ["specialization-web"],
      educationLevel: "BACHELOR",
      salaryMin: 25_000_000,
      salaryMax: 35_000_000,
    });

    expect(getMissingDraftFields(complete.draft)).toEqual([]);
  });
});

describe("applyPayloadFallbacks", () => {
  it("recovers the catalog ids the recruiter picked on the AI form", () => {
    const filled = applyPayloadFallbacks(makeResponse({}), {
      ...payload,
      jobCategoryId: "category-1",
      employmentTypeId: "type-1",
      experienceLevelId: "level-1",
      requiredSkillIds: ["skill-react"],
      preferredSkillIds: ["skill-react", "skill-node"],
    });

    expect(filled.draft.jobCategoryId).toBe("category-1");
    expect(filled.draft.employmentTypeId).toBe("type-1");
    expect(filled.draft.experienceLevelId).toBe("level-1");
    expect(filled.draft.skillIds).toEqual(["skill-react", "skill-node"]);
  });

  it("never overrides what the generator already resolved", () => {
    const filled = applyPayloadFallbacks(
      makeResponse({ jobCategoryId: "category-generated", skillIds: ["skill-generated"] }),
      { ...payload, jobCategoryId: "category-1", requiredSkillIds: ["skill-react"] },
    );

    expect(filled.draft.jobCategoryId).toBe("category-generated");
    expect(filled.draft.skillIds).toEqual(["skill-generated"]);
  });
});

describe("buildJobPostSourceText", () => {
  it("flattens the edited JD, known facts and custom sections into plain text", () => {
    const text = buildJobPostSourceText({
      payload,
      response: makeResponse({ experienceLevelId: "level-1" }),
      catalogs,
      customSections: [
        { id: "custom-1", title: "Quy trình phỏng vấn", content: "<p>Hai vòng.</p>" },
      ],
      companyName: "Công ty Công nghệ UpNext",
    });

    expect(text).toContain("Chức danh: Senior React Developer");
    expect(text).toContain("Cấp bậc: Senior");
    expect(text).toContain("Số năm kinh nghiệm: 4");
    expect(text).toContain("QUY TRÌNH PHỎNG VẤN");
    expect(text).toContain("Hai vòng.");
    // Nothing HTML survives: the extraction endpoint reads plain text.
    expect(text).not.toContain("<");
    // Absent facts are dropped rather than sent as empty labels the model would try to honour.
    expect(text).not.toContain("Loại hình:");
  });
});

describe("mergeInferredDraft", () => {
  it("fills only the blanks and keeps the recruiter's own content", () => {
    const base = makeResponse({
      description: "<p>Bản đã chỉnh tay.</p>",
      experienceLevelId: "level-1",
      skillIds: ["skill-react"],
    });
    const inferred = makeResponse({
      description: "<p>AI đọc lại.</p>",
      jobCategoryId: "category-1",
      employmentTypeId: "type-1",
      experienceLevelId: "level-other",
      workingDays: "Thứ 2 - Thứ 6",
      educationLevel: "BACHELOR",
      skillIds: ["skill-other"],
      specializationIds: ["specialization-web"],
      vacanciesCount: 3,
      salaryMin: 25_000_000,
      salaryMax: 35_000_000,
      salaryIsNegotiable: false,
    });

    const merged = mergeInferredDraft(base, inferred);

    expect(merged.draft.description).toBe("<p>Bản đã chỉnh tay.</p>");
    expect(merged.draft.experienceLevelId).toBe("level-1");
    expect(merged.draft.skillIds).toEqual(["skill-react"]);
    expect(merged.draft.jobCategoryId).toBe("category-1");
    expect(merged.draft.employmentTypeId).toBe("type-1");
    expect(merged.draft.workingDays).toBe("Thứ 2 - Thứ 6");
    expect(merged.draft.educationLevel).toBe("BACHELOR");
    expect(merged.draft.specializationIds).toEqual(["specialization-web"]);
    expect(merged.draft.vacanciesCount).toBe(3);
    expect(merged.draft.salaryMin).toBe(25_000_000);
    expect(merged.draft.salaryIsNegotiable).toBe(false);
  });

  it("leaves a negotiable salary alone when the JD carries no range", () => {
    const merged = mergeInferredDraft(makeResponse({}), makeResponse({}));

    expect(merged.draft.salaryMin).toBeNull();
    expect(merged.draft.salaryIsNegotiable).toBe(true);
  });

  it("carries over unmatched names only for the fields it actually filled", () => {
    const base = makeResponse({ skillIds: ["skill-react"] }, { unmatchedSkillNames: ["Rust"] });
    const inferred = makeResponse(
      { specializationIds: ["specialization-web"] },
      { unmatchedSkillNames: ["Elixir"], unmatchedSpecializationNames: ["Blockchain"] },
    );

    const merged = mergeInferredDraft(base, inferred);

    expect(merged.suggestions.unmatchedSkillNames).toEqual(["Rust"]);
    expect(merged.suggestions.unmatchedSpecializationNames).toEqual(["Blockchain"]);
  });
});
