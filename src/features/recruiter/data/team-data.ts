import type { LucideIcon } from "@/features/recruiter/icons";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Crown,
  LockKey,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "@/features/recruiter/icons";

export type TeamRole = "OWNER" | "ADMIN" | "RECRUITER" | "INTERVIEWER";

export type MemberStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

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
  role: TeamRole;
  status: MemberStatus;
};

export type RoleDefinition = {
  description: string;
  icon: LucideIcon;
  label: string;
  role: TeamRole;
  tone: "violet" | "blue" | "emerald" | "orange";
};

export const roleDefinitions: Record<TeamRole, RoleDefinition> = {
  ADMIN: {
    description: "Quản lý vận hành tuyển dụng",
    icon: ShieldCheck,
    label: "Admin",
    role: "ADMIN",
    tone: "blue",
  },
  INTERVIEWER: {
    description: "Xem lịch & đánh giá phỏng vấn",
    icon: UsersRound,
    label: "Interviewer",
    role: "INTERVIEWER",
    tone: "orange",
  },
  OWNER: {
    description: "Toàn quyền hệ thống",
    icon: Crown,
    label: "Owner",
    role: "OWNER",
    tone: "violet",
  },
  RECRUITER: {
    description: "Quản lý tin & ứng viên",
    icon: UserRound,
    label: "Recruiter",
    role: "RECRUITER",
    tone: "emerald",
  },
};

export const roleOrder: TeamRole[] = ["OWNER", "ADMIN", "RECRUITER", "INTERVIEWER"];

export const teamKpis = [
  {
    icon: UsersRound,
    label: "Tổng thành viên",
    tone: "emerald",
    trend: "2 so với tuần trước",
    trendDirection: "up",
    value: "12",
  },
  {
    icon: CheckCircle2,
    label: "Đang hoạt động",
    tone: "emerald",
    trend: "1 so với tuần trước",
    trendDirection: "up",
    value: "9",
  },
  {
    icon: Clock3,
    label: "Chờ xác nhận",
    tone: "amber",
    trend: "1 so với tuần trước",
    trendDirection: "down",
    value: "2",
  },
  {
    icon: LockKey,
    label: "Tạm khóa",
    tone: "rose",
    trend: "Không đổi",
    trendDirection: "flat",
    value: "1",
  },
] as const;

export const teamTabs = [
  { icon: UsersRound, id: "members", label: "Thành viên" },
  { icon: CalendarClock, id: "activity", label: "Lịch sử hoạt động" },
] as const;

export type TeamTabId = (typeof teamTabs)[number]["id"];

export const teamMembers: CompanyMember[] = [
  {
    actionLabel: "Xem chi tiết",
    assignedJobCount: 8,
    avatar: "NTL",
    department: "HR",
    email: "linh.nguyen@upnext.vn",
    fullName: "Nguyễn Thu Linh",
    id: "mem-1",
    interviewCount: 12,
    lastActiveAt: "10 phút trước",
    role: "OWNER",
    status: "ACTIVE",
  },
  {
    actionLabel: "Đổi vai trò",
    assignedJobCount: 6,
    avatar: "TTM",
    department: "HR",
    email: "mai.tran@upnext.vn",
    fullName: "Trần Thị Mai",
    id: "mem-2",
    interviewCount: 10,
    lastActiveAt: "35 phút trước",
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    actionLabel: "Đổi vai trò",
    assignedJobCount: 4,
    avatar: "LHN",
    department: "HR",
    email: "nam.le@upnext.vn",
    fullName: "Lê Hoàng Nam",
    id: "mem-3",
    interviewCount: 8,
    lastActiveAt: "1 giờ trước",
    role: "RECRUITER",
    status: "ACTIVE",
  },
  {
    actionLabel: "Gửi lại lời mời",
    assignedJobCount: 0,
    avatar: "PQB",
    department: "Engineering",
    email: "bao.pham@upnext.vn",
    fullName: "Phạm Quốc Bảo",
    id: "mem-4",
    interviewCount: 3,
    lastActiveAt: "Chưa đăng nhập",
    role: "INTERVIEWER",
    status: "PENDING",
  },
  {
    actionLabel: "Kích hoạt",
    assignedJobCount: 0,
    avatar: "DTH",
    department: "Engineering",
    email: "hieu.do@upnext.vn",
    fullName: "Đỗ Trung Hiếu",
    id: "mem-5",
    interviewCount: 5,
    lastActiveAt: "3 ngày trước",
    role: "INTERVIEWER",
    status: "SUSPENDED",
  },
];

export const permissionRules = [
  "Luôn phải có ít nhất 1 Owner",
  "Admin không thể chỉnh sửa quyền hệ thống",
  "Recruiter không có quyền quản lý thành viên",
  "Interviewer chỉ xem ứng viên được gán",
] as const;

export const activityLogs = [
  {
    actor: "Nguyễn Thu Linh",
    action: "Mời thành viên",
    note: "Vai trò Interviewer",
    target: "Phạm Quốc Bảo",
    time: "10 phút trước",
  },
  {
    actor: "Trần Thị Mai",
    action: "Đổi vai trò",
    note: "Recruiter",
    target: "Lê Hoàng Nam",
    time: "35 phút trước",
  },
  {
    actor: "Nguyễn Thu Linh",
    action: "Tạm khóa thành viên",
    note: "Tài khoản tạm khóa",
    target: "Đỗ Trung Hiếu",
    time: "1 giờ trước",
  },
  {
    actor: "Trần Thị Mai",
    action: "Gửi lại lời mời",
    note: "Chờ xác nhận",
    target: "Phạm Quốc Bảo",
    time: "2 giờ trước",
  },
] as const;
