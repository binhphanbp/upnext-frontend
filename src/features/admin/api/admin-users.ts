import { apiRequest } from "@/shared/api/http";

import type { AdminRole } from "./roles";

export type AdminAccount = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  roleId?: string | null;
  createdByAdminId?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: AdminRole | null;
  createdByAdmin?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
};

export type AdminAccountListResponse = {
  data: AdminAccount[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AdminAccountQueryParams = {
  page?: number | undefined;
  limit?: number | undefined;
  q?: string | undefined;
  roleId?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED" | undefined;
};

export type CreateAdminAccountPayload = {
  email: string;
  fullName: string;
  password: string;
  phone?: string | undefined;
  avatarUrl?: string | undefined;
  roleId?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED" | undefined;
};

export type UpdateAdminAccountPayload = {
  fullName?: string | undefined;
  phone?: string | undefined;
  avatarUrl?: string | undefined;
  roleId?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED" | undefined;
};

export async function getAdminAccounts(
  token: string,
  params: AdminAccountQueryParams = {},
): Promise<AdminAccountListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.q) searchParams.set("q", params.q.trim());
  if (params.roleId) searchParams.set("roleId", params.roleId);
  if (params.status) searchParams.set("status", params.status);

  const queryStr = searchParams.toString();
  const path = queryStr ? `/admin/admins?${queryStr}` : "/admin/admins";

  return apiRequest<AdminAccountListResponse>(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminAccount(token: string, id: string): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/admin/admins/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminAccount(
  token: string,
  payload: CreateAdminAccountPayload,
): Promise<AdminAccount> {
  return apiRequest<AdminAccount>("/admin/admins", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminAccount(
  token: string,
  id: string,
  payload: UpdateAdminAccountPayload,
): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/admin/admins/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function resetAdminPassword(
  token: string,
  id: string,
  newPassword: string,
): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/admin/admins/${id}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });
}

export async function lockAdminAccount(token: string, id: string): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/admin/admins/${id}/lock`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function unlockAdminAccount(token: string, id: string): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`/admin/admins/${id}/unlock`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteAdminAccount(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/admin/admins/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
