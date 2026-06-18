import type { LucideIcon } from "@/features/recruiter/icons";

export type TeamRoleCode = string;

export type MemberStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE" | "DEACTIVATED" | string;

export type CompanyMember = {
  actionLabel: string;
  assignedJobCount: number;
  avatar: string;
  department: string;
  email: string;
  fullName: string;
  id: string;
  interviewCount: number;
  lastActiveAt: string;
  recruiterAccountId: string;
  roleCode: TeamRoleCode;
  roleId: string;
  roleName: string;
  status: MemberStatus;
};

export type RecruiterRoleDefinition = {
  code: TeamRoleCode;
  description: string;
  icon: LucideIcon;
  id: string;
  label: string;
  permissions: string[];
  tone: "violet" | "blue" | "emerald" | "orange" | "slate";
};

export type TeamKpi = {
  label: string;
  tone: "amber" | "emerald" | "rose";
  trend: string;
  trendDirection: "down" | "flat" | "up";
  value: string;
};

export type RecruiterJobPostStatus =
  | "active"
  | "draft"
  | "expired"
  | "expiring"
  | "locked"
  | "pending";

export type RecruiterJobPostEffectiveness = "good" | "needsOptimization" | "new" | "ok";

export type RecruiterJobPostTab =
  | "all"
  | "active"
  | "draft"
  | "expired"
  | "expiring"
  | "locked"
  | "pending";

export type RecruiterJobPost = {
  applications: number;
  companyName: string;
  conversionRate: number | null;
  daysLeft: number | null;
  effectiveness: RecruiterJobPostEffectiveness;
  employmentType: string;
  experienceLevel: string;
  id: string;
  locationSummary: string;
  moderationStatus: string | null;
  newCandidates: number;
  publishedAt: string | null;
  status: RecruiterJobPostStatus;
  title: string;
  updatedAt: string;
  views: number;
};

export type RecruiterJobPostsKpi = {
  helper: string;
  label: string;
  tone: "blue" | "emerald" | "orange" | "rose" | "violet";
  trend?: string;
  value: string;
};
