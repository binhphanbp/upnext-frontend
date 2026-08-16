import { authHeaders, jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type ReputationActivity = Readonly<{
  id: string;
  companyId: string;
  actionType: string;
  score: string;
  reason: string | null;
  createdAt: string;
  byAdmin?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}>;

export function getReputationActivities(companyId: string, token: string) {
  return apiRequest<ReputationActivity[]>(`/companies/${companyId}/reputation-activities`, {
    headers: authHeaders(token),
  });
}

export type Appeal = Readonly<{
  id: string;
  targetType: string;
  targetId: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}>;

export type CreateAppealPayload = Readonly<{
  content: string;
  evidenceFileId?: string;
}>;

export function createAppeal(payload: CreateAppealPayload, token: string) {
  return apiRequest<Appeal>("/appeals", {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function getMyAppeals(token: string) {
  return apiRequest<Appeal[]>("/appeals", {
    headers: authHeaders(token),
  });
}

export type HiringResultReport = Readonly<{
  id: string;
  jobPostId: string;
  totalHired: number;
  totalApplications: number;
  note: string | null;
  submittedAt: string;
}>;

export type SubmitHiringReportPayload = Readonly<{
  totalHired: number;
  totalApplications: number;
  note?: string;
}>;

export function submitHiringReport(
  jobPostId: string,
  payload: SubmitHiringReportPayload,
  token: string,
) {
  return apiRequest<HiringResultReport>(`/job-posts/${jobPostId}/hiring-report`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function getHiringReport(jobPostId: string, token: string) {
  return apiRequest<HiringResultReport | null>(`/job-posts/${jobPostId}/hiring-report`, {
    headers: authHeaders(token),
  });
}
