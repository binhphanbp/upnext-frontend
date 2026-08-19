import { authHeaders, jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

/**
 * "Ứng viên tiềm năng" của recruiter: ứng viên đã nộp đơn được đánh dấu lưu lại để
 * xem lại sau, độc lập với trạng thái pipeline (SUBMITTED/VIEWED/.../HIRED) của
 * đơn ứng tuyển. Khớp model RecruiterCandidateShortlist ở backend.
 */
export type ShortlistEntry = Readonly<{
  id: string;
  candidateProfileId: string;
  jobPostId: string | null;
  priority: number;
  note: string | null;
  createdAt: string;
}>;

export function getRecruiterShortlist(token: string) {
  return apiRequest<ShortlistEntry[]>("/recruiter/shortlists", {
    headers: authHeaders(token),
  });
}

export function addToShortlist(
  token: string,
  input: {
    candidateProfileId: string;
    jobPostId?: string | undefined;
    note?: string | undefined;
    priority?: number | undefined;
  },
) {
  return apiRequest<ShortlistEntry>("/recruiter/shortlists", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(input),
  });
}

export function removeFromShortlist(token: string, shortlistId: string) {
  return apiRequest<void>(`/recruiter/shortlists/${shortlistId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
