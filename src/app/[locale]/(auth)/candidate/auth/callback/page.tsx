import { Suspense } from "react";

import { CandidateOAuthCallbackPage } from "@/features/auth/candidate-oauth-callback-page";

export default function CandidateOAuthCallbackRoute() {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center bg-slate-50"
          aria-busy="true"
        >
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent motion-reduce:animate-none" />
        </main>
      }
    >
      <CandidateOAuthCallbackPage />
    </Suspense>
  );
}
