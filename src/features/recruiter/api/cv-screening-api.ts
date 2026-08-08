import { recruiterApiRequest } from "@/features/recruiter/api/client";

export type RunStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL_FAILED";

export interface RunCvScreeningPayload {
  jobPostId: string;
  /** Optional cost cap. Omit to score every application on the job post. */
  limit?: number;
}

export interface RunCvScreeningResponse {
  runId: string;
  status: RunStatus;
}

export interface CvScreeningRunResponse {
  id: string;
  status: RunStatus;
  /** Number of applications this run will score -- the progress denominator. */
  totalApplications: number;
  processedCount: number;
  failedCount: number;
  limit: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface CvScreeningResultItem {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  finalScore: number;
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
export type EducationLevel = "HIGH_SCHOOL" | "VOCATIONAL" | "COLLEGE" | "BACHELOR" | "POSTGRADUATE";

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
  evidence: string | null;
  candidateEducationLevel?: EducationLevel | null;
  requiredEducationLevel?: EducationLevel | null;
  difference?: number | null;
}

export interface ScoreCriterionBreakdown {
  key: ScoreCriterionKey;
  summary: string;
  items: ScoreBreakdownItem[];
}

export interface ApplicationAiScoreResponse {
  applicationId: string;
  status?: string | null;
  candidateName: string;
  jobTitle: string;
  finalScore: number;
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

export function getCvVersionDownloadUrl(cvVersionId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
  const slash = baseUrl.endsWith("/") ? "" : "/";
  return `${baseUrl}${slash}cv-versions/${cvVersionId}/download`;
}

export function getApplicationCvUrl(applicationId: string, cvVersionId?: string) {
  if (cvVersionId) {
    return getCvVersionDownloadUrl(cvVersionId);
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
  const slash = baseUrl.endsWith("/") ? "" : "/";
  return `${baseUrl}${slash}cv-versions/${applicationId}/download`;
}
