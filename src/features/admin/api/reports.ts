import { apiRequest } from "@/shared/api/http";

export type AdminReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
export type AdminReportTargetType =
  | "JOB_POST"
  | "COMPANY"
  | "CANDIDATE"
  | "USER"
  | "ARTICLE"
  | "COMMENT";

export interface AdminReportResponse {
  id: string;
  targetType: AdminReportTargetType;
  targetId: string;
  targetName?: string;
  reason: string;
  description?: string;
  status: AdminReportStatus;
  reporter?: {
    id: string;
    email: string;
    profile?: {
      fullName?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetAdminReportsParams {
  page?: number | undefined;
  limit?: number | undefined;
  q?: string | undefined;
  status?: string | undefined;
  targetType?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface AdminReportsPaginatedResponse {
  items: AdminReportResponse[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
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
    if (params.sortBy) searchParams.append("sortBy", String(params.sortBy));
    if (params.sortOrder) searchParams.append("sortOrder", String(params.sortOrder));
  }

  const query = searchParams.toString();
  const url = query ? `/admin/reports?${query}` : `/admin/reports`;

  return apiRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminReportDetails(
  token: string,
  id: string,
): Promise<AdminReportResponse> {
  return apiRequest(`/admin/reports/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminReportStatus(
  token: string,
  id: string,
  data: { status: AdminReportStatus },
): Promise<AdminReportResponse> {
  return apiRequest(`/admin/reports/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
