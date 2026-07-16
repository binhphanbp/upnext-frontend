import { useQuery } from "@tanstack/react-query";

import { getInterview, getRecruiterInterviews } from "../api/interviews";

export function useRecruiterInterviews(token: string | null, params?: { applicationId?: string }) {
  return useQuery({
    queryKey: ["recruiter", "interviews", params],
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return getRecruiterInterviews(token, params);
    },
    enabled: !!token,
  });
}

export function useRecruiterInterviewDetail(token: string | null, interviewId: string | null) {
  return useQuery({
    queryKey: ["recruiter", "interview", interviewId],
    queryFn: () => {
      if (!token || !interviewId) {
        throw new Error("Missing token or interview id");
      }
      return getInterview(interviewId, token);
    },
    enabled: !!token && !!interviewId,
  });
}
