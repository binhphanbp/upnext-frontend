export type SeniorityLevel = "intern" | "fresher" | "junior" | "mid" | "senior" | "lead";

export type InterviewType = "technical" | "system-design" | "behavioral" | "live-coding";

export type RoleCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "ai-ml"
  | "devops"
  | "ui-ux"
  | "mobile";

export interface RolePreset {
  id: string;
  category: RoleCategory;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  iconName: string;
  tags: string[];
  recommendedLevel: SeniorityLevel;
  totalQuestions: number;
  durationMinutes: number;
}

export interface InterviewQuestion {
  id: string;
  order: number;
  question: string;
  questionVi: string;
  category: string;
  categoryVi: string;
  difficulty: "easy" | "medium" | "hard";
  keyTopics: string[];
  idealPoints: string[];
  idealPointsVi: string[];
  sampleAnswer?: string;
  sampleAnswerVi?: string;
  answeredText?: string;
  status: "pending" | "current" | "answered" | "skipped";
  score?: number; // 0-100
  feedback?: string;
  feedbackVi?: string;
}

export interface CompetencyScore {
  name: string;
  nameVi: string;
  score: number; // 0-100
  fullMark: number;
}

export interface WorkmapMetric {
  label: string;
  labelVi: string;
  percentage: number;
  color: string;
}

export interface InterviewEvaluationReport {
  sessionId: string;
  roleTitle: string;
  roleTitleVi: string;
  level: SeniorityLevel;
  interviewType: InterviewType;
  completedAt: string;
  durationSeconds: number;
  overallScore: number; // 0-100
  verdict: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "NEED_IMPROVEMENT";
  verdictTitleVi: string;
  verdictSummaryVi: string;
  competencies: CompetencyScore[];
  workmapMetrics: WorkmapMetric[];
  strengths: string[];
  strengthsVi: string[];
  improvements: string[];
  improvementsVi: string[];
  questions: InterviewQuestion[];
  aiSummaryNotes: string;
  aiSummaryNotesVi: string;
}

export type InterviewStage = "setup" | "interview" | "report";
