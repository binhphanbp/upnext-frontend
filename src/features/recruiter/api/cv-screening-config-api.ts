import { recruiterApiRequest } from "@/features/recruiter/api/client";

export interface CvScreeningConfig {
  /** Free-text guidance appended to the AI scoring prompt. null = none set. */
  customInstructions: string | null;
  /** Default "Top N" shortlist size when a run omits `limit`. null = score everyone. */
  defaultTopN: 10 | 20 | 50 | null;
  /** Minimum embedding similarity score (0-100) a CV must clear to enter the shortlist. */
  minSimilarityScore: number | null;
  updatedByAccountId: string | null;
  updatedAt: string | null;
}

export type UpdateCvScreeningConfigPayload = Partial<
  Pick<CvScreeningConfig, "customInstructions" | "defaultTopN" | "minSimilarityScore">
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
