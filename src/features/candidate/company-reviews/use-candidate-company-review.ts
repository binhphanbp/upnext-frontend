"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  createCompanyReview,
  deleteCompanyReview,
  getMyCompanyReview,
  updateCompanyReview,
  type CompanyReviewPayload,
} from "@/features/candidate/company-reviews/api";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

export function useCandidateCompanyReview(companyId: string) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<CandidateSession | null | undefined>(undefined);
  const publicReviewsQueryKey = useMemo(() => ["public-company-reviews", companyId], [companyId]);
  const myReviewQueryKey = useMemo(
    () => ["candidate-company-review", session?.user.id, companyId] as const,
    [session?.user.id, companyId],
  );

  useEffect(() => {
    setSession(getCandidateSession());
  }, []);

  const myReviewQuery = useQuery({
    enabled: Boolean(session),
    queryFn: async () => {
      const data = await getMyCompanyReview(session!.accessToken, companyId);
      return data ?? null;
    },
    queryKey: myReviewQueryKey,
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: myReviewQueryKey }),
      queryClient.invalidateQueries({ queryKey: publicReviewsQueryKey }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (payload: CompanyReviewPayload) => {
      if (!session) throw new Error("Candidate session is unavailable");
      return createCompanyReview(session.accessToken, companyId, payload);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CompanyReviewPayload) => {
      if (!session || !myReviewQuery.data) throw new Error("No review to update");
      return updateCompanyReview(session.accessToken, myReviewQuery.data.id, payload);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!session || !myReviewQuery.data) throw new Error("No review to delete");
      return deleteCompanyReview(session.accessToken, myReviewQuery.data.id);
    },
    onSuccess: invalidate,
  });

  return {
    isAuthenticated: Boolean(session),
    isSessionResolved: session !== undefined,
    myReview: myReviewQuery.data ?? null,
    isMyReviewLoading: session !== undefined && myReviewQuery.isPending,
    submit: (payload: CompanyReviewPayload) =>
      myReviewQuery.data
        ? updateMutation.mutateAsync(payload)
        : createMutation.mutateAsync(payload),
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    remove: () => deleteMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
  };
}
