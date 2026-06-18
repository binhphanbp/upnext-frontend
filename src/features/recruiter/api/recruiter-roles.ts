import { apiRequest } from "@/shared/api/http";

export type RecruiterRoleApiItem = {
  code: string;
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  rolePermissions?: Array<{
    permission?: {
      code?: string;
      description?: string | null;
      id: string;
      name?: string;
    } | null;
  }> | null;
  updatedAt: string;
};

export function getRecruiterRoles() {
  return apiRequest<RecruiterRoleApiItem[]>("/recruiter-roles");
}
