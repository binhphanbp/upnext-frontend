"use client";

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { useMemo } from "react";

import {
  getJobPostApplications,
  getJobPostDetail,
  getJobPostViewStats,
  getRecruiterJobPosts,
  type RecruiterJobPostApiItem,
} from "@/features/recruiter/api/job-posts";
import { getRecruiterAccounts } from "@/features/recruiter/api/recruiter-accounts";
import {
  type RecruiterJobPost,
  type RecruiterJobPostsKpi,
  type RecruiterJobPostStatus,
  type RecruiterJobPostTab,
} from "@/features/recruiter/types";
import { env } from "@/shared/lib/env";

const recruiterAccountsQueryKey = ["recruiter-accounts"] as const;
const recruiterJobPostsQueryKey = (recruiterId: string) =>
  ["recruiter-job-posts", recruiterId] as const;
const recruiterJobPostStatsQueryKey = (recruiterId: string, jobIds: string[]) =>
  ["recruiter-job-post-stats", recruiterId, ...jobIds] as const;

export function useJobPostsPageData() {
  const companyId = env.NEXT_PUBLIC_RECRUITER_COMPANY_ID;

  const recruiterAccountsQuery = useQuery({
    queryKey: recruiterAccountsQueryKey,
    queryFn: getRecruiterAccounts,
  });

  const recruiterAccount = useMemo(() => {
    return (
      recruiterAccountsQuery.data?.items.find(
        (account) => account.companyId === companyId && account.status === "ACTIVE",
      ) ?? null
    );
  }, [companyId, recruiterAccountsQuery.data?.items]);

  const recruiterId = recruiterAccount?.id ?? null;

  const jobPostsQuery = useQuery({
    enabled: Boolean(recruiterId),
    queryKey: recruiterId
      ? recruiterJobPostsQueryKey(recruiterId)
      : ["recruiter-job-posts", "missing-recruiter"],
    queryFn: () => getRecruiterJobPosts(recruiterId as string),
  });

  const jobPostStatsQuery = useQuery({
    enabled: Boolean(recruiterId) && Boolean(jobPostsQuery.data?.length),
    queryKey: recruiterId
      ? recruiterJobPostStatsQueryKey(
          recruiterId,
          (jobPostsQuery.data ?? []).map((jobPost) => jobPost.id),
        )
      : ["recruiter-job-post-stats", "missing-recruiter"],
    queryFn: async () => {
      const jobPosts = jobPostsQuery.data ?? [];

      return Promise.all(
        jobPosts.map(async (jobPost) => {
          const [applicationsResponse, viewsResponse, detailResponse] = await Promise.all([
            getJobPostApplications(jobPost.id, recruiterId as string),
            getJobPostViewStats(jobPost.id, recruiterId as string),
            getJobPostDetail(jobPost.id),
          ]);

          return {
            applicationsCount: normalizeApplicationsCount(applicationsResponse),
            detail: detailResponse,
            jobPostId: jobPost.id,
            views: viewsResponse.views ?? 0,
          };
        }),
      );
    },
  });

  const jobPosts = useMemo(() => {
    const statsByJobId = new Map(
      (jobPostStatsQuery.data ?? []).map((stats) => [stats.jobPostId, stats]),
    );

    return (jobPostsQuery.data ?? []).map((jobPost) =>
      mapRecruiterJobPost(jobPost, statsByJobId.get(jobPost.id)),
    );
  }, [jobPostStatsQuery.data, jobPostsQuery.data]);

  const kpis = useMemo(() => buildJobPostsKpis(jobPosts), [jobPosts]);

  return {
    companyName: recruiterAccount?.company?.name ?? "Công ty tuyển dụng",
    error: recruiterAccountsQuery.error ?? jobPostsQuery.error ?? jobPostStatsQuery.error ?? null,
    isLoading:
      recruiterAccountsQuery.isLoading || jobPostsQuery.isLoading || jobPostStatsQuery.isLoading,
    jobPosts,
    kpis,
    recruiterId,
  };
}

function mapRecruiterJobPost(
  jobPost: RecruiterJobPostApiItem,
  stats?:
    | {
        applicationsCount: number;
        detail: Awaited<ReturnType<typeof getJobPostDetail>>;
        jobPostId: string;
        views: number;
      }
    | undefined,
): RecruiterJobPost {
  const applications = stats?.applicationsCount ?? 0;
  const views = stats?.views ?? 0;
  const conversionRate = views > 0 ? (applications / views) * 100 : null;
  const detail = stats?.detail;
  const daysLeft = getDaysLeft(jobPost.expiredAt);
  const status = mapJobPostStatus(jobPost.status, jobPost.moderationStatus, daysLeft);

  return {
    applications,
    companyName: detail?.company?.name ?? "Công ty tuyển dụng",
    conversionRate,
    daysLeft,
    effectiveness: getEffectiveness(applications, conversionRate, status),
    employmentType: jobPost.employmentType?.name ?? "-",
    experienceLevel: jobPost.experienceLevel?.name ?? "-",
    id: jobPost.id,
    locationSummary: buildLocationSummary(detail),
    moderationStatus: jobPost.moderationStatus,
    newCandidates: 0,
    publishedAt: jobPost.publishedAt,
    status,
    title: jobPost.title,
    updatedAt: jobPost.updatedAt,
    views,
  };
}

