import { authHeaders, jsonAuthHeaders } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type RunStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL_FAILED";

export interface RunCvScreeningPayload {
  jobPostId: string;
  limit: number;
  minScore: number;
}

export interface RunCvScreeningResponse {
  runId: string;
  status: RunStatus;
}

export interface CvScreeningRunResponse {
  id: string;
  status: RunStatus;
  totalApplications: number;
  processedCount: number;
  failedCount: number;
  limit: number;
  minScore: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface CvScreeningResultItem {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  finalScore: number;
  semanticScore: number;
  aiScore: number;
  skillScore: number;
  experienceScore: number;
  projectScore: number;
  educationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  recommendation: string;
  cvFileUrl?: string | null;
}

export interface ApplicationAiScoreResponse {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  finalScore: number;
  semanticScore: number;
  aiScore: number;
  skillScore: number;
  experienceScore: number;
  projectScore: number;
  educationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: string;
  cvFileUrl?: string | null;
}

export function runCvScreening(payload: RunCvScreeningPayload, token: string) {
  return apiRequest<RunCvScreeningResponse>("/recruiter/cv-screening/run", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
  });
}

export function getCvScreeningRun(runId: string, token: string) {
  return apiRequest<CvScreeningRunResponse>(`/recruiter/cv-screening/runs/${runId}`, {
    headers: authHeaders(token),
  });
}

export function getCvScreeningResults(runId: string, token: string) {
  return apiRequest<CvScreeningResultItem[]>(`/recruiter/cv-screening/runs/${runId}/results`, {
    headers: authHeaders(token),
  });
}

export function getApplicationAiScore(applicationId: string, token: string) {
  return apiRequest<ApplicationAiScoreResponse>(
    `/recruiter/applications/${applicationId}/ai-score`,
    {
      headers: authHeaders(token),
    },
  );
}

export function getApplicationCvUrl(applicationId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
  const slash = baseUrl.endsWith("/") ? "" : "/";
  return `${baseUrl}${slash}recruiter/applications/${applicationId}/cv`;
}
