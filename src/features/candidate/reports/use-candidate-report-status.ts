"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  checkCandidateReportStatus,
  type CandidateReportTargetType,
} from "@/features/candidate/reports/api";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

export function useCandidateReportStatus(
  targetType: CandidateReportTargetType,
  targetId: string | null | undefined,
) {
  const [session, setSession] = useState<CandidateSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getCandidateSession());
  }, []);

  const query = useQuery({
    enabled: Boolean(session && targetId),
    queryFn: () => checkCandidateReportStatus(targetType, targetId!, session!.accessToken),
    queryKey: ["candidate-report-status", targetType, targetId, session?.user?.id],
  });

  return {
    hasActiveReport: query.data?.hasActiveReport ?? false,
    isSessionResolved: session !== undefined,
    isLoading: query.isPending,
  };
}
