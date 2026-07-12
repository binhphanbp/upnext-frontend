import { Suspense } from "react";

import {
  CandidateApplicationsLoading,
  CandidateApplicationsPage,
} from "@/features/candidate/applications";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<CandidateApplicationsLoading />}>
      <CandidateApplicationsPage />
    </Suspense>
  );
}
