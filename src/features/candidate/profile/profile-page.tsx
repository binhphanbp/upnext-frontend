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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Swal from "sweetalert2";

import {
  createCandidateEducation,
  createCandidateExperience,
  createCandidateSkill,
  createSkillOption,
  getMyCandidateApplications,
  getMyCandidateCvs,
  getMyCandidateProfile,
  getMySavedJobs,
  searchSkills,
  type CandidateCvApi,
  type CandidateProfileApi,
  updateCandidateJobPreference,
  updateMyCandidateProfile,
  setCandidateCvDefault,
  deleteCandidateCv,
  uploadCandidateCvFile,
  createCandidateCv,
} from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

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

type CandidateSummary = {
  name: string;
  title: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  completion: number;
  savedJobs: number;
  applications: number;
  profileViews: number;
};

type EducationRecord = {
  mark: string;
  school: string;
  degree: string;
  period: string;
  location: string;
  note: string;
};

type ResumeRow = {
  id: string;
  name: string;
  meta: string;
  tags: string[];
  primary: boolean;
  publicUrl?: string | null | undefined;
};

type ExperienceRow = {
  title: string;
  company: string;
  period: string;
  location: string;
  current: boolean;
  bullets: string[];
  tags: string[];
};

type TechnicalSkill = [name: string, level: string, dots: number];
type LanguageRow = [code: string, name: string, level: string, dots: number];
type PreferenceCard = [label: string, value: string];

type CandidateProfileViewModel = {
  candidate: CandidateSummary;
  skillPills: string[];
  educationRecords: EducationRecord[];
  resumeRows: ResumeRow[];
  experienceRows: ExperienceRow[];
  technicalSkills: TechnicalSkill[];
  softSkills: string[];
  languageRows: LanguageRow[];
  preferenceCards: PreferenceCard[];
  aboutText: string;
};

type CandidateProfileActions = {
  onAddEducation: () => void;
  onAddExperience: () => void;
  onAddSkill: () => void;
  onEditPreferences: () => void;
  onEditProfile: () => void;
  onSetCvDefault: (cvId: string) => void;
  onDeleteCv: (cvId: string) => void;
  onUploadCv: (file: File) => void;
};

