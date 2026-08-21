"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { env } from "@/shared/lib/env";

import { findCopilotQuota, getCandidateSubscription } from "../api/candidate-subscription-api";
import { useCopilotSession } from "./use-copilot-session";

export const AI_COPILOT_QUOTA_QUERY_KEY = ["candidate-subscription", "me"] as const;

/**
 * Reads a server-authoritative allowance only when the live Copilot transport
 * is active. Mock mode deliberately has no fictional plan or quota UI.
 *
 * An unavailable usage endpoint must not lock a candidate out of the assistant:
 * the backend remains the final atomic quota guard when a message is sent.
 */
export function useAiCopilotQuota() {
  const queryClient = useQueryClient();
  const { isSignedIn, isSessionResolved } = useCopilotSession();
  const enabled = isSessionResolved && isSignedIn && env.NEXT_PUBLIC_AI_COPILOT_SOURCE === "api";
  const query = useQuery({
    queryKey: AI_COPILOT_QUOTA_QUERY_KEY,
    queryFn: getCandidateSubscription,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
  const quota = findCopilotQuota(query.data);
  const isExhausted = Boolean(
    quota?.enabled && quota.limit !== null && quota.remaining !== null && quota.remaining <= 0,
  );

  const refresh = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: AI_COPILOT_QUOTA_QUERY_KEY });
  }, [enabled, queryClient]);

  return {
    ...query,
    enabled,
    quota,
    isExhausted,
    refresh,
  };
}
