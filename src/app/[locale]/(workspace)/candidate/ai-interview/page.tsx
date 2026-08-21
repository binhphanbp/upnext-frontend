import { Suspense } from "react";

import { AiInterviewPage, AiInterviewSkeleton } from "@/features/ai-interview";

export default function CandidateAiInterviewPage() {
  return (
    <Suspense fallback={<AiInterviewSkeleton />}>
      <AiInterviewPage />
    </Suspense>
  );
}
