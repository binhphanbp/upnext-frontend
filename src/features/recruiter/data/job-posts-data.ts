import type { LucideIcon } from "@/features/recruiter/icons";
import {
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  Edit3,
  Eye,
  FileWarning,
  ListFilter,
  Send,
  Sparkles,
  UsersRound,
} from "@/features/recruiter/icons";

export type JobKpiItem = {
  accent: "blue" | "green" | "orange" | "red" | "violet";
  helper: string;
  icon: LucideIcon;
  label: string;
  trend?: string;
  value: string;
};

export const jobKpis: JobKpiItem[] = [
  {
    accent: "blue",
    helper: "trong 7 ngày",
    icon: BriefcaseBusiness,
    label: "Tổng tin",
    trend: "3",
    value: "24",
  },
  {
    accent: "green",
    helper: "so với tuần trước",
    icon: UsersRound,
    label: "Đang tuyển",
    trend: "2",
    value: "12",
  },
  {
    accent: "orange",
    helper: "2 tin mới gửi duyệt",
    icon: Clock3,
    label: "Chờ duyệt",
    value: "3",
  },
  {
    accent: "red",
    helper: "Cần gia hạn sớm",
    icon: CalendarClock,
    label: "Sắp hết hạn",
    value: "4",
  },
  {
    accent: "violet",
    helper: "Nội dung cần cập nhật",
    icon: Edit3,
    label: "Cần chỉnh sửa",
    value: "1",
  },
];

export const jobTabs = [
  "Tất cả",
  "Đang tuyển",
  "Chờ duyệt",
  "Sắp hết hạn",
  "Hết hạn",
  "Nháp",
  "Bị khóa",
] as const;

export type JobPostStatus = "active" | "expiring" | "needsOptimization" | "pending";
export type JobEffectiveness = "good" | "ok" | "needsOptimization" | "new";

export type RecruiterJobPost = {
  applications: string;
  conversion: string;
  daysLeft: string;
  effectiveness: JobEffectiveness;
  newCandidates: string;
  status: JobPostStatus;
  title: string;
  views: string;
};

export const recruiterJobPosts: RecruiterJobPost[] = [
  {
    applications: "120",
    conversion: "9.6%",
    daysLeft: "12 ngày",
    effectiveness: "good",
    newCandidates: "18",
    status: "active",
    title: "Frontend Developer (React)",
    views: "1,248",
  },
  {
    applications: "95",
    conversion: "9.7%",
    daysLeft: "18 ngày",
    effectiveness: "good",
    newCandidates: "14",
    status: "active",
    title: "Backend Developer (Node.js)",
    views: "982",
  },
  {
    applications: "78",
    conversion: "10.3%",
    daysLeft: "7 ngày",
    effectiveness: "ok",
    newCandidates: "9",
    status: "active",
    title: "UI/UX Designer",
    views: "756",
  },
  {
    applications: "66",
    conversion: "10.4%",
    daysLeft: "2 ngày",
    effectiveness: "ok",
    newCandidates: "7",
    status: "expiring",
    title: "QA Engineer (Test Automation)",
    views: "634",
  },
  {
    applications: "40",
    conversion: "7.8%",
    daysLeft: "15 ngày",
    effectiveness: "needsOptimization",
    newCandidates: "3",
    status: "needsOptimization",
    title: "DevOps Engineer",
    views: "512",
  },
  {
    applications: "0",
    conversion: "—",
    daysLeft: "—",
    effectiveness: "new",
    newCandidates: "0",
    status: "pending",
    title: "Product Designer",
    views: "286",
  },
];

export const statusLabels: Record<JobPostStatus, string> = {
  active: "Đang tuyển",
  expiring: "Sắp hết hạn",
  needsOptimization: "Cần tối ưu",
  pending: "Chờ duyệt",
};

export const effectivenessLabels: Record<JobEffectiveness, string> = {
  good: "Tốt",
  needsOptimization: "Cần tối ưu",
  new: "Mới",
  ok: "Ổn",
};

export const jobActionItems = [
  { color: "text-orange-500", icon: CalendarClock, text: "4 tin sắp hết hạn" },
  { color: "text-blue-500", icon: Clock3, text: "3 tin chờ duyệt" },
  { color: "text-violet-500", icon: Edit3, text: "1 tin cần chỉnh sửa nội dung" },
  {
    color: "text-emerald-500",
    icon: Eye,
    text: "2 tin có nhiều lượt xem nhưng ít hồ sơ",
  },
] as const;

export const postingPerformance = [
  { label: "Tổng lượt xem", trend: "18%", value: "4,418" },
  { label: "Tổng hồ sơ", trend: "12%", value: "399" },
  { label: "Tỷ lệ ứng tuyển TB", trend: "0.8%", value: "9.0%" },
] as const;

export const planResources = [
  { label: "Lượt đăng tin", percent: 60, value: "12 / 20" },
  { label: "Lượt đẩy tin", percent: 47, value: "28 / 60" },
  { label: "Lượt làm mới tin", percent: 30, value: "6 / 20" },
] as const;

export const filterControls = ["Trạng thái", "Địa điểm", "Ngày hết hạn", "Hiệu quả"] as const;

export { FileWarning, ListFilter, Send, Sparkles };
