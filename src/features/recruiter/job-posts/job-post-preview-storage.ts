import type { JobLocationOption, JobPostCatalogs } from "./api";
import type { JobPostPreviewValues } from "./recruiter-job-post-preview";

export const RECRUITER_JOB_POST_PREVIEW_STORAGE_KEY = "upnext.recruiter.job-post-preview";

export type RecruiterJobPostPreviewPayload = Readonly<{
  companyName: string;
  companyLogoUrl: string;
  companyVerified: boolean;
  values: JobPostPreviewValues;
  catalogs: JobPostCatalogs;
  locations: ReadonlyArray<JobLocationOption>;
}>;

export function saveRecruiterJobPostPreview(payload: RecruiterJobPostPreviewPayload) {
  const serialized = JSON.stringify(payload);
  window.sessionStorage.setItem(RECRUITER_JOB_POST_PREVIEW_STORAGE_KEY, serialized);
  // The preview opens in a new tab, and only some browsers hand a copy of sessionStorage to it.
  // localStorage is shared across tabs outright, so the preview always finds its payload.
  try {
    window.localStorage.setItem(RECRUITER_JOB_POST_PREVIEW_STORAGE_KEY, serialized);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function getRecruiterJobPostPreview(): RecruiterJobPostPreviewPayload | null {
  const rawPreview =
    window.sessionStorage.getItem(RECRUITER_JOB_POST_PREVIEW_STORAGE_KEY) ??
    window.localStorage.getItem(RECRUITER_JOB_POST_PREVIEW_STORAGE_KEY);
  if (!rawPreview) return null;

  try {
    return JSON.parse(rawPreview) as RecruiterJobPostPreviewPayload;
  } catch {
    return null;
  }
}
