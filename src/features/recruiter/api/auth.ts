import { apiRequest } from "@/shared/api/http";

const recruiterAuthBaseUrl = "http://localhost:3636/api/v1/recruiter/auth";
const recruiterPasswordResetBaseUrl =
  "http://localhost:3636/api/v1/recruiter-accounts/password-reset";

export type RecruiterAuthUser = Readonly<{
  id: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN" | "SYSTEM";
}>;

export type RecruiterLoginResponse = Readonly<{
  accessToken: string;
  tokenType: string;
  user: RecruiterAuthUser;
}>;

export type RecruiterLoginPayload = Readonly<{
  email: string;
  password: string;
}>;

export type RecruiterRegisterPayload = Readonly<{
  email: string;
  password: string;
}>;

export type PasswordResetMessageResponse = Readonly<{
  message: string;
}>;

export function loginRecruiter(payload: RecruiterLoginPayload) {
  return apiRequest<RecruiterLoginResponse>(`${recruiterAuthBaseUrl}/login`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function registerRecruiter(payload: RecruiterRegisterPayload) {
  return apiRequest<RecruiterLoginResponse>(`${recruiterAuthBaseUrl}/register`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function requestRecruiterPasswordReset(email: string) {
  return apiRequest<PasswordResetMessageResponse>(`${recruiterPasswordResetBaseUrl}/request`, {
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function confirmRecruiterPasswordReset(payload: { token: string; password: string }) {
  return apiRequest<PasswordResetMessageResponse>(`${recruiterPasswordResetBaseUrl}/confirm`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}
