"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMySavedJobs,
  saveCandidateJob,
  unsaveCandidateJob,
} from "@/features/candidate/api/profile";
import {
  clearCandidateSession,
  getCandidateSession,
  type CandidateSession,
} from "@/features/candidate/session";

type ToggleSaveJobCallbacks = {
  onError?: () => void;
  onSuccess?: (saved: boolean) => void;
};

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
    queryFn: () => getMySavedJobs(session!.accessToken),
    queryKey,
    retry: (failureCount, error: any) => {
      const status = error?.status || error?.statusCode;
      if (status === 401 || status === 403 || error?.message?.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (savedJobsQuery.isError) {
      const err = savedJobsQuery.error as any;
      const status = err?.status || err?.statusCode;
      if (
        status === 401 ||
        status === 403 ||
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized")
      ) {
        clearCandidateSession();
        setSession(null);
      }
    }
  }, [savedJobsQuery.isError, savedJobsQuery.error]);
  const mutation = useMutation({
    mutationFn: async ({ jobPostId, saved }: { jobPostId: string; saved: boolean }) => {
      if (!session) throw new Error("Candidate session is unavailable");
      return saved
        ? unsaveCandidateJob(session.accessToken, jobPostId)
        : saveCandidateJob(session.accessToken, jobPostId);
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

  const setSavedJob = useCallback(
    (jobPostId: string, shouldSave: boolean, callbacks: ToggleSaveJobCallbacks = {}) => {
      if (!session) return false;
      const saved = !shouldSave;
      mutation.mutate(
        { jobPostId, saved },
        {
          ...(callbacks.onError ? { onError: callbacks.onError } : {}),
          ...(callbacks.onSuccess ? { onSuccess: () => callbacks.onSuccess?.(shouldSave) } : {}),
        },
      );
      return true;
    },
    [mutation, session],
  );

  const toggleSaveJob = useCallback(
    (jobPostId: string, callbacks: ToggleSaveJobCallbacks = {}) => {
      const saved = Object.hasOwn(optimisticState, jobPostId)
        ? Boolean(optimisticState[jobPostId])
        : serverIds.has(jobPostId);
      return setSavedJob(jobPostId, !saved, callbacks);
    },
    [optimisticState, serverIds, setSavedJob],
  );

  return {
    // Mutation failures are surfaced beside the action as a toast. Keeping this
    // for the loading query avoids repeating the same error in two places.
    error: savedJobsQuery.error,
    isAuthenticated: Boolean(session),
    isPending: (jobPostId: string) =>
      mutation.isPending && mutation.variables?.jobPostId === jobPostId,
    isSessionResolved: session !== undefined,
    setSavedJob,
    savedJobIds,
    toggleSaveJob,
  };
}
