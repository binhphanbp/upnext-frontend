/**
 * Contract types for the UpNext AI Copilot surface.
 *
 * These mirror the payloads in the implementation plan so that swapping the mock
 * transport for the real `NestJS -> FastAPI` pipeline is a change of one adapter
 * (`api/copilot-transport.ts`) and nothing else:
 *   - §13.3 streaming events
 *   - §14.1 public API contract at NestJS
 *   - §15.4 mandatory UI states
 *   - §19.2 error codes
 */

export type AiActorType = "CANDIDATE" | "RECRUITER" | "ADMIN";

/** §6.2 — AIConversation.contextType */
export type AiContextType =
  | "GENERAL"
  | "CV"
  | "JOB"
  | "APPLICATION"
  | "CANDIDATE"
  | "REPORT"
  | "MOCK_INTERVIEW";

/** §13.2 — intent router output, surfaced in the UI as a provenance chip. */
export type AiIntent =
  | "GENERAL_GUIDANCE"
  | "CV_ANALYSIS"
  | "JOB_SEARCH"
  | "JOB_COMPARISON"
  | "APPLICATION_STATUS"
  | "MOCK_INTERVIEW"
  | "SKILL_GAP"
  | "OUT_OF_SCOPE";

/** §19.2 — every failure the UI must be able to explain to a human. */
export type AiErrorCode =
  | "AI_MODEL_TIMEOUT"
  | "AI_MODEL_RATE_LIMIT"
  | "AI_INVALID_OUTPUT"
  | "AI_TOOL_NOT_ALLOWED"
  | "AI_TOOL_FAILED"
  | "AI_CONTEXT_NOT_FOUND"
  | "AI_CONTEXT_FORBIDDEN"
  | "AI_EMBEDDING_FAILED"
  | "AI_INDEXING_FAILED"
  | "AI_BUDGET_EXCEEDED"
  | "AI_SERVICE_UNAVAILABLE";

/**
 * §15.4 — the eleven states the plan requires the interface to express.
 * `idle` is the twelfth: nothing in flight.
 */
export type AiRunStatus =
  | "idle"
  | "loading"
  | "queued"
  | "processing"
  | "streaming"
  | "completed"
  | "failed"
  | "rate_limited"
  | "permission_denied"
  | "model_unavailable"
  | "partial";

/* -------------------------------------------------------------------------- */
/* Grounding                                                                   */
/* -------------------------------------------------------------------------- */

export type AiCitationSource = "CV" | "JOB" | "APPLICATION" | "PROFILE" | "POLICY" | "INTERVIEW";

/**
 * Every non-trivial claim carries evidence (§1.3: "mọi kết quả quan trọng phải có
 * dữ liệu dẫn chứng"). Citations are rendered as numbered chips and resolved in
 * a list under the message.
 */
export type AiCitation = {
  id: string;
  /** 1-based marker shown inline as `[1]`. */
  index: number;
  sourceType: AiCitationSource;
  sourceId: string;
  title: string;
  excerpt: string;
  href?: string;
};

export type AiToolCallStatus = "running" | "succeeded" | "failed" | "blocked";

/** Rendered as the run timeline so the user can audit what the model touched. */
export type AiToolCall = {
  id: string;
  name: string;
  label: string;
  status: AiToolCallStatus;
  detail?: string;
  durationMs?: number;
};

/* -------------------------------------------------------------------------- */
/* Cards                                                                       */
/* -------------------------------------------------------------------------- */

export type AiScoreBreakdownItem = {
  key: string;
  label: string;
  /** 0–100 */
  score: number;
  /** 0–1, the weight this dimension carries in the total (§11.3). */
  weight: number;
  /** Some dimensions legitimately have no data — never scored as zero (§11.5). */
  unknown?: boolean;
};

/** §8.2 — candidate ↔ job match result. */
export type AiJobMatchCard = {
  type: "job_match";
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  workingModel: string;
  salaryLabel?: string;
  /** §11.4 — fit. */
  totalScore: number;
  /** §11.4 — how trustworthy the inputs were. Deliberately separate. */
  confidenceScore: number;
  confidenceReason?: string;
  breakdown: AiScoreBreakdownItem[];
  matchedSkills: string[];
  missingSkills: string[];
  toVerify: string[];
  algorithmVersion: string;
  href: string;
};

/** §8.1 — structured CV analysis. */
export type AiCvAnalysisCard = {
  type: "cv_analysis";
  cvVersionId: string;
  cvName: string;
  overallScore: number;
  scores: {
    completeness: number;
    clarity: number;
    impact: number;
    atsReadiness: number;
  };
  strengths: { text: string; evidence: string }[];
  weaknesses: { text: string; evidence: string }[];
  missingSections: string[];
  href: string;
};

