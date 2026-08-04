import type { CandidateCvApi } from "./api/profile";

/**
 * Keeps a deliberate CV choice intact when the CV query refreshes. A default is
 * only a starting suggestion; it must never replace a CV the candidate has
 * just selected or uploaded.
 */
export function resolveCandidateCvSelection(
  cvs: CandidateCvApi[] | undefined,
  selectedCvId: string | null,
) {
  if (!cvs?.length) return null;

  if (selectedCvId && cvs.some((cv) => cv.id === selectedCvId)) {
    return selectedCvId;
  }

  return cvs.find((cv) => cv.isDefault)?.id ?? cvs[0]?.id ?? null;
}

export function getLatestCandidateCvVersion(cv: CandidateCvApi) {
  return [...cv.versions].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0];
}
