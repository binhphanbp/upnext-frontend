"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import { reportCompanyReview } from "@/features/recruiter/company-reviews/api";
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
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      if (!session) throw new Error("Recruiter session is unavailable");
      return reportCompanyReview(session.accessToken, reviewId, reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["public-company-reviews", companyId] });
    },
  });

  return {
    canReport,
    isSessionResolved: session !== undefined,
    report: (reviewId: string, reason: string) => reportMutation.mutateAsync({ reviewId, reason }),
    isReporting: reportMutation.isPending,
  };
}
