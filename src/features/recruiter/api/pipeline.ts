import { apiRequest } from "@/shared/api/http";

import { authHeaders } from "./client";
import { updateApplicationStatus } from "./team";

export type PipelineStageId =
  | "applied"
  | "screening"
  | "technical_test"
  | "interview"
  | "offering"
  | "hired"
  | "rejected";

export type PipelineCandidate = {
  id: string;
  applicationId: string;
  candidateId: string;
  name: string;
  role: string;
  stageId: PipelineStageId;
  avatarUrl?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  techStack: string[];
  scores?: {
    label: string;
    value: number;
    maxValue: number;
  }[];
  lastUpdatedAt: string;
  interview?: {
    id: string;
    scheduledAt: string;
    interviewerName?: string | null;
    mode?: string | null;
  } | null;
};

export type RecruiterPipelineResponse = {
  stages: {
    id: PipelineStageId;
    title: string;
    description: string;
  }[];
  candidates: PipelineCandidate[];
  metrics: {
    totalCandidates: number;
    inInterview: number;
    offersSent: number;
    passRate: number;
  };
};

export function getRecruiterPipeline(
  token: string,
  params?: {
    search?: string;
    jobPostId?: string;
    stageId?: string;
  },
): Promise<RecruiterPipelineResponse> {
  const queryParams = new URLSearchParams();
  if (params?.search) {
    queryParams.set("search", params.search);
  }
  if (params?.jobPostId && params.jobPostId !== "all") {
    queryParams.set("jobPostId", params.jobPostId);
  }
  if (params?.stageId) {
    queryParams.set("stageId", params.stageId);
  }

  const queryStr = queryParams.toString();
  const path = `/recruiter/pipeline${queryStr ? `?${queryStr}` : ""}`;

  return apiRequest<RecruiterPipelineResponse>(path, {
    headers: authHeaders(token),
  });
}

export function updatePipelineCandidateStage(
  applicationId: string,
  stageId: PipelineStageId,
  token: string,
) {
  const stageToStatusMap: Record<PipelineStageId, string> = {
    applied: "SUBMITTED",
    screening: "VIEWED",
    technical_test: "SHORTLISTED",
    interview: "INTERVIEWING",
    offering: "OFFERED",
    hired: "HIRED",
    rejected: "REJECTED",
  };
  const status = stageToStatusMap[stageId] || "SUBMITTED";
  return updateApplicationStatus(applicationId, status, token);
}
