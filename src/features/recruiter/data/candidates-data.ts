import type { LucideIcon } from "@/features/recruiter/icons";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  UsersRound,
} from "@/features/recruiter/icons";

export type CandidateKpi = {
  accent: "emerald" | "teal" | "amber" | "violet" | "green";
  icon: LucideIcon;
  label: string;
  trend: string;
  trendDirection: "up" | "down";
  value: string;
};

export const candidateKpis: CandidateKpi[] = [
  {
    accent: "emerald",
    icon: UsersRound,
    label: "Tổng ứng viên",
    trend: "18 hồ sơ trong 7 ngày",
    trendDirection: "up",
    value: "1,248",
  },
  {
    accent: "teal",
    icon: FileText,
    label: "Ứng viên mới",
    trend: "12 hồ sơ trong 7 ngày",
    trendDirection: "up",
    value: "86",
  },
  {
    accent: "amber",
    icon: Filter,
    label: "Đang sàng lọc",
    trend: "4% so với tuần trước",
    trendDirection: "down",
    value: "312",
  },
  {
    accent: "violet",
    icon: CalendarCheck2,
    label: "Chờ phỏng vấn",
    trend: "6 hồ sơ trong 7 ngày",
    trendDirection: "up",
    value: "36",
  },
  {
    accent: "green",
    icon: CheckCircle2,
    label: "Đã tuyển",
    trend: "2 hồ sơ trong 7 ngày",
    trendDirection: "up",
    value: "12",
  },
];

export const candidateTabs = [
  { count: "1,248", label: "Tất cả" },
  { count: "86", label: "Mới ứng tuyển" },
  { count: "102", label: "Đã xem" },
  { count: "312", label: "Sàng lọc" },
  { count: "36", label: "Hẹn PV" },
  { count: "28", label: "Phỏng vấn" },
  { count: "8", label: "Offer" },
  { count: "12", label: "Trúng tuyển" },
  { count: "662", label: "Từ chối" },
] as const;

export const quickFilters = [
  { count: "18", label: "CV chưa xem" },
  { count: "6", label: "Chờ phản hồi quá 48h" },
  { count: "4", label: "Sắp phỏng vấn" },
  { count: "2", label: "Đề xuất đổi lịch" },
] as const;

export type CandidateStatus =
  | "new"
  | "screening"
  | "interviewScheduled"
  | "interviewing"
  | "reviewed"
  | "offer"
  | "hired"
  | "rejected";

export type CandidateApplication = {
  actionLabel: string;
  appliedDate: string;
  appliedTime: string;
  avatarTone: "emerald" | "blue" | "pink" | "amber";
  email: string;
  experience: string;
  extraSkillCount?: number;
  id: string;
  interview?: {
    date: string;
    status?: "confirmed" | "pending";
    time: string;
    title: string;
  };
  jobCode: string;
  jobTitle: string;
  name: string;
  selected: boolean;
  skills: string[];
  status: CandidateStatus;
};

