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
