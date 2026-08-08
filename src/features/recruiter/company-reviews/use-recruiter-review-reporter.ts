"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  reportCompanyReview,
  uploadReviewReportEvidence,
} from "@/features/recruiter/company-reviews/api";
import { getRecruiterSession, type RecruiterSession } from "@/features/recruiter/session";

export function useRecruiterReviewReporter(companyId: string) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<RecruiterSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getRecruiterSession());
  }, []);

  const accountQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getRecruiterAccount(session!.user.id, session!.accessToken),
    queryKey: ["recruiter-account", session?.user.id],
  });

  const canReport = accountQuery.data?.company?.id === companyId;

  const reportMutation = useMutation({
    mutationFn: async ({
      reviewId,
      reason,
      evidence,
    }: {
      reviewId: string;
      reason: string;
      evidence: File | null;
    }) => {
      if (!session) throw new Error("Recruiter session is unavailable");
      const evidenceFileId = evidence
        ? (await uploadReviewReportEvidence(evidence, session.accessToken)).file.id
        : undefined;
      return reportCompanyReview(session.accessToken, reviewId, reason, evidenceFileId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["public-company-reviews", companyId] });
    },
  });

  return {
    canReport,
    isSessionResolved: session !== undefined,
    report: (reviewId: string, reason: string, evidence: File | null = null) =>
      reportMutation.mutateAsync({ reviewId, reason, evidence }),
    isReporting: reportMutation.isPending,
  };
}
