/**
 * Realtime AI Interview — contract types.
 *
 * The session is modelled as a duplex event stream so that the UI is written
 * against the shape a real WebRTC / WebSocket bridge will emit. Swapping the
 * scripted driver in `api/interview-transport.ts` for a live socket must not
 * touch a single component.
 *
 * Scope boundary, enforced by the type system rather than by convention:
 * there is no field anywhere in this file for inferred emotion, mood,
 * personality, attractiveness or demographic attributes. Delivery signals below
 * describe *how speech was delivered* (pace, pauses, filler words) and are
 * coaching-only — see `DeliverySignals`.
 */

export type InterviewMode = "voice" | "text";

export type InterviewLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR" | "LEAD";

export type InterviewDifficulty = "easy" | "medium" | "hard";

export type InterviewCompetency =
  | "fundamentals"
  | "database"
  | "api_design"
  | "system_design"
  | "testing"
  | "problem_solving"
  | "behavioral";

/** Where the session is in its lifecycle — drives every affordance on screen. */
export type InterviewPhase =
  | "idle"
  | "connecting"
  | "interviewer_speaking"
  | "listening"
  | "evaluating"
  | "feedback"
  | "paused"
  | "completed"
  | "failed";

export type InterviewSetup = {
  mode: InterviewMode;
  /** Job the session is calibrated against, or `null` for a topic-only run. */
  jobId: string | null;
  jobTitle: string;
  level: InterviewLevel;
  questionCount: 5 | 7 | 10;
  difficulty: InterviewDifficulty;
  competencies: InterviewCompetency[];
  /** Real microphone + browser speech APIs vs the scripted demo driver. */
  useLiveCapture: boolean;
  cameraEnabled: boolean;
};

export type InterviewQuestion = {
  id: string;
  /** 1-based. */
  index: number;
  total: number;
  text: string;
  competency: InterviewCompetency;
  difficulty: InterviewDifficulty;
  /** What a strong answer would touch — revealed only in the report. */
  expectedSignals: string[];
  timeLimitSec: number;
  /** Set when the adaptive engine drilled into a previous answer (§8.4). */
  followUpOfId?: string;
};

export type TranscriptSpeaker = "interviewer" | "candidate";

export type TranscriptSegment = {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
  /** Interim results render dimmed; finals render solid. */
  isFinal: boolean;
  startedAtMs: number;
  questionId: string | null;
};

/**
 * Coaching-only speech delivery signals.
 *
 * Deliberately excluded, and not to be added later without a legal review:
 * emotion / sentiment inference, personality traits, accent or dialect scoring,
 * appearance, age, gender. EU AI Act Art. 5(1)(f) prohibits emotion inference in
 * employment contexts; the project plan §3.3 places it out of scope.
 *
 * These values never contribute to `QuestionScore.score` and are never exposed
 * to recruiters — see `DELIVERY_IS_COACHING_ONLY` in `lib/delivery-metrics.ts`.
 */
export type DeliverySignals = {
  /** Words per minute over the answer so far. */
  wpm: number;
  fillerCount: number;
  fillerBreakdown: { word: string; count: number }[];
  /** Share of the answer spent silent, 0–1. */
  silenceRatio: number;
  longestPauseMs: number;
  spokenMs: number;
  /** 0–1, how even the loudness was. Low values read as trailing off. */
  volumeStability: number;
};

/** One point on the live delivery sparkline. */
export type DeliverySample = {
  atMs: number;
  wpm: number;
  /** 0–1 instantaneous input level, from the analyser node. */
  level: number;
};

export type ScoreDimensions = {
  /** §8.4 rubric, out of 40 / 20 / 15 / 15 / 10. */
  technicalCorrectness: number;
  relevance: number;
  depth: number;
  clarity: number;
  practicalEvidence: number;
};

export type QuestionScore = {
  questionId: string;
  questionText: string;
  /** 0–100, the sum of `dimensions`. Delivery signals are not part of it. */
  score: number;
  dimensions: ScoreDimensions;
  strengths: string[];
  missingPoints: string[];
  followUpFocus: string[];
  suggestedAnswer: string;
  transcript: string;
  delivery: DeliverySignals;
  /** What the adaptive engine decided to do next, and why (§8.4). */
  adaptiveDecision: {
    action: "deepen" | "follow_up" | "simplify" | "switch_topic" | "complete";
    reason: string;
  };
};

export type InterviewReport = {
  sessionId: string;
  jobTitle: string;
  level: InterviewLevel;
  startedAt: string;
  durationSec: number;
  overallScore: number;
  dimensionAverages: ScoreDimensions;
  competencyScores: { competency: InterviewCompetency; score: number; questionCount: number }[];
  questionScores: QuestionScore[];
  delivery: DeliverySignals;
  strengths: string[];
  priorities: string[];
  /** Concrete next steps, each tied to something observed in the session. */
  nextSteps: { title: string; detail: string; href?: string }[];
};

/* -------------------------------------------------------------------------- */
/* Realtime event stream                                                       */
/* -------------------------------------------------------------------------- */

export type InterviewErrorCode =
  | "MIC_PERMISSION_DENIED"
  | "MIC_UNAVAILABLE"
  | "SPEECH_UNSUPPORTED"
  | "NETWORK_UNSTABLE"
  | "AI_SERVICE_UNAVAILABLE"
  | "SESSION_EXPIRED";

export type InterviewEvent =
  | { type: "phase"; data: { phase: InterviewPhase } }
  /** The interviewer's line, emitted before playback so captions lead audio. */
  | { type: "interviewer_utterance"; data: { text: string; estimatedMs: number } }
  | { type: "question"; data: InterviewQuestion }
  | { type: "transcript"; data: TranscriptSegment }
  | { type: "delivery_sample"; data: DeliverySample }
  | { type: "question_score"; data: QuestionScore }
  | { type: "session_complete"; data: InterviewReport }
  | { type: "error"; data: { code: InterviewErrorCode; detail: string } };

/** Connection health shown in the session header. */
export type ConnectionQuality = "excellent" | "good" | "poor" | "offline";
