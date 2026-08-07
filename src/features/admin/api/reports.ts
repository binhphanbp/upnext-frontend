import { apiRequest } from "@/shared/api/http";

export type AdminReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

/** Values the backend actually writes to `Report.targetType`. */
export type AdminReportTargetType =
  | "JOB_POST"
  | "COMPANY"
  | "CANDIDATE"
  | "POST"
  | "COMPANY_REVIEW";

export type AdminReportReporterRole = "CANDIDATE" | "RECRUITER";

/**
 * `targetDetails` is resolved per `targetType`, so its shape varies. Only the fields the
 * table renders are declared; everything is optional because an already-deleted target
 * resolves to null.
 */
export interface AdminReportTargetDetails {
  id?: string;
  name?: string;
  title?: string;
  status?: string;
  overallRating?: number;
  summary?: string | null;
  company?: { id: string; name: string } | null;
  account?: { fullName?: string } | null;
}

export interface AdminReportResponse {
  id: string;
  reporterType: AdminReportReporterRole;
  targetType: AdminReportTargetType;
  targetId: string;
  reason: string;
  status: AdminReportStatus;
  createdAt: string;
  updatedAt: string;
  targetDetails?: AdminReportTargetDetails | null;
  reporterCandidate?: {
    id: string;
    account?: { fullName?: string; email?: string };
  } | null;
  reporterRecruiterAccount?: {
    id: string;
    email: string;
    company?: { id: string; name: string } | null;
  } | null;
  handledByAdmin?: { id: string; fullName: string; email: string } | null;
  evidenceFile?: { id: string; publicUrl: string | null } | null;
}

export interface GetAdminReportsParams {
  page?: number | undefined;
  limit?: number | undefined;
  q?: string | undefined;
  status?: string | undefined;
  targetType?: string | undefined;
  reporterRole?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface AdminReportsPaginatedResponse {
  items: AdminReportResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function getAdminReports(
  token: string,
  params?: GetAdminReportsParams,
): Promise<AdminReportsPaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.q) searchParams.append("q", String(params.q));
    if (params.status && params.status !== "all")
      searchParams.append("status", String(params.status));
    if (params.targetType && params.targetType !== "all")
      searchParams.append("targetType", String(params.targetType));
    if (params.reporterRole && params.reporterRole !== "all")
      searchParams.append("reporterRole", String(params.reporterRole));
    if (params.sortBy) searchParams.append("sortBy", String(params.sortBy));
    if (params.sortOrder) searchParams.append("sortOrder", String(params.sortOrder));
  }

  const query = searchParams.toString();
  const url = query ? `/admin/reports?${query}` : `/admin/reports`;

  return apiRequest(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminReportDetails(
  token: string,
  id: string,
): Promise<AdminReportResponse> {
  return apiRequest(`/admin/reports/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Resolving a COMPANY_REVIEW report is what hides that review, so this is also the
 * "hide review" action — there is no separate endpoint for it.
 */
export async function updateAdminReportStatus(
  token: string,
  id: string,
  data: { status: AdminReportStatus },
): Promise<AdminReportResponse> {
  return apiRequest(`/admin/reports/${id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
