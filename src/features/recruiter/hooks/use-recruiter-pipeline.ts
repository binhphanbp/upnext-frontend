import { useQuery } from "@tanstack/react-query";

import { getRecruiterPipeline } from "../api/pipeline";

export function useRecruiterPipeline(
  token: string | null,
  params?: {
    search?: string;
    jobPostId?: string;
    stageId?: string;
  },
) {
  return useQuery({
    queryKey: ["recruiter", "pipeline", params],
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return getRecruiterPipeline(token, params);
    },
    enabled: !!token,
  });
}
