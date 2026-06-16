import type { LucideIcon } from "@/features/recruiter/icons";
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Gift,
  Globe2,
  Home,
  Laptop,
  Mail,
  MapPin,
  PenLine,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UsersRound,
} from "@/features/recruiter/icons";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type StepMeta = {
  id: WizardStep;
  label: string;
};

export const createJobSteps: StepMeta[] = [
  { id: 1, label: "Thông tin cơ bản" },
  { id: 2, label: "Lương & phúc lợi" },
  { id: 3, label: "Mô tả công việc" },
  { id: 4, label: "Tiêu chí ứng viên" },
  { id: 5, label: "Xem trước" },
];

export const basicFields = {
  contactEmail: "hr@upnext.vn",
  contactPhone: "0901 234 567",
  contractType: "Full-time",
  deadline: "30/06/2025",
  department: "Engineering",
  headcount: "2",
  industry: "IT Software",
  level: "Middle",
  locations: ["TP. Hồ Chí Minh", "Hà Nội"],
  owner: "Nguyễn Thu Linh",
  summary:
    "Chúng tôi đang tìm kiếm Frontend Developer (React) để phát triển giao diện người dùng hiện đại, hiệu năng cao cho sản phẩm UpNext.",
  title: "Frontend Developer (React)",
  workModel: "Hybrid",
} as const;

export const benefits = [
  "Bảo hiểm đầy đủ",
  "Lương tháng 13",
  "Review lương",
  "Laptop/MacBook",
  "Remote linh hoạt",
  "Teambuilding",
  "Khám sức khỏe",
] as const;

export const salaryFields = {
  currency: "VND / tháng",
  max: "30,000,000",
  min: "15,000,000",
  note: "Môi trường product, quy trình rõ ràng, review lương định kỳ, hỗ trợ thiết bị làm việc và cơ hội phát triển dài hạn.",
  perks: "Thưởng hiệu suất, phụ cấp gửi xe, phụ cấp ăn trưa.",
  schedule: "Thứ 2 - Thứ 6, 08:30 - 17:30",
  workingPolicy: "Hybrid 3 ngày/tuần",
  leavePolicy: "12 ngày phép năm, nghỉ lễ theo quy định",
  equipment: "Cấp MacBook hoặc laptop theo nhu cầu công việc",
} as const;

export const jobDescription = {
  overview:
    "Tham gia phát triển sản phẩm tuyển dụng UpNext, phối hợp với team Product, Design và Backend để xây dựng trải nghiệm ứng tuyển tốt hơn cho người dùng.",
  responsibilities: [
    "Phát triển giao diện web bằng React/Next.js",
    "Tối ưu hiệu năng và trải nghiệm người dùng",
    "Phối hợp với Backend, UI/UX và QA",
  ],
  requirements: [
    "Có từ 2 năm kinh nghiệm React",
    "Thành thạo TypeScript",
    "Hiểu REST API, Git, responsive UI",
  ],
  niceToHave: ["Có kinh nghiệm Next.js", "Biết testing với Jest/RTL", "Từng làm sản phẩm SaaS"],
  perks: [
    "Lương cạnh tranh, review định kỳ",
    "Bảo hiểm đầy đủ, thiết bị làm việc",
    "Môi trường product, quy trình rõ ràng",
  ],
  interviewProcess: "Vòng 1: HR Screening · Vòng 2: Technical Interview · Vòng 3: Offer Discussion",
} as const;

export const candidateCriteria = {
  english: "Đọc hiểu tài liệu kỹ thuật",
  experience: "2–4 năm",
  excluded: ["PHP", "Manual Tester"],
  locations: ["TP. Hồ Chí Minh", "Hà Nội"],
  note: "Ưu tiên ứng viên có kinh nghiệm product, từng làm việc với team design và có khả năng phối hợp tốt.",
  preferredSkills: ["Next.js", "Tailwind CSS", "Jest", "Figma"],
  requiredSkills: ["React", "TypeScript", "REST API", "Git"],
  salaryMax: "30,000,000",
  salaryMin: "15,000,000",
  workModels: ["Onsite", "Hybrid", "Remote"],
} as const;

export type PlanUsage = {
  label: string;
  percent: number;
  value: string;
};

export const createPlanUsage: PlanUsage[] = [
  { label: "Lượt đăng tin", percent: 60, value: "12 / 20" },
  { label: "Lượt đẩy tin", percent: 47, value: "28 / 60" },
  { label: "Lượt AI viết tin", percent: 50, value: "15 / 30" },
];

export type AssistantSuggestion = {
  icon: LucideIcon;
  text: string;
};

