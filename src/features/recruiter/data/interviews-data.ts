import type { LucideIcon } from "@/features/recruiter/icons";
import {
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  NotePencil,
  UserMinus,
} from "@/features/recruiter/icons";

export type InterviewStatus =
  | "SCHEDULED"
  | "UPCOMING"
  | "IN_PROGRESS"
  | "NEEDS_FEEDBACK"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export type InterviewResult = "PASS" | "CONSIDER" | "FAIL" | "NO_SHOW" | "NONE";

export type InterviewRound = "HR" | "TECHNICAL" | "FINAL" | "OFFER";

export type InterviewMode = "ONLINE" | "OFFLINE";

export type RecruiterInterview = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateInitials: string;
  candidateTone: "emerald" | "blue" | "amber" | "rose" | "violet";
  jobTitle: string;
  jobStack?: string;
  round: InterviewRound;
  roundLabel: string;
  interviewerName: string;
  interviewerTitle: string;
  interviewerInitials: string;
  dateLabel: string;
  timeRange: string;
  durationLabel: string;
  mode: InterviewMode;
  status: InterviewStatus;
  result: InterviewResult;
  actionLabel: string;
};

export type InterviewKpi = {
  accent: "emerald" | "amber" | "violet" | "green" | "rose";
  icon: LucideIcon;
  label: string;
  value: string;
  trendValue: string;
  trendLabel: string;
  trendDirection: "up" | "down";
};

export const interviewKpis: InterviewKpi[] = [
  {
    accent: "emerald",
    icon: CalendarCheck2,
    label: "Lịch hôm nay",
    value: "8",
    trendValue: "2",
    trendLabel: "so với hôm qua",
    trendDirection: "up",
  },
  {
    accent: "amber",
    icon: Clock3,
    label: "Sắp diễn ra",
    value: "3",
    trendValue: "1",
    trendLabel: "so với hôm qua",
    trendDirection: "up",
  },
  {
    accent: "violet",
    icon: NotePencil,
    label: "Cần đánh giá",
    value: "6",
    trendValue: "2",
    trendLabel: "so với tuần trước",
    trendDirection: "up",
  },
  {
    accent: "green",
    icon: CheckCircle2,
    label: "Hoàn thành tuần này",
    value: "24",
    trendValue: "15%",
    trendLabel: "so với tuần trước",
    trendDirection: "up",
  },
  {
    accent: "rose",
    icon: UserMinus,
    label: "Không tham gia",
    value: "2",
    trendValue: "1",
    trendLabel: "so với tuần trước",
    trendDirection: "down",
  },
];

export const interviewTabs = [
  { label: "Tất cả", count: 32 },
  { label: "Hôm nay", count: 8 },
  { label: "Sắp tới", count: 11 },
  { label: "Sắp diễn ra", count: 3 },
  { label: "Cần đánh giá", count: 6 },
  { label: "Hoàn thành", count: 24 },
  { label: "Không tham gia", count: 2 },
  { label: "Đã hủy", count: 1 },
] as const;

export const interviews: RecruiterInterview[] = [
  {
    id: "int-001",
    candidateName: "Nguyễn Minh Anh",
    candidateEmail: "minhanh.nguyen@gmail.com",
    candidateInitials: "MA",
    candidateTone: "rose",
    jobTitle: "Lập trình viên Frontend",
    jobStack: "(React)",
    round: "HR",
    roundLabel: "Vòng 1\nSàng lọc nhân sự",
    interviewerName: "Trần Thị Mai",
    interviewerTitle: "Quản lý nhân sự",
    interviewerInitials: "TM",
    dateLabel: "Hôm nay",
    timeRange: "09:00 - 09:45",
    durationLabel: "45 phút",
    mode: "ONLINE",
    status: "UPCOMING",
    result: "NONE",
    actionLabel: "Vào phòng",
  },
  {
    id: "int-002",
    candidateName: "Trần Quốc Bảo",
    candidateEmail: "quocbao.tran@gmail.com",
    candidateInitials: "QB",
    candidateTone: "blue",
    jobTitle: "Lập trình viên Backend",
    jobStack: "(Node.js)",
    round: "TECHNICAL",
    roundLabel: "Vòng 2\nPhỏng vấn kỹ thuật",
    interviewerName: "Lê Hoàng Nam",
    interviewerTitle: "Trưởng nhóm kỹ thuật",
    interviewerInitials: "HN",
    dateLabel: "Hôm nay",
    timeRange: "10:30 - 11:15",
    durationLabel: "45 phút",
    mode: "ONLINE",
    status: "SCHEDULED",
    result: "NONE",
    actionLabel: "Xem lịch",
  },
  {
    id: "int-003",
    candidateName: "Lê Thu Trang",
    candidateEmail: "thutrang.le@gmail.com",
    candidateInitials: "TT",
    candidateTone: "amber",
    jobTitle: "Nhà thiết kế UI/UX",
    round: "HR",
    roundLabel: "Vòng 1\nSàng lọc nhân sự",
    interviewerName: "Trần Thị Mai",
    interviewerTitle: "Quản lý nhân sự",
    interviewerInitials: "TM",
    dateLabel: "Hôm nay",
    timeRange: "13:30 - 14:15",
    durationLabel: "45 phút",
    mode: "OFFLINE",
    status: "NEEDS_FEEDBACK",
    result: "NONE",
    actionLabel: "Đánh giá",
  },
  {
    id: "int-004",
    candidateName: "Phạm Hoàng Nam",
    candidateEmail: "hoangnam.pham@gmail.com",
    candidateInitials: "HN",
    candidateTone: "blue",
    jobTitle: "Kỹ sư kiểm thử",
    round: "TECHNICAL",
    roundLabel: "Vòng 2\nPhỏng vấn kỹ thuật",
    interviewerName: "Lê Hoàng Nam",
    interviewerTitle: "Trưởng nhóm kỹ thuật",
    interviewerInitials: "HN",
    dateLabel: "Hôm qua",
    timeRange: "15:00 - 15:45",
    durationLabel: "45 phút",
    mode: "ONLINE",
    status: "NO_SHOW",
    result: "NO_SHOW",
    actionLabel: "Chi tiết",
  },
  {
    id: "int-005",
    candidateName: "Đỗ Thảo Vy",
    candidateEmail: "thaovy.do@gmail.com",
    candidateInitials: "TV",
    candidateTone: "rose",
    jobTitle: "Nhà thiết kế sản phẩm",
    round: "TECHNICAL",
    roundLabel: "Vòng 2\nPhỏng vấn kỹ thuật",
    interviewerName: "Phan Tuấn Anh",
    interviewerTitle: "Trưởng nhóm thiết kế",
    interviewerInitials: "TA",
    dateLabel: "Hôm qua",
    timeRange: "16:30 - 17:15",
    durationLabel: "45 phút",
    mode: "OFFLINE",
    status: "COMPLETED",
    result: "PASS",
    actionLabel: "Xem",
  },
];

