import { Suspense } from "react";

import { CandidateProfileLoading, CandidateProfilePage } from "@/features/candidate/profile";

export default function ProfilePage() {
  return (
    <Suspense fallback={<CandidateProfileLoading />}>
      <CandidateProfilePage />
    </Suspense>
  );
}
