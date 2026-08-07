import { authHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type CandidateFunnelStatus =
  | "SUBMITTED"
  | "VIEWED"
  | "CONSIDERING"
  | "SHORTLISTED"
  | "INTERVIEWING"
  | "OFFERED"
  | "HIRED";

export type CandidateAiScoreBucket = "excellent" | "good" | "average" | "low" | "unscored";

export type RecentApplication = Readonly<{
  id: string;
  status: string;
  submittedAt: string;
  viewedAt: string | null;
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string;
  jobPostId: string;
  jobPostTitle: string;
  aiScore: number | null;
}>;

export type RecruiterCandidateSummary = Readonly<{
  totals: Readonly<{
    total: number;
    unviewed: number;
    newLast7Days: number;
    staleOver7Days: number;
    upcomingInterviews: number;
    staleThresholdDays: number;
  }>;
  funnel: ReadonlyArray<Readonly<{ status: CandidateFunnelStatus; count: number }>>;
  byStatus: Readonly<Record<string, number>>;
  aiScoreBuckets: Readonly<Record<CandidateAiScoreBucket, number>>;
  recentApplications: readonly RecentApplication[];
}>;

export function getRecruiterCandidateSummary(token: string) {
  return apiRequest<RecruiterCandidateSummary>("/recruiter/candidate-summary", {
    headers: authHeaders(token),
  });
}
