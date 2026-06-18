import type { LucideIcon } from "@/features/recruiter/icons";
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Clock3,
  FileArchive,
  Gift,
  Home,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
} from "@/features/recruiter/icons";

export type SidebarItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const sidebarItems: SidebarItem[] = [
  { href: "/recruiter", icon: Home, label: "Tổng quan" },
  { href: "/recruiter/job-posts", icon: ClipboardCheck, label: "Tin tuyển dụng" },
  { href: "/recruiter/candidates", icon: UserRound, label: "Ứng viên" },
  { href: "/recruiter/talent-pool", icon: Search, label: "Tìm ứng viên" },
  { href: "/recruiter/interviews", icon: CalendarCheck2, label: "Lịch phỏng vấn" },
  { href: "/recruiter/analytics", icon: ChartNoAxesCombined, label: "Báo cáo" },
  { href: "/recruiter/company-billing", icon: FileArchive, label: "Gói & tài nguyên" },
  { href: "/recruiter/company-profile", icon: Building2, label: "Hồ sơ & uy tín" },
  { href: "/recruiter/settings", icon: Settings, label: "Cài đặt" },
];

export const dashboardReferenceNow = new Date("2026-06-16T09:00:00+07:00");

export type DashboardJobStatus = "ACTIVE" | "CLOSED" | "DRAFT";
export type DashboardApplicationStatus =
  | "NEW"
  | "SUBMITTED"
  | "VIEWED"
  | "SCREENING"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "OFFER_SENT"
  | "HIRED"
  | "REJECTED";
export type DashboardApplicationStage =
  | "APPLIED"
  | "VIEWED"
  | "SCREENING"
  | "INTERVIEW_CREATED"
  | "INTERVIEW_COMPLETED"
  | "OFFER_CREATED"
  | "HIRED";
export type DashboardInterviewStatus =
  | "SCHEDULED"
  | "UPCOMING"
  | "NEEDS_FEEDBACK"
  | "NO_SHOW"
  | "COMPLETED"
  | "CANCELLED";
export type DashboardOfferStatus = "PENDING" | "OFFER_SENT" | "ACCEPTED" | "DECLINED";

export type DashboardJob = {
  id: string;
  approved: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  expiresAt: Date;
  lockedAt: Date | null;
  status: DashboardJobStatus;
  title: string;
};

export type DashboardApplication = {
  candidateEmail: string;
  candidateName: string;
  createdAt: Date;
  cvViewedAt: Date | null;
  id: string;
  interviewCreatedAt: Date | null;
  jobId: string;
  recruiterMessageSentAt: Date | null;
  reachedStages: DashboardApplicationStage[];
  rejectedAt: Date | null;
  role: string;
  status: DashboardApplicationStatus;
};

export type DashboardInterview = {
  applicationId: string;
  durationMinutes: number;
  endAt: Date;
  feedbackSubmittedAt: Date | null;
  id: string;
  interviewerName: string;
  round: string;
  scheduledAt: Date;
  status: DashboardInterviewStatus;
};

export type DashboardJobView = {
  jobId: string;
  viewedAt: Date;
  visitorId: string;
};

export type DashboardOffer = {
  applicationId: string;
  createdAt: Date;
  finalResultAt: Date | null;
  id: string;
  status: DashboardOfferStatus;
};

export type DashboardTrustSnapshot = {
  date: Date;
  jobQualityScore: number;
  profileVerificationScore: number;
  responseScore: number;
  violationScore: number;
};

