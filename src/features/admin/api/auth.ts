import { apiRequest } from "@/shared/api/http";

export type AdminAuthUser = Readonly<{
  id: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN" | "SYSTEM";
}>;

export type AdminLoginResponse = Readonly<{
  accessToken: string;
  tokenType: string;
  user: AdminAuthUser;
}>;

export type AdminLoginPayload = Readonly<{
  email: string;
  password: string;
}>;

export type AdminProfileResponse = {
  data: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    status: "ACTIVE" | "INACTIVE" | "LOCKED";
    lastLoginAt?: string | null;
    role?: {
      id: string;
      roleCode: string;
      roleName: string;
      description?: string | null;
      isSystem: boolean;
      status: "ACTIVE" | "INACTIVE";
    } | null;
    permissions: string[];
  };
};

export function loginAdmin(payload: AdminLoginPayload) {
  return apiRequest<AdminLoginResponse>("/admin/auth/login", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function getCurrentAdminProfile(token: string) {
  return apiRequest<AdminProfileResponse>("/admin/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