export type AiSkillGapItem = {
  skill: string;
  importance: "required" | "nice_to_have";
  status: "missing" | "partial" | "unproven";
  note: string;
};

export type AiSkillGapCard = {
  type: "skill_gap";
  jobTitle: string;
  gaps: AiSkillGapItem[];
  preparationQuestions: string[];
};

export type AiApplicationStatusCard = {
  type: "application_status";
  applicationId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  statusTone: "neutral" | "info" | "success" | "warning" | "error";
  appliedAt: string;
  timeline: { label: string; at: string; state: "done" | "current" | "upcoming" }[];
  href: string;
};

/** §8.4 — per-question mock interview scoring. */
export type AiInterviewFeedbackCard = {
  type: "interview_feedback";
  questionIndex: number;
  questionTotal: number;
  question: string;
  score: number;
  dimensions: {
    technicalCorrectness: number;
    relevance: number;
    depth: number;
    clarity: number;
    practicalEvidence: number;
  };
  strengths: string[];
  missingPoints: string[];
  href: string;
};

export type AiCard =
  | AiJobMatchCard
  | AiCvAnalysisCard
  | AiSkillGapCard
  | AiApplicationStatusCard
  | AiInterviewFeedbackCard;

/* -------------------------------------------------------------------------- */
/* Human-in-the-loop actions                                                   */
/* -------------------------------------------------------------------------- */

export type AiActionType =
  | "APPLY_CV_SUGGESTION"
  | "SAVE_JOB"
  | "START_MOCK_INTERVIEW"
  | "UPDATE_JOB_PREFERENCE";

/** §6.2 AIActionRequest — nothing is written until the human presses confirm. */
export type AiActionRequest = {
  id: string;
  actionType: AiActionType;
  title: string;
  description: string;
  /** Exactly what would be written, field by field. No hidden mutations. */
  changes: { label: string; from?: string; to: string }[];
  confirmLabel: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "EXECUTED" | "FAILED";
};

/* -------------------------------------------------------------------------- */
/* Messages & conversations                                                    */
/* -------------------------------------------------------------------------- */

export type AiMessageRole = "user" | "assistant";

export type AiMessageFeedback = "up" | "down";

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
  status: AiRunStatus;
  intent?: AiIntent;
  toolCalls: AiToolCall[];
  citations: AiCitation[];
  cards: AiCard[];
  actionRequest?: AiActionRequest;
  /** Follow-up prompts offered under the answer. */
  suggestions: string[];
  errorCode?: AiErrorCode;
  errorDetail?: string;
  feedback?: AiMessageFeedback;
  /** Run metadata surfaced in the "chi tiết" popover — the audit story (§19). */
  meta?: {
    model: string;
    promptVersion: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
  };
};

export type AiConversationSummary = {
  id: string;
  title: string;
  contextType: AiContextType;
  updatedAt: string;
  messageCount: number;
};

export type AiConversation = AiConversationSummary & {
  messages: AiMessage[];
};

/* -------------------------------------------------------------------------- */
/* Streaming (§13.3)                                                           */
/* -------------------------------------------------------------------------- */

export type AiStreamEvent =
  | { event: "status"; data: { step: AiRunStatus; label?: string } }
  | { event: "intent"; data: { intent: AiIntent } }
  | { event: "tool_start"; data: { tool: AiToolCall } }
  | {
      event: "tool_result";
      data: { id: string; status: AiToolCallStatus; detail?: string; durationMs: number };
    }
  | { event: "content_delta"; data: { text: string } }
  | { event: "card"; data: { card: AiCard } }
  | { event: "citation"; data: { citation: AiCitation } }
  | { event: "action_request"; data: { actionRequest: AiActionRequest } }
  | { event: "suggestions"; data: { suggestions: string[] } }
  | { event: "error"; data: { code: AiErrorCode; detail: string; status: AiRunStatus } }
  | { event: "done"; data: { messageId: string; meta: NonNullable<AiMessage["meta"]> } };

/* -------------------------------------------------------------------------- */
/* Page context (§8.3)                                                         */
/* -------------------------------------------------------------------------- */

export type AiPageContext = {
  type: AiContextType;
  /** Entity id parsed out of the route, when the route carries one. */
  id?: string;
  /** Human label for the context chip, e.g. "Trang: Chi tiết việc làm". */
  labelKey: string;
};

export type AiQuickAction = {
  id: string;
  labelKey: string;
  icon: "sparkle" | "target" | "scales" | "gap" | "interview" | "status";
  prompt: string;
  /** Only offered when the user is on a matching page. */
  requiresContext?: AiContextType[];
};
