import { apiRequest } from "@/shared/api/http";

export type AdminPermission = {
  id: string;
  permissionName: string;
  permissionCode: string;
  module: string;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminPermissions(token: string): Promise<AdminPermission[]> {
  return apiRequest<AdminPermission[]>("/admin/permissions", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
