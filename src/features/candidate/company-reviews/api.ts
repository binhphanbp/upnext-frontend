import { apiRequest } from "@/shared/api/http";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function jsonAuthHeaders(token: string) {
  return { ...authHeaders(token), "Content-Type": "application/json" };
}

/** Một đánh giá = 1 số sao tổng thể + 1 ô nhận xét (`summary`). */
export type CandidateCompanyReview = Readonly<{
  id: string;
  candidateProfileId: string;
  companyId: string;
  overallRating: number;
  summary: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  createdAt: string;
  updatedAt: string;
}>;

export type CompanyReviewPayload = Readonly<{
  overallRating: number;
  summary?: string | undefined;
}>;

export function getMyCompanyReview(token: string, companyId: string) {
  return apiRequest<CandidateCompanyReview | null>(
    `/companies/${encodeURIComponent(companyId)}/reviews/me`,
    { headers: authHeaders(token) },
  );
}

export function createCompanyReview(
  token: string,
  companyId: string,
  payload: CompanyReviewPayload,
) {
  return apiRequest<CandidateCompanyReview>(`/companies/${encodeURIComponent(companyId)}/reviews`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateCompanyReview(
  token: string,
  reviewId: string,
  payload: CompanyReviewPayload,
) {
  return apiRequest<CandidateCompanyReview>(`/company-reviews/${reviewId}`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function deleteCompanyReview(token: string, reviewId: string) {
  return apiRequest<void>(`/company-reviews/${reviewId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}
