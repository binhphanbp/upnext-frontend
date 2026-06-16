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
  ShieldCheck,
  Settings,
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

export type KpiCard = {
  accent: "blue" | "amber" | "green" | "violet" | "teal" | "sky";
  icon: LucideIcon;
  label: string;
  trend: string;
  value: string;
};

export const kpiCards: KpiCard[] = [
  {
    accent: "blue",
    icon: FileArchive,
    label: "Tin đang tuyển",
    trend: "2 so với hôm qua",
    value: "12",
  },
  {
    accent: "amber",
    icon: ClipboardCheck,
    label: "Hồ sơ mới",
    trend: "15% so với hôm qua",
    value: "48",
  },
  {
    accent: "green",
    icon: UsersRound,
    label: "Phỏng vấn tuần này",
    trend: "2 so với tuần trước",
    value: "9",
  },
  {
    accent: "violet",
    icon: MessageCircle,
    label: "Tỷ lệ phản hồi",
    trend: "6% so với tuần trước",
    value: "92%",
  },
  {
    accent: "teal",
    icon: BarChart3,
    label: "Tỷ lệ ứng tuyển",
    trend: "2.4% so với tuần trước",
    value: "18.6%",
  },
  {
    accent: "sky",
    icon: ShieldCheck,
    label: "Điểm uy tín",
    trend: "5 điểm so với tháng trước",
    value: "86/100",
  },
];

export type TaskItem = {
  count: number;
  icon: LucideIcon;
  label: string;
};

export const taskItems: TaskItem[] = [
  { count: 18, icon: FileArchive, label: "CV chưa xem" },
  { count: 3, icon: Clock3, label: "Tin sắp hết hạn" },
  { count: 4, icon: CalendarCheck2, label: "Lịch chờ xác nhận" },
  { count: 6, icon: Star, label: "Phỏng vấn cần đánh giá" },
  { count: 2, icon: Gift, label: "Offer chờ phản hồi" },
];

export const performanceData = [
  { date: "22/04", interviews: 12, profiles: 24 },
  { date: "24/04", interviews: 16, profiles: 31 },
  { date: "26/04", interviews: 22, profiles: 34 },
  { date: "29/04", interviews: 18, profiles: 48 },
  { date: "01/05", interviews: 14, profiles: 52 },
  { date: "03/05", interviews: 15, profiles: 43 },
  { date: "06/05", interviews: 24, profiles: 38 },
  { date: "08/05", interviews: 28, profiles: 57 },
  { date: "10/05", interviews: 26, profiles: 61 },
  { date: "13/05", interviews: 32, profiles: 86 },
  { date: "15/05", interviews: 46, profiles: 78 },
  { date: "17/05", interviews: 25, profiles: 83 },
  { date: "20/05", interviews: 34, profiles: 80 },
] as const;

export const pipelineStages = [
  { color: "bg-emerald-500", label: "Đã nộp", percent: 100, value: "1,248" },
  { color: "bg-emerald-500", label: "Đã xem", percent: 70, value: "876" },
  { color: "bg-emerald-500", label: "Sàng lọc", percent: 25, value: "312" },
  { color: "bg-amber-400", label: "Hẹn PV", percent: 15, value: "186" },
  { color: "bg-orange-500", label: "Phỏng vấn", percent: 7, value: "92" },
  { color: "bg-rose-500", label: "Offer", percent: 2, value: "24" },
  { color: "bg-emerald-500", label: "Trúng tuyển", percent: 1, value: "12" },
] as const;

export type InterviewStatus = "confirmed" | "pending" | "reschedule";

export const interviews = [
  {
    duration: "30p",
    name: "Nguyễn Minh Anh",
    role: "Frontend Developer",
    round: "Vòng 1: Phỏng vấn HR",
    status: "confirmed" as InterviewStatus,
    time: "09:00",
  },
  {
    duration: "45p",
    name: "Trần Quốc Bảo",
    role: "Backend Developer",
    round: "Vòng 2: Technical",
    status: "pending" as InterviewStatus,
    time: "10:30",
  },
  {
    duration: "30p",
    name: "Lê Thu Trang",
    role: "UI/UX Designer",
    round: "Vòng 1: Phỏng vấn HR",
    status: "confirmed" as InterviewStatus,
    time: "13:30",
  },
  {
    duration: "60p",
    name: "Phạm Hoàng Nam",
    role: "QA Engineer",
    round: "Vòng 2: Technical",
    status: "reschedule" as InterviewStatus,
    time: "15:00",
  },
] as const;

export type JobStatus = "active" | "expiring" | "needsOptimization";

export const jobRows = [
  {
    applications: 120,
    conversion: "9.6%",
    daysLeft: "12 ngày",
    title: "Frontend Developer (React)",
    status: "active" as JobStatus,
    views: "1,248",
  },
  {
    applications: 95,
    conversion: "9.7%",
    daysLeft: "18 ngày",
    title: "Backend Developer (Node.js)",
    status: "active" as JobStatus,
    views: "982",
  },
  {
    applications: 78,
    conversion: "10.3%",
    daysLeft: "7 ngày",
    title: "UI/UX Designer",
    status: "active" as JobStatus,
    views: "756",
  },
  {
    applications: 66,
    conversion: "10.4%",
    daysLeft: "2 ngày",
    title: "QA Engineer (Test Automation)",
    status: "expiring" as JobStatus,
    views: "634",
  },
  {
    applications: 40,
    conversion: "7.8%",
    daysLeft: "15 ngày",
    title: "DevOps Engineer",
    status: "needsOptimization" as JobStatus,
    views: "512",
  },
] as const;

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

export const statusLabels: Record<JobStatus, string> = {
  active: "Đang tuyển",
  expiring: "Sắp hết hạn",
  needsOptimization: "Cần tối ưu",
};

export const interviewStatusLabels: Record<InterviewStatus, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  reschedule: "Đổi lịch",
};
