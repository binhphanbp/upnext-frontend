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
  createdAt: string;
  /** Reviews are attributed: the reviewer's name is shown, and nothing else from their profile. */
  reviewer: { id: string; fullName: string };
  /** This recruiter's own report on the review, if they have filed one. */
  myReport: MyCompanyReviewReport | null;
}>;

export type MyCompanyReviewsSummary = Readonly<{
  totalReviews: number;
  averageOverallRating: number | null;
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

export function reportCompanyReview(
  token: string,
  reviewId: string,
  reason: string,
  evidenceFileIds: string[] = [],
) {
  return apiRequest<{ id: string }>(`/company-reviews/${reviewId}/report`, {
    body: JSON.stringify(evidenceFileIds.length > 0 ? { reason, evidenceFileIds } : { reason }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

/** `REPORT_EVIDENCE` keeps the screenshot private — only admins ever open it. */
export function uploadReviewReportEvidence(files: File[], token: string) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  formData.append("purpose", "REPORT_EVIDENCE");
  formData.append("visibility", "PRIVATE");

  return apiRequest<{ files: Array<{ id: string }> }>("/files/upload-many", {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

/** Uploads the evidence images (if any) and returns their ids in the order given. */
export async function uploadReviewReportEvidenceIds(files: File[], token: string) {
  if (files.length === 0) return [];
  const { files: uploaded } = await uploadReviewReportEvidence(files, token);
  return uploaded.map((file) => file.id);
}
