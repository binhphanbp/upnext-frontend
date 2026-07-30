import type {
  GenerateJobPostDraftPayload,
  JobPostAiDraftResponse,
  JobPostSalaryInsightResponse,
} from "./api";
import type { CustomJobPostSection } from "./job-post-ai-result";

const STORAGE_KEY_PREFIX = "upnext.recruiter.job-post-ai-result.v1";
const RESULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

export type StoredJobPostAiResult = Readonly<{
  generatedResult: {
    payload: GenerateJobPostDraftPayload;
    response: JobPostAiDraftResponse;
  };
  salaryInsight: JobPostSalaryInsightResponse | null;
  salaryExperienceYears: string;
  /**
   * Block layout the recruiter arranged. Optional so drafts saved before custom sections
   * existed still load instead of being discarded.
   */
  sectionOrder?: string[];
  customSections?: CustomJobPostSection[];
}>;

type StoredEnvelope = {
  savedAt: number;
  state: StoredJobPostAiResult;
};

function getStorageKey(recruiterId: string) {
  return `${STORAGE_KEY_PREFIX}.${recruiterId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomSection(value: unknown): value is CustomJobPostSection {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.content === "string"
  );
}

function isStoredResult(value: unknown): value is StoredJobPostAiResult {
  if (!isRecord(value) || !isRecord(value.generatedResult)) return false;

  const { payload, response } = value.generatedResult;
  if (!isRecord(payload) || !isRecord(response) || !isRecord(response.draft)) return false;

  return (
    typeof payload.title === "string" &&
    (payload.yearsOfExperience === undefined || typeof payload.yearsOfExperience === "string") &&
    (payload.outputLanguage === "vi" || payload.outputLanguage === "en") &&
    ["traditional", "skill_focused", "value_focused"].includes(String(payload.presentationStyle)) &&
    typeof response.draft.title === "string" &&
    typeof response.draft.description === "string" &&
    typeof value.salaryExperienceYears === "string" &&
    (value.salaryInsight === null || isRecord(value.salaryInsight)) &&
    (value.sectionOrder === undefined ||
      (Array.isArray(value.sectionOrder) &&
        value.sectionOrder.every((key) => typeof key === "string"))) &&
    (value.customSections === undefined ||
      (Array.isArray(value.customSections) && value.customSections.every(isCustomSection)))
  );
}

export function saveJobPostAiResult(recruiterId: string, state: StoredJobPostAiResult) {
  const envelope: StoredEnvelope = {
    savedAt: Date.now(),
    state,
  };
  try {
    window.localStorage.setItem(getStorageKey(recruiterId), JSON.stringify(envelope));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function loadJobPostAiResult(recruiterId: string): StoredJobPostAiResult | null {
  const storageKey = getStorageKey(recruiterId);

  try {
    const rawResult = window.localStorage.getItem(storageKey);
    if (!rawResult) return null;

    const envelope = JSON.parse(rawResult) as unknown;
    if (
      !isRecord(envelope) ||
      typeof envelope.savedAt !== "number" ||
      Date.now() - envelope.savedAt > RESULT_MAX_AGE_MS ||
      !isStoredResult(envelope.state)
    ) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return envelope.state;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function clearJobPostAiResult(recruiterId: string) {
  try {
    window.localStorage.removeItem(getStorageKey(recruiterId));
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
