"use client";

import { useQuery } from "@tanstack/react-query";

import { getPublicJobDetail } from "./api";

/**
 * The homepage aggregate deliberately excludes verbose job descriptions. Load
 * one detail only after a candidate asks to preview that specific job, then
 * retain it briefly for subsequent hover/focus interactions.
 */
export function useJobPreviewDetail(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ["public-job-preview", jobId],
    queryFn: () => getPublicJobDetail(jobId!),
    enabled: Boolean(jobId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
