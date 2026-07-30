import type { GenerateJobPostDraftPayload, JobPostAiDraftResponse, JobPostCatalogs } from "./api";
import type { CustomJobPostSection } from "./job-post-ai-result";

type AiDraft = JobPostAiDraftResponse["draft"];

/** The extraction endpoint rejects anything shorter, so a thin JD skips the second pass. */
export const MIN_INFERENCE_SOURCE_LENGTH = 60;

/**
 * Fields the recruiter form expects but the generator does not always produce. Everything listed
 * here is inferable from the JD body, so an empty one is worth a second AI pass rather than an
 * empty select on the create screen.
 */
export function getMissingDraftFields(draft: AiDraft): string[] {
  const missing: string[] = [];

  if (!draft.jobCategoryId) missing.push("jobCategoryId");
  if (!draft.employmentTypeId) missing.push("employmentTypeId");
  if (!draft.experienceLevelId) missing.push("experienceLevelId");
  if (!draft.workingDays?.trim()) missing.push("workingDays");
  if (draft.skillIds.length === 0) missing.push("skillIds");
  if (draft.specializationIds.length === 0) missing.push("specializationIds");
  if (!draft.educationLevel || draft.educationLevel === "ANY") missing.push("educationLevel");
  if (draft.salaryMin === null && draft.salaryMax === null) missing.push("salary");

  return missing;
}

