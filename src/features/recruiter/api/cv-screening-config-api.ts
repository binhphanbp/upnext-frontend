import { recruiterApiRequest } from "@/features/recruiter/api/client";

export type WeightPreset = "FRESHER" | "MID" | "SENIOR" | "CUSTOM";

/** Points allocated to each rubric group. Multiples of 5, always totalling 100. */
export interface ScoringWeights {
  skills: number;
  experience: number;
  projects: number;
  education: number;
}

export interface CvScreeningConfig {
  scope: "COMPANY" | "JOB_POST";
  jobPostId: string | null;
  weights: ScoringWeights;
  weightPreset: WeightPreset | null;
  /** Deal-breakers. A miss is warned about, it does not veto the candidate. */
  mustHaveCriteria: string[];
  /** Bonus criteria, credited within the preferred-skills / domain items. */
  niceToHaveCriteria: string[];
  customPrompt: string | null;
  /** Final score (0-100) at or above which a candidate is "Đạt tiêu chuẩn". */
  passingScore: number | null;
  defaultTopN: number | null;
  /** For a job-scoped config: which fields still follow the company defaults. */
  inherited: Record<string, boolean>;
  updatedByAccountId: string | null;
  updatedAt: string | null;
}

export type UpdateCvScreeningConfigPayload = {
  weightSkills?: number;
  weightExperience?: number;
  weightProjects?: number;
  weightEducation?: number;
  weightPreset?: WeightPreset | null;
  mustHaveCriteria?: string[] | null;
  niceToHaveCriteria?: string[] | null;
  customPrompt?: string | null;
  passingScore?: number | null;
  defaultTopN?: number | null;
};

export function getCvScreeningConfig(token: string) {
  return recruiterApiRequest<CvScreeningConfig>("/recruiter/cv-screening/config", token);
}

export function updateCvScreeningConfig(payload: UpdateCvScreeningConfigPayload, token: string) {
  return recruiterApiRequest<CvScreeningConfig>("/recruiter/cv-screening/config", token, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export function getJobCvScreeningConfig(jobPostId: string, token: string) {
  return recruiterApiRequest<CvScreeningConfig>(
    `/recruiter/cv-screening/config/job/${jobPostId}`,
    token,
  );
}

export function updateJobCvScreeningConfig(
  jobPostId: string,
  payload: UpdateCvScreeningConfigPayload,
  token: string,
) {
  return recruiterApiRequest<CvScreeningConfig>(
    `/recruiter/cv-screening/config/job/${jobPostId}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    },
  );
}

/** Drops the job override so the job follows the company defaults again. */
export function resetJobCvScreeningConfig(jobPostId: string, token: string) {
  return recruiterApiRequest<CvScreeningConfig>(
    `/recruiter/cv-screening/config/job/${jobPostId}`,
    token,
    { method: "DELETE" },
  );
}
