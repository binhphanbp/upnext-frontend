import { apiRequest } from "@/shared/api/http";

export type RecruiterAuthUser = Readonly<{
  id: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN" | "SYSTEM";
}>;

export type RecruiterLoginResponse = Readonly<{
  accessToken: string;
  refreshToken: string;
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

export type RecruiterRegisterResponse = Readonly<{
  email: string;
  emailVerified: boolean;
  message: string;
}>;

export type PasswordResetMessageResponse = Readonly<{
  message: string;
}>;

export function loginRecruiter(payload: RecruiterLoginPayload) {
  return apiRequest<RecruiterLoginResponse>("/recruiter/auth/login", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function refreshRecruiter(refreshToken: string) {
  return apiRequest<RecruiterLoginResponse>("/recruiter/auth/refresh", {
    body: JSON.stringify({ refreshToken }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function registerRecruiter(payload: RecruiterRegisterPayload) {
  return apiRequest<RecruiterRegisterResponse>("/recruiter/auth/register", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function requestRecruiterPasswordReset(email: string, locale?: string) {
  return apiRequest<PasswordResetMessageResponse>("/recruiter-accounts/password-reset/request", {
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
      ...(locale ? { "x-locale": locale } : {}),
    },
    method: "POST",
  });
}

export function confirmRecruiterPasswordReset(payload: { token: string; password: string }) {
  return apiRequest<PasswordResetMessageResponse>("/recruiter-accounts/password-reset/confirm", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function requestRecruiterEmailVerification(email: string, locale?: string) {
  return apiRequest<{ message: string }>(
    "/recruiter-accounts/email-verification/request-unauthenticated",
    {
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
        ...(locale ? { "x-locale": locale } : {}),
      },
      method: "POST",
    },
  );
}

export function verifyRecruiterEmail(token: string) {
  return apiRequest<{ email: string; emailVerified: boolean }>(
    "/recruiter-accounts/email-verification/verify",
    {
      body: JSON.stringify({ token }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
}
