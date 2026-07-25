"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  followCandidateCompany,
  getMyFollowedCompanies,
  unfollowCandidateCompany,
} from "@/features/candidate/api/profile";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

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

  const toggleFollowCompany = useCallback(
    (companyId: string) => {
      if (!session) return false;
      const following = Object.hasOwn(optimisticState, companyId)
        ? Boolean(optimisticState[companyId])
        : serverIds.has(companyId);
      mutation.mutate({ companyId, following });
      return true;
    },
    [mutation, optimisticState, serverIds, session],
  );

  return {
    error: mutation.error ?? companyFollowsQuery.error,
    followedCompanyIds,
    isAuthenticated: Boolean(session),
    isPending: (companyId: string) =>
      mutation.isPending && mutation.variables?.companyId === companyId,
    isSessionResolved: session !== undefined,
    toggleFollowCompany,
  };
}
