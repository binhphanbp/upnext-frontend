"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  followCandidateCompany,
  getMyFollowedCompanies,
  unfollowCandidateCompany,
} from "@/features/candidate/api/profile";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

type ToggleFollowCompanyCallbacks = {
  onError?: () => void;
  onSuccess?: (following: boolean) => void;
};

export function useCandidateCompanyFollows() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<CandidateSession | null | undefined>(undefined);
  const [optimisticState, setOptimisticState] = useState<Record<string, boolean>>({});
  const queryKey = useMemo(
    () => ["candidate-company-follows", session?.user.id] as const,
    [session?.user.id],
  );

  useEffect(() => {
    setSession(getCandidateSession());
  }, []);

  const companyFollowsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMyFollowedCompanies(session!.accessToken),
    queryKey,
  });
  const mutation = useMutation({
    mutationFn: async ({ companyId, following }: { companyId: string; following: boolean }) => {
      if (!session) throw new Error("Candidate session is unavailable");
      return following
        ? unfollowCandidateCompany(session.accessToken, companyId)
        : followCandidateCompany(session.accessToken, companyId);
    },
    onMutate: ({ companyId, following }) => {
      setOptimisticState((current) => ({ ...current, [companyId]: !following }));
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey });
      setOptimisticState((current) => {
        const next = { ...current };
        delete next[variables.companyId];
        return next;
      });
    },
  });

  const serverIds = useMemo(
    () => new Set((companyFollowsQuery.data ?? []).map((follow) => follow.companyId)),
    [companyFollowsQuery.data],
  );
  const followedCompanyIds = useMemo(() => {
    const ids = new Set(serverIds);
    Object.entries(optimisticState).forEach(([companyId, following]) => {
      if (following) ids.add(companyId);
      else ids.delete(companyId);
    });
    return Array.from(ids);
  }, [optimisticState, serverIds]);

  const setCompanyFollowing = useCallback(
    (companyId: string, shouldFollow: boolean, callbacks: ToggleFollowCompanyCallbacks = {}) => {
      if (!session) return false;
      const following = !shouldFollow;
      mutation.mutate(
        { companyId, following },
        {
          ...(callbacks.onError ? { onError: callbacks.onError } : {}),
          ...(callbacks.onSuccess ? { onSuccess: () => callbacks.onSuccess?.(shouldFollow) } : {}),
        },
      );
      return true;
    },
    [mutation, session],
  );

  const toggleFollowCompany = useCallback(
    (companyId: string, callbacks: ToggleFollowCompanyCallbacks = {}) => {
      const following = Object.hasOwn(optimisticState, companyId)
        ? Boolean(optimisticState[companyId])
        : serverIds.has(companyId);
      return setCompanyFollowing(companyId, !following, callbacks);
    },
    [optimisticState, serverIds, setCompanyFollowing],
  );

  return {
    // Mutation failures are surfaced beside the action as a toast. Keeping this
    // for the loading query avoids repeating the same error in two places.
    error: companyFollowsQuery.error,
    followedCompanyIds,
    isAuthenticated: Boolean(session),
    isPending: (companyId: string) =>
      mutation.isPending && mutation.variables?.companyId === companyId,
    isSessionResolved: session !== undefined,
    setCompanyFollowing,
    toggleFollowCompany,
  };
}
