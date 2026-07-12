import { Suspense } from "react";

import { CandidateSavedJobsLoading, CandidateSavedJobsPage } from "@/features/candidate/saved-jobs";

export default function SavedJobsPage() {
  return (
    <Suspense fallback={<CandidateSavedJobsLoading />}>
      <CandidateSavedJobsPage />
    </Suspense>
  );
}
