import { Suspense } from "react";

import {
  CandidateNotificationsLoading,
  CandidateNotificationsPage,
} from "@/features/candidate/notifications";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<CandidateNotificationsLoading />}>
      <CandidateNotificationsPage />
    </Suspense>
  );
}