function atDate(dayOffset: number, hour: number, minute = 0) {
  const date = new Date(dashboardReferenceNow);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function atMonth(monthOffset: number, day: number, hour = 9, minute = 0) {
  const date = new Date(dashboardReferenceNow);
  date.setMonth(date.getMonth() + monthOffset, day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const dashboardJobs: DashboardJob[] = [
  {
    approved: true,
    createdAt: atMonth(-6, 12),
    deletedAt: null,
    expiresAt: atDate(18, 23, 0),
    id: "job-frontend-react",
    lockedAt: null,
    status: "ACTIVE",
    title: "Frontend Developer (React)",
  },
  {
    approved: true,
    createdAt: atMonth(-5, 2),
    deletedAt: null,
    expiresAt: atDate(11, 23, 0),
    id: "job-backend-node",
    lockedAt: null,
    status: "ACTIVE",
    title: "Backend Developer (Node.js)",
  },
  {
    approved: true,
    createdAt: atMonth(-4, 18),
    deletedAt: null,
    expiresAt: atDate(6, 23, 0),
    id: "job-uiux",
    lockedAt: null,
    status: "ACTIVE",
    title: "UI/UX Designer",
  },
  {
    approved: true,
    createdAt: atMonth(-3, 7),
    deletedAt: null,
    expiresAt: atDate(2, 23, 0),
    id: "job-qa",
    lockedAt: null,
    status: "ACTIVE",
    title: "QA Engineer (Test Automation)",
  },
  {
    approved: true,
    createdAt: atMonth(-2, 9),
    deletedAt: null,
    expiresAt: atDate(15, 23, 0),
    id: "job-devops",
    lockedAt: null,
    status: "ACTIVE",
    title: "DevOps Engineer",
  },
  {
    approved: true,
    createdAt: atMonth(-1, 4),
    deletedAt: null,
    expiresAt: atDate(20, 23, 0),
    id: "job-product",
    lockedAt: null,
    status: "ACTIVE",
    title: "Product Designer",
  },
  {
    approved: true,
    createdAt: atMonth(-8, 20),
    deletedAt: null,
    expiresAt: atDate(-4, 23, 0),
    id: "job-closed-data",
    lockedAt: null,
    status: "CLOSED",
    title: "Data Analyst",
  },
];

function createApplication(
  input: Omit<DashboardApplication, "candidateEmail" | "candidateName" | "role"> & {
    candidateName: string;
    role: string;
  },
) {
  const { candidateName, role, ...rest } = input;

  return {
    ...rest,
    candidateEmail: `${candidateName.toLowerCase().replaceAll(" ", ".")}@gmail.com`,
    candidateName,
    role,
  };
}

export const dashboardApplications: DashboardApplication[] = [
  createApplication({
    candidateName: "Nguyen Minh Anh",
    createdAt: atDate(0, 8, 10),
    cvViewedAt: atDate(0, 8, 45),
    id: "app-001",
    interviewCreatedAt: atDate(0, 8, 50),
    jobId: "job-frontend-react",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED"],
    recruiterMessageSentAt: atDate(0, 8, 35),
    rejectedAt: null,
    role: "Frontend Developer (React)",
    status: "INTERVIEW_SCHEDULED",
  }),
  createApplication({
    candidateName: "Tran Quoc Bao",
    createdAt: atDate(0, 9, 5),
    cvViewedAt: atDate(0, 10, 0),
    id: "app-002",
    interviewCreatedAt: atDate(0, 10, 5),
    jobId: "job-backend-node",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED"],
    recruiterMessageSentAt: atDate(0, 9, 45),
    rejectedAt: null,
    role: "Backend Developer (Node.js)",
    status: "INTERVIEW_SCHEDULED",
  }),
  createApplication({
    candidateName: "Le Thu Trang",
    createdAt: atDate(0, 11, 0),
    cvViewedAt: atDate(0, 11, 35),
    id: "app-003",
    interviewCreatedAt: atDate(0, 11, 45),
    jobId: "job-uiux",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED"],
    recruiterMessageSentAt: atDate(0, 11, 30),
    rejectedAt: null,
    role: "UI/UX Designer",
    status: "INTERVIEW_SCHEDULED",
  }),
  createApplication({
    candidateName: "Pham Hoang Nam",
    createdAt: atDate(-1, 15, 10),
    cvViewedAt: atDate(-1, 16, 0),
    id: "app-004",
    interviewCreatedAt: atDate(-1, 16, 20),
    jobId: "job-qa",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED", "INTERVIEW_COMPLETED"],
    recruiterMessageSentAt: atDate(-1, 15, 50),
    rejectedAt: null,
    role: "QA Engineer",
    status: "INTERVIEW_COMPLETED",
  }),
  createApplication({
    candidateName: "Do Thao Vy",
    createdAt: atDate(-1, 17, 0),
    cvViewedAt: atDate(-1, 18, 0),
    id: "app-005",
    interviewCreatedAt: atDate(-1, 18, 10),
    jobId: "job-product",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
      "HIRED",
    ],
    recruiterMessageSentAt: atDate(-1, 17, 20),
    rejectedAt: null,
    role: "Product Designer",
    status: "HIRED",
  }),
  createApplication({
    candidateName: "Vu Thuy Linh",
    createdAt: atDate(-2, 10, 30),
    cvViewedAt: null,
    id: "app-006",
    interviewCreatedAt: null,
    jobId: "job-frontend-react",
    reachedStages: ["APPLIED"],
    recruiterMessageSentAt: null,
    rejectedAt: null,
    role: "Frontend Developer (React)",
    status: "NEW",
  }),
  createApplication({
    candidateName: "Do Trung Hieu",
    createdAt: atDate(-2, 14, 15),
    cvViewedAt: atDate(-1, 9, 30),
    id: "app-007",
    interviewCreatedAt: null,
    jobId: "job-devops",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING"],
    recruiterMessageSentAt: atDate(-1, 9, 45),
    rejectedAt: null,
    role: "DevOps Engineer",
    status: "SCREENING",
  }),
  createApplication({
    candidateName: "Ngo Van Dung",
    createdAt: atDate(-3, 8, 0),
    cvViewedAt: atDate(-3, 12, 20),
    id: "app-008",
    interviewCreatedAt: null,
    jobId: "job-frontend-react",
    reachedStages: ["APPLIED", "VIEWED"],
    recruiterMessageSentAt: atDate(-3, 12, 30),
    rejectedAt: null,
    role: "Frontend Developer (React)",
    status: "VIEWED",
  }),
  createApplication({
    candidateName: "Bui Thi Mai",
    createdAt: atDate(-4, 9, 40),
    cvViewedAt: atDate(-4, 10, 10),
    id: "app-009",
    interviewCreatedAt: atDate(-3, 11, 0),
    jobId: "job-product",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED"],
    recruiterMessageSentAt: atDate(-4, 11, 0),
    rejectedAt: null,
    role: "Product Designer",
    status: "INTERVIEW_SCHEDULED",
  }),
  createApplication({
    candidateName: "Le Quang Huy",
    createdAt: atDate(-5, 13, 15),
    cvViewedAt: atDate(-5, 14, 0),
    id: "app-010",
    interviewCreatedAt: null,
    jobId: "job-backend-node",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING"],
    recruiterMessageSentAt: atDate(-5, 14, 15),
    rejectedAt: null,
    role: "Backend Developer (Node.js)",
    status: "SCREENING",
  }),
  createApplication({
    candidateName: "Nguyen Bao Chau",
    createdAt: atDate(-6, 9, 5),
    cvViewedAt: null,
    id: "app-011",
    interviewCreatedAt: null,
    jobId: "job-uiux",
    reachedStages: ["APPLIED"],
    recruiterMessageSentAt: null,
    rejectedAt: null,
    role: "UI/UX Designer",
    status: "SUBMITTED",
  }),
  createApplication({
    candidateName: "Tran Minh Duc",
    createdAt: atDate(-7, 15, 40),
    cvViewedAt: atDate(-6, 9, 0),
    id: "app-012",
    interviewCreatedAt: atDate(-5, 10, 0),
    jobId: "job-qa",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
    ],
    recruiterMessageSentAt: atDate(-6, 9, 20),
    rejectedAt: null,
    role: "QA Engineer",
    status: "OFFER_SENT",
  }),
  createApplication({
    candidateName: "Pham Gia Han",
    createdAt: atDate(-9, 8, 25),
    cvViewedAt: atDate(-9, 10, 0),
    id: "app-013",
    interviewCreatedAt: atDate(-8, 14, 0),
    jobId: "job-backend-node",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED"],
    recruiterMessageSentAt: atDate(-9, 10, 15),
    rejectedAt: null,
    role: "Backend Developer (Node.js)",
    status: "INTERVIEW_SCHEDULED",
  }),
  createApplication({
    candidateName: "Doan Ngoc Ha",
    createdAt: atDate(-12, 10, 5),
    cvViewedAt: atDate(-11, 9, 0),
    id: "app-014",
    interviewCreatedAt: atDate(-10, 11, 15),
    jobId: "job-devops",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED", "INTERVIEW_COMPLETED"],
    recruiterMessageSentAt: atDate(-11, 9, 20),
    rejectedAt: null,
    role: "DevOps Engineer",
    status: "INTERVIEW_COMPLETED",
  }),
  createApplication({
    candidateName: "Hoang Anh Thu",
    createdAt: atDate(-14, 14, 40),
    cvViewedAt: atDate(-13, 10, 10),
    id: "app-015",
    interviewCreatedAt: atDate(-12, 14, 0),
    jobId: "job-product",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
      "HIRED",
    ],
    recruiterMessageSentAt: atDate(-13, 10, 25),
    rejectedAt: null,
    role: "Product Designer",
    status: "HIRED",
  }),
  createApplication({
    candidateName: "Le Thanh Nam",
    createdAt: atDate(-18, 8, 50),
    cvViewedAt: null,
    id: "app-016",
    interviewCreatedAt: null,
    jobId: "job-frontend-react",
    reachedStages: ["APPLIED"],
    recruiterMessageSentAt: null,
    rejectedAt: null,
    role: "Frontend Developer (React)",
    status: "NEW",
  }),
  createApplication({
    candidateName: "Tran Huu Phuc",
    createdAt: atDate(-22, 9, 35),
    cvViewedAt: atDate(-21, 9, 0),
    id: "app-017",
    interviewCreatedAt: null,
    jobId: "job-uiux",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING"],
    recruiterMessageSentAt: atDate(-21, 9, 10),
    rejectedAt: null,
    role: "UI/UX Designer",
    status: "SCREENING",
  }),
  createApplication({
    candidateName: "Nguyen Bao Ngan",
    createdAt: atDate(-26, 11, 15),
    cvViewedAt: atDate(-25, 8, 45),
    id: "app-018",
    interviewCreatedAt: atDate(-24, 10, 0),
    jobId: "job-qa",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
    ],
    recruiterMessageSentAt: atDate(-25, 9, 0),
    rejectedAt: null,
    role: "QA Engineer",
    status: "OFFER_SENT",
  }),
  createApplication({
    candidateName: "Le Minh Khoa",
    createdAt: atDate(-31, 13, 25),
    cvViewedAt: atDate(-30, 8, 15),
    id: "app-019",
    interviewCreatedAt: null,
    jobId: "job-backend-node",
    reachedStages: ["APPLIED", "VIEWED"],
    recruiterMessageSentAt: atDate(-30, 8, 25),
    rejectedAt: atDate(-28, 11, 0),
    role: "Backend Developer (Node.js)",
    status: "REJECTED",
  }),
  createApplication({
    candidateName: "Vu Nhat Linh",
    createdAt: atDate(-35, 10, 10),
    cvViewedAt: atDate(-34, 8, 0),
    id: "app-020",
    interviewCreatedAt: atDate(-33, 9, 30),
    jobId: "job-devops",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED"],
    recruiterMessageSentAt: atDate(-34, 8, 30),
    rejectedAt: null,
    role: "DevOps Engineer",
    status: "INTERVIEW_SCHEDULED",
  }),
  createApplication({
    candidateName: "Pham Thi Yen",
    createdAt: atMonth(-2, 12, 9, 20),
    cvViewedAt: atMonth(-2, 13, 10, 0),
    id: "app-021",
    interviewCreatedAt: atMonth(-2, 15, 14, 0),
    jobId: "job-frontend-react",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
      "HIRED",
    ],
    recruiterMessageSentAt: atMonth(-2, 13, 10, 20),
    rejectedAt: null,
    role: "Frontend Developer (React)",
    status: "HIRED",
  }),
  createApplication({
    candidateName: "Tran Gia Bao",
    createdAt: atMonth(-2, 18, 15, 10),
    cvViewedAt: atMonth(-2, 19, 9, 5),
    id: "app-022",
    interviewCreatedAt: null,
    jobId: "job-uiux",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING"],
    recruiterMessageSentAt: atMonth(-2, 19, 9, 20),
    rejectedAt: null,
    role: "UI/UX Designer",
    status: "SCREENING",
  }),
  createApplication({
    candidateName: "Nguyen Thanh Binh",
    createdAt: atMonth(-3, 6, 10, 30),
    cvViewedAt: null,
    id: "app-023",
    interviewCreatedAt: null,
    jobId: "job-product",
    reachedStages: ["APPLIED"],
    recruiterMessageSentAt: null,
    rejectedAt: null,
    role: "Product Designer",
    status: "SUBMITTED",
  }),
  createApplication({
    candidateName: "Le Thi Hang",
    createdAt: atMonth(-4, 9, 9, 0),
    cvViewedAt: atMonth(-4, 10, 10, 0),
    id: "app-024",
    interviewCreatedAt: atMonth(-4, 11, 11, 0),
    jobId: "job-backend-node",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED", "INTERVIEW_COMPLETED"],
    recruiterMessageSentAt: atMonth(-4, 10, 10, 30),
    rejectedAt: null,
    role: "Backend Developer (Node.js)",
    status: "INTERVIEW_COMPLETED",
  }),
  createApplication({
    candidateName: "Pham Duc Long",
    createdAt: atMonth(-5, 14, 14, 15),
    cvViewedAt: atMonth(-5, 15, 8, 45),
    id: "app-025",
    interviewCreatedAt: null,
    jobId: "job-qa",
    reachedStages: ["APPLIED", "VIEWED"],
    recruiterMessageSentAt: atMonth(-5, 15, 9, 5),
    rejectedAt: atMonth(-5, 17, 15, 0),
    role: "QA Engineer",
    status: "REJECTED",
  }),
  createApplication({
    candidateName: "Hoang Duc Anh",
    createdAt: atMonth(-6, 20, 10, 45),
    cvViewedAt: atMonth(-6, 21, 10, 10),
    id: "app-026",
    interviewCreatedAt: atMonth(-6, 22, 14, 20),
    jobId: "job-devops",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
    ],
    recruiterMessageSentAt: atMonth(-6, 21, 10, 20),
    rejectedAt: null,
    role: "DevOps Engineer",
    status: "OFFER_SENT",
  }),
  createApplication({
    candidateName: "Truong Hong Nhung",
    createdAt: atMonth(-7, 4, 9, 30),
    cvViewedAt: null,
    id: "app-027",
    interviewCreatedAt: null,
    jobId: "job-product",
    reachedStages: ["APPLIED"],
    recruiterMessageSentAt: null,
    rejectedAt: null,
    role: "Product Designer",
    status: "NEW",
  }),
  createApplication({
    candidateName: "Nguyen Phuong Linh",
    createdAt: atMonth(-8, 11, 11, 5),
    cvViewedAt: atMonth(-8, 12, 10, 0),
    id: "app-028",
    interviewCreatedAt: atMonth(-8, 14, 13, 0),
    jobId: "job-frontend-react",
    reachedStages: [
      "APPLIED",
      "VIEWED",
      "SCREENING",
      "INTERVIEW_CREATED",
      "INTERVIEW_COMPLETED",
      "OFFER_CREATED",
      "HIRED",
    ],
    recruiterMessageSentAt: atMonth(-8, 12, 10, 15),
    rejectedAt: null,
    role: "Frontend Developer (React)",
    status: "HIRED",
  }),
  createApplication({
    candidateName: "Le Duc Tuan",
    createdAt: atMonth(-10, 16, 15, 30),
    cvViewedAt: atMonth(-10, 17, 9, 15),
    id: "app-029",
    interviewCreatedAt: null,
    jobId: "job-backend-node",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING"],
    recruiterMessageSentAt: atMonth(-10, 17, 9, 30),
    rejectedAt: null,
    role: "Backend Developer (Node.js)",
    status: "SCREENING",
  }),
  createApplication({
    candidateName: "Tran Bich Ngoc",
    createdAt: atMonth(-11, 8, 10, 15),
    cvViewedAt: atMonth(-11, 8, 15, 30),
    id: "app-030",
    interviewCreatedAt: atMonth(-11, 10, 9, 45),
    jobId: "job-uiux",
    reachedStages: ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW_CREATED", "INTERVIEW_COMPLETED"],
    recruiterMessageSentAt: atMonth(-11, 8, 15, 40),
    rejectedAt: null,
    role: "UI/UX Designer",
    status: "INTERVIEW_COMPLETED",
  }),
];

