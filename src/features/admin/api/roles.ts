import { apiRequest } from "@/shared/api/http";

import type { AdminPermission } from "./permissions";

export type AdminRolePermissionRelation = {
  id: string;
  roleId: string;
  permissionId: string;
  permission: AdminPermission;
};

export type AdminRole = {
  id: string;
  roleCode: string;
  roleName: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  isSystem: boolean;
  adminsCount: number;
  permissionsCount: number;
  rolePermissions: AdminRolePermissionRelation[];
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminRolePayload = {
  roleCode?: string | undefined;
  roleName: string;
  description?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | undefined;
  permissionIds?: string[] | undefined;
};

export type UpdateAdminRolePayload = {
  roleName?: string | undefined;
  description?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | undefined;
};

export async function getAdminRoles(token: string): Promise<AdminRole[]> {
  return apiRequest<AdminRole[]>("/admin/roles", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRole(token: string, id: string): Promise<AdminRole> {
  return apiRequest<AdminRole>(`/admin/roles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminRole(
  token: string,
  payload: CreateAdminRolePayload,
): Promise<AdminRole> {
  return apiRequest<AdminRole>("/admin/roles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminRole(
  token: string,
  id: string,
  payload: UpdateAdminRolePayload,
): Promise<AdminRole> {
  return apiRequest<AdminRole>(`/admin/roles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminRole(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/admin/roles/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function syncRolePermissions(
  token: string,
  roleId: string,
  permissionIds: string[],
): Promise<AdminRole> {
  return apiRequest<AdminRole>(`/admin/roles/${roleId}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permissionIds }),
  });
}
