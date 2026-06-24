"use client";

import {
  ArrowRight,
  BookmarkSimple,
  Briefcase,
  Camera,
  CheckCircle,
  Code,
  Crown,
  DotsThreeVertical,
  EnvelopeSimple,
  Eye,
  FilePdf,
  GearSix,
  GraduationCap,
  GridFour,
  LinkSimple,
  LinkedinLogo,
  MapPin,
  PencilSimple,
  Phone,
  Plus,
  SealCheck,
  Sparkle,
  TrendUp,
  UploadSimple,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

type IconComponent = ComponentType<{
  className?: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}>;

type CandidateProfileCopy = Readonly<{
  page: {
    previewProfile: string;
  };
  status: {
    completionLabel: string;
  };
  sidebar: {
    editPhoto: string;
    resume: string;
    primary: string;
    uploadResume: string;
  };
  labels: {
    about: string;
    skills: string;
    workExperience: string;
    education: string;
    jobPreferences: string;
  };
  actions: {
    edit: string;
  };
  current: string;
}>;

const candidate = {
  name: "Nguyễn Quốc Vương",
  title: "Backend Developer",
  location: "Hà Nội, Việt Nam",
  website: "vuongdev.com",
  email: "vuong.nguyenquoc.sistrain@gmail.com",
  phone: "(+84) 98 765 4321",
  linkedin: "linkedin.com/in/nguyenquocvuong",
  github: "github.com/nguyenquocvuong",
  completion: 78,
  savedJobs: 12,
  applications: 5,
  profileViews: 98,
};

const skills = ["Java", "Spring Boot", "Node.js", "MySQL", "REST API", "+4"];

const completionItems = [
  { key: "personal", done: true },
  { key: "experience", done: true },
  { key: "education", done: true },
  { key: "skills", done: false },
  { key: "about", done: false },
] as const;

const profileTabs = [
  { key: "overview", icon: GridFour },
  { key: "resume", icon: FilePdf },
  { key: "experience", icon: Briefcase },
  { key: "education", icon: GraduationCap },
  { key: "skills", icon: Sparkle },
  { key: "preferences", icon: GearSix },
] as const;

type ProfileTabKey = (typeof profileTabs)[number]["key"];

const educationRecords = [
  {
    mark: "PT",
    school: "Hanoi University of Science and Technology",
    degree: "Bachelor of Information Technology",
    period: "Sep 2019 - Jun 2023",
    location: "Hà Nội, Việt Nam",
    note: "GPA 3.45 / 4.0",
  },
  {
    mark: "HA",
    school: "Hanoi - Amsterdam High School for the Gifted",
    degree: "High School Diploma",
    period: "Sep 2016 - Jun 2019",
    location: "Hà Nội, Việt Nam",
    note: "GPA 8.7 / 10",
  },
  {
    mark: "OC",
    school: "Coursera, Udemy, freeCodeCamp",
    degree: "Online Courses & Certifications",
    period: "2021 - 2024",
    location: "Online",
    note: "Algorithms · System Design · Database",
  },
] as const;

const resumeRows = [
  {
    name: "CV_NguyenQuocVuong_Backend.pdf",
    meta: "Updated 10 May 2025 · 356 KB",
    tags: ["Backend Developer", "Full-time", "Java", "Spring Boot", "+3"],
    primary: true,
  },
  {
    name: "CV_NguyenQuocVuong_Internship.pdf",
    meta: "Updated 28 Apr 2025 · 298 KB",
    tags: ["Internship", "Part-time", "Student"],
    primary: false,
  },
  {
    name: "CV_Product_Designer.pdf",
    meta: "Updated 12 Mar 2025 · 410 KB",
    tags: ["UI/UX Designer", "Full-time", "Figma", "Design System", "+2"],
    primary: false,
  },
] as const;

const experienceRows = [
  {
    title: "Backend Developer",
    company: "SIS Train",
    period: "Mar 2024 - Present (1 year 2 months)",
    location: "Hà Nội, Việt Nam",
    current: true,
    bullets: [
      "Phát triển RESTful API bằng Spring Boot phục vụ ứng dụng web nội bộ.",
      "Xây dựng module xác thực JWT và phân quyền người dùng.",
      "Tối ưu truy vấn MySQL, cải thiện hiệu năng hệ thống khoảng 30%.",
      "Thiết kế và tích hợp hệ thống thông báo realtime bằng WebSocket.",
    ],
    tags: ["Java", "Spring Boot", "MySQL", "REST API", "WebSocket", "Docker"],
  },
  {
    title: "Backend Developer Intern",
    company: "SIS Train",
    period: "Oct 2023 - Mar 2024 (6 months)",
    location: "Hà Nội, Việt Nam",
    current: false,
    bullets: [
      "Tham gia phát triển API cho module quản lý người dùng.",
      "Viết unit test và tài liệu API.",
      "Hỗ trợ tối ưu database và fix bug.",
    ],
    tags: ["Java", "Spring Boot", "MySQL", "Postman"],
  },
  {
    title: "Freelance Developer",
    company: "Freelance",
    period: "Jun 2023 - Sep 2023 (4 months)",
    location: "Remote",
    current: false,
    bullets: [
      "Xây dựng API với Node.js và Express.",
      "Tích hợp thanh toán VNPay và quản lý đơn hàng.",
    ],
    tags: ["Node.js", "Express", "MongoDB", "REST API"],
  },
] as const;

const technicalSkills = [
  ["Java", "Advanced", 5],
  ["Spring Boot", "Advanced", 5],
  ["JavaScript", "Advanced", 4],
  ["Node.js", "Advanced", 5],
  ["TypeScript", "Intermediate", 4],
  ["MySQL", "Advanced", 5],
  ["REST API", "Advanced", 4],
  ["Docker", "Intermediate", 4],
  ["Git", "Advanced", 4],
] as const;

const softSkills = [
  "Problem Solving",
  "Teamwork",
  "Communication",
  "Time Management",
  "Adaptability",
  "Critical Thinking",
] as const;

const preferenceCards = [
  ["Desired Role", "Backend Developer"],
  ["Seniority", "Intern · Fresher · Junior"],
  ["Employment Type", "Full-time"],
  ["Work Mode", "On-site · Hybrid · Remote"],
  ["Salary Range", "25 - 35M VND"],
  ["Preferred Locations", "Hà Nội, Đà Nẵng, Hồ Chí Minh City"],
  ["Preferred Industries", "Software Product, Fintech, SaaS"],
  ["Tech Stack Focus", "Java, Spring Boot, Node.js, MySQL, REST API"],
  ["Availability", "Can start in 2 weeks"],
  ["Open to Relocation", "No"],
  ["Job Search Status", "Actively looking"],
  ["Email Job Alerts", "On"],
] as const;

const copyByLocale = {
  vi: {
    status: "Sẵn sàng nhận việc",
    editProfile: "Chỉnh sửa hồ sơ",
    aboutText:
      "Backend Developer với hơn 2 năm kinh nghiệm xây dựng hệ thống web hiệu năng cao và API đáng tin cậy.",
    tabs: {
      overview: "Tổng quan",
      resume: "CV",
      experience: "Kinh nghiệm",
      education: "Học vấn",
      skills: "Kỹ năng",
      preferences: "Mong muốn",
    },
    contactTitle: "Giới thiệu & liên hệ",
    latestResume: "CV mới nhất",
    resumeHistory: "Lịch sử CV",
    resumeName: "CV_NguyenQuocVuong_Backend.pdf",
    resumeMeta: "Cập nhật lần cuối: 10/06/2026 · 356 KB",
    preview: "Xem trước",
    replace: "Thay thế",
    uploadAnother: "Tải CV khác",
    experienceSnapshot: "Kinh nghiệm nổi bật",
    experienceDetail: "Chi tiết kinh nghiệm",
    currentRole: "Backend Developer Intern",
    company: "SIS Train",
    period: "03/2024 - Hiện tại · Hà Nội, Việt Nam",
    bullets: [
      "Phát triển RESTful API bằng Spring Boot phục vụ ứng dụng web.",
      "Xây dựng module xác thực JWT và phân quyền người dùng.",
      "Tối ưu truy vấn MySQL, cải thiện hiệu năng hệ thống khoảng 30%.",
    ],
    viewAllExperience: "Xem tất cả kinh nghiệm",
    educationTitle: "Học vấn",
    skillsTitle: "Kỹ năng chuyên môn",
    skillsHint: "Thêm 3 kỹ năng còn thiếu để hồ sơ khớp tốt hơn với các vị trí Backend.",
    addSkill: "Thêm kỹ năng",
    preferencesTitle: "Tóm tắt mong muốn việc làm",
    preferences: [
      ["Vai trò mong muốn", "Backend Developer"],
      ["Hình thức", "Toàn thời gian"],
      ["Mức lương", "25 - 35M VND"],
      ["Địa điểm", "Hà Nội, Đà Nẵng"],
      ["Mô hình", "Hybrid / Remote"],
    ],
    editPreferences: "Chỉnh mong muốn",
    completionTitle: "Hoàn thiện hồ sơ",
    completionDescription: "Hoàn thiện hồ sơ để tăng cơ hội được nhà tuyển dụng tìm thấy.",
    completeProfile: "Hoàn thiện hồ sơ",
    completionItems: {
      personal: "Thông tin cá nhân",
      experience: "Kinh nghiệm làm việc",
      education: "Học vấn",
      skills: "Kỹ năng còn thiếu",
      about: "Giới thiệu bản thân",
    },
    quickStats: "Thống kê nhanh",
    savedJobs: "Việc đã lưu",
    applications: "Đã ứng tuyển",
    profileViews: "Lượt xem hồ sơ",
    last30Days: "30 ngày qua",
    tipTitle: "Gợi ý cho bạn",
    tipText: "Bổ sung kỹ năng và phần giới thiệu bản thân để hồ sơ nổi bật hơn 3x.",
    improveNow: "Hoàn thiện ngay",
    addExperience: "Thêm kinh nghiệm",
    addEducation: "Thêm học vấn",
    edit: "Chỉnh sửa",
    primaryResume: "CV chính",
    resumeDescription: "Quản lý CV và chọn bản tốt nhất cho từng lần ứng tuyển.",
    resumeTabs: ["CV của tôi", "Thư ứng tuyển", "Mẫu CV"],
    primaryResumeNote: "CV này sẽ tự động được đính kèm khi bạn ứng tuyển.",
    change: "Thay đổi",
    dragResume: "Kéo thả CV vào đây, hoặc chọn tệp",
    resumeScore: "Điểm CV",
    goodJob: "Đang tốt!",
    feedback: "Cần góp ý?",
    getReviewed: "Nhận đánh giá",
    viewAllTips: "Xem tất cả gợi ý",
    summary: "Tóm tắt",
    educationDescription: "Thêm, chỉnh sửa hoặc sắp xếp lại thông tin học vấn.",
    skillsDescription: "Thêm, chỉnh sửa hoặc xoá kỹ năng để nhà tuyển dụng tìm thấy bạn dễ hơn.",
    technicalSkills: "Kỹ năng chuyên môn",
    softSkills: "Kỹ năng mềm",
    languages: "Ngôn ngữ",
    preferencesDescription:
      "Thiết lập mong muốn tìm việc để nhà tuyển dụng hiểu rõ vị trí phù hợp với bạn.",
    preferencePreview: "Hiển thị với nhà tuyển dụng",
    scoreDescriptions: {
      resume: "CV của bạn đã có cấu trúc tốt và có thể tối ưu thêm để tăng lượt phỏng vấn.",
      match: "Mong muốn việc làm của bạn rõ ràng và thân thiện với nhà tuyển dụng.",
    },
    feedbackDescriptions: {
      resume: "Nhận góp ý chuyên sâu cho CV của bạn.",
      experience: "Nhận góp ý chuyên sâu cho phần kinh nghiệm.",
      education: "Nhận góp ý chuyên sâu cho phần học vấn.",
      skills: "Nhận góp ý chuyên sâu cho bộ kỹ năng.",
    },
    tipItems: {
      resume: [
        "Thêm tóm tắt nghề nghiệp ngắn gọn",
        "Làm nổi bật kỹ năng quan trọng",
        "Bổ sung thành tựu có số liệu",
        "Thêm liên kết dự án",
        "Tối ưu CV cho ATS",
      ],
      experience: [
        "Dùng chức danh rõ ràng",
        "Thêm thành tựu đo lường được",
        "Nêu bật công nghệ liên quan",
        "Bổ sung chi tiết cho vai trò cũ",
        "Cập nhật kinh nghiệm mới nhất",
      ],
      education: [
        "Đặt bằng cấp cao nhất lên trước",
        "Thêm ngành học hoặc chuyên môn",
        "Thêm GPA nếu đủ nổi bật",
        "Bổ sung môn học hoặc chứng chỉ liên quan",
        "Giữ thông tin luôn cập nhật",
      ],
      skills: [
        "Thêm kỹ năng liên quan nhất",
        "Cập nhật kỹ năng thường xuyên",
        "Thêm mức độ thành thạo",
        "Kết hợp kỹ năng cứng và kỹ năng mềm",
        "Tránh kỹ năng đã lỗi thời",
      ],
      preferences: [
        "Thêm địa điểm mong muốn để mở rộng cơ hội",
        "Nêu rõ tech stack ưu tiên",
        "Đặt mức lương thực tế",
        "Thêm ngành nghề bạn quan tâm",
        "Cho biết thời gian có thể bắt đầu",
      ],
    },
    matchPills: [
      "Phù hợp việc Backend Remote",
      "Tốt cho vai trò Java/Spring",
      "Mức lương mong muốn rõ ràng",
    ],
    visibilityTitle: "Hiển thị hồ sơ",
    visibilityDescription: "Hồ sơ của bạn đang hiển thị với nhà tuyển dụng phù hợp.",
    manageVisibility: "Quản lý hiển thị",
    nextActions: {
      overview: {
        title: "Ưu tiên tiếp theo",
        description: "Bổ sung giới thiệu bản thân và kỹ năng để hồ sơ nổi bật hơn.",
        action: "Hoàn thiện hồ sơ",
      },
      resume: {
        title: "Tối ưu CV",
        description: "Chọn CV chính và cập nhật bản mới nhất để ứng tuyển nhanh hơn.",
        action: "Cập nhật CV",
      },
      experience: {
        title: "Làm rõ kinh nghiệm",
        description: "Thêm thành tựu có số liệu để nhà tuyển dụng hiểu tác động công việc.",
        action: "Thêm thành tựu",
      },
      education: {
        title: "Bổ sung học vấn",
        description: "Thêm chứng chỉ hoặc khóa học liên quan đến backend để tăng độ tin cậy.",
        action: "Cập nhật học vấn",
      },
      skills: {
        title: "Tăng độ khớp kỹ năng",
        description: "Thêm mức độ thành thạo cho các kỹ năng chính như Java, Spring Boot, MySQL.",
        action: "Cập nhật kỹ năng",
      },
      preferences: {
        title: "Tinh chỉnh mong muốn",
        description: "Rà soát mức lương, địa điểm và hình thức làm việc để nhận match tốt hơn.",
        action: "Chỉnh mong muốn",
      },
    },
    tips: {
      resume: "Gợi ý CV",
      experience: "Gợi ý kinh nghiệm",
      education: "Gợi ý học vấn",
      skills: "Gợi ý kỹ năng",
      preferences: "Gợi ý mong muốn",
    },
  },
  en: {
    status: "Open to work",
    editProfile: "Edit Profile",
    aboutText:
      "Backend Developer with 2+ years of experience building reliable APIs and high-performance web systems.",
    tabs: {
      overview: "Overview",
      resume: "Resume",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      preferences: "Preferences",
    },
    contactTitle: "About & Contact",
    latestResume: "Latest Resume",
    resumeHistory: "Resume History",
    resumeName: "CV_NguyenQuocVuong_Backend.pdf",
    resumeMeta: "Last updated: Jun 10, 2026 · 356 KB",
    preview: "Preview",
    replace: "Replace",
    uploadAnother: "Upload another resume",
    experienceSnapshot: "Experience Snapshot",
    experienceDetail: "Experience Detail",
    currentRole: "Backend Developer Intern",
    company: "SIS Train",
    period: "Mar 2024 - Present · Hanoi, Vietnam",
    bullets: [
      "Built RESTful APIs with Spring Boot for production web applications.",
      "Implemented JWT authentication and role-based authorization modules.",
      "Optimized MySQL queries and improved system performance by about 30%.",
    ],
    viewAllExperience: "View all experience",
    educationTitle: "Education",
    skillsTitle: "Professional Skills",
    skillsHint: "Add 3 missing skills to improve matching for Backend roles.",
    addSkill: "Add skill",
    preferencesTitle: "Job Preferences Summary",
    preferences: [
      ["Desired Role", "Backend Developer"],
      ["Employment Type", "Full-time"],
      ["Salary Range", "25 - 35M VND"],
      ["Locations", "Hanoi, Da Nang"],
      ["Work Mode", "Hybrid / Remote"],
    ],
    editPreferences: "Edit preferences",
    completionTitle: "Profile Completion",
    completionDescription: "Complete your profile to increase recruiter discovery.",
    completeProfile: "Complete profile",
    completionItems: {
      personal: "Personal information",
      experience: "Work experience",
      education: "Education",
      skills: "More skills needed",
      about: "About summary",
    },
    quickStats: "Quick Stats",
    savedJobs: "Saved Jobs",
    applications: "Applications",
    profileViews: "Profile Views",
    last30Days: "Last 30 days",
    tipTitle: "Tip for you",
    tipText: "Add key skills and a concise summary to make your profile stand out up to 3x.",
    improveNow: "Improve now",
    addExperience: "Add Experience",
    addEducation: "Add Education",
    edit: "Edit",
    primaryResume: "Primary Resume",
    resumeDescription: "Manage your resumes and choose the best one for your applications.",
    resumeTabs: ["My Resumes", "Cover Letters", "Resume Templates"],
    primaryResumeNote: "This resume will be automatically attached to your job applications.",
    change: "Change",
    dragResume: "Drag and drop your file here, or browse",
    resumeScore: "Resume Score",
    goodJob: "Good job!",
    feedback: "Need feedback?",
    getReviewed: "Get reviewed",
    viewAllTips: "View all tips",
    summary: "Summary",
    educationDescription: "Add, edit or reorder your education.",
    skillsDescription:
      "Add, edit or remove your skills. Recruiters can find you based on these skills.",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    languages: "Languages",
    preferencesDescription: "Set your job search preferences so employers can find better matches.",
    preferencePreview: "Preference Preview",
    scoreDescriptions: {
      resume: "Your resume is well-structured and can be improved further for more interviews.",
      match: "Your preferences are clear and recruiter-friendly.",
    },
    feedbackDescriptions: {
      resume: "Get expert feedback on your resume.",
      experience: "Get expert feedback on your experience.",
      education: "Get expert feedback on your education.",
      skills: "Get expert feedback on your skills.",
    },
    tipItems: {
      resume: [
        "Add a professional summary",
        "Highlight your top skills",
        "Add more achievements",
        "Include project links",
        "Optimize for ATS",
      ],
      experience: [
        "Use clear job titles",
        "Add measurable achievements",
        "Highlight relevant technologies",
        "Add more details to older roles",
        "Keep experience up to date",
      ],
      education: [
        "Add your highest degree first",
        "Include your field of study",
        "Add GPA if it is 3.0 or higher",
        "Include relevant coursework",
        "Keep information up to date",
      ],
      skills: [
        "Add your most relevant skills",
        "Keep your skills up to date",
        "Add proficiency level",
        "Include both hard and soft skills",
        "Avoid adding outdated skills",
      ],
      preferences: [
        "Add preferred locations to widen your matches",
        "Specify your tech stack for better relevance",
        "Set a realistic salary range",
        "Add more industries you are interested in",
        "Share your notice period or availability",
      ],
    },
    matchPills: [
      "Matches Remote Backend Jobs",
      "Good for Java/Spring roles",
      "Salary expectations clearly set",
    ],
    visibilityTitle: "Profile visibility",
    visibilityDescription: "Your profile is visible to relevant recruiters.",
    manageVisibility: "Manage visibility",
    nextActions: {
      overview: {
        title: "Next priority",
        description: "Add a stronger summary and missing skills to make your profile stand out.",
        action: "Complete profile",
      },
      resume: {
        title: "Optimize your resume",
        description: "Keep a primary resume updated so applications stay fast and consistent.",
        action: "Update resume",
      },
      experience: {
        title: "Clarify experience",
        description: "Add measurable achievements so recruiters understand your impact.",
        action: "Add achievements",
      },
      education: {
        title: "Add education proof",
        description: "Include relevant certificates or coursework to strengthen credibility.",
        action: "Update education",
      },
      skills: {
        title: "Improve skill matching",
        description:
          "Add proficiency levels for Java, Spring Boot, MySQL, and core backend skills.",
        action: "Update skills",
      },
      preferences: {
        title: "Tune your preferences",
        description: "Review salary, locations, and work mode to receive better matches.",
        action: "Edit preferences",
      },
    },
    tips: {
      resume: "Resume Tips",
      experience: "Experience Tips",
      education: "Education Tips",
      skills: "Skills Tips",
      preferences: "Preference Tips",
    },
  },
} as const;

export function CandidateProfilePage() {
  const t = useTranslations("CandidateProfile");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("overview");
  const productCopy = t.raw("content") as CandidateProfileCopy;
  const copy = locale === "en" ? copyByLocale.en : copyByLocale.vi;

  return (
    <div className="space-y-4 sm:space-y-5">
      <ProfileHero copy={copy} productCopy={productCopy} />
      <ProfileTabs activeTab={activeTab} copy={copy} onTabChange={setActiveTab} />
      <ProfileTabPanel activeTab={activeTab} copy={copy} productCopy={productCopy} />
    </div>
  );
}

function ProfileHero({
  copy,
  productCopy,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
}>) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="p-5 sm:p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_300px] lg:items-center">
          <div className="relative w-fit">
            <div className="grid size-28 place-items-center rounded-full bg-slate-900 text-3xl font-extrabold text-white ring-4 ring-slate-100 sm:size-36 sm:text-4xl">
              V
            </div>
            <button
              type="button"
              className="upnext-focus bg-brand absolute right-2 bottom-2 grid size-9 place-items-center rounded-full border-4 border-white text-white"
              aria-label={productCopy.sidebar.editPhoto}
            >
              <Camera size={16} weight="fill" />
            </button>
          </div>

          <div className="min-w-0">
            <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">
              <span className="bg-brand size-2 rounded-full" />
              {copy.status}
            </Badge>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                {candidate.name}
              </h1>
              <SealCheck className="text-brand" size={22} weight="fill" />
            </div>
            <p className="mt-1 text-base font-semibold text-slate-700">{candidate.title}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={17} />
                {candidate.location}
              </span>
              <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
              <a
                className="upnext-focus text-brand inline-flex items-center gap-1 rounded-md"
                href={`https://${candidate.website}`}
              >
                <LinkSimple size={17} />
                {candidate.website}
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-800">Profile completion</span>
                <span className="text-brand">{candidate.completion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="bg-brand block h-full rounded-full"
                  style={{ width: `${candidate.completion}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button className="bg-brand h-11 rounded-lg px-5 font-extrabold shadow-none hover:bg-emerald-700">
                <PencilSimple />
                {copy.editProfile}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-lg border-slate-200 bg-white px-5 font-extrabold shadow-none hover:bg-slate-50 hover:text-slate-950"
              >
                <Eye />
                {productCopy.page.previewProfile}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileTabs({
  activeTab,
  copy,
  onTabChange,
}: Readonly<{
  activeTab: ProfileTabKey;
  copy: (typeof copyByLocale)["vi" | "en"];
  onTabChange: (tab: ProfileTabKey) => void;
}>) {
  return (
    <Card className="sticky top-[84px] z-30 rounded-2xl border-slate-200/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur">
      <CardContent className="p-0">
        <div className="flex overflow-x-auto px-4" role="tablist" aria-label="Profile sections">
          {profileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`profile-panel-${tab.key}`}
                id={`profile-tab-${tab.key}`}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "upnext-focus relative flex h-14 shrink-0 items-center gap-2 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:text-slate-950",
                  active && "text-brand",
                )}
              >
                <Icon size={18} />
                {copy.tabs[tab.key]}
                {active ? (
                  <span className="bg-brand absolute right-4 bottom-0 left-4 h-0.5 rounded-full" />
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileTabPanel({
  activeTab,
  copy,
  productCopy,
}: Readonly<{
  activeTab: ProfileTabKey;
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
}>) {
  const panelContent: Record<ProfileTabKey, ReactNode> = {
    overview: (
      <>
        <AboutContactCard copy={copy} />
        <ExperienceSnapshotCard copy={copy} productCopy={productCopy} />
        <PreferencesCard copy={copy} productCopy={productCopy} compact />
      </>
    ),
    resume: <ResumeCard copy={copy} productCopy={productCopy} />,
    experience: <ExperienceSnapshotCard copy={copy} productCopy={productCopy} detailed />,
    education: <EducationCard copy={copy} />,
    skills: <SkillsCard copy={copy} />,
    preferences: <PreferencesCard copy={copy} productCopy={productCopy} />,
  };

  return (
    <section
      id={`profile-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`profile-tab-${activeTab}`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">{panelContent[activeTab]}</main>
        <SharedProfileAside activeTab={activeTab} copy={copy} productCopy={productCopy} />
      </div>
    </section>
  );
}

function AboutContactCard({ copy }: Readonly<{ copy: (typeof copyByLocale)["vi" | "en"] }>) {
  const contacts = [
    [EnvelopeSimple, candidate.email],
    [Phone, candidate.phone],
    [LinkedinLogo, candidate.linkedin],
    [LinkSimple, candidate.github],
  ] as const;

  return (
    <SectionCard id="overview" title={copy.contactTitle} icon={SealCheck}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.75fr)]">
        <p className="text-sm leading-7 font-medium text-slate-600">{copy.aboutText}</p>
        <div className="space-y-3 border-slate-200 md:border-l md:pl-8">
          {contacts.map(([Icon, text]) => (
            <InfoRow key={text} icon={Icon}>
              {text}
            </InfoRow>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function ResumeCard({
  copy,
  productCopy,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
}>) {
  return (
    <SectionCard
      id="resume"
      title={copy.latestResume === "CV mới nhất" ? "CV của tôi" : "My Resumes"}
      icon={FilePdf}
      action={
        <div className="flex items-center gap-2">
          <Button className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700">
            <UploadSimple />
            {productCopy.sidebar.uploadResume}
          </Button>
          <button
            type="button"
            className="upnext-focus grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950"
            aria-label={copy.resumeHistory}
          >
            <DotsThreeVertical size={22} />
          </button>
        </div>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.resumeDescription}</p>
      <div className="mb-5 flex gap-6 border-b border-slate-200">
        {copy.resumeTabs.map((item, index) => (
          <button
            key={item}
            type="button"
            className={cn(
              "upnext-focus relative h-11 text-sm font-extrabold text-slate-500",
              index === 0 && "text-brand",
            )}
          >
            {item}
            {index === 0 ? (
              <span className="bg-brand absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
            ) : null}
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-3">
          <span className="text-brand grid size-11 place-items-center rounded-full bg-emerald-100">
            <Crown size={22} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-950">{copy.primaryResume}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{copy.primaryResumeNote}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-lg border-emerald-200 bg-white font-extrabold text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
        >
          <ArrowRight />
          {copy.change}
        </Button>
      </div>
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
        {resumeRows.map((resume) => (
          <article
            key={resume.name}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          >
            <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-red-500">
              PDF
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-extrabold text-slate-950">{resume.name}</h3>
                {resume.primary ? (
                  <Badge tone="brand" className="rounded-full">
                    {productCopy.sidebar.primary}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">{resume.meta}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {resume.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-lg border-slate-200 bg-white shadow-none hover:bg-slate-50 hover:text-slate-950"
              >
                <Eye />
                {copy.preview}
              </Button>
              <button className="upnext-focus grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                <DotsThreeVertical size={20} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center sm:flex-row sm:gap-4">
        <UploadSimple className="text-slate-500" size={34} />
        <p className="text-sm font-semibold text-slate-600">
          {copy.dragResume}
          <br />
          <span className="text-xs text-slate-500">PDF, DOC, DOCX (Max 10MB)</span>
        </p>
      </div>
    </SectionCard>
  );
}

function ExperienceSnapshotCard({
  copy,
  detailed = false,
  productCopy,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  detailed?: boolean;
  productCopy: CandidateProfileCopy;
}>) {
  return (
    <SectionCard
      id="experience"
      title={detailed ? copy.experienceDetail : copy.experienceSnapshot}
      icon={Briefcase}
      action={
        detailed ? (
          <Button className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700">
            <Plus />
            {copy.addExperience}
          </Button>
        ) : null
      }
    >
      {detailed ? (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {experienceRows.map((role, index) => (
            <article
              key={`${role.title}-${role.period}`}
              className="grid gap-4 p-5 md:grid-cols-[40px_minmax(0,1fr)_auto]"
            >
              <div className="relative hidden justify-center md:flex">
                <span
                  className={cn(
                    "mt-1 size-3 rounded-full ring-4 ring-emerald-50",
                    index === 0 ? "bg-brand" : "bg-slate-300",
                  )}
                />
                {index < experienceRows.length - 1 ? (
                  <span className="absolute top-6 bottom-[-1.25rem] w-px bg-slate-200" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-950">{role.title}</h3>
                  {role.current ? (
                    <Badge tone="brand" className="rounded-full">
                      Current
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {role.company} · {role.period} · {role.location}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm leading-6 font-medium text-slate-600">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-500" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 md:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-emerald-200 bg-white font-extrabold text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <PencilSimple />
                  {copy.edit}
                </Button>
                <button className="upnext-focus grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                  <DotsThreeVertical size={20} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <p className="text-brand text-sm font-extrabold">{copy.currentRole}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{copy.company}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{copy.period}</p>
            </div>
            <ul className="space-y-2">
              {copy.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 text-sm leading-6 font-medium text-slate-600"
                >
                  <span className="bg-brand mt-2 size-1.5 shrink-0 rounded-full" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <InlineAction>{copy.viewAllExperience}</InlineAction>
        </>
      )}
      <span className="sr-only">{productCopy.labels.workExperience}</span>
    </SectionCard>
  );
}

function EducationCard({ copy }: Readonly<{ copy: (typeof copyByLocale)["vi" | "en"] }>) {
  return (
    <SectionCard
      id="education"
      title={copy.educationTitle}
      icon={GraduationCap}
      action={
        <Button className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700">
          <Plus />
          {copy.addEducation}
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.educationDescription}</p>
      <div className="space-y-3">
        {educationRecords.map((item) => (
          <article
            key={item.degree}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-100">
              {item.mark}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-slate-950">{item.degree}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.school}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-500">
                <span>{item.period}</span>
                <span className="hidden size-1 rounded-full bg-slate-300 sm:inline-block" />
                <span>{item.location}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">{item.note}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-emerald-200 bg-white font-extrabold text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
              >
                <PencilSimple />
                {copy.edit}
              </Button>
              <button className="upnext-focus grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                <DotsThreeVertical size={20} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function SkillsCard({ copy }: Readonly<{ copy: (typeof copyByLocale)["vi" | "en"] }>) {
  return (
    <SectionCard
      id="skills"
      title={copy.skillsTitle}
      icon={Code}
      action={
        <Button className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700">
          <Plus />
          {copy.addSkill}
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.skillsDescription}</p>

      <div className="space-y-7">
        <div>
          <h3 className="mb-3 text-sm font-extrabold text-slate-950">{copy.technicalSkills}</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {technicalSkills.map(([name, level, dots]) => (
              <article
                key={name}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-950">{name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "size-2 rounded-full",
                            index < dots ? "bg-brand" : "bg-slate-200",
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{level}</span>
                  </div>
                </div>
                <button className="upnext-focus grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-50">
                  <DotsThreeVertical size={18} />
                </button>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-extrabold text-slate-950">{copy.softSkills}</h3>
          <div className="flex flex-wrap gap-3">
            {softSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
              >
                <span className="bg-brand size-2 rounded-full" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-extrabold text-slate-950">{copy.languages}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["VI", "Vietnamese", "Native", 5],
              ["EN", "English", "Professional", 3],
            ].map(([code, name, level, dots]) => (
              <article
                key={name}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-700">
                    {code}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{level}</p>
                  </div>
                </div>
                <span className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "size-2 rounded-full",
                        index < Number(dots) ? "bg-brand" : "bg-slate-200",
                      )}
                    />
                  ))}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function PreferencesCard({
  compact = false,
  copy,
  productCopy,
}: Readonly<{
  compact?: boolean;
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
}>) {
  const compactIcons = [Briefcase, Briefcase, TrendUp, MapPin, GearSix] as const;
  const icons = [
    Briefcase,
    SealCheck,
    Briefcase,
    GearSix,
    TrendUp,
    MapPin,
    Briefcase,
    Code,
    GearSix,
    TrendUp,
    SealCheck,
    EnvelopeSimple,
  ] as const;

  if (compact) {
    return (
      <SectionCard id="preferences" title={copy.preferencesTitle} icon={Briefcase}>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {copy.preferences.map(([label, value], index) => {
            const Icon = compactIcons[index] ?? Briefcase;

            return (
              <div key={label} className="min-w-0">
                <dt className="text-brand flex items-center gap-2 text-xs font-bold">
                  <Icon size={17} />
                  {label}
                </dt>
                <dd className="mt-2 text-sm font-semibold text-slate-700">{value}</dd>
              </div>
            );
          })}
        </dl>
        <span className="sr-only">{productCopy.labels.jobPreferences}</span>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      id="preferences"
      title={copy.preferencesTitle}
      icon={Briefcase}
      action={
        <Button className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700">
          <PencilSimple />
          {copy.editPreferences}
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.preferencesDescription}</p>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {preferenceCards.map(([label, value], index) => {
          const Icon = icons[index] ?? Briefcase;
          return (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <Icon className="text-brand" size={20} />
                <span>{label}</span>
              </dt>
              <dd className="mt-3 text-sm font-extrabold text-slate-800">{value}</dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <h3 className="text-sm font-extrabold text-slate-950">{copy.preferencePreview}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {copy.matchPills.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
            >
              <CheckCircle className="text-brand" size={17} weight="fill" />
              {item}
            </span>
          ))}
        </div>
      </div>
      <span className="sr-only">{productCopy.labels.jobPreferences}</span>
    </SectionCard>
  );
}

function SharedProfileAside({
  activeTab,
  copy,
  productCopy,
}: Readonly<{
  activeTab: ProfileTabKey;
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
}>) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
      <CompletionCard copy={copy} productCopy={productCopy} />
      <NextActionCard activeTab={activeTab} copy={copy} />
      <ProfileVisibilityCard copy={copy} />
      <QuickStatsCard copy={copy} />
    </aside>
  );
}

function NextActionCard({
  activeTab,
  copy,
}: Readonly<{
  activeTab: ProfileTabKey;
  copy: (typeof copyByLocale)["vi" | "en"];
}>) {
  const item = copy.nextActions[activeTab];

  return (
    <Card className="rounded-2xl border-emerald-200 bg-emerald-50/35 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700">
            <Sparkle size={21} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 font-medium text-slate-600">{item.description}</p>
          </div>
        </div>
        <Button className="bg-brand mt-5 h-10 w-full rounded-lg font-extrabold shadow-none hover:bg-emerald-700">
          {item.action}
          <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfileVisibilityCard({ copy }: Readonly<{ copy: (typeof copyByLocale)["vi" | "en"] }>) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-950">{copy.visibilityTitle}</h2>
            <p className="mt-2 text-sm leading-6 font-medium text-slate-600">
              {copy.visibilityDescription}
            </p>
          </div>
          <button
            type="button"
            aria-label={copy.visibilityTitle}
            aria-pressed="true"
            className="upnext-focus bg-brand relative mt-1 h-7 w-12 shrink-0 rounded-full"
          >
            <span className="absolute top-1 right-1 size-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
        <InlineAction>{copy.manageVisibility}</InlineAction>
      </CardContent>
    </Card>
  );
}

function CompletionCard({
  copy,
  productCopy,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
}>) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3">
        <span className="text-brand grid size-10 place-items-center rounded-xl bg-emerald-50">
          <CheckCircle size={21} />
        </span>
        <CardTitle className="text-base">{copy.completionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="flex gap-4">
          <ProgressRing
            value={candidate.completion}
            label={`${candidate.completion}%`}
            ariaLabel={productCopy.status.completionLabel}
          />
          <p className="pt-2 text-sm leading-6 font-medium text-slate-600">
            {copy.completionDescription}
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {completionItems.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm font-semibold">
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border",
                  item.done
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 text-slate-400",
                )}
              >
                {item.done ? <CheckCircle size={14} weight="fill" /> : null}
              </span>
              <span className={item.done ? "text-slate-700" : "text-slate-500"}>
                {copy.completionItems[item.key]}
              </span>
            </li>
          ))}
        </ul>

        <InlineAction>{copy.completeProfile}</InlineAction>
      </CardContent>
    </Card>
  );
}

function QuickStatsCard({ copy }: Readonly<{ copy: (typeof copyByLocale)["vi" | "en"] }>) {
  const stats = [
    [BookmarkSimple, copy.savedJobs, candidate.savedJobs],
    [Briefcase, copy.applications, candidate.applications],
    [Eye, copy.profileViews, candidate.profileViews],
  ] as const;

  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3">
        <span className="text-brand grid size-10 place-items-center rounded-xl bg-emerald-50">
          <TrendUp size={21} />
        </span>
        <CardTitle className="text-base">{copy.quickStats}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-2">
        {stats.map(([Icon, label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-600">
              <Icon size={17} />
              {label}
            </span>
            <strong className="font-extrabold text-slate-950">{value}</strong>
          </div>
        ))}
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>{copy.last30Days}</span>
          <span className="text-brand">+24%</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  id,
  title,
  icon: Icon,
  action,
  children,
}: Readonly<{
  id?: string;
  title: string;
  icon: IconComponent;
  action?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Card
      id={id}
      className="scroll-mt-40 rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 p-5 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon size={24} className="text-slate-700" />
          <CardTitle className="truncate text-lg">{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-5 pt-2">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, children }: Readonly<{ icon: IconComponent; children: ReactNode }>) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
      <Icon size={18} className="shrink-0 text-slate-500" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

function InlineAction({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <button
      type="button"
      className="upnext-focus text-brand mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-extrabold"
    >
      {children}
      <ArrowRight size={16} weight="bold" />
    </button>
  );
}

function ProgressRing({
  value,
  label,
  ariaLabel,
}: Readonly<{
  value: number;
  label: string;
  ariaLabel: string;
}>) {
  return (
    <div
      className="grid size-20 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--brand) ${value}%, #e2e8f0 0)` }}
      aria-label={`${ariaLabel} ${label}`}
    >
      <div className="grid size-14 place-items-center rounded-full bg-white">
        <span className="text-base font-extrabold text-emerald-700">{label}</span>
      </div>
    </div>
  );
}