export const dashboardInterviews: DashboardInterview[] = [
  {
    applicationId: "app-001",
    durationMinutes: 30,
    endAt: atDate(0, 9, 30),
    feedbackSubmittedAt: null,
    id: "int-001",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atDate(0, 9, 0),
    status: "UPCOMING",
  },
  {
    applicationId: "app-002",
    durationMinutes: 45,
    endAt: atDate(0, 11, 15),
    feedbackSubmittedAt: null,
    id: "int-002",
    interviewerName: "Le Hoang Nam",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(0, 10, 30),
    status: "SCHEDULED",
  },
  {
    applicationId: "app-003",
    durationMinutes: 45,
    endAt: atDate(0, 14, 15),
    feedbackSubmittedAt: null,
    id: "int-003",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atDate(0, 13, 30),
    status: "SCHEDULED",
  },
  {
    applicationId: "app-004",
    durationMinutes: 45,
    endAt: atDate(-1, 15, 45),
    feedbackSubmittedAt: null,
    id: "int-004",
    interviewerName: "Le Hoang Nam",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(-1, 15, 0),
    status: "NO_SHOW",
  },
  {
    applicationId: "app-005",
    durationMinutes: 45,
    endAt: atDate(-1, 17, 15),
    feedbackSubmittedAt: atDate(-1, 17, 40),
    id: "int-005",
    interviewerName: "Phan Tuan Anh",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(-1, 16, 30),
    status: "COMPLETED",
  },
  {
    applicationId: "app-009",
    durationMinutes: 45,
    endAt: atDate(-2, 15, 15),
    feedbackSubmittedAt: null,
    id: "int-006",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atDate(-2, 14, 30),
    status: "NEEDS_FEEDBACK",
  },
  {
    applicationId: "app-012",
    durationMinutes: 60,
    endAt: atDate(-6, 11, 0),
    feedbackSubmittedAt: atDate(-6, 11, 20),
    id: "int-007",
    interviewerName: "Le Hoang Nam",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(-6, 10, 0),
    status: "COMPLETED",
  },
  {
    applicationId: "app-013",
    durationMinutes: 45,
    endAt: atDate(-8, 15, 15),
    feedbackSubmittedAt: null,
    id: "int-008",
    interviewerName: "Le Hoang Nam",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(-8, 14, 30),
    status: "CANCELLED",
  },
  {
    applicationId: "app-014",
    durationMinutes: 45,
    endAt: atDate(-10, 11, 45),
    feedbackSubmittedAt: null,
    id: "int-009",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atDate(-10, 11, 0),
    status: "NEEDS_FEEDBACK",
  },
  {
    applicationId: "app-015",
    durationMinutes: 60,
    endAt: atDate(-12, 15, 0),
    feedbackSubmittedAt: atDate(-12, 15, 25),
    id: "int-010",
    interviewerName: "Phan Tuan Anh",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(-12, 14, 0),
    status: "COMPLETED",
  },
  {
    applicationId: "app-018",
    durationMinutes: 45,
    endAt: atDate(-24, 10, 45),
    feedbackSubmittedAt: atDate(-24, 11, 5),
    id: "int-011",
    interviewerName: "Le Hoang Nam",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atDate(-24, 10, 0),
    status: "COMPLETED",
  },
  {
    applicationId: "app-020",
    durationMinutes: 45,
    endAt: atDate(-33, 10, 15),
    feedbackSubmittedAt: null,
    id: "int-012",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atDate(-33, 9, 30),
    status: "NEEDS_FEEDBACK",
  },
  {
    applicationId: "app-021",
    durationMinutes: 45,
    endAt: atMonth(-2, 15, 14, 45),
    feedbackSubmittedAt: atMonth(-2, 15, 15, 10),
    id: "int-013",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atMonth(-2, 15, 14, 0),
    status: "COMPLETED",
  },
  {
    applicationId: "app-024",
    durationMinutes: 45,
    endAt: atMonth(-4, 11, 11, 45),
    feedbackSubmittedAt: atMonth(-4, 11, 12, 5),
    id: "int-014",
    interviewerName: "Le Hoang Nam",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atMonth(-4, 11, 11, 0),
    status: "COMPLETED",
  },
  {
    applicationId: "app-026",
    durationMinutes: 45,
    endAt: atMonth(-6, 22, 15, 5),
    feedbackSubmittedAt: null,
    id: "int-015",
    interviewerName: "Phan Tuan Anh",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    scheduledAt: atMonth(-6, 22, 14, 20),
    status: "NO_SHOW",
  },
  {
    applicationId: "app-028",
    durationMinutes: 45,
    endAt: atMonth(-8, 14, 13, 45),
    feedbackSubmittedAt: atMonth(-8, 14, 14, 0),
    id: "int-016",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atMonth(-8, 14, 13, 0),
    status: "COMPLETED",
  },
  {
    applicationId: "app-030",
    durationMinutes: 60,
    endAt: atMonth(-11, 10, 10, 45),
    feedbackSubmittedAt: atMonth(-11, 10, 11, 10),
    id: "int-017",
    interviewerName: "Tran Thi Mai",
    round: "Vòng 1: Sàng lọc nhân sự",
    scheduledAt: atMonth(-11, 10, 9, 45),
    status: "COMPLETED",
  },
];

