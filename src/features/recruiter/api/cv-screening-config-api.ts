import { recruiterApiRequest } from "@/features/recruiter/api/client";

export interface CvScreeningConfig {
  /** Guidance for the "skills" rubric group (tối đa 40đ), appended to the AI prompt. */
  skillsInstructions: string | null;
  /** Guidance for the "experience" rubric group (tối đa 30đ). */
  experienceInstructions: string | null;
  /** Guidance for the "projects" rubric group (tối đa 20đ). */
  projectsInstructions: string | null;
  /** When true, every run scores education (tối đa 10đ) as if the job required none. */
  ignoreEducationRequirement: boolean;
  /** Default "Top N" shortlist size when a run omits `limit`. null = score everyone. */
  defaultTopN: 10 | 20 | 50 | null;
  /** Minimum embedding similarity score (0-100) a CV must clear to enter the shortlist. */
  minSimilarityScore: number | null;
  updatedByAccountId: string | null;
  updatedAt: string | null;
}

export type UpdateCvScreeningConfigPayload = Partial<
  Pick<
    CvScreeningConfig,
    | "skillsInstructions"
    | "experienceInstructions"
    | "projectsInstructions"
    | "ignoreEducationRequirement"
    | "defaultTopN"
    | "minSimilarityScore"
  >
>;

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
