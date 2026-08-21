import { REPORT_SUMMARY, SCRIPTED_TURNS } from "../api/mock-session";
import type {
  DeliverySignals,
  InterviewCompetency,
  InterviewReport,
  InterviewSetup,
  QuestionScore,
  ScoreDimensions,
} from "../types";
import { RUBRIC_DIMENSIONS } from "./rubric";

function averageDimensions(scores: QuestionScore[]): ScoreDimensions {
  const empty: ScoreDimensions = {
    technicalCorrectness: 0,
    relevance: 0,
    depth: 0,
    clarity: 0,
    practicalEvidence: 0,
  };
  if (scores.length === 0) return empty;

  const totals = scores.reduce<ScoreDimensions>(
    (accumulator, score) => {
      for (const dimension of RUBRIC_DIMENSIONS) {
        accumulator[dimension.key] += score.dimensions[dimension.key];
      }
      return accumulator;
    },
    { ...empty },
  );

  for (const dimension of RUBRIC_DIMENSIONS) {
    totals[dimension.key] = Number((totals[dimension.key] / scores.length).toFixed(1));
  }
  return totals;
}

function aggregateDelivery(scores: QuestionScore[]): DeliverySignals {
  if (scores.length === 0) {
    return {
      wpm: 0,
      fillerCount: 0,
      fillerBreakdown: [],
      silenceRatio: 0,
      longestPauseMs: 0,
      spokenMs: 0,
      volumeStability: 0,
    };
  }

  const breakdown = new Map<string, number>();
  for (const score of scores) {
    for (const entry of score.delivery.fillerBreakdown) {
      breakdown.set(entry.word, (breakdown.get(entry.word) ?? 0) + entry.count);
    }
  }

  const spokenMs = scores.reduce((total, score) => total + score.delivery.spokenMs, 0);
  // Weight pace by how long each answer ran, so a long rambling answer counts
  // more than a two-sentence one instead of both counting equally.
  const weightedWpm = spokenMs
    ? scores.reduce((total, score) => total + score.delivery.wpm * score.delivery.spokenMs, 0) /
      spokenMs
    : 0;

  return {
    wpm: Math.round(weightedWpm),
    fillerCount: scores.reduce((total, score) => total + score.delivery.fillerCount, 0),
    fillerBreakdown: [...breakdown.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((left, right) => right.count - left.count),
    silenceRatio: Number(
      (
        scores.reduce((total, score) => total + score.delivery.silenceRatio, 0) / scores.length
      ).toFixed(2),
    ),
    longestPauseMs: Math.max(...scores.map((score) => score.delivery.longestPauseMs)),
    spokenMs,
    volumeStability: Number(
      (
        scores.reduce((total, score) => total + score.delivery.volumeStability, 0) / scores.length
      ).toFixed(2),
    ),
  };
}

function competencyScores(scores: QuestionScore[]) {
  const byCompetency = new Map<InterviewCompetency, { total: number; count: number }>();

  for (const score of scores) {
    const turn = SCRIPTED_TURNS.find((item) => item.question.id === score.questionId);
    if (!turn) continue;
    const current = byCompetency.get(turn.question.competency) ?? { total: 0, count: 0 };
    byCompetency.set(turn.question.competency, {
      total: current.total + score.score,
      count: current.count + 1,
    });
  }

  return [...byCompetency.entries()]
    .map(([competency, { total, count }]) => ({
      competency,
      score: Math.round(total / count),
      questionCount: count,
    }))
    .sort((left, right) => left.score - right.score);
}

export function buildReport(
  sessionId: string,
  setup: InterviewSetup,
  scores: QuestionScore[],
  durationSec: number,
  startedAt: string,
): InterviewReport {
  const overallScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score.score, 0) / scores.length)
    : 0;

  return {
    sessionId,
    jobTitle: setup.jobTitle,
    level: setup.level,
    startedAt,
    durationSec,
    overallScore,
    dimensionAverages: averageDimensions(scores),
    competencyScores: competencyScores(scores),
    questionScores: scores,
    delivery: aggregateDelivery(scores),
    strengths: REPORT_SUMMARY.strengths,
    priorities: REPORT_SUMMARY.priorities,
    nextSteps: REPORT_SUMMARY.nextSteps,
  };
}
