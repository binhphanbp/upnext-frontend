import { Suspense } from "react";

import { AiCopilotPage, AiCopilotPageSkeleton } from "@/features/ai-copilot";

export default function CandidateAiPage() {
  return (
    <Suspense fallback={<AiCopilotPageSkeleton />}>
      <AiCopilotPage />
    </Suspense>
  );
}
