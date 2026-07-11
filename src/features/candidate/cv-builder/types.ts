export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface CvPersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phoneNumber: string;
  address: string;
  website: string;
  avatarUrl?: string;
}

export interface CvExperience {
  id: string;
  companyName: string;
  positionTitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  technologies: string;
}

export interface CvEducation {
  id: string;
  schoolName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  gpa?: string;
  description: string;
}

export interface CvProject {
  id: string;
  name: string;
  role: string;
  description: string;
  projectUrl: string;
  deployUrl: string;
  technologies: string;
}

export interface CvSkill {
  id: string;
  name: string;
  level: SkillLevel;
}

export interface CvTargetJob {
  role: string;
  company: string;
  description: string;
}

export type CvSectionKey =
  | "personal"
  | "summary"
  | "experience"
  | "projects"
  | "education"
  | "skills";

export type CvEditorSectionKey = "targeting" | CvSectionKey | "review" | "styling";

export interface CvStyleConfig {
  fontFamily: "font-sans" | "font-serif" | "font-mono" | "font-outfit";
  themeColor: "teal" | "indigo" | "violet" | "emerald" | "slate" | string;
  textSize: "sm" | "base" | "lg";
  marginSize: "sm" | "base" | "lg";
}

export interface CvData {
  targetJob: CvTargetJob;
  personalInfo: CvPersonalInfo;
  summary: string;
  experiences: CvExperience[];
  educations: CvEducation[];
  projects: CvProject[];
  skills: CvSkill[];
  sectionsOrder: CvSectionKey[];
  style: CvStyleConfig;
  selectedTemplate: "modern" | "minimalist" | "creative";
  cvLanguage: "vi" | "en";
  hiddenSections?: CvSectionKey[];
  customSectionNames?: Record<string, string>;
}

export type CvIssueSeverity = "error" | "warning";

export interface CvIssue {
  code: string;
  path: string;
  section: CvSectionKey;
  severity: CvIssueSeverity;
}

export type CvSectionStatus = "complete" | "empty" | "inProgress";

export interface CvSectionEvaluation {
  completion: number;
  errors: number;
  status: CvSectionStatus;
  warnings: number;
}

export interface CvEvaluation {
  blockingIssues: CvIssue[];
  contentSignals: CvContentSignals;
  exportReady: boolean;
  issues: CvIssue[];
  jobMatch: CvJobMatchEvaluation;
  score: number;
  sections: Record<CvSectionKey, CvSectionEvaluation>;
}

export interface CvKeywordEvidence {
  keyword: string;
  sections: CvSectionKey[];
}

export interface CvJobMatchEvaluation {
  hasDescription: boolean;
  matched: CvKeywordEvidence[];
  missing: string[];
  score: number | null;
  total: number;
}

export interface CvContentSignals {
  actionLedBullets: number;
  quantifiedBullets: number;
  skillsWithEvidence: number;
  skillsWithoutEvidence: string[];
  totalBullets: number;
  totalSkills: number;
}
