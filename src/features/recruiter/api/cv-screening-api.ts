import { recruiterApiRequest } from "@/features/recruiter/api/client";

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
  skillMatchScore: number;
  retrievalScore: number;
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

export type ScoreCriterionKey = "skills" | "experience" | "projects" | "education";

export interface EvaluationRubricItem {
  key: string;
  label: string;
  maxScore: number;
  description: string;
}

export interface EvaluationRubricCriterion {
  key: ScoreCriterionKey;
  label: string;
  maxScore: number;
  criteria: EvaluationRubricItem[];
}

export interface ScoreBreakdownItem {
  key: string;
  awardedScore: number;
  reason: string;
  evidence: string;
}

export interface ScoreCriterionBreakdown {
  key: ScoreCriterionKey;
  summary: string;
  items: ScoreBreakdownItem[];
}

export interface ApplicationAiScoreResponse {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  finalScore: number;
  semanticScore: number;
  skillMatchScore: number;
  retrievalScore: number;
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
  criteriaBreakdown: ScoreCriterionBreakdown[];
  evaluationRubric: EvaluationRubricCriterion[];
  cvFileUrl?: string | null;
}

export function runCvScreening(payload: RunCvScreeningPayload, token: string) {
  return recruiterApiRequest<RunCvScreeningResponse>("/recruiter/cv-screening/run", token, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export function getCvScreeningRun(runId: string, token: string) {
  return recruiterApiRequest<CvScreeningRunResponse>(
    `/recruiter/cv-screening/runs/${runId}`,
    token,
  );
}

export function getCvScreeningResults(runId: string, token: string) {
  return recruiterApiRequest<CvScreeningResultItem[]>(
    `/recruiter/cv-screening/runs/${runId}/results`,
    token,
  );
}

export function getApplicationAiScore(applicationId: string, token: string) {
  return recruiterApiRequest<ApplicationAiScoreResponse>(
    `/recruiter/applications/${applicationId}/ai-score`,
    token,
  );
}

export function getApplicationCvUrl(applicationId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
  const slash = baseUrl.endsWith("/") ? "" : "/";
  return `${baseUrl}${slash}recruiter/applications/${applicationId}/cv`;
}
