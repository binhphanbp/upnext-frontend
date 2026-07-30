const STORAGE_KEY_PREFIX = "upnext.recruiter.job-post-form.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1_000;

/**
 * A snapshot of the create form as the recruiter last left it.
 *
 * The AI hand-off (`job-post-ai-draft-storage`) is consumed once and removed, so a reload used to
 * land on an empty form and throw away everything the AI had produced. This keeps the actual field
 * values instead of the AI payload, which also preserves edits made after the autofill.
 */
export type StoredJobPostFormDraft = Readonly<{
  values: Record<string, unknown>;
  aiSuggestedSkills: string[];
  aiSuggestedSpecializations: string[];
  /** Post already created by a submit that failed part-way, so a retry updates it. */
  pendingDraftId: string;
}>;

type StoredEnvelope = {
  savedAt: number;
  state: StoredJobPostFormDraft;
};

function getStorageKey(recruiterId: string) {
  return `${STORAGE_KEY_PREFIX}.${recruiterId}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function saveJobPostFormDraft(recruiterId: string, state: StoredJobPostFormDraft) {
  if (!recruiterId) return;

  const envelope: StoredEnvelope = { savedAt: Date.now(), state };
  try {
    window.sessionStorage.setItem(getStorageKey(recruiterId), JSON.stringify(envelope));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function loadJobPostFormDraft(recruiterId: string): StoredJobPostFormDraft | null {
  if (!recruiterId) return null;

  const storageKey = getStorageKey(recruiterId);
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as unknown;
    if (
      typeof envelope !== "object" ||
      envelope === null ||
      !("savedAt" in envelope) ||
      !("state" in envelope) ||
      typeof envelope.savedAt !== "number" ||
      Date.now() - envelope.savedAt > MAX_AGE_MS
    ) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    const state = envelope.state as Record<string, unknown>;
    if (
      typeof state.values !== "object" ||
      state.values === null ||
      !isStringArray(state.aiSuggestedSkills) ||
      !isStringArray(state.aiSuggestedSpecializations) ||
      typeof state.pendingDraftId !== "string"
    ) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    return state as unknown as StoredJobPostFormDraft;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

export function clearJobPostFormDraft(recruiterId: string) {
  if (!recruiterId) return;
  try {
    window.sessionStorage.removeItem(getStorageKey(recruiterId));
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
