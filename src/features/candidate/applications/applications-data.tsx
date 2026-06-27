export type ApplicationStatus = "reviewing" | "interview" | "offer" | "rejected";

export type Application = Readonly<{
  id: string;
  role: string;
  company: string;
  companyMark: string;
  companyTone: "blue" | "orange" | "green" | "neutral";
  location: string;
  workMode: string;
  status: ApplicationStatus;
  appliedAt: string;
  statusTitle: string;
  statusDescription: string;
  resume: string;
  nextStep?: string;
  interviewAt?: string;
  salary?: string;
  recruiter?: string;
  matchScore: number;
  note: string;
  timeline: readonly {
    title: string;
    description: string;
    date: string;
    done: boolean;
  }[];
}>;

export type ApplicationStatusMeta = Readonly<{
  key: "all" | ApplicationStatus;
  label: string;
  count: number;
  tone: "brand" | "warning" | "info" | "success" | "error";
}>;

export const applications: readonly Application[] = [
  {
    id: "sis-backend-developer",
    role: "Backend Developer",
    company: "SIS Train",
    companyMark: "SIS",
    companyTone: "blue",
    location: "Hà Nội, Việt Nam",
    workMode: "Hybrid",
    status: "reviewing",
    appliedAt: "10/06/2025",
    statusTitle: "Đang xem xét",
    statusDescription: "Nhà tuyển dụng đã xem CV 08/06/2025",
    resume: "CV_NguyenQuocVuong.pdf",
    salary: "25 - 35M VND",
    recruiter: "Mai Anh",
    matchScore: 86,
    note: "Hồ sơ đang được đội tuyển dụng đánh giá. Bạn nên cập nhật thêm 2 dự án backend nổi bật để tăng sức thuyết phục.",
    timeline: [
      {
        title: "Đã ứng tuyển",
        description: "CV đã được gửi đến SIS Train.",
        date: "10/06/2025",
        done: true,
      },
      {
        title: "Nhà tuyển dụng đã xem CV",
        description: "Hồ sơ được mở và đưa vào danh sách đánh giá.",
        date: "08/06/2025",
        done: true,
      },
      {
        title: "Đang xem xét",
        description: "Chờ phản hồi vòng lọc hồ sơ.",
        date: "Hiện tại",
        done: false,
      },
    ],
  },
  {
    id: "fpt-java-developer",
    role: "Java Developer",
    company: "FPT Software",
    companyMark: "FPT",
    companyTone: "orange",
    location: "Hà Nội, Việt Nam",
    workMode: "Hybrid",
    status: "interview",
    appliedAt: "05/06/2025",
    statusTitle: "Phỏng vấn",
    statusDescription: "Phỏng vấn kỹ thuật vào 15 Jun, 10:00 AM",
    resume: "CV_NguyenQuocVuong.pdf",
    nextStep: "Chuẩn bị phỏng vấn kỹ thuật",
    interviewAt: "15 Jun, 2025 · 10:00 AM",
    salary: "30 - 45M VND",
    recruiter: "Thu Hà",
    matchScore: 91,
    note: "Lịch phỏng vấn kỹ thuật đã được xác nhận. Chuẩn bị trọng tâm Java, Spring Boot, REST API và tối ưu truy vấn SQL.",
    timeline: [
      {
        title: "Đã ứng tuyển",
        description: "CV đã được gửi đến FPT Software.",
        date: "05/06/2025",
        done: true,
      },
      {
        title: "Qua vòng lọc CV",
        description: "Nhà tuyển dụng đánh giá hồ sơ phù hợp.",
        date: "09/06/2025",
        done: true,
      },
      {
        title: "Lịch phỏng vấn",
        description: "Phỏng vấn kỹ thuật với team backend.",
        date: "15/06/2025",
        done: false,
      },
    ],
  },
  {
    id: "vng-software-engineer-intern",
    role: "Software Engineer Intern",
    company: "VNG Corporation",
    companyMark: "VNG",
    companyTone: "orange",
    location: "TP. Hồ Chí Minh",
    workMode: "Remote",
    status: "offer",
    appliedAt: "30/05/2025",
    statusTitle: "Đề nghị",
    statusDescription: "Đề nghị gửi ngày 12/06/2025. Hạn phản hồi: 19/06/2025",
    resume: "CV_NguyenQuocVuong.pdf",
    nextStep: "Phản hồi đề nghị trước 19/06/2025",
    salary: "12 - 15M VND",
    recruiter: "Quốc Bảo",
    matchScore: 78,
    note: "Bạn đã nhận được đề nghị thực tập. Hãy xem kỹ mức hỗ trợ, thời gian làm việc và mentor trực tiếp trước khi phản hồi.",
    timeline: [
      {
        title: "Đã ứng tuyển",
        description: "Ứng tuyển vị trí thực tập kỹ sư phần mềm.",
        date: "30/05/2025",
        done: true,
      },
      {
        title: "Phỏng vấn hoàn tất",
        description: "Hoàn thành vòng trao đổi kỹ thuật.",
        date: "08/06/2025",
        done: true,
      },
      {
        title: "Nhận đề nghị",
        description: "Đề nghị đang chờ phản hồi từ bạn.",
        date: "12/06/2025",
        done: false,
      },
    ],
  },
  {
    id: "teko-fullstack-developer",
    role: "Full-stack Developer",
    company: "Teko Vietnam",
    companyMark: "teko",
    companyTone: "neutral",
    location: "Đà Nẵng, Việt Nam",
    workMode: "On-site",
    status: "rejected",
    appliedAt: "22/05/2025",
    statusTitle: "Đã từ chối",
    statusDescription: "Cảm ơn bạn đã quan tâm đến vị trí này",
    resume: "CV_NguyenQuocVuong.pdf",
    salary: "20 - 32M VND",
    recruiter: "Hiring Team",
    matchScore: 64,
    note: "Vị trí đã đóng hoặc yêu cầu chưa khớp tại thời điểm ứng tuyển. Bạn có thể lưu công ty để theo dõi cơ hội khác.",
    timeline: [
      {
        title: "Đã ứng tuyển",
        description: "CV đã được gửi đến Teko Vietnam.",
        date: "22/05/2025",
        done: true,
      },
      {
        title: "Đã xem xét",
        description: "Nhà tuyển dụng đã đánh giá hồ sơ.",
        date: "28/05/2025",
        done: true,
      },
      {
        title: "Không tiếp tục",
        description: "Quy trình dừng ở vòng lọc hồ sơ.",
        date: "30/05/2025",
        done: true,
      },
    ],
  },
];

