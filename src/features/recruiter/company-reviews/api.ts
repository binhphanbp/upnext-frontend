import { jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export function reportCompanyReview(token: string, reviewId: string, reason: string) {
  return apiRequest<{ id: string }>(`/company-reviews/${reviewId}/report`, {
    body: JSON.stringify({ reason }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}
