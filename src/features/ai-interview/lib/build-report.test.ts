import { describe, expect, it } from "vitest";

import { initialQuestionScore, SCRIPTED_TURNS } from "../api/mock-session";
import type { InterviewSetup, QuestionScore } from "../types";
import { buildReport } from "./build-report";
import { sumDimensions } from "./rubric";

const setup: InterviewSetup = {
  mode: "voice",
  jobId: "job-kyber",
  jobTitle: "Backend Developer — Kyber Tech",
  level: "JUNIOR",
  questionCount: 5,
  difficulty: "medium",
  competencies: [],
  useLiveCapture: false,
  cameraEnabled: false,
};

function scores(count: number): QuestionScore[] {
  return SCRIPTED_TURNS.slice(0, count).map((turn) => initialQuestionScore(turn));
}

describe("buildReport", () => {
  it("averages the per-question scores", () => {
    const input = scores(5);
    const report = buildReport("s1", setup, input, 1_200, "2026-07-31T09:00:00.000Z");
    const expected = Math.round(
      input.reduce((total, score) => total + score.score, 0) / input.length,
    );
    expect(report.overallScore).toBe(expected);
  });

  it("orders competencies weakest first, so the report leads with the gap", () => {
    const report = buildReport("s1", setup, scores(5), 1_200, "2026-07-31T09:00:00.000Z");
    const values = report.competencyScores.map((entry) => entry.score);
    expect(values).toEqual([...values].sort((left, right) => left - right));
  });

  it("returns a zeroed report rather than NaN when every question was skipped", () => {
    const report = buildReport("s1", setup, [], 60, "2026-07-31T09:00:00.000Z");
    expect(report.overallScore).toBe(0);
    expect(report.competencyScores).toEqual([]);
    expect(Number.isFinite(report.delivery.wpm)).toBe(true);
  });

  it("keeps a partial session usable when the candidate ends early", () => {
    const report = buildReport("s1", setup, scores(2), 300, "2026-07-31T09:00:00.000Z");
    expect(report.questionScores).toHaveLength(2);
    expect(report.overallScore).toBeGreaterThan(0);
  });
});

describe("rubric fixtures", () => {
  it("every scripted score's dimensions add up to its headline score", () => {
    for (const turn of SCRIPTED_TURNS) {
      expect(sumDimensions(turn.score.dimensions), turn.question.id).toBe(turn.score.score);
    }
  });

  it("question indices are contiguous and share one total", () => {
    SCRIPTED_TURNS.forEach((turn, index) => {
      expect(turn.question.index).toBe(index + 1);
      expect(turn.question.total).toBe(SCRIPTED_TURNS.length);
    });
  });
});