function createViews(jobId: string, when: Date, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    jobId,
    viewedAt: new Date(when.getTime() + index * 60_000),
    visitorId: `${jobId}-${when.getTime()}-${index + 1}`,
  }));
}

export const dashboardJobViews: DashboardJobView[] = [
  ...createViews("job-frontend-react", atDate(0, 8, 0), 22),
  ...createViews("job-backend-node", atDate(0, 9, 0), 16),
  ...createViews("job-uiux", atDate(-1, 10, 0), 18),
  ...createViews("job-qa", atDate(-2, 11, 0), 15),
  ...createViews("job-devops", atDate(-3, 9, 30), 14),
  ...createViews("job-product", atDate(-4, 13, 0), 12),
  ...createViews("job-frontend-react", atDate(-5, 10, 0), 20),
  ...createViews("job-backend-node", atDate(-6, 14, 0), 18),
  ...createViews("job-uiux", atDate(-7, 8, 0), 16),
  ...createViews("job-product", atDate(-10, 9, 0), 14),
  ...createViews("job-qa", atDate(-14, 15, 0), 14),
  ...createViews("job-devops", atDate(-18, 10, 0), 16),
  ...createViews("job-frontend-react", atDate(-21, 9, 0), 21),
  ...createViews("job-backend-node", atDate(-24, 10, 0), 19),
  ...createViews("job-uiux", atDate(-28, 14, 0), 15),
  ...createViews("job-product", atMonth(-2, 12, 10, 0), 24),
  ...createViews("job-qa", atMonth(-3, 8, 11, 0), 18),
  ...createViews("job-devops", atMonth(-4, 9, 12, 0), 17),
  ...createViews("job-frontend-react", atMonth(-5, 6, 9, 0), 22),
  ...createViews("job-backend-node", atMonth(-6, 20, 10, 0), 20),
  ...createViews("job-uiux", atMonth(-7, 15, 13, 0), 16),
  ...createViews("job-product", atMonth(-8, 3, 15, 0), 14),
  ...createViews("job-qa", atMonth(-10, 6, 9, 0), 18),
  ...createViews("job-devops", atMonth(-11, 11, 8, 0), 16),
];

