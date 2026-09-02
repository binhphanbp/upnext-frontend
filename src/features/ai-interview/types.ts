export type InterviewRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "product_manager"
  | "data_analyst"
  | "hr_behavioral"
  | "english_comm";

export type ExperienceLevel = "intern" | "fresher" | "junior" | "middle" | "senior";

export type EducationType = "university" | "college";

export type Language = "vi" | "en";

export type InterviewMode = "basic" | "deep";

export interface Question {
  id: string;
  text: string;
  role: InterviewRole;
  level: ExperienceLevel;
  category: "technical" | "behavioral" | "situational" | "intro";
  expectedKeyPoints: string[];
  sampleGoodAnswer?: string | undefined;
  timeLimitSeconds: number;
  parentQuestionId?: string | undefined;
  isFollowUp?: boolean | undefined;
  followUpIndex?: number | undefined;
  fromCvProject?: string | undefined;
}

export type EmotionType =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised";

export interface FaceMetrics {
  detected: boolean;
  isLockedCandidate?: boolean | undefined;
  foreignFacesCount?: number | undefined;
  box?:
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | undefined;
  dominantEmotion: EmotionType;
  emotions: Record<EmotionType, number>; // percentages 0-100
  confidenceScore: number; // 0-100
  eyeContactScore: number; // 0-100
  isLookingAtCamera: boolean;
  smileScore: number; // 0-100
  mouthOpenness: number; // 0-100
  isMouthMoving: boolean;
  isMouthTalking: boolean;
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export interface AudioMetrics {
  volume: number; // 0-100 RMS
  volumeLevel: "silent" | "too_quiet" | "optimal" | "too_loud";
  isSpeaking: boolean;
  pitch: number; // Hz
  pitchStability: number; // 0-100
  speechRateWPM: number;
  fillerWordsCount: number;
  fillerWordsDetected: string[];
  totalSilenceSeconds: number;
  totalSpeakingSeconds: number;
  isNoiseFiltered?: boolean | undefined;
  ambientNoiseLevel?: number | undefined;
}

export interface QuestionAnswerRecord {
  question: Question;
  transcript: string;
  correctedTranscript?: string | undefined;
  audioDurationSeconds: number;
  faceMetricsTimeline: Array<{
    timestamp: number;
    metrics: FaceMetrics;
  }>;
  audioMetricsTimeline: Array<{
    timestamp: number;
    metrics: AudioMetrics;
  }>;
  averageConfidence: number;
  averageEyeContact: number;
  dominantEmotion: EmotionType;
  fillerWordsCount: number;
  averageWPM: number;
  evaluation?: QuestionEvaluation | undefined;
  followUpExchanges?:
    | Array<{
        questionText: string;
        answerText: string;
        timestamp?: number | undefined;
      }>
    | undefined;
}

export interface EvaluateAnswerResponse {
  success: boolean;
  isFollowUp: boolean;
  followUpIndex?: number | undefined;
  maxFollowUps?: number | undefined;
  followUpQuestion?: Question | undefined;
  answerRecord?: QuestionAnswerRecord | undefined;
  error?: string | undefined;
}

export interface QuestionEvaluation {
  score: number; // 0-100
  contentScore: number; // 0-100
  confidenceScore: number; // 0-100
  communicationScore: number; // 0-100
  bodyLanguageScore: number; // 0-100
  correctedTranscript?: string | undefined;
  spellingAndGrammarCorrections?: string[] | undefined;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  feedback: string;
  suggestions: string[];
  strengths: string[];
}

export interface FinalInterviewReport {
  sessionId: string;
  candidateName: string;
  role: InterviewRole;
  level: ExperienceLevel;
  educationType?: EducationType | undefined;
  language: Language;
  interviewMode?: InterviewMode | undefined;
  startTime: string;
  totalDurationSeconds: number;
  overallScore: number; // 0-100
  breakdown: {
    contentKnowledge: number;
    confidenceAndComposure: number;
    voiceAndPace: number;
    eyeContactAndEngagement: number;
    structureAndClarity: number;
  };
  emotionDistribution: Record<EmotionType, number>;
  totalFillerWords: number;
  averageWPM: number;
  overallFeedback: string;
  keyStrengths: string[];
  criticalImprovements: string[];
  questionsAnswered: QuestionAnswerRecord[];
}

export interface TTSVoiceInfo {
  id: string;
  name: string;
  gender: "Female" | "Male";
  language: Language;
  description: string;
  isDefault?: boolean | undefined;
}

export interface CvProject {
  name: string;
  technologies?: string[];
  role?: string;
  description?: string;
}

export interface CvMetadata {
  candidateName?: string;
  suggestedRole?: InterviewRole;
  suggestedLevel?: ExperienceLevel;
  skills?: string[];
  summary?: string;
  projects?: CvProject[];
  education?: string[];
}

export interface JdMetadata {
  jobTitle?: string;
  targetRole?: InterviewRole;
  targetLevel?: ExperienceLevel;
  requiredSkills?: string[];
  responsibilities?: string[];
  requirements?: string[];
}

export interface MatchAnalysis {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch?: string;
  strengthsSummary?: string;
  gapsSummary?: string;
  recommendations?: string[];
}

export interface CvScanResponse {
  cvMarkdown?: string;
  cvMetadata?: CvMetadata;
  jdMarkdown?: string;
  jdMetadata?: JdMetadata;
  matchAnalysis: MatchAnalysis;
  suggestedQuestions: Question[];
}

export interface InterviewSessionConfig {
  sessionId?: string | undefined;
  candidateName: string;
  role: InterviewRole;
  level: ExperienceLevel;
  educationType?: EducationType | undefined;
  language: Language;
  interviewMode?: InterviewMode | undefined;
  questionCount: number;
  enableTTS: boolean;
  enableCamera: boolean;
  enableMic: boolean;
  enableNoiseSuppression?: boolean | undefined;
  selectedVoiceId?: string | undefined;
  selectedVoiceURI?: string | undefined;
  geminiApiKey?: string | undefined;
  cvMarkdown?: string | undefined;
  jdMarkdown?: string | undefined;
  matchAnalysis?: MatchAnalysis | undefined;
  customQuestions?: Question[] | undefined;
}

export type InterviewStage = "setup" | "interview" | "report";

// Backwards compatibility types
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
  sampleAnswer?: string | undefined;
  sampleAnswerVi?: string | undefined;
  answeredText?: string | undefined;
  status: "pending" | "current" | "answered" | "skipped";
  score?: number | undefined;
  feedback?: string | undefined;
  feedbackVi?: string | undefined;
}

export interface CompetencyScore {
  name: string;
  nameVi: string;
  score: number;
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
  overallScore: number;
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
