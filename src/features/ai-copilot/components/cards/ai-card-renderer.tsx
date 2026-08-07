"use client";

import type { AiCard } from "../../types";
import { ApplicationStatusCard } from "./application-status-card";
import { CvAnalysisCard } from "./cv-analysis-card";
import { InterviewFeedbackCard } from "./interview-feedback-card";
import { JobMatchCard } from "./job-match-card";
import { SkillGapCard } from "./skill-gap-card";

/**
 * Cards arrive over the wire as a discriminated union (§13.3 `card` event). An
 * unrecognised `type` renders nothing rather than crashing the thread — a newer
 * AI service must be able to ship a card the frontend has not learned yet.
 */
export function AiCardRenderer({ card }: { card: AiCard }) {
  switch (card.type) {
    case "job_match":
      return <JobMatchCard card={card} />;
    case "cv_analysis":
      return <CvAnalysisCard card={card} />;
    case "skill_gap":
      return <SkillGapCard card={card} />;
    case "application_status":
      return <ApplicationStatusCard card={card} />;
    case "interview_feedback":
      return <InterviewFeedbackCard card={card} />;
    default:
      return null;
  }
}
