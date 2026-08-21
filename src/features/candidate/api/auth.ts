import { apiRequest } from "@/shared/api/http";

import type { CandidateSession } from "../session";

export type CandidateLoginPayload = Readonly<{
  email: string;
  password: string;
}>;

export type CandidateRegisterPayload = Readonly<{
  fullName: string;
  email: string;
  password: string;
}>;

export type PasswordResetMessageResponse = Readonly<{
  message: string;
}>;

export function loginCandidate(payload: CandidateLoginPayload) {
  return apiRequest<CandidateSession>("/candidate/auth/login", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function registerCandidate(payload: CandidateRegisterPayload) {
  return apiRequest<CandidateSession>("/candidate/auth/register", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function requestCandidatePasswordReset(email: string, locale?: string) {
  return apiRequest<PasswordResetMessageResponse>("/candidate-accounts/password-reset/request", {
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
      ...(locale ? { "x-locale": locale } : {}),
    },
    method: "POST",
  });
}

export function confirmCandidatePasswordReset(payload: { token: string; password: string }) {
  return apiRequest<PasswordResetMessageResponse>("/candidate-accounts/password-reset/confirm", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export type CandidateEmailVerificationStatus = Readonly<{
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  message: string;
}>;

/** Gửi lại link xác thực bằng email — không cần đăng nhập (dùng khi mở link
 * xác thực trên thiết bị khác, hoặc từ trang hồ sơ khi email chưa xác thực). */
export function requestCandidateEmailVerification(email: string, locale?: string) {
  return apiRequest<CandidateEmailVerificationStatus>(
    "/candidate-accounts/email-verification/request-unauthenticated",
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

/** Chỉ đọc trạng thái, không gửi lại email — dùng để quyết định có hiện banner
 * "email chưa xác thực" trên hồ sơ ứng viên hay không. */
export function getCandidateEmailVerificationStatus(email: string) {
  return apiRequest<CandidateEmailVerificationStatus>(
    "/candidate-accounts/email-verification/status",
    {
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}

export function verifyCandidateEmail(token: string) {
  return apiRequest<{ email: string; emailVerified: boolean }>(
    "/candidate-accounts/email-verification/verify",
    {
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}
