"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMySavedJobs,
  saveCandidateJob,
  unsaveCandidateJob,
} from "@/features/candidate/api/profile";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

export function useCandidateSavedJobs() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<CandidateSession | null | undefined>(undefined);
  const [optimisticState, setOptimisticState] = useState<Record<string, boolean>>({});
  const queryKey = useMemo(
    () => ["candidate-saved-jobs", session?.user.id] as const,
    [session?.user.id],
  );

  useEffect(() => {
    setSession(getCandidateSession());
  }, []);

  const savedJobsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMySavedJobs(session!.accessToken, session!.user.id),
    queryKey,
  });
  const mutation = useMutation({
    mutationFn: async ({ jobPostId, saved }: { jobPostId: string; saved: boolean }) => {
      if (!session) throw new Error("Candidate session is unavailable");
      return saved
        ? unsaveCandidateJob(session.accessToken, session.user.id, jobPostId)
        : saveCandidateJob(session.accessToken, session.user.id, jobPostId);
    },
    onMutate: ({ jobPostId, saved }) => {
      setOptimisticState((current) => ({ ...current, [jobPostId]: !saved }));
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey });
      setOptimisticState((current) => {
        const next = { ...current };
        delete next[variables.jobPostId];
        return next;
      });
    },
  });

  const serverIds = useMemo(
    () => new Set((savedJobsQuery.data ?? []).map((savedJob) => savedJob.jobPostId)),
    [savedJobsQuery.data],
  );
  const savedJobIds = useMemo(() => {
    const ids = new Set(serverIds);
    Object.entries(optimisticState).forEach(([jobPostId, saved]) => {
      if (saved) ids.add(jobPostId);
      else ids.delete(jobPostId);
    });
    return Array.from(ids);
  }, [optimisticState, serverIds]);

  const toggleSaveJob = useCallback(
    (jobPostId: string) => {
      if (!session) return false;
      const saved = Object.hasOwn(optimisticState, jobPostId)
        ? Boolean(optimisticState[jobPostId])
        : serverIds.has(jobPostId);
      mutation.mutate({ jobPostId, saved });
      return true;
    },
    [mutation, optimisticState, serverIds, session],
  );

  return {
    error: mutation.error ?? savedJobsQuery.error,
    isPending: (jobPostId: string) =>
      mutation.isPending && mutation.variables?.jobPostId === jobPostId,
    isSessionResolved: session !== undefined,
    savedJobIds,
    toggleSaveJob,
  };
}