export const statusLabels: Record<InterviewStatus, string> = {
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
  IN_PROGRESS: "Đang diễn ra",
  NEEDS_FEEDBACK: "Cần đánh giá",
  NO_SHOW: "Không tham gia",
  SCHEDULED: "Đã lên lịch",
  UPCOMING: "Sắp diễn ra",
};

export const resultLabels: Record<InterviewResult, string> = {
  CONSIDER: "Cân nhắc",
  FAIL: "Không đạt",
  NONE: "—",
  NO_SHOW: "Vắng mặt",
  PASS: "Đạt",
};

export const actionTasks = [
  { count: 6, label: "Lịch cần đánh giá", tone: "amber" },
  { count: 3, label: "Lịch sắp diễn ra trong 2 giờ", tone: "emerald" },
  { count: 2, label: "Lịch quá giờ chưa cập nhật", tone: "rose" },
  { count: 2, label: "Ứng viên không tham gia", tone: "rose" },
] as const;

export const todaySchedule = [
  {
    time: "09:00",
    duration: "30p",
    name: "Nguyễn Minh Anh",
    role: "Lập trình viên Frontend",
    round: "Vòng 1: Sàng lọc nhân sự",
    status: "UPCOMING" as InterviewStatus,
  },
  {
    time: "10:30",
    duration: "45p",
    name: "Trần Quốc Bảo",
    role: "Lập trình viên Backend",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    status: "SCHEDULED" as InterviewStatus,
  },
  {
    time: "13:30",
    duration: "45p",
    name: "Lê Thu Trang",
    role: "Nhà thiết kế UI/UX",
    round: "Vòng 1: Sàng lọc nhân sự",
    status: "NEEDS_FEEDBACK" as InterviewStatus,
  },
  {
    time: "15:00",
    duration: "45p",
    name: "Phạm Hoàng Nam",
    role: "Kỹ sư kiểm thử",
    round: "Vòng 2: Phỏng vấn kỹ thuật",
    status: "NO_SHOW" as InterviewStatus,
  },
] as const;

export const performanceMetrics = [
  { label: "Tỷ lệ hoàn thành", value: "86%", tone: "emerald", progress: 86 },
  { label: "Vắng mặt", value: "2", tone: "rose" },
  { label: "Thời gian nhập đánh giá TB", value: "4h", tone: "amber" },
  { label: "Lịch cần đánh giá", value: "6", tone: "amber" },
] as const;

export const createInterviewDefaults = {
  candidate: "Nguyễn Minh Anh",
  job: "Lập trình viên Frontend (React)",
  interviewer: "Trần Thị Mai",
  round: "Sàng lọc nhân sự",
  duration: "45 phút",
  mode: "Trực tuyến",
  notifyCandidate: true,
};

export const dialogOptions = {
  durations: ["30 phút", "45 phút", "60 phút", "90 phút"],
  feedbackResults: ["Đạt", "Cân nhắc", "Không đạt", "Không tham gia"],
  modes: ["Trực tuyến", "Trực tiếp"],
  nextSteps: ["Chuyển vòng tiếp theo", "Gửi đề nghị", "Từ chối", "Giữ trong pipeline"],
  noShowReasons: [
    "Không vào buổi họp",
    "Không đến địa điểm phỏng vấn",
    "Không liên hệ được",
    "Báo bận sau giờ hẹn",
    "Khác",
  ],
  rounds: ["Sàng lọc nhân sự", "Phỏng vấn kỹ thuật", "Phỏng vấn cuối", "Trao đổi đề nghị"],
} as const;

export const calendarIcon = Calendar;
