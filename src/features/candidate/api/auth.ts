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
