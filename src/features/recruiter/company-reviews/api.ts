import { authHeaders, jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type CompanyReviewReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export type MyCompanyReviewReport = Readonly<{
  id: string;
  status: CompanyReviewReportStatus;
  reason: string;
  createdAt: string;
}>;

export type MyCompanyReview = Readonly<{
  id: string;
  overallRating: number;
  summary: string | null;
  overtimeSatisfaction: number | null;
  overtimeReason: string | null;
  whatILove: string | null;
  improvementSuggestion: string | null;
  salaryBenefitsRating: number | null;
  trainingLearningRating: number | null;
  managementCareRating: number | null;
  cultureFunRating: number | null;
  officeWorkspaceRating: number | null;
  createdAt: string;
  /** This recruiter's own report on the review, if they have filed one. */
  myReport: MyCompanyReviewReport | null;
}>;

export type MyCompanyReviewsSummary = Readonly<{
  totalReviews: number;
  averageOverallRating: number | null;
  averageBySection: Readonly<{
    salaryBenefits: number | null;
    trainingLearning: number | null;
    managementCare: number | null;
    cultureFun: number | null;
    officeWorkspace: number | null;
    overtimeSatisfaction: number | null;
  }>;
  /** Count of reviews per star, keyed "1".."5". */
  ratingDistribution: Readonly<Record<string, number>>;
}>;

export type MyCompanyReviewsResponse = Readonly<{
  items: MyCompanyReview[];
  summary: MyCompanyReviewsSummary;
  meta: { page: number; limit: number; total: number; totalPages: number };
}>;

export type MyCompanyReviewsParams = {
  page?: number | undefined;
  limit?: number | undefined;
  overallRating?: number | undefined;
};

export function getMyCompanyReviews(token: string, params: MyCompanyReviewsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.overallRating) searchParams.set("overallRating", String(params.overallRating));

  const query = searchParams.toString();
  return apiRequest<MyCompanyReviewsResponse>(
    `/company-reviews/my-company${query ? `?${query}` : ""}`,
    { headers: authHeaders(token) },
  );
}

export function reportCompanyReview(token: string, reviewId: string, reason: string) {
  return apiRequest<{ id: string }>(`/company-reviews/${reviewId}/report`, {
    body: JSON.stringify({ reason }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}