export const statusMeta: readonly ApplicationStatusMeta[] = [
  { key: "all", label: "Tất cả", count: applications.length, tone: "brand" },
  {
    key: "reviewing",
    label: "Đang xem xét",
    count: applications.filter((item) => item.status === "reviewing").length,
    tone: "warning",
  },
  {
    key: "interview",
    label: "Phỏng vấn",
    count: applications.filter((item) => item.status === "interview").length,
    tone: "info",
  },
  {
    key: "offer",
    label: "Đề nghị",
    count: applications.filter((item) => item.status === "offer").length,
    tone: "success",
  },
  {
    key: "rejected",
    label: "Đã từ chối",
    count: applications.filter((item) => item.status === "rejected").length,
    tone: "error",
  },
];

export const statusStyles: Record<ApplicationStatus, { badge: string; dot: string }> = {
  reviewing: {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    dot: "bg-amber-500",
  },
  interview: {
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
    dot: "bg-blue-600",
  },
  offer: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-brand" },
  rejected: { badge: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
};

export const upcomingInterview = applications.find((item) => item.status === "interview");

export const applicationTips = [
  {
    icon: "bell",
    title: "Theo dõi thường xuyên",
    description: "Kiểm tra cập nhật trạng thái và phản hồi từ nhà tuyển dụng.",
  },
  {
    icon: "clock",
    title: "Phản hồi đúng hạn",
    description: "Phản hồi nhanh giúp bạn tạo ấn tượng chuyên nghiệp.",
  },
  {
    icon: "check",
    title: "Chuẩn bị kỹ lưỡng",
    description: "Tìm hiểu công ty và luyện tập trước buổi phỏng vấn.",
  },
] as const;
