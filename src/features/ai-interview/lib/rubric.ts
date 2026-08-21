import type { InterviewCompetency, InterviewLevel, ScoreDimensions } from "../types";

/** §8.4 — the fixed rubric. Weights are points, and they sum to 100. */
export const RUBRIC_DIMENSIONS = [
  { key: "technicalCorrectness", max: 40, labelKey: "rubric.technicalCorrectness" },
  { key: "relevance", max: 20, labelKey: "rubric.relevance" },
  { key: "depth", max: 15, labelKey: "rubric.depth" },
  { key: "clarity", max: 15, labelKey: "rubric.clarity" },
  { key: "practicalEvidence", max: 10, labelKey: "rubric.practicalEvidence" },
] as const satisfies readonly {
  key: keyof ScoreDimensions;
  max: number;
  labelKey: string;
}[];

export const COMPETENCY_LABEL_KEYS: Record<InterviewCompetency, string> = {
  fundamentals: "competency.fundamentals",
  database: "competency.database",
  api_design: "competency.apiDesign",
  system_design: "competency.systemDesign",
  testing: "competency.testing",
  problem_solving: "competency.problemSolving",
  behavioral: "competency.behavioral",
};

export const LEVEL_LABEL_KEYS: Record<InterviewLevel, string> = {
  INTERN: "level.intern",
  FRESHER: "level.fresher",
  JUNIOR: "level.junior",
  MIDDLE: "level.middle",
  SENIOR: "level.senior",
  LEAD: "level.lead",
};

export function sumDimensions(dimensions: ScoreDimensions): number {
  return RUBRIC_DIMENSIONS.reduce((total, dimension) => total + dimensions[dimension.key], 0);
}

/** Bands used for copy and colour. Never red — a low score is information. */
export function scoreBand(score: number): "strong" | "solid" | "developing" {
  if (score >= 80) return "strong";
  if (score >= 60) return "solid";
  return "developing";
}
