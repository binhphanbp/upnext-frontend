import { authHeaders, jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type InterviewType = "ONLINE" | "ONSITE";
export type InterviewStatus = "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type InterviewResult = "PENDING" | "PASSED" | "FAILED" | "UNDER_REVIEW";
export type InterviewActorType = "CANDIDATE" | "RECRUITER" | "ADMIN" | "SYSTEM";

export type Interview = Readonly<{
  id: string;
  recruiterProfileId: string;
  applicationId: string;
  interviewRound: number;
  type: InterviewType;
  scheduledStartAt: string;
  scheduledEndAt: string;
  meetingUrl: string | null;
  recruiterNote: string | null;
  location: string | null;
  status: InterviewStatus;
  rescheduleCount: number;
  result: InterviewResult;
  maxRescheduleCount: number;
  candidateNote: string | null;
  calendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    status: string;
    jobPost: {
      id: string;
      title: string;
      company: { name: string };
    };
    candidateProfile: {
      phoneNumber: string | null;
      account: { fullName: string };
    };
  };
  recruiterProfile?: {
    fullName: string;
  };
}>;

export type InterviewLog = Readonly<{
  id: string;
  interviewId: string;
  oldStatus: InterviewStatus | null;
  newStatus: InterviewStatus;
  proposedStartAt: string | null;
  proposedEndAt: string | null;
  actorType: InterviewActorType;
  actorId: string | null;
  note: string | null;
  createdAt: string;
}>;

export type InterviewDetail = Interview &
  Readonly<{
    logs: InterviewLog[];
  }>;

export type CreateInterviewPayload = Readonly<{
  applicationId: string;
  recruiterProfileId?: string;
  interviewRound?: number;
  type?: InterviewType;
  scheduledStartAt: string;
  scheduledEndAt: string;
  meetingUrl?: string;
  location?: string;
  recruiterNote?: string;
  candidateNote?: string;
}>;

export type RescheduleInterviewPayload = Readonly<{
  scheduledStartAt: string;
  scheduledEndAt: string;
  note?: string;
}>;

export type CancelInterviewPayload = Readonly<{
  note: string;
}>;

export type UpdateInterviewResultPayload = Readonly<{
  result: InterviewResult;
  feedbackNote?: string;
}>;

export function getRecruiterInterviews(token: string, params?: { applicationId?: string }) {
  const query = new URLSearchParams();
  if (params?.applicationId) {
    query.set("applicationId", params.applicationId);
  }
  const queryStr = query.toString();

  return apiRequest<Interview[]>(`/interviews${queryStr ? `?${queryStr}` : ""}`, {
    headers: authHeaders(token),
  });
}

export function getInterview(interviewId: string, token: string) {
  return apiRequest<InterviewDetail>(`/interviews/${interviewId}`, {
    headers: authHeaders(token),
  });
}

export function createInterview(payload: CreateInterviewPayload, token: string) {
  return apiRequest<Interview>("/interviews", {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function rescheduleInterview(
  interviewId: string,
  payload: RescheduleInterviewPayload,
  token: string,
) {
  return apiRequest<Interview>(`/interviews/${interviewId}/reschedule`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function cancelInterview(
  interviewId: string,
  payload: CancelInterviewPayload,
  token: string,
) {
  return apiRequest<Interview>(`/interviews/${interviewId}/cancel`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function updateInterviewResult(
  interviewId: string,
  payload: UpdateInterviewResultPayload,
  token: string,
) {
  return apiRequest<Interview>(`/interviews/${interviewId}/result`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}
