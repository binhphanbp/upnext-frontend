import { Suspense } from "react";

import { CandidateKnowledgeSourcePage } from "@/features/ai-copilot/components/candidate-knowledge-source-page";

export default async function CandidateKnowledgeSourceRoute({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <Suspense fallback={null}>
      <CandidateKnowledgeSourcePage documentId={documentId} />
    </Suspense>
  );
}
