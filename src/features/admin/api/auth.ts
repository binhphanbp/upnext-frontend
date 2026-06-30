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

export function loginAdmin(payload: AdminLoginPayload) {
  return apiRequest<AdminLoginResponse>("/admin/auth/login", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}
