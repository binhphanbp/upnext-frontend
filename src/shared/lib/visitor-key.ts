/**
 * Anonymous, per-browser key persisted in localStorage -- lets the backend
 * dedupe events (job view counts, sponsored impression/click counts) from the
 * same visitor without any account or cookie tracking. Originally lived only
 * in job-detail-page.tsx (see `x-upnext-visitor-key` header,
 * `JobPostsService.recordView`); extracted here so the sponsored-jobs
 * impression/click tracking (`use-boost-delivery-tracking.ts`) reuses the
 * exact same identity instead of minting a second, unrelated one.
 */
const VISITOR_KEY_STORAGE_NAME = "upnext:visitor-key:v1";

export function getOrCreateVisitorKey(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const existingKey = window.localStorage.getItem(VISITOR_KEY_STORAGE_NAME);
    if (existingKey) return existingKey;

    const visitorKey =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY_STORAGE_NAME, visitorKey);
    return visitorKey;
  } catch {
    // Privacy mode or a blocked storage area should never break the page.
    return undefined;
  }
}
