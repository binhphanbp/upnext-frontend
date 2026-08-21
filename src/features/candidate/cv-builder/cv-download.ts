import type { CandidateCvApi } from "@/features/candidate/api/profile";

import { parseCvSnapshot } from "./store";

type CandidateCvVersion = CandidateCvApi["versions"][number];

/**
 * Builder snapshots are the authoritative document. A previously attached PDF may be stale
 * or unavailable in storage, so candidate downloads must render the snapshot instead.
 */
export function shouldRenderBuilderCvSnapshotForDownload(
  cv: Pick<CandidateCvApi, "source">,
  version: Pick<CandidateCvVersion, "contentJson" | "sourceFile">,
) {
  return cv.source === "BUILDER" && parseCvSnapshot(version.contentJson) !== null;
}