const candidate: CandidateSummary = {
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

const educationRecords: EducationRecord[] = [
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
];

const resumeRows: ResumeRow[] = [
  {
    id: "mock-1",
    name: "CV_NguyenQuocVuong_Backend.pdf",
    meta: "Updated 10 May 2025 · 356 KB",
    tags: ["Backend Developer", "Full-time", "Java", "Spring Boot", "+3"],
    primary: true,
    publicUrl: null,
  },
  {
    id: "mock-2",
    name: "CV_NguyenQuocVuong_Internship.pdf",
    meta: "Updated 28 Apr 2025 · 298 KB",
    tags: ["Internship", "Part-time", "Student"],
    primary: false,
    publicUrl: null,
  },
  {
    id: "mock-3",
    name: "CV_Product_Designer.pdf",
    meta: "Updated 12 Mar 2025 · 410 KB",
    tags: ["UI/UX Designer", "Full-time", "Figma", "Design System", "+2"],
    primary: false,
    publicUrl: null,
  },
];

const experienceRows: ExperienceRow[] = [
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
];

const technicalSkills: TechnicalSkill[] = [
  ["Java", "Advanced", 5],
  ["Spring Boot", "Advanced", 5],
  ["JavaScript", "Advanced", 4],
  ["Node.js", "Advanced", 5],
  ["TypeScript", "Intermediate", 4],
  ["MySQL", "Advanced", 5],
  ["REST API", "Advanced", 4],
  ["Docker", "Intermediate", 4],
  ["Git", "Advanced", 4],
];

const softSkills = [
  "Problem Solving",
  "Teamwork",
  "Communication",
  "Time Management",
  "Adaptability",
  "Critical Thinking",
] satisfies string[];

const preferenceCards: PreferenceCard[] = [
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
];

const languageRows: LanguageRow[] = [
  ["VI", "Vietnamese", "Native", 5],
  ["EN", "English", "Professional", 3],
];

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

function createFallbackProfileViewModel(copy: (typeof copyByLocale)["vi" | "en"]) {
  return {
    aboutText: copy.aboutText,
    candidate,
    educationRecords,
    experienceRows,
    languageRows,
    preferenceCards,
    resumeRows,
    skillPills: skills,
    softSkills,
    technicalSkills,
  } satisfies CandidateProfileViewModel;
}

function createProfileViewModel(
  profile: CandidateProfileApi,
  cvs: CandidateCvApi[],
  applicationCount: number,
  savedJobCount: number,
  copy: (typeof copyByLocale)["vi" | "en"],
  locale: string,
) {
  const links = normalizeProfileLinks(profile);
  const profileExperiences = profile.experiences ?? [];
  const profileSkills = profile.skills ?? [];
  const nextCandidate: CandidateSummary = {
    ...candidate,
    applications: applicationCount,
    email: profile.account.email,
    github: links.github ?? candidate.github,
    linkedin: links.linkedin ?? candidate.linkedin,
    location: profile.address ?? candidate.location,
    name: profile.account.fullName,
    phone: profile.phoneNumber ?? candidate.phone,
    profileViews: candidate.profileViews,
    savedJobs: savedJobCount,
    website: links.website ?? candidate.website,
    completion: getProfileCompletion(profile, cvs.length),
  };

  return {
    aboutText: profile.description || copy.aboutText,
    candidate: nextCandidate,
    educationRecords: profile.educations.length
      ? profile.educations.map((item) => ({
          degree: item.degree ?? item.major ?? "Education",
          location: profile.address ?? candidate.location,
          mark: getRecordMark(item.schoolName),
          note: item.gpa ? `GPA ${item.gpa}` : (item.description ?? ""),
          period: formatPeriod(item.startDate, item.endDate, item.isCurrent, locale),
          school: item.schoolName,
        }))
      : educationRecords,
    experienceRows: profileExperiences.map((item) =>
      toExperienceRow(item, profile.address, locale),
    ),
    languageRows: profile.languages.length
      ? profile.languages.map((item) => [
          getRecordMark(item.language),
          item.language,
          item.proficiency,
          getLanguageDots(item.proficiency),
        ])
      : languageRows,
    preferenceCards: profile.jobPreference
      ? createPreferenceCardsFromApi(profile.jobPreference, locale)
      : preferenceCards,
    resumeRows: cvs.length ? cvs.map((item) => toResumeRow(item, locale)) : resumeRows,
    skillPills: profileSkills.length
      ? profileSkills.slice(0, 6).map((item) => item.skill.name)
      : skills,
    softSkills,
    technicalSkills: profileSkills.length
      ? profileSkills.map((item) => [
          item.skill.name,
          formatProficiencyLabel(item.proficiencyLevel),
          getSkillDots(item.proficiencyLevel),
        ])
      : technicalSkills,
  } satisfies CandidateProfileViewModel;
}

function createPreferenceCardsFromApi(
  preference: NonNullable<CandidateProfileApi["jobPreference"]>,
  locale: string,
) {
  const salaryMin = Number(preference.desiredSalaryMin ?? 0);
  const salaryMax = Number(preference.desiredSalaryMax ?? 0);
  const salary =
    salaryMin || salaryMax
      ? `${salaryMin ? formatMoneyCompact(salaryMin) : "0"} - ${
          salaryMax ? formatMoneyCompact(salaryMax) : "?"
        } ${preference.salaryCurrency}`
      : locale === "en"
        ? "Not updated"
        : "Chưa cập nhật";

  return [
    [locale === "en" ? "Desired Role" : "Vai trò mong muốn", preference.desiredPosition ?? "-"],
    [locale === "en" ? "Seniority" : "Cấp bậc", preference.desiredLevel?.name ?? "-"],
    [locale === "en" ? "Employment Type" : "Hình thức", "-"],
    [locale === "en" ? "Work Mode" : "Mô hình", preference.workingModel ?? "-"],
    [locale === "en" ? "Salary Range" : "Mức lương", salary],
    [locale === "en" ? "Preferred Locations" : "Địa điểm", "-"],
    [locale === "en" ? "Preferred Industries" : "Ngành nghề", "-"],
    [locale === "en" ? "Tech Stack Focus" : "Tech stack", "-"],
    [
      locale === "en" ? "Availability" : "Thời gian bắt đầu",
      preference.noticePeriodDays
        ? `${preference.noticePeriodDays} ${locale === "en" ? "days" : "ngày"}`
        : "-",
    ],
    [
      locale === "en" ? "Open to Relocation" : "Sẵn sàng relocation",
      preference.isRelocate ? "Yes" : "No",
    ],
    [locale === "en" ? "Job Search Status" : "Trạng thái tìm việc", "-"],
    [locale === "en" ? "Email Job Alerts" : "Email job alerts", "-"],
  ] satisfies PreferenceCard[];
}

function formatMoneyCompact(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  return String(value);
}

function formatProficiencyLabel(level: string) {
  return level
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSkillDots(level: string) {
  if (level === "EXPERT") return 5;
  if (level === "ADVANCED") return 4;
  if (level === "INTERMEDIATE") return 3;
  return 2;
}

function normalizeProfileLinks(profile: CandidateProfileApi) {
  return profile.links.reduce(
    (result, link) => {
      const type = link.type.toLowerCase();
      const url = stripProtocol(link.url);

      if (type.includes("linkedin")) result.linkedin = url;
      else if (type.includes("github")) result.github = url;
      else if (type.includes("website") || type.includes("portfolio")) result.website = url;

      return result;
    },
    {} as { github?: string; linkedin?: string; website?: string },
  );
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//u, "").replace(/\/$/u, "");
}

function getRecordMark(value: string) {
  return value
    .split(/\s|-/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatPeriod(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  locale: string,
) {
  const start = formatProfileDate(startDate, locale);
  const end = isCurrent
    ? locale === "en"
      ? "Present"
      : "Hiện tại"
    : formatProfileDate(endDate, locale);

  return (
    [start, end].filter(Boolean).join(" - ") || (locale === "en" ? "Not updated" : "Chưa cập nhật")
  );
}

function formatProfileDate(date: string | null, locale: string) {
  if (!date) return "";

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function toResumeRow(cv: CandidateCvApi, locale: string) {
  const latestVersion = cv.versions[0];
  const fileName = latestVersion?.sourceFile?.originalName ?? cv.title;
  const updatedLabel = locale === "en" ? "Updated" : "Cập nhật";
  const publicUrl = latestVersion?.sourceFile?.publicUrl;

  return {
    id: cv.id,
    name: fileName,
    meta: `${updatedLabel} ${formatProfileDate(cv.updatedAt, locale)} · ${cv.status}`,
    primary: cv.isDefault,
    tags: [cv.source, cv.status].filter(Boolean),
    publicUrl,
  } satisfies ResumeRow;
}

function toExperienceRow(
  experience: CandidateProfileApi["experiences"][number],
  fallbackLocation: string | null,
  locale: string,
) {
  const bullets = splitExperienceDescription(experience.description);
  const tags = splitTechnologyTags(experience.technologies);

  return {
    title: experience.positionTitle,
    company: experience.companyName,
    period: formatPeriod(experience.startDate, experience.endDate, experience.isCurrent, locale),
    location: fallbackLocation ?? (locale === "en" ? "Not updated" : "Chưa cập nhật"),
    current: experience.isCurrent,
    bullets: bullets.length
      ? bullets
      : [
          locale === "en"
            ? "Experience details have not been updated yet."
            : "Chi tiết kinh nghiệm chưa được cập nhật.",
        ],
    tags,
  } satisfies ExperienceRow;
}

function splitExperienceDescription(description: string | null) {
  if (!description) return [];

  return description
    .split(/\r?\n|[•]/u)
    .map((item) => item.replace(/^[-*]\s*/u, "").trim())
    .filter(Boolean);
}

function splitTechnologyTags(technologies: string | null) {
  if (!technologies) return [];

  return technologies
    .split(/[,;|]/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getLanguageDots(proficiency: string) {
  const normalized = proficiency.toLowerCase();
  if (normalized.includes("native") || normalized.includes("bản ngữ")) return 5;
  if (normalized.includes("professional") || normalized.includes("advanced")) return 4;
  if (normalized.includes("intermediate")) return 3;
  if (normalized.includes("beginner")) return 2;
  return 3;
}

function getProfileCompletion(profile: CandidateProfileApi, cvCount: number) {
  const checks = [
    Boolean(profile.account.fullName),
    Boolean(profile.phoneNumber),
    Boolean(profile.address),
    Boolean(profile.description),
    profile.educations.length > 0,
    (profile.experiences ?? []).length > 0,
    profile.languages.length > 0,
    profile.links.length > 0,
    cvCount > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim().replace(/[.,\s]/gu, "");
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeWorkingModel(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === "ONSITE" || normalized === "REMOTE" || normalized === "HYBRID") {
    return normalized;
  }

  return "HYBRID";
}

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export function CandidateProfilePage() {
  const t = useTranslations("CandidateProfile");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("overview");
  const [apiProfileViewModel, setApiProfileViewModel] = useState<CandidateProfileViewModel | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<
    "edit-profile" | "add-experience" | "add-education" | "add-skill" | "edit-preferences" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Profile fields
  const [profileDescription, setProfileDescription] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");

  // Add Experience fields
  const [expPosition, setExpPosition] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expTech, setExpTech] = useState("");
  const [expDescription, setExpDescription] = useState("");

  // Add Education fields
  const [eduSchool, setEduSchool] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduMajor, setEduMajor] = useState("");
  const [eduDescription, setEduDescription] = useState("");

  // Add Skill fields
  const [newSkillName, setNewSkillName] = useState("");

  // Edit Preferences fields
  const [prefPosition, setPrefPosition] = useState("");
  const [prefSalaryMin, setPrefSalaryMin] = useState("");
  const [prefSalaryMax, setPrefSalaryMax] = useState("");
  const [prefWorkingModel, setPrefWorkingModel] = useState<"ONSITE" | "REMOTE" | "HYBRID">(
    "HYBRID",
  );

  const productCopy = t.raw("content") as CandidateProfileCopy;
  const copy = locale === "en" ? copyByLocale.en : copyByLocale.vi;
  const fallbackProfileViewModel = useMemo(() => createFallbackProfileViewModel(copy), [copy]);
  const profileViewModel = apiProfileViewModel ?? fallbackProfileViewModel;

  const loadProfileFromSession = useCallback(
    async (currentSession: NonNullable<ReturnType<typeof getCandidateSession>>) => {
      const [profile, cvs, applications, savedJobs] = await Promise.all([
        getMyCandidateProfile(currentSession.accessToken),
        getMyCandidateCvs(currentSession.accessToken, currentSession.user.id),
        getMyCandidateApplications(currentSession.accessToken, currentSession.user.id),
        getMySavedJobs(currentSession.accessToken, currentSession.user.id),
      ]);

      setApiProfileViewModel(
        createProfileViewModel(
          profile,
          cvs.items,
          applications.length,
          savedJobs.length,
          copy,
          locale,
        ),
      );
    },
    [copy, locale],
  );

  useEffect(() => {
    const session = getCandidateSession();

    if (!session) {
      setApiProfileViewModel(null);
      setProfileLoading(false);
      return;
    }

    const currentSession = session;
    let ignore = false;
    setProfileLoading(true);

    async function loadProfile() {
      try {
        await loadProfileFromSession(currentSession);
      } catch {
        if (!ignore) setApiProfileViewModel(null);
      } finally {
        if (!ignore) setProfileLoading(false);
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [loadProfileFromSession]);

  async function runProfileAction(action: (token: string) => Promise<void>) {
    const session = getCandidateSession();

    if (!session) {
      void Swal.fire({
        icon: "warning",
        title: "Thông báo",
        text: "Bạn cần đăng nhập candidate để cập nhật hồ sơ.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await action(session.accessToken);
      await loadProfileFromSession(session);
      void toast.fire({
        icon: "success",
        title: "Cập nhật hồ sơ thành công.",
      });
      setActiveModal(null);
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditProfile() {
    setProfileDescription(profileViewModel.aboutText || "");
    setProfilePhone(profileViewModel.candidate.phone || "");
    setProfileAddress(profileViewModel.candidate.location || "");
    setActiveModal("edit-profile");
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    void runProfileAction((token) =>
      updateMyCandidateProfile(token, {
        address: profileAddress.trim(),
        description: profileDescription.trim(),
        phoneNumber: profilePhone.trim(),
      }).then(() => undefined),
    );
  };

  function handleAddExperience() {
    setExpPosition("");
    setExpCompany("");
    setExpTech("");
    setExpDescription("");
    setActiveModal("add-experience");
  }

  const handleSaveExperience = (e: React.FormEvent) => {
    e.preventDefault();
    void runProfileAction((token) =>
      createCandidateExperience(token, {
        companyName: expCompany.trim(),
        description: expDescription.trim(),
        employmentType: "Full-time",
        isCurrent: true,
        positionTitle: expPosition.trim(),
        technologies: expTech.trim(),
      }).then(() => undefined),
    );
  };

  function handleAddEducation() {
    setEduSchool("");
    setEduDegree("");
    setEduMajor("");
    setEduDescription("");
    setActiveModal("add-education");
  }

  const handleSaveEducation = (e: React.FormEvent) => {
    e.preventDefault();
    void runProfileAction((token) =>
      createCandidateEducation(token, {
        degree: eduDegree.trim(),
        description: eduDescription.trim(),
        major: eduMajor.trim(),
        schoolName: eduSchool.trim(),
      }).then(() => undefined),
    );
  };

  function handleAddSkill() {
    setNewSkillName("");
    setActiveModal("add-skill");
  }

  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    void runProfileAction(async (token) => {
      const normalizedName = newSkillName.trim();
      const foundSkills = await searchSkills(normalizedName);
      const exactSkill =
        foundSkills.find((item) => item.name.toLowerCase() === normalizedName.toLowerCase()) ??
        (foundSkills[0] ? undefined : await createSkillOption(normalizedName));
      const selectedSkill = exactSkill ?? foundSkills[0];

      if (!selectedSkill) throw new Error("Không tìm thấy kỹ năng phù hợp.");

      await createCandidateSkill(token, {
        proficiencyLevel: "INTERMEDIATE",
        skillId: selectedSkill.id,
      });
    });
  };

  function handleEditPreferences() {
    setPrefPosition(profileViewModel.candidate.title || "");
    setPrefSalaryMin("");
    setPrefSalaryMax("");
    setPrefWorkingModel("HYBRID");
    setActiveModal("edit-preferences");
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    void runProfileAction((token) =>
      updateCandidateJobPreference(token, {
        desiredPosition: prefPosition.trim(),
        desiredSalaryMax: parseOptionalNumber(prefSalaryMax),
        desiredSalaryMin: parseOptionalNumber(prefSalaryMin),
        salaryCurrency: "VND",
        workingModel: normalizeWorkingModel(prefWorkingModel),
      }).then(() => undefined),
    );
  };

  function handleSetCvDefault(cvId: string) {
    void runProfileAction((token) => setCandidateCvDefault(token, cvId).then(() => undefined));
  }

  async function handleDeleteCv(cvId: string) {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa CV này? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      void runProfileAction((token) => deleteCandidateCv(token, cvId));
    }
  }

  async function handleUploadCv(file: File) {
    const session = getCandidateSession();
    if (!session) {
      void Swal.fire({
        icon: "warning",
        title: "Thông báo",
        text: "Bạn cần đăng nhập candidate để tải CV lên.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const uploadRes = await uploadCandidateCvFile(file, session.accessToken);
      const fileId = uploadRes.file.id;

      await createCandidateCv(session.accessToken, session.user.id, {
        title: file.name.replace(/\.[^/.]+$/, ""),
        source: "UPLOAD",
        isDefault: false,
        sourceFileId: fileId,
      });

      await loadProfileFromSession(session);

      void toast.fire({
        icon: "success",
        title: "Tải CV lên thành công.",
      });
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error instanceof Error ? error.message : "Không thể tải CV lên.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const profileActions: CandidateProfileActions = {
    onAddEducation: handleAddEducation,
    onAddExperience: handleAddExperience,
    onAddSkill: handleAddSkill,
    onEditPreferences: handleEditPreferences,
    onEditProfile: handleEditProfile,
    onSetCvDefault: handleSetCvDefault,
    onDeleteCv: handleDeleteCv,
    onUploadCv: handleUploadCv,
  };

  if (profileLoading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <ProfileHeroSkeleton />
        <ProfileTabs activeTab={activeTab} copy={copy} onTabChange={setActiveTab} />
        <ProfileContentSkeleton activeTab={activeTab} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <ProfileHero
        copy={copy}
        onEditProfile={profileActions.onEditProfile}
        productCopy={productCopy}
        viewModel={profileViewModel}
      />
      <ProfileTabs activeTab={activeTab} copy={copy} onTabChange={setActiveTab} />
      <ProfileTabPanel
        actions={profileActions}
        activeTab={activeTab}
        copy={copy}
        onTabChange={setActiveTab}
        productCopy={productCopy}
        viewModel={profileViewModel}
      />

      {/* Modals for Candidate Data Input */}

      {/* 1. Edit Profile Modal */}
      <Dialog
        open={activeModal === "edit-profile"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="profileDescription">Giới thiệu bản thân</Label>
              <textarea
                id="profileDescription"
                className="upnext-focus min-h-[100px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm"
                placeholder="Ví dụ: Tôi là lập trình viên Backend có kinh nghiệm..."
                value={profileDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setProfileDescription(e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profilePhone">Số điện thoại</Label>
              <Input
                id="profilePhone"
                type="text"
                placeholder="Nhập số điện thoại"
                value={profilePhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProfilePhone(e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profileAddress">Địa chỉ</Label>
              <Input
                id="profileAddress"
                type="text"
                placeholder="Ví dụ: Hà Nội, Việt Nam"
                value={profileAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProfileAddress(e.target.value)
                }
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Experience Modal */}
      <Dialog
        open={activeModal === "add-experience"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thêm kinh nghiệm làm việc</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExperience} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="expPosition">Chức danh</Label>
              <Input
                id="expPosition"
                type="text"
                placeholder="Ví dụ: Lập trình viên Node.js"
                value={expPosition}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExpPosition(e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expCompany">Tên công ty</Label>
              <Input
                id="expCompany"
                type="text"
                placeholder="Ví dụ: ABC Technology"
                value={expCompany}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpCompany(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expTech">Công nghệ / Kỹ năng (cách nhau bằng dấu phẩy)</Label>
              <Input
                id="expTech"
                type="text"
                placeholder="Ví dụ: React, Node.js, Spring Boot"
                value={expTech}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpTech(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expDescription">Mô tả công việc</Label>
              <textarea
                id="expDescription"
                className="upnext-focus min-h-[100px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm"
                placeholder="Mô tả trách nhiệm hoặc dự án đã thực hiện..."
                value={expDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setExpDescription(e.target.value)
                }
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add Education Modal */}
      <Dialog
        open={activeModal === "add-education"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thêm học vấn</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEducation} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="eduSchool">Tên trường</Label>
              <Input
                id="eduSchool"
                type="text"
                placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                value={eduSchool}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEduSchool(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eduDegree">Bằng cấp / Chương trình</Label>
              <Input
                id="eduDegree"
                type="text"
                placeholder="Ví dụ: Cử nhân"
                value={eduDegree}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEduDegree(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eduMajor">Chuyên ngành</Label>
              <Input
                id="eduMajor"
                type="text"
                placeholder="Ví dụ: Công nghệ thông tin"
                value={eduMajor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEduMajor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eduDescription">Ghi chú / GPA</Label>
              <textarea
                id="eduDescription"
                className="upnext-focus min-h-[80px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm"
                placeholder="Ví dụ: GPA 3.5/4.0..."
                value={eduDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEduDescription(e.target.value)
                }
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Add Skill Modal */}
      <Dialog
        open={activeModal === "add-skill"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thêm kỹ năng</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSkill} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newSkillName">Tên kỹ năng</Label>
              <Input
                id="newSkillName"
                type="text"
                placeholder="Ví dụ: Git, Docker, Next.js"
                value={newSkillName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewSkillName(e.target.value)
                }
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Edit Preferences Modal */}
      <Dialog
        open={activeModal === "edit-preferences"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thay đổi mong muốn công việc</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="prefPosition">Vai trò mong muốn</Label>
              <Input
                id="prefPosition"
                type="text"
                placeholder="Ví dụ: Backend Developer"
                value={prefPosition}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPrefPosition(e.target.value)
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prefSalaryMin">Lương tối thiểu (VND)</Label>
                <Input
                  id="prefSalaryMin"
                  type="number"
                  placeholder="Ví dụ: 15000000"
                  value={prefSalaryMin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPrefSalaryMin(e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prefSalaryMax">Lương tối đa (VND)</Label>
                <Input
                  id="prefSalaryMax"
                  type="number"
                  placeholder="Ví dụ: 30000000"
                  value={prefSalaryMax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPrefSalaryMax(e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prefWorkingModel">Mô hình làm việc</Label>
              <select
                id="prefWorkingModel"
                className="upnext-focus w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                value={prefWorkingModel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPrefWorkingModel(e.target.value as any)
                }
                required
              >
                <option value="HYBRID">Hybrid (Kết hợp)</option>
                <option value="REMOTE">Remote (Từ xa)</option>
                <option value="ONSITE">Onsite (Tại văn phòng)</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileHeroSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="p-5 sm:p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_300px] lg:items-center">
          <Skeleton className="size-28 rounded-full bg-slate-100 sm:size-36" />
          <div className="min-w-0 space-y-4">
            <Skeleton className="h-7 w-32 rounded-full bg-emerald-50" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-72 max-w-full bg-slate-100" />
              <Skeleton className="h-5 w-44 bg-slate-100" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[90, 120, 78, 105, 84].map((width) => (
                <Skeleton
                  key={width}
                  className="h-7 rounded-full bg-emerald-50"
                  style={{ width }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between gap-3">
                <Skeleton className="h-4 w-36 bg-slate-100" />
                <Skeleton className="h-4 w-10 bg-slate-100" />
              </div>
              <Skeleton className="h-2 w-full rounded-full bg-slate-100" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Skeleton className="h-11 flex-1 rounded-lg bg-slate-100" />
              <Skeleton className="h-11 flex-1 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileContentSkeleton({ activeTab }: Readonly<{ activeTab: ProfileTabKey }>) {
  const rowCount = activeTab === "overview" ? 2 : activeTab === "experience" ? 3 : 4;

  return (
    <section id={`profile-panel-${activeTab}`} role="tabpanel">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <SectionSkeleton rows={rowCount} />
          {activeTab === "overview" ? <SectionSkeleton rows={2} /> : null}
        </main>
        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <AsideSkeleton />
          <AsideSkeleton compact />
          <AsideSkeleton compact />
        </aside>
      </div>
    </section>
  );
}

function SectionSkeleton({ rows }: Readonly<{ rows: number }>) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3">
        <Skeleton className="size-6 rounded-lg bg-slate-100" />
        <Skeleton className="h-6 w-44 bg-slate-100" />
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-slate-100 p-4">
            <Skeleton className="h-5 w-2/5 bg-slate-100" />
            <Skeleton className="h-4 w-4/5 bg-slate-100" />
            <Skeleton className="h-4 w-3/5 bg-slate-100" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AsideSkeleton({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-5 w-40 bg-slate-100" />
        <Skeleton className={cn("bg-slate-100", compact ? "h-12" : "h-20")} />
        <Skeleton className="h-4 w-2/3 bg-slate-100" />
      </CardContent>
    </Card>
  );
}

function ProfileHero({
  copy,
  onEditProfile,
  productCopy,
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  onEditProfile: () => void;
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
}>) {
  const { candidate: profileCandidate, skillPills } = viewModel;

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="p-5 sm:p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_300px] lg:items-center">
          <div className="relative w-fit">
            <div className="grid size-28 place-items-center rounded-full bg-slate-900 text-3xl font-extrabold text-white ring-4 ring-slate-100 sm:size-36 sm:text-4xl">
              {profileCandidate.name.charAt(0).toUpperCase()}
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
                {profileCandidate.name}
              </h1>
              <SealCheck className="text-brand" size={22} weight="fill" />
            </div>
            <p className="mt-1 text-base font-semibold text-slate-700">{profileCandidate.title}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={17} />
                {profileCandidate.location}
              </span>
              <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
              <a
                className="upnext-focus text-brand inline-flex items-center gap-1 rounded-md"
                href={`https://${profileCandidate.website}`}
              >
                <LinkSimple size={17} />
                {profileCandidate.website}
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {skillPills.map((skill) => (
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
                <span className="text-brand">{profileCandidate.completion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="bg-brand block h-full rounded-full"
                  style={{ width: `${profileCandidate.completion}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                className="bg-brand h-11 rounded-lg px-5 font-extrabold shadow-none hover:bg-emerald-700"
                onClick={onEditProfile}
              >
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
  actions,
  activeTab,
  copy,
  onTabChange,
  productCopy,
  viewModel,
}: Readonly<{
  actions: CandidateProfileActions;
  activeTab: ProfileTabKey;
  copy: (typeof copyByLocale)["vi" | "en"];
  onTabChange: (tab: ProfileTabKey) => void;
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
}>) {
  const panelContent: Record<ProfileTabKey, ReactNode> = {
    overview: (
      <>
        <AboutContactCard copy={copy} viewModel={viewModel} />
        <ExperienceSnapshotCard
          copy={copy}
          onAddExperience={actions.onAddExperience}
          onViewAllExperience={() => onTabChange("experience")}
          productCopy={productCopy}
          viewModel={viewModel}
        />
        <PreferencesCard copy={copy} productCopy={productCopy} viewModel={viewModel} compact />
      </>
    ),
    resume: (
      <ResumeCard copy={copy} productCopy={productCopy} viewModel={viewModel} actions={actions} />
    ),
    experience: (
      <ExperienceSnapshotCard
        copy={copy}
        onAddExperience={actions.onAddExperience}
        productCopy={productCopy}
        viewModel={viewModel}
        detailed
      />
    ),
    education: (
      <EducationCard copy={copy} onAddEducation={actions.onAddEducation} viewModel={viewModel} />
    ),
    skills: <SkillsCard copy={copy} onAddSkill={actions.onAddSkill} viewModel={viewModel} />,
    preferences: (
      <PreferencesCard
        copy={copy}
        onEditPreferences={actions.onEditPreferences}
        productCopy={productCopy}
        viewModel={viewModel}
      />
    ),
  };

  return (
    <section
      id={`profile-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`profile-tab-${activeTab}`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">{panelContent[activeTab]}</main>
        <SharedProfileAside
          activeTab={activeTab}
          copy={copy}
          productCopy={productCopy}
          viewModel={viewModel}
        />
      </div>
    </section>
  );
}

function AboutContactCard({
  copy,
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  viewModel: CandidateProfileViewModel;
}>) {
  const { candidate: profileCandidate } = viewModel;
  const contacts = [
    [EnvelopeSimple, profileCandidate.email],
    [Phone, profileCandidate.phone],
    [LinkedinLogo, profileCandidate.linkedin],
    [LinkSimple, profileCandidate.github],
  ] as const;

  return (
    <SectionCard id="overview" title={copy.contactTitle} icon={SealCheck}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.75fr)]">
        <p className="text-sm leading-7 font-medium text-slate-600">{viewModel.aboutText}</p>
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
  viewModel,
  actions,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
  actions: CandidateProfileActions;
}>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      actions.onUploadCv(file);
    }
  };

  return (
    <SectionCard
      id="resume"
      title={copy.latestResume === "CV mới nhất" ? "CV của tôi" : "My Resumes"}
      icon={FilePdf}
      action={
        <div className="flex items-center gap-2">
          <Button
            className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700"
            onClick={handleUploadClick}
          >
            <UploadSimple />
            {productCopy.sidebar.uploadResume}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />
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
          onClick={handleUploadClick}
        >
          <ArrowRight />
          {copy.change}
        </Button>
      </div>
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
        {viewModel.resumeRows.map((resume) => (
          <article key={resume.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
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
                onClick={() => resume.publicUrl && window.open(resume.publicUrl, "_blank")}
                disabled={!resume.publicUrl}
              >
                <Eye />
                {copy.preview}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="upnext-focus grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                    <DotsThreeVertical size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => actions.onSetCvDefault(resume.id)}
                    disabled={resume.primary}
                  >
                    Đặt làm chính
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={() => actions.onDeleteCv(resume.id)}
                  >
                    Xóa CV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </article>
        ))}
      </div>
      <div
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center transition-colors hover:bg-slate-50 sm:flex-row sm:gap-4"
        onClick={handleUploadClick}
      >
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
  onAddExperience,
  onViewAllExperience,
  productCopy,
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  detailed?: boolean;
  onAddExperience: () => void;
  onViewAllExperience?: () => void;
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
}>) {
  const highlightedRole = viewModel.experienceRows[0];
  const emptyExperienceTitle =
    copy.viewAllExperience === "View all experience"
      ? "No experience added yet"
      : "Chưa có kinh nghiệm";
  const emptyExperienceDescription =
    copy.viewAllExperience === "View all experience"
      ? "Add your work history so recruiters can understand your background."
      : "Thêm kinh nghiệm làm việc để nhà tuyển dụng hiểu rõ hơn về hồ sơ của bạn.";

  return (
    <SectionCard
      id="experience"
      title={detailed ? copy.experienceDetail : copy.experienceSnapshot}
      icon={Briefcase}
      action={
        detailed ? (
          <Button
            className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700"
            onClick={onAddExperience}
          >
            <Plus />
            {copy.addExperience}
          </Button>
        ) : null
      }
    >
      {!highlightedRole ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <Briefcase className="mx-auto text-slate-400" size={34} />
          <p className="mt-3 text-sm font-extrabold text-slate-900">{emptyExperienceTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 font-medium text-slate-500">
            {emptyExperienceDescription}
          </p>
        </div>
      ) : detailed ? (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {viewModel.experienceRows.map((role, index) => (
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
                {index < viewModel.experienceRows.length - 1 ? (
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
              <p className="text-brand text-sm font-extrabold">{highlightedRole.title}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{highlightedRole.company}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {highlightedRole.period} · {highlightedRole.location}
              </p>
            </div>
            <ul className="space-y-2">
              {highlightedRole.bullets.map((bullet) => (
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
          {onViewAllExperience ? (
            <InlineAction onClick={onViewAllExperience}>{copy.viewAllExperience}</InlineAction>
          ) : (
            <InlineAction>{copy.viewAllExperience}</InlineAction>
          )}
        </>
      )}
      <span className="sr-only">{productCopy.labels.workExperience}</span>
    </SectionCard>
  );
}

function EducationCard({
  copy,
  onAddEducation,
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  onAddEducation: () => void;
  viewModel: CandidateProfileViewModel;
}>) {
  return (
    <SectionCard
      id="education"
      title={copy.educationTitle}
      icon={GraduationCap}
      action={
        <Button
          className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700"
          onClick={onAddEducation}
        >
          <Plus />
          {copy.addEducation}
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.educationDescription}</p>
      <div className="space-y-3">
        {viewModel.educationRecords.map((item) => (
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

function SkillsCard({
  copy,
  onAddSkill,
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  onAddSkill: () => void;
  viewModel: CandidateProfileViewModel;
}>) {
  return (
    <SectionCard
      id="skills"
      title={copy.skillsTitle}
      icon={Code}
      action={
        <Button
          className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700"
          onClick={onAddSkill}
        >
          <Plus />
          {copy.addSkill}
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.skillsDescription}</p>

      <div className="space-y-7">
        <div>
          <h3 className="mb-3 text-sm font-extrabold text-slate-950">{copy.technicalSkills}</h3>
          <div className="flex flex-wrap gap-3">
            {viewModel.technicalSkills.map(([name, level]) => (
              <span
                key={name}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
              >
                <span className="bg-brand size-2 rounded-full" />
                <span>{name}</span>
                {level ? (
                  <span className="text-xs font-semibold text-slate-400">({level})</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-extrabold text-slate-950">{copy.softSkills}</h3>
          <div className="flex flex-wrap gap-3">
            {viewModel.softSkills.map((skill) => (
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
            {viewModel.languageRows.map(([code, name, level, dots]) => (
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
  onEditPreferences,
  productCopy,
  viewModel,
}: Readonly<{
  compact?: boolean;
  copy: (typeof copyByLocale)["vi" | "en"];
  onEditPreferences?: () => void;
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
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
        <Button
          className="bg-brand h-10 rounded-lg px-4 font-extrabold shadow-none hover:bg-emerald-700"
          onClick={onEditPreferences}
        >
          <PencilSimple />
          {copy.editPreferences}
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm font-medium text-slate-500">{copy.preferencesDescription}</p>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {viewModel.preferenceCards.map(([label, value], index) => {
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
  viewModel,
}: Readonly<{
  activeTab: ProfileTabKey;
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
}>) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
      <CompletionCard copy={copy} productCopy={productCopy} viewModel={viewModel} />
      <NextActionCard activeTab={activeTab} copy={copy} />
      <ProfileVisibilityCard copy={copy} />
      <QuickStatsCard copy={copy} viewModel={viewModel} />
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
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  productCopy: CandidateProfileCopy;
  viewModel: CandidateProfileViewModel;
}>) {
  const dynamicCompletionItems = [
    {
      key: "personal",
      done: Boolean(
        viewModel.candidate.name && viewModel.candidate.phone && viewModel.candidate.location,
      ),
    },
    {
      key: "experience",
      done: viewModel.experienceRows.length > 0,
    },
    {
      key: "education",
      done: viewModel.educationRecords.length > 0,
    },
    {
      key: "skills",
      done: viewModel.technicalSkills.length > 0 || viewModel.skillPills.length > 0,
    },
    {
      key: "about",
      done: Boolean(viewModel.aboutText && viewModel.aboutText.trim()),
    },
  ] as const;

  const completionPercentage = Math.round(
    (dynamicCompletionItems.filter((item) => item.done).length / dynamicCompletionItems.length) *
      100,
  );

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
            value={completionPercentage}
            label={`${completionPercentage}%`}
            ariaLabel={productCopy.status.completionLabel}
          />
          <p className="pt-2 text-sm leading-6 font-medium text-slate-600">
            {copy.completionDescription}
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {dynamicCompletionItems.map((item) => (
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

function QuickStatsCard({
  copy,
  viewModel,
}: Readonly<{
  copy: (typeof copyByLocale)["vi" | "en"];
  viewModel: CandidateProfileViewModel;
}>) {
  const { candidate: profileCandidate } = viewModel;
  const stats = [
    [BookmarkSimple, copy.savedJobs, profileCandidate.savedJobs],
    [Briefcase, copy.applications, profileCandidate.applications],
    [Eye, copy.profileViews, profileCandidate.profileViews],
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

function InlineAction({
  children,
  onClick,
}: Readonly<{ children: ReactNode; onClick?: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
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
