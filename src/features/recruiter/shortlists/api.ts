import { authHeaders, jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type ShortlistStatus = "ACTIVE" | "ARCHIVED";

export type ShortlistEntry = Readonly<{
  id: string;
  priority: number;
  status: ShortlistStatus;
  note: string | null;
  createdAt: string;
  /** The posting the candidate was saved from, when there was one. */
  jobPost: { id: string; title: string } | null;
  /** Who on the team saved this candidate. */
  recruiterAccount: { id: string; email: string; profile: { fullName: string } | null };
  candidateProfile: {
    id: string;
    description: string | null;
    preferredSearchCity: string | null;
    jobSearchStatus: string;
    account: { id: string; fullName: string; email: string };
  };
  /** Null means no CV, so this candidate cannot be scheduled yet. */
  latestCv: { id: string; title: string } | null;
}>;

export type ShortlistResponse = Readonly<{
  items: ShortlistEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}>;

export type ShortlistParams = {
  page?: number | undefined;
  limit?: number | undefined;
  q?: string | undefined;
  mine?: boolean | undefined;
  status?: ShortlistStatus | undefined;
  jobPostId?: string | undefined;
};

export function getShortlist(token: string, params: ShortlistParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.q) query.set("q", params.q);
  if (params.mine) query.set("mine", "true");
  if (params.status) query.set("status", params.status);
  if (params.jobPostId) query.set("jobPostId", params.jobPostId);

  const queryString = query.toString();
  return apiRequest<ShortlistResponse>(
    `/recruiter/shortlists${queryString ? `?${queryString}` : ""}`,
    { headers: authHeaders(token) },
  );
}

export function addToShortlist(
  token: string,
  payload: { candidateProfileId: string; jobPostId?: string; note?: string; priority?: number },
) {
  return apiRequest<ShortlistEntry>("/recruiter/shortlists", {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateShortlistEntry(
  token: string,
  id: string,
  payload: { note?: string; priority?: number; status?: ShortlistStatus },
) {
  return apiRequest<ShortlistEntry>(`/recruiter/shortlists/${id}`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function removeFromShortlist(token: string, id: string) {
  return apiRequest<void>(`/recruiter/shortlists/${id}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export type BatchSchedulingMode = "SEQUENTIAL" | "SAME_SLOT";

export type BatchInterviewPayload = Readonly<{
  jobPostId: string;
  candidateProfileIds: string[];
  startAt: string;
  durationMinutes: number;
  gapMinutes?: number;
  mode?: BatchSchedulingMode;
  interviewRound?: number;
  type?: "ONLINE" | "ONSITE";
  meetingUrl?: string;
  location?: string;
  recruiterNote?: string;
  candidateNote?: string;
}>;

export type BatchInterviewResponse = Readonly<{
  /** One entry per candidate: the request succeeds even when individual rows fail. */
  results: Array<{
    candidateProfileId: string;
    scheduled: boolean;
    interviewId?: string;
    scheduledStartAt?: string;
    invitedApplicationCreated?: boolean;
    error?: string;
  }>;
  summary: { requested: number; scheduled: number; failed: number };
}>;

export function createBatchInterviews(token: string, payload: BatchInterviewPayload) {
  return apiRequest<BatchInterviewResponse>("/interviews/batch", {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}
