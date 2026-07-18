import { apiRequest } from "@/shared/api/http";

import type { TalentContactRequest } from "../types/contracts";

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export function getTalentContactRequests(token: string) {
  return apiRequest<{ data: TalentContactRequest[] }>("/talent-contact-requests", {
    headers: headers(token),
  });
}

export function createTalentContactRequest(
  token: string,
  input: {
    clientRequestId: string;
    candidateProfileId: string;
    jobPostId: string;
    introMessage: string;
  },
) {
  return apiRequest<{ data: TalentContactRequest }>("/talent-contact-requests", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(input),
  });
}

export function respondToTalentRequest(
  token: string,
  requestId: string,
  action: "accept" | "decline" | "block-company",
  input: { expectedVersion?: number; reasonCode?: string } = {},
) {
  return apiRequest<{ data: TalentContactRequest }>(
    `/talent-contact-requests/${requestId}/${action}`,
    { method: "POST", headers: headers(token), body: JSON.stringify(input) },
  );
}

export function updateContactPreference(
  token: string,
  input: { status: "OPTED_IN" | "OPTED_OUT"; consentVersion?: string },
) {
  return apiRequest("/candidate/contact-preference", {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(input),
  });
}

export function unblockCompany(token: string, companyId: string) {
  return apiRequest(`/candidate/contact-blocks/${companyId}`, {
    method: "DELETE",
    headers: headers(token),
  });
}

export function generateTalentRecommendations(token: string, jobPostId: string, limit = 30) {
  return apiRequest("/talent-recommendations/runs", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ jobPostId, limit }),
  });
}