function buildLocationSummary(detail?: Awaited<ReturnType<typeof getJobPostDetail>>) {
  const location = detail?.jobPostLocations?.[0]?.jobLocation;

  if (!location) {
    return "-";
  }

  return [location.city, location.district, location.country].filter(Boolean).join(", ");
}

function getDaysLeft(expiredAt: string | null) {
  if (!expiredAt) {
    return null;
  }

  return differenceInCalendarDays(new Date(expiredAt), new Date());
}

function mapJobPostStatus(
  status: string,
  moderationStatus: string | null,
  daysLeft: number | null,
): RecruiterJobPostStatus {
  if (moderationStatus === "REJECTED" || moderationStatus === "BLOCKED") {
    return "locked";
  }

  if (status === "DRAFT") {
    return "draft";
  }

  if (moderationStatus === "PENDING" || moderationStatus === "IN_REVIEW") {
    return "pending";
  }

  if (status === "CLOSED" || (daysLeft !== null && daysLeft < 0)) {
    return "expired";
  }

  if (status === "PUBLISHED" && daysLeft !== null && daysLeft <= 7) {
    return "expiring";
  }

  return "active";
}

function getEffectiveness(
  applications: number,
  conversionRate: number | null,
  status: RecruiterJobPostStatus,
) {
  if (status === "pending" || status === "draft") {
    return "new";
  }

  if (conversionRate !== null && conversionRate >= 8) {
    return "good";
  }

  if (applications >= 1) {
    return "ok";
  }

  return "needsOptimization";
}

function buildJobPostsKpis(jobPosts: RecruiterJobPost[]): RecruiterJobPostsKpi[] {
  const total = jobPosts.length;
  const active = jobPosts.filter((jobPost) => jobPost.status === "active").length;
  const pending = jobPosts.filter((jobPost) => jobPost.status === "pending").length;
  const expiring = jobPosts.filter((jobPost) => jobPost.status === "expiring").length;
  const locked = jobPosts.filter((jobPost) => jobPost.status === "locked").length;

  return [
    {
      helper: "Tất cả tin tuyển dụng của bạn",
      label: "Tổng tin",
      tone: "blue",
      value: `${total}`,
    },
    {
      helper: "Đang hiển thị và nhận hồ sơ",
      label: "Đang tuyển",
      tone: "emerald",
      value: `${active}`,
    },
    {
      helper: "Đang chờ UpNext kiểm duyệt",
      label: "Chờ duyệt",
      tone: "orange",
      value: `${pending}`,
    },
    {
      helper: "Cần gia hạn trong 7 ngày tới",
      label: "Sắp hết hạn",
      tone: "rose",
      value: `${expiring}`,
    },
    {
      helper: "Tạm ngưng hiển thị",
      label: "Bị khóa",
      tone: "violet",
      value: `${locked}`,
    },
  ];
}

function normalizeApplicationsCount(response: unknown) {
  if (Array.isArray(response)) {
    return response.length;
  }

  if (
    typeof response === "object" &&
    response !== null &&
    "items" in response &&
    Array.isArray(response.items)
  ) {
    return response.items.length;
  }

  if (
    typeof response === "object" &&
    response !== null &&
    "total" in response &&
    typeof response.total === "number"
  ) {
    return response.total;
  }

  return 0;
}

export function filterRecruiterJobPosts(
  jobPosts: RecruiterJobPost[],
  filters: {
    effectiveness: "ALL" | "good" | "needsOptimization" | "new" | "ok";
    location: string;
    search: string;
    status: "ALL" | RecruiterJobPostStatus;
    tab: RecruiterJobPostTab;
  },
) {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const normalizedLocation = filters.location.trim().toLowerCase();

  return jobPosts.filter((jobPost) => {
    const searchMatch =
      normalizedSearch.length === 0 ||
      jobPost.title.toLowerCase().includes(normalizedSearch) ||
      jobPost.companyName.toLowerCase().includes(normalizedSearch);

    const statusMatch = filters.status === "ALL" || jobPost.status === filters.status;
    const tabMatch = filters.tab === "all" || jobPost.status === filters.tab;
    const locationMatch =
      normalizedLocation.length === 0 ||
      jobPost.locationSummary.toLowerCase().includes(normalizedLocation);
    const effectivenessMatch =
      filters.effectiveness === "ALL" || jobPost.effectiveness === filters.effectiveness;

    return searchMatch && statusMatch && tabMatch && locationMatch && effectivenessMatch;
  });
}