export const candidates: CandidateApplication[] = [
  {
    actionLabel: "Xem CV",
    appliedDate: "10/06/2024",
    appliedTime: "09:20",
    avatarTone: "pink",
    email: "minhanh@gmail.com",
    experience: "3 năm",
    extraSkillCount: 2,
    id: "1",
    jobCode: "#UPN-2345",
    jobTitle: "Frontend Developer",
    name: "Nguyễn Minh Anh",
    selected: true,
    skills: ["React", "TypeScript", "Tailwind CSS"],
    status: "new",
  },
  {
    actionLabel: "Hẹn PV",
    appliedDate: "10/06/2024",
    appliedTime: "08:45",
    avatarTone: "blue",
    email: "quocbao@gmail.com",
    experience: "4 năm",
    extraSkillCount: 1,
    id: "2",
    jobCode: "#UPN-2346",
    jobTitle: "Backend Developer",
    name: "Trần Quốc Bảo",
    selected: true,
    skills: ["Node.js", "NestJS", "PostgreSQL"],
    status: "screening",
  },
  {
    actionLabel: "Xem lịch",
    appliedDate: "09/06/2024",
    appliedTime: "16:15",
    avatarTone: "pink",
    email: "thutrang@gmail.com",
    experience: "2 năm",
    id: "3",
    interview: {
      date: "13/06/2024",
      status: "pending",
      time: "13:30",
      title: "Vòng 1 - HR",
    },
    jobCode: "#UPN-2343",
    jobTitle: "UI/UX Designer",
    name: "Lê Thu Trang",
    selected: true,
    skills: ["Figma", "Adobe XD", "Research"],
    status: "interviewScheduled",
  },
  {
    actionLabel: "Đánh giá",
    appliedDate: "09/06/2024",
    appliedTime: "11:30",
    avatarTone: "amber",
    email: "hoangnam@gmail.com",
    experience: "3 năm",
    extraSkillCount: 1,
    id: "4",
    interview: {
      date: "11/06/2024",
      status: "confirmed",
      time: "09:00",
      title: "Vòng 2 - Technical",
    },
    jobCode: "#UPN-2341",
    jobTitle: "QA Engineer",
    name: "Phạm Hoàng Nam",
    selected: false,
    skills: ["Selenium", "Cypress", "Postman"],
    status: "interviewing",
  },
  {
    actionLabel: "Xem CV",
    appliedDate: "08/06/2024",
    appliedTime: "15:20",
    avatarTone: "pink",
    email: "thuylinh@gmail.com",
    experience: "5 năm",
    id: "5",
    jobCode: "#UPN-2340",
    jobTitle: "Business Analyst",
    name: "Vũ Thùy Linh",
    selected: false,
    skills: ["SQL", "Excel", "Power BI"],
    status: "reviewed",
  },
  {
    actionLabel: "Cập nhật",
    appliedDate: "08/06/2024",
    appliedTime: "10:05",
    avatarTone: "blue",
    email: "hieu.dt@gmail.com",
    experience: "4 năm",
    extraSkillCount: 1,
    id: "6",
    interview: {
      date: "08/06/2024",
      time: "11:00",
      title: "Vòng 3 - Offer",
    },
    jobCode: "#UPN-2339",
    jobTitle: "DevOps Engineer",
    name: "Đỗ Trung Hiếu",
    selected: false,
    skills: ["AWS", "Docker", "Kubernetes"],
    status: "offer",
  },
  {
    actionLabel: "Xem hồ sơ",
    appliedDate: "07/06/2024",
    appliedTime: "14:40",
    avatarTone: "amber",
    email: "dungnv@gmail.com",
    experience: "2 năm",
    extraSkillCount: 1,
    id: "7",
    jobCode: "#UPN-2338",
    jobTitle: "Frontend Developer",
    name: "Ngô Văn Dũng",
    selected: false,
    skills: ["React Native", "Redux", "TypeScript"],
    status: "hired",
  },
  {
    actionLabel: "Xem lý do",
    appliedDate: "07/06/2024",
    appliedTime: "09:10",
    avatarTone: "pink",
    email: "maibt@gmail.com",
    experience: "1 năm",
    id: "8",
    jobCode: "#UPN-2337",
    jobTitle: "HR Executive",
    name: "Bùi Thị Mai",
    selected: false,
    skills: ["Communication", "HRM", "Excel"],
    status: "rejected",
  },
];

export const statusLabels: Record<CandidateStatus, string> = {
  hired: "Trúng tuyển",
  interviewScheduled: "Hẹn phỏng vấn",
  interviewing: "Phỏng vấn",
  new: "Mới ứng tuyển",
  offer: "Offer",
  rejected: "Từ chối",
  reviewed: "Đã xem",
  screening: "Sàng lọc",
};

export const rightPanelTasks = [
  { count: "18", icon: Eye, label: "CV chưa xem", tone: "blue" },
  { count: "6", icon: Clock3, label: "Hồ sơ chờ phản hồi quá 48h", tone: "amber" },
  {
    count: "4",
    icon: CalendarCheck2,
    label: "Lịch phỏng vấn chờ xác nhận",
    tone: "violet",
  },
  { count: "2", icon: RefreshCw, label: "Ứng viên đề xuất đổi lịch", tone: "blue" },
] as const;

export const performanceMetrics = [
  {
    color: "#059669",
    label: "Tỷ lệ phản hồi",
    trend: "8% so với tuần trước",
    trendDirection: "up",
    value: "92%",
  },
  {
    color: "#7c3aed",
    label: "Thời gian xem CV trung bình",
    trend: "2h so với tuần trước",
    trendDirection: "down",
    value: "18h",
  },
  {
    color: "#2563eb",
    label: "Hồ sơ xử lý trong tuần",
    trend: "14 hồ sơ so với tuần trước",
    trendDirection: "up",
    value: "86",
  },
] as const;

export const reminderItems = [
  "Phản hồi sớm giúp tăng điểm uy tín",
  "Không để hồ sơ chờ quá 7 ngày",
  "Cập nhật trạng thái rõ ràng cho ứng viên",
] as const;
