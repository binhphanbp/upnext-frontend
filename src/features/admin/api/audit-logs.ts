import { apiRequest } from "@/shared/api/http";

export type AdminAuditLogAdmin = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role?: {
    id: string;
    roleName: string;
    roleCode: string;
  } | null;
};

export type AdminAuditLogItem = {
  id: string;
  adminId: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
  admin: AdminAuditLogAdmin | null;
};

export type AdminAuditLogListResponse = {
  items: AdminAuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminAuditLogStats = {
  totalLogs: number;
  todayLogs: number;
  activeAdmins: number;
  topAction: string;
};

export type AdminAuditLogFilterOptions = {
  actions: string[];
  targetTypes: string[];
};

export type AdminAuditLogQuery = {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  action?: string | undefined;
  targetType?: string | undefined;
  adminId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  INVOICE_MANUAL_PAID: "Duyệt thanh toán tay",
  INVOICE_CANCELLED: "Hủy hóa đơn",
  APPROVE_JOB_POST: "Duyệt tin tuyển dụng",
  REJECT_JOB_POST: "Từ chối tin tuyển dụng",
  VERIFY_COMPANY: "Xác thực doanh nghiệp",
  REJECT_COMPANY_VERIFICATION: "Từ chối xác thực công ty",
  UPDATE_SYSTEM_CONFIG: "Cập nhật cấu hình",
  VIEW_USER_AUDIT: "Xem hồ sơ người dùng",
  CREATE_SUBSCRIPTION_PLAN: "Tạo gói dịch vụ",
  UPDATE_SUBSCRIPTION_PLAN: "Cập nhật gói dịch vụ",
  DELETE_SUBSCRIPTION_PLAN: "Xóa gói dịch vụ",
  CREATE_ADMIN_ACCOUNT: "Tạo tài khoản Admin",
  UPDATE_ADMIN_ACCOUNT: "Cập nhật tài khoản Admin",
  LOCK_ADMIN_ACCOUNT: "Khóa tài khoản Admin",
  UNLOCK_ADMIN_ACCOUNT: "Mở khóa tài khoản Admin",
  ASSIGN_ADMIN_ROLE: "Gán vai trò Admin",
  CREATE_ADMIN_ROLE: "Tạo vai trò mới",
  UPDATE_ADMIN_ROLE: "Cập nhật vai trò",
  DELETE_ADMIN_ROLE: "Xóa vai trò",
  ROLE_CREATED: "Tạo vai trò",
  ROLE_UPDATED: "Cập nhật vai trò",
  ROLE_DELETED: "Xóa vai trò",
};

export function formatAuditAction(action: string | null | undefined): string {
  if (!action) return "—";
  if (AUDIT_ACTION_LABELS[action]) {
    return AUDIT_ACTION_LABELS[action];
  }
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export const AUDIT_TARGET_LABELS: Record<string, string> = {
  INVOICE: "Hóa đơn",
  COMPANY: "Doanh nghiệp",
  JOB_POST: "Tin tuyển dụng",
  USER: "Người dùng",
  ADMIN_ACCOUNT: "Tài khoản Admin",
  SUBSCRIPTION_PLAN: "Gói dịch vụ",
  ROLE: "Vai trò phân quyền",
  SYSTEM: "Hệ thống",
};

export function formatAuditTarget(target: string | null | undefined): string {
  if (!target) return "Hệ thống";
  return AUDIT_TARGET_LABELS[target] || target;
}

export async function getAdminAuditLogs(
  query: AdminAuditLogQuery,
  token: string,
): Promise<AdminAuditLogListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.action && query.action !== "ALL") params.set("action", query.action);
  if (query.targetType && query.targetType !== "ALL") params.set("targetType", query.targetType);
  if (query.adminId) params.set("adminId", query.adminId);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const qs = params.toString();
  const url = `/admin/audit-logs${qs ? `?${qs}` : ""}`;

  return apiRequest<AdminAuditLogListResponse>(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function getAdminAuditLogStats(token: string): Promise<AdminAuditLogStats> {
  return apiRequest<AdminAuditLogStats>("/admin/audit-logs/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function getAdminAuditLogFilterOptions(
  token: string,
): Promise<AdminAuditLogFilterOptions> {
  return apiRequest<AdminAuditLogFilterOptions>("/admin/audit-logs/filter-options", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function getAdminAuditLogById(id: string, token: string): Promise<AdminAuditLogItem> {
  return apiRequest<AdminAuditLogItem>(`/admin/audit-logs/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
