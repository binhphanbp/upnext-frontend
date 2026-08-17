"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getMyCandidateApplications } from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";

/**
 * The jobs the signed-in candidate already has a live application for.
 *
 * Job cards outside the detail page had no idea about this, so a candidate who had just
 * applied still saw a plain "Ứng tuyển" button on every listing and could open the dialog
 * again. One request covers every card on the page; asking per card would be a request per
 * job. Withdrawn applications are left out on purpose — that job is open to them again.
 */
export function useAppliedJobIds() {
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const session = getCandidateSession();
    setCandidateId(session?.user.id ?? null);
    setToken(session?.accessToken ?? null);
  }, []);

  const { data } = useQuery({
    enabled: Boolean(token),
    // Shares its cache with the applications screen rather than adding a second source.
    queryKey: ["candidate-applications", candidateId],
    queryFn: () => getMyCandidateApplications(token!),
  });

  return useMemo(
    () =>
      new Set(
        (data ?? [])
          .filter((application) => application.status !== "WITHDRAWN")
          .map((application) => application.jobPostId),
      ),
    [data],
  );
}