export const assistantSuggestions: Record<WizardStep, AssistantSuggestion[]> = {
  1: [
    { icon: PenLine, text: "Tối ưu tiêu đề tuyển dụng" },
    { icon: Target, text: "Gợi ý cấp bậc phù hợp" },
    { icon: FileText, text: "Gợi ý mô tả ngắn" },
    { icon: ClipboardCheck, text: "Kiểm tra thông tin còn thiếu" },
  ],
  2: [
    { icon: Target, text: "Gợi ý khoảng lương phù hợp" },
    { icon: Gift, text: "Đề xuất phúc lợi hấp dẫn" },
    { icon: ShieldCheck, text: "Tối ưu mô tả quyền lợi" },
    { icon: ClipboardCheck, text: "Kiểm tra thông tin còn thiếu" },
  ],
  3: [
    { icon: PenLine, text: "Tối ưu tiêu đề" },
    { icon: PenLine, text: "Viết lại chuyên nghiệp hơn" },
    { icon: Target, text: "Làm rõ yêu cầu kỹ năng" },
    { icon: Star, text: "Gợi ý quyền lợi hấp dẫn hơn" },
    { icon: ShieldCheck, text: "Kiểm tra nội dung vi phạm" },
  ],
  4: [
    { icon: Target, text: "Gợi ý kỹ năng phù hợp" },
    { icon: BriefcaseBusiness, text: "Đề xuất kinh nghiệm tối thiểu" },
    { icon: Bot, text: "Tối ưu tiêu chí sàng lọc" },
    { icon: ClipboardCheck, text: "Kiểm tra điều kiện còn thiếu" },
  ],
  5: [
    { icon: ShieldCheck, text: "Không phát hiện từ khóa vi phạm" },
    { icon: FileText, text: "Mô tả công việc đầy đủ" },
    { icon: Gift, text: "Mức lương hiển thị rõ ràng" },
    { icon: Target, text: "Tiêu chí ứng viên hợp lý" },
  ],
};

export const assistantTips: Record<WizardStep, string> = {
  1: "Gợi ý: Tin có tiêu đề rõ công nghệ, cấp bậc và địa điểm thường thu hút hồ sơ phù hợp hơn.",
  2: "Gợi ý: Tin hiển thị khoảng lương rõ ràng và phúc lợi cụ thể thường có tỷ lệ ứng tuyển tốt hơn.",
  3: "Gợi ý: Tin có quyền lợi rõ ràng và mức lương minh bạch thường có tỷ lệ ứng tuyển tốt hơn.",
  4: "Gợi ý: Tiêu chí rõ ràng và trọng số hợp lý sẽ giúp lọc hồ sơ phù hợp tốt hơn.",
  5: "Tin đã sẵn sàng để gửi duyệt.",
};

export type NoticeItem = {
  icon?: LucideIcon;
  text: string;
};

export const noticeItems: Record<WizardStep, NoticeItem[]> = {
  1: [
    { text: "Bổ sung mô tả ngắn vị trí" },
    { text: "Xác nhận địa điểm làm việc" },
    { text: "Kiểm tra email liên hệ" },
  ],
  2: [
    { text: "Bổ sung mức lương tối đa" },
    { text: "Mô tả phúc lợi nổi bật" },
    { text: "Kiểm tra chính sách làm việc" },
  ],
  3: [
    { text: "Không phát hiện từ khóa vi phạm" },
    { text: "Mô tả công việc đủ chi tiết" },
    { text: "Yêu cầu ứng viên rõ ràng" },
  ],
  4: [
    { text: "Xác nhận mức kinh nghiệm" },
    { text: "Bổ sung kỹ năng ưu tiên" },
    { text: "Kiểm tra từ khóa loại trừ" },
  ],
  5: [
    { text: "Kiểm tra lại email liên hệ" },
    { text: "Xác nhận thời hạn nhận hồ sơ" },
    { text: "Đảm bảo JD đúng nhu cầu tuyển dụng" },
  ],
};

export const previewMeta = [
  { icon: UsersRound, text: "Middle" },
  { icon: BriefcaseBusiness, text: "Full-time" },
  { icon: Laptop, text: "Hybrid" },
  { icon: Home, text: "TP. Hồ Chí Minh" },
  { icon: MapPin, text: "Hà Nội" },
] as const;

export const previewBenefits = [
  { icon: ShieldCheck, text: "Bảo hiểm đầy đủ" },
  { icon: Gift, text: "Lương tháng 13" },
  { icon: Laptop, text: "Laptop/MacBook" },
  { icon: Globe2, text: "Remote linh hoạt" },
  { icon: Star, text: "Review lương" },
] as const;

export const previewProcess = [
  { icon: UsersRound, title: "Vòng 1", text: "HR Screening" },
  { icon: FileText, title: "Vòng 2", text: "Technical Interview" },
  { icon: Mail, title: "Vòng 3", text: "Offer Discussion" },
] as const;

export { CheckCircle2, Eye, Save, Send, Sparkles };