function stripHtml(value: string) {
  return value
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function labelById(options: ReadonlyArray<{ id: string; name: string }>, id: string | null) {
  return options.find((option) => option.id === id)?.name ?? "";
}

/**
 * Flattens the JD the recruiter is looking at — including their edits and any custom section —
 * into the plain text the extraction endpoint reads. Known values are labelled so the model
 * anchors on them instead of re-deriving fields that are already settled.
 */
export function buildJobPostSourceText({
  payload,
  response,
  catalogs,
  customSections,
  companyName,
}: Readonly<{
  payload: GenerateJobPostDraftPayload;
  response: JobPostAiDraftResponse;
  catalogs: JobPostCatalogs;
  customSections: readonly CustomJobPostSection[];
  companyName: string;
}>) {
  const { draft } = response;
  const facts: Array<[string, string]> = [
    ["Chức danh", draft.title],
    ["Công ty", companyName],
    ["Ngành nghề", labelById(catalogs.categories, draft.jobCategoryId)],
    ["Cấp bậc", labelById(catalogs.experienceLevels, draft.experienceLevelId)],
    ["Loại hình", labelById(catalogs.employmentTypes, draft.employmentTypeId)],
    ["Số năm kinh nghiệm", payload.yearsOfExperience ?? ""],
    ["Thời gian làm việc", draft.workingDays ?? ""],
  ];

  const lines = [
    ...facts
      .filter(([, value]) => value.trim() !== "")
      .map(([label, value]) => `${label}: ${value.trim()}`),
    "",
    "MÔ TẢ CÔNG VIỆC",
    stripHtml(draft.description),
    "",
    "YÊU CẦU CÔNG VIỆC",
    stripHtml(draft.requirements),
    "",
    "QUYỀN LỢI",
    stripHtml(draft.benefits),
    ...customSections.flatMap((section) => [
      "",
      section.title.trim().toUpperCase(),
      stripHtml(section.content),
    ]),
  ];

  return lines.join("\n").trim();
}

/**
 * Copies what the recruiter already chose on the AI form onto the draft. The generator only echoes
 * a catalog id back when its own text matched the catalog, so an explicit pick can otherwise arrive
 * at the create screen as an empty select — no AI call needed to know the answer.
 */
export function applyPayloadFallbacks(
  response: JobPostAiDraftResponse,
  payload: GenerateJobPostDraftPayload,
): JobPostAiDraftResponse {
  const { draft } = response;
  const payloadSkillIds = Array.from(
    new Set([...(payload.requiredSkillIds ?? []), ...(payload.preferredSkillIds ?? [])]),
  );

  return {
    ...response,
    draft: {
      ...draft,
      jobCategoryId: draft.jobCategoryId ?? payload.jobCategoryId ?? null,
      employmentTypeId: draft.employmentTypeId ?? payload.employmentTypeId ?? null,
      experienceLevelId: draft.experienceLevelId ?? payload.experienceLevelId ?? null,
      skillIds: draft.skillIds.length > 0 ? draft.skillIds : payloadSkillIds,
    },
  };
}

const FIELD_LABELS: Record<string, string> = {
  jobCategoryId: "ngành nghề",
  employmentTypeId: "loại hình",
  experienceLevelId: "cấp bậc",
  workingDays: "thời gian làm việc",
  educationLevel: "trình độ học vấn",
  skillIds: "kỹ năng",
  specializationIds: "chuyên môn",
  salary: "khoảng lương",
  vacanciesCount: "số lượng tuyển",
};

/**
 * Names the fields inference actually changed, so the create screen can say what it filled rather
 * than leaving the recruiter to spot the difference.
 */
export function getAutofilledFieldLabels(
  before: JobPostAiDraftResponse,
  after: JobPostAiDraftResponse,
): string[] {
  const changed = (key: keyof JobPostAiDraftResponse["draft"]) =>
    JSON.stringify(before.draft[key]) !== JSON.stringify(after.draft[key]);

  const keys: Array<[string, boolean]> = [
    ["jobCategoryId", changed("jobCategoryId")],
    ["employmentTypeId", changed("employmentTypeId")],
    ["experienceLevelId", changed("experienceLevelId")],
    ["workingDays", changed("workingDays")],
    ["educationLevel", changed("educationLevel")],
    ["skillIds", changed("skillIds")],
    ["specializationIds", changed("specializationIds")],
    ["salary", changed("salaryMin") || changed("salaryMax")],
    ["vacanciesCount", changed("vacanciesCount")],
  ];

  return keys.filter(([, isChanged]) => isChanged).map(([key]) => FIELD_LABELS[key] ?? key);
}

/**
 * Copies inferred values onto the draft, but only where the recruiter's own JD left a gap: the
 * body they edited by hand always wins over a second machine reading of it.
 */
export function mergeInferredDraft(
  base: JobPostAiDraftResponse,
  inferred: JobPostAiDraftResponse,
): JobPostAiDraftResponse {
  const draft = base.draft;
  const source = inferred.draft;
  const missing = new Set(getMissingDraftFields(draft));
  const fillsSalary =
    missing.has("salary") && source.salaryMin !== null && source.salaryMax !== null;

  return {
    ...base,
    draft: {
      ...draft,
      jobCategoryId: missing.has("jobCategoryId")
        ? (source.jobCategoryId ?? draft.jobCategoryId)
        : draft.jobCategoryId,
      employmentTypeId: missing.has("employmentTypeId")
        ? (source.employmentTypeId ?? draft.employmentTypeId)
        : draft.employmentTypeId,
      experienceLevelId: missing.has("experienceLevelId")
        ? (source.experienceLevelId ?? draft.experienceLevelId)
        : draft.experienceLevelId,
      workingDays: missing.has("workingDays")
        ? source.workingDays?.trim()
          ? source.workingDays
          : draft.workingDays
        : draft.workingDays,
      educationLevel: missing.has("educationLevel")
        ? source.educationLevel || draft.educationLevel
        : draft.educationLevel,
      skillIds:
        missing.has("skillIds") && source.skillIds.length > 0 ? source.skillIds : draft.skillIds,
      specializationIds:
        missing.has("specializationIds") && source.specializationIds.length > 0
          ? source.specializationIds
          : draft.specializationIds,
      // A JD that says "Thỏa thuận" extracts as null, so this only fires when the body really
      // does carry a range — in which case the number in the text beats an empty salary field.
      salaryMin: fillsSalary ? source.salaryMin : draft.salaryMin,
      salaryMax: fillsSalary ? source.salaryMax : draft.salaryMax,
      salaryPeriod: fillsSalary ? source.salaryPeriod : draft.salaryPeriod,
      salaryIsNegotiable: fillsSalary ? false : draft.salaryIsNegotiable,
      salaryIsVisible: fillsSalary ? true : draft.salaryIsVisible,
      vacanciesCount:
        draft.vacanciesCount <= 1 && source.vacanciesCount > 1
          ? source.vacanciesCount
          : draft.vacanciesCount,
    },
    suggestions: {
      unmatchedSkillNames: Array.from(
        new Set([
          ...base.suggestions.unmatchedSkillNames,
          ...(missing.has("skillIds") ? inferred.suggestions.unmatchedSkillNames : []),
        ]),
      ),
      unmatchedSpecializationNames: Array.from(
        new Set([
          ...base.suggestions.unmatchedSpecializationNames,
          ...(missing.has("specializationIds")
            ? inferred.suggestions.unmatchedSpecializationNames
            : []),
        ]),
      ),
    },
  };
}
