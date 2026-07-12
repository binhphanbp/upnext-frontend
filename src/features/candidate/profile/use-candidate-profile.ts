"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getMyCandidateCvs, getMyCandidateProfile } from "@/features/candidate/api/profile";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

const candidateCvsPageLimit = 100;

async function getAllCandidateCvs(token: string, candidateAccountId: string) {
  const firstPage = await getMyCandidateCvs(token, candidateAccountId, 1, candidateCvsPageLimit);
  const remainingPageCount = Math.max(0, firstPage.meta.totalPages - 1);

  if (remainingPageCount === 0) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: remainingPageCount }, (_, index) =>
      getMyCandidateCvs(token, candidateAccountId, index + 2, candidateCvsPageLimit),
    ),
  );

  return {
    items: [firstPage, ...remainingPages].flatMap((page) => page.items),
    meta: firstPage.meta,
  };
}

export function useCandidateProfileWorkspace() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<CandidateSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getCandidateSession());
  }, []);

  const candidateAccountId = session?.user.id;
  const profileQueryKey = useMemo(
    () => ["candidate-profile", candidateAccountId] as const,
    [candidateAccountId],
  );
  const cvsQueryKey = useMemo(
    () => ["candidate-cvs", candidateAccountId] as const,
    [candidateAccountId],
  );

  const profileQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMyCandidateProfile(session!.accessToken),
    queryKey: profileQueryKey,
  });

  const cvsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getAllCandidateCvs(session!.accessToken, session!.user.id),
    queryKey: cvsQueryKey,
  });

  const mutateProfile = useCallback(
    async <TResult>(action: (accessToken: string) => Promise<TResult>) => {
      if (!session) throw new Error("Candidate session is unavailable");

      const result = await action(session.accessToken);
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      return result;
    },
    [profileQueryKey, queryClient, session],
  );

  const mutateCvs = useCallback(
    async <TResult>(action: (accessToken: string) => Promise<TResult>) => {
      if (!session) throw new Error("Candidate session is unavailable");

      const result = await action(session.accessToken);
      await queryClient.invalidateQueries({ queryKey: cvsQueryKey });
      return result;
    },
    [cvsQueryKey, queryClient, session],
  );

  return {
    cvsQuery,
    isSessionResolved: session !== undefined,
    mutateCvs,
    mutateProfile,
    profileQuery,
    session: session ?? null,
  };
}
