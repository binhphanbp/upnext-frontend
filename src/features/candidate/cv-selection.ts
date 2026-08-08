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
  const applicableCvs = cvs?.filter((cv) => cv.status === "ACTIVE" && cv.versions.length > 0);
  if (!applicableCvs?.length) return null;

  if (selectedCvId && applicableCvs.some((cv) => cv.id === selectedCvId)) {
    return selectedCvId;
  }

  return applicableCvs.find((cv) => cv.isDefault)?.id ?? applicableCvs[0]?.id ?? null;
}

export function getLatestCandidateCvVersion(cv: CandidateCvApi) {
  return [...cv.versions].sort(
    (left, right) =>
      right.versionNo - left.versionNo ||
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0];
}
