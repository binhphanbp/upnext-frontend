import { authHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type RecruiterAnalyticsWindowDays = 7 | 30 | 90;

export type RecruiterAnalyticsFunnelStageKey =
  | "VIEWED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFERED"
  | "HIRED";

export type RecruiterAnalyticsFunnelStage = Readonly<{
  stage: RecruiterAnalyticsFunnelStageKey;
  count: number;
  conversionFromPrevious: number | null;
  conversionFromFirst: number | null;
}>;

export type RecruiterAnalyticsTimeSeriesPoint = Readonly<{
  date: string;
  views: number;
  applications: number;
  hires: number;
}>;

export type RecruiterAnalyticsJobRow = Readonly<{
  jobPostId: string;
  title: string;
  status: string;
  publishedAt: string | null;
  views: number;
  applications: number;
  viewToApplyRate: number | null;
  interviewing: number;
  offered: number;
  hired: number;
  applyToHireRate: number | null;
  avgTimeToHireDays: number | null;
}>;

export type RecruiterAnalyticsResponse = Readonly<{
  window: Readonly<{ days: RecruiterAnalyticsWindowDays; from: string; to: string }>;
  scope: Readonly<{
    jobPostId: string | null;
    job: Readonly<{
      id: string;
      title: string;
      status: string;
      moderationStatus: string;
      publishedAt: string | null;
      vacanciesCount: number;
    }> | null;
  }>;
  kpis: Readonly<{
    totalViews: number;
    totalApplications: number;
    interviewsScheduled: number;
    hires: number;
    timeToHireDays: Readonly<{ average: number | null; median: number | null; sampleSize: number }>;
  }>;
  funnel: Readonly<{ stages: readonly RecruiterAnalyticsFunnelStage[] }>;
  timeSeries: Readonly<{ points: readonly RecruiterAnalyticsTimeSeriesPoint[] }>;
  jobs: readonly RecruiterAnalyticsJobRow[] | null;
}>;

export function getRecruiterAnalytics(
  token: string,
  params: { windowDays: RecruiterAnalyticsWindowDays; jobPostId?: string | undefined },
) {
  const query = new URLSearchParams();
  query.set("windowDays", String(params.windowDays));
  if (params.jobPostId) query.set("jobPostId", params.jobPostId);

  return apiRequest<RecruiterAnalyticsResponse>(`/recruiter/analytics?${query.toString()}`, {
    headers: authHeaders(token),
  });
}
