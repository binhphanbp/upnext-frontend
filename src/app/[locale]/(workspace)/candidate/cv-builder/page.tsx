import { Suspense } from "react";

import { CandidateCvBuilder } from "@/features/candidate/cv-builder/cv-builder";

export default function CandidateCvBuilderPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-screen bg-slate-50" />}>
      <CandidateCvBuilder />
    </Suspense>
  );
}