export const dashboardOffers: DashboardOffer[] = [
  {
    applicationId: "app-005",
    createdAt: atDate(-1, 18, 20),
    finalResultAt: atDate(0, 8, 0),
    id: "offer-001",
    status: "ACCEPTED",
  },
  {
    applicationId: "app-012",
    createdAt: atDate(-6, 11, 15),
    finalResultAt: null,
    id: "offer-002",
    status: "OFFER_SENT",
  },
  {
    applicationId: "app-018",
    createdAt: atDate(-24, 11, 15),
    finalResultAt: null,
    id: "offer-003",
    status: "PENDING",
  },
  {
    applicationId: "app-021",
    createdAt: atMonth(-2, 15, 15, 30),
    finalResultAt: atMonth(-2, 18, 11, 0),
    id: "offer-004",
    status: "ACCEPTED",
  },
  {
    applicationId: "app-026",
    createdAt: atMonth(-6, 22, 15, 25),
    finalResultAt: null,
    id: "offer-005",
    status: "OFFER_SENT",
  },
  {
    applicationId: "app-028",
    createdAt: atMonth(-8, 14, 14, 10),
    finalResultAt: atMonth(-8, 17, 10, 0),
    id: "offer-006",
    status: "ACCEPTED",
  },
];

export const dashboardTrustSnapshots: DashboardTrustSnapshot[] = [
  {
    date: atMonth(-11, 1),
    jobQualityScore: 72,
    profileVerificationScore: 81,
    responseScore: 70,
    violationScore: 92,
  },
  {
    date: atMonth(-10, 1),
    jobQualityScore: 73,
    profileVerificationScore: 82,
    responseScore: 71,
    violationScore: 93,
  },
  {
    date: atMonth(-9, 1),
    jobQualityScore: 74,
    profileVerificationScore: 82,
    responseScore: 72,
    violationScore: 92,
  },
  {
    date: atMonth(-8, 1),
    jobQualityScore: 75,
    profileVerificationScore: 83,
    responseScore: 74,
    violationScore: 92,
  },
  {
    date: atMonth(-7, 1),
    jobQualityScore: 76,
    profileVerificationScore: 83,
    responseScore: 75,
    violationScore: 93,
  },
  {
    date: atMonth(-6, 1),
    jobQualityScore: 77,
    profileVerificationScore: 84,
    responseScore: 76,
    violationScore: 93,
  },
  {
    date: atMonth(-5, 1),
    jobQualityScore: 78,
    profileVerificationScore: 85,
    responseScore: 78,
    violationScore: 94,
  },
  {
    date: atMonth(-4, 1),
    jobQualityScore: 79,
    profileVerificationScore: 86,
    responseScore: 79,
    violationScore: 94,
  },
  {
    date: atMonth(-3, 1),
    jobQualityScore: 80,
    profileVerificationScore: 86,
    responseScore: 81,
    violationScore: 95,
  },
  {
    date: atMonth(-2, 1),
    jobQualityScore: 81,
    profileVerificationScore: 87,
    responseScore: 82,
    violationScore: 95,
  },
  {
    date: atMonth(-1, 1),
    jobQualityScore: 82,
    profileVerificationScore: 88,
    responseScore: 84,
    violationScore: 96,
  },
  {
    date: atMonth(0, 1),
    jobQualityScore: 83,
    profileVerificationScore: 89,
    responseScore: 86,
    violationScore: 96,
  },
];

