import { apiRequest } from "@/shared/api/http";

import type { LoginValues, RegisterValues } from "../schemas/auth-schema";

export type CandidateAuthUser = Readonly<{
  id: string;
  email: string;
  fullName: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN" | "SYSTEM";
}>;

export type CandidateAuthResponse = Readonly<{
  accessToken: string;
  tokenType: string;
  user: CandidateAuthUser;
}>;

export function loginCandidate(payload: LoginValues) {
  return apiRequest<CandidateAuthResponse>("/candidate/auth/login", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function registerCandidate(payload: Omit<RegisterValues, "confirm">) {
  return apiRequest<CandidateAuthResponse>("/candidate/auth/register", {
    body: JSON.stringify({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}
