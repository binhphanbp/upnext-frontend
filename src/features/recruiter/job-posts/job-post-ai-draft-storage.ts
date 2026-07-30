import type { JobPostAiDraftResponse } from "./api";

const STORAGE_KEY = "upnext.recruiter.job-post-ai-draft.v1";
const AUTOFILL_NOTICE_KEY = "upnext.recruiter.job-post-ai-autofill.v1";

/**
 * Field names the AI inferred on the way over, kept beside the draft so the create screen can name
 * them in its toast instead of the recruiter having to spot which selects changed.
 */
export function saveJobPostAiAutofillNotice(fieldLabels: readonly string[]) {
  if (fieldLabels.length === 0) {
    window.sessionStorage.removeItem(AUTOFILL_NOTICE_KEY);
    return;
  }
  window.sessionStorage.setItem(AUTOFILL_NOTICE_KEY, JSON.stringify(fieldLabels));
}

export function consumeJobPostAiAutofillNotice(): string[] {
  const raw = window.sessionStorage.getItem(AUTOFILL_NOTICE_KEY);
  window.sessionStorage.removeItem(AUTOFILL_NOTICE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJobPostAiDraft(draft: JobPostAiDraftResponse) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function consumeJobPostAiDraft(): JobPostAiDraftResponse | null {
  const rawDraft = window.sessionStorage.getItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);

  if (!rawDraft) return null;

  try {
    const parsed = JSON.parse(rawDraft) as Partial<JobPostAiDraftResponse>;
    if (
      !parsed.draft ||
      typeof parsed.draft.title !== "string" ||
      typeof parsed.draft.description !== "string" ||
      !parsed.suggestions ||
      !Array.isArray(parsed.suggestions.unmatchedSkillNames) ||
      !Array.isArray(parsed.suggestions.unmatchedSpecializationNames)
    ) {
      return null;
    }

    return parsed as JobPostAiDraftResponse;
  } catch {
    return null;
  }
}
