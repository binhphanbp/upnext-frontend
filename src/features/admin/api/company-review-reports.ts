import { apiRequest } from "@/shared/api/http";

export type AdminCompanyReviewReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export interface AdminCompanyReviewReport {
  id: string;
  reason: string;
  status: AdminCompanyReviewReportStatus;
  createdAt: string;
  companyReview: {
    id: string;
    overallRating: number;
    summary: string | null;
    company: {
      id: string;
      name: string;
    };
  };
  reporterRecruiterAccount: {
    id: string;
    email: string;
  };
}

export interface GetAdminCompanyReviewReportsParams {
  page?: number | undefined;
  limit?: number | undefined;
  status?: AdminCompanyReviewReportStatus | undefined;
}

export interface AdminCompanyReviewReportsResponse {
  items: AdminCompanyReviewReport[];
  total: number;
  page: number;
  limit: number;
}

export function getAdminCompanyReviewReports(
  token: string,
  params: GetAdminCompanyReviewReportsParams = {},
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiRequest<AdminCompanyReviewReportsResponse>(
    `/admin/company-review-reports${query ? `?${query}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export function hideReportedCompanyReview(token: string, reportId: string) {
  return apiRequest<AdminCompanyReviewReport>(
    `/admin/company-review-reports/${reportId}/hide-review`,
    {
      headers: { Authorization: `Bearer ${token}` },
      method: "PATCH",
    },
  );
}

export function dismissCompanyReviewReport(token: string, reportId: string) {
  return apiRequest<AdminCompanyReviewReport>(`/admin/company-review-reports/${reportId}/dismiss`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "PATCH",
  });
}