export const packageUsage = [
  { icon: Home, label: "Lượt đăng tin", value: "12 / 20" },
  { icon: ChartNoAxesCombined, label: "Lượt đẩy tin", value: "28 / 60" },
  { icon: Search, label: "Lượt tìm ứng viên", value: "186 / 500" },
] as const;

export const trustItems = [
  "Hồ sơ công ty đầy đủ",
  "Phản hồi ứng viên tốt",
  "Tần suất đăng tin ổn định",
] as const;

export const dashboardMetricIcons = {
  activeJobs: FileArchive,
  applicationRate: BarChart3,
  expiringJobs: Clock3,
  interviews: UsersRound,
  interviewsNeedFeedback: Star,
  newApplications: ClipboardCheck,
  noShowInterviews: CalendarCheck2,
  offersNeedUpdate: Gift,
  responseRate: MessageCircle,
  trustScore: ShieldCheck,
  upcomingInterviews: CalendarCheck2,
  unviewedCvs: FileArchive,
} as const;

export type JobStatus = "active" | "expiring" | "needsOptimization";

export const statusLabels: Record<JobStatus, string> = {
  active: "Đang tuyển",
  expiring: "Sắp hết hạn",
  needsOptimization: "Cần tối ưu",
};

export const jobRows = dashboardJobs
  .filter((job) => job.status === "ACTIVE")
  .map((job) => {
    const applications = dashboardApplications.filter(
      (application) => application.jobId === job.id,
    ).length;
    const views = dashboardJobViews.filter((view) => view.jobId === job.id).length;
    const conversion = views === 0 ? 0 : (applications / views) * 100;
    const remainingDays = Math.max(
      0,
      Math.ceil(
        (job.expiresAt.getTime() - dashboardReferenceNow.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );
    const status: JobStatus =
      remainingDays <= 2 ? "needsOptimization" : remainingDays <= 7 ? "expiring" : "active";

    return {
      applications,
      conversion: `${conversion.toFixed(1)}%`,
      daysLeft: `${remainingDays} ngày`,
      status,
      title: job.title,
      views: new Intl.NumberFormat("vi-VN").format(views),
    };
  });
