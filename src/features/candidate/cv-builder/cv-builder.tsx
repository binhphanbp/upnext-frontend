"use client";

import {
  Briefcase,
  GraduationCap,
  Code,
  User,
  Layout,
  PaintBrush,
  Printer,
  Trash,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkle,
  Link as LinkIcon,
  EnvelopeSimple,
  Phone,
  MapPin,
  Globe,
  PlusCircle,
  FilePdf,
  CaretDoubleLeft,
  CaretDoubleRight,
  DotsSix,
  ArrowLeft,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getMyCandidateProfile, type CandidateProfileApi } from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";
import { upnextLogo } from "@/features/public/home/brand";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";

import { useCvBuilderStore } from "./store";
import { CvData } from "./types";

import "./cv-builder.css";

// Color mapping for Tailwind classes
const themeColors = {
  teal: {
    primary: "text-teal-600",
    bg: "bg-teal-500",
    border: "border-teal-500",
    accent: "text-teal-700",
    bgLight: "bg-teal-50",
    bullets: "marker:text-teal-600",
    creativeSidebar: "bg-teal-950 text-teal-50",
    divider: "border-teal-200",
  },
  indigo: {
    primary: "text-indigo-600",
    bg: "bg-indigo-500",
    border: "border-indigo-500",
    accent: "text-indigo-700",
    bgLight: "bg-indigo-50",
    bullets: "marker:text-indigo-600",
    creativeSidebar: "bg-indigo-900 text-indigo-50",
    divider: "border-indigo-200",
  },
  violet: {
    primary: "text-violet-600",
    bg: "bg-violet-500",
    border: "border-violet-500",
    accent: "text-violet-700",
    bgLight: "bg-violet-50",
    bullets: "marker:text-violet-600",
    creativeSidebar: "bg-violet-900 text-violet-50",
    divider: "border-violet-200",
  },
  emerald: {
    primary: "text-emerald-600",
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    accent: "text-emerald-700",
    bgLight: "bg-emerald-50",
    bullets: "marker:text-emerald-600",
    creativeSidebar: "bg-emerald-900 text-emerald-50",
    divider: "border-emerald-200",
  },
  slate: {
    primary: "text-slate-800",
    bg: "bg-slate-700",
    border: "border-slate-700",
    accent: "text-slate-900",
    bgLight: "bg-slate-100",
    bullets: "marker:text-slate-800",
    creativeSidebar: "bg-slate-800 text-slate-50",
    divider: "border-slate-300",
  },
};

export function CandidateCvBuilder() {
  const t = useTranslations("CvBuilder");
  const router = useRouter();

  const {
    cvData,
    updatePersonalInfo,
    updateSummary,
    addExperience,
    updateExperience,
    deleteExperience,
    moveExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    moveEducation,
    addProject,
    updateProject,
    deleteProject,
    moveProject,
    addSkill,
    updateSkill,
    deleteSkill,
    moveSection,
    setSectionsOrder,
    setCvLanguage,
    updateStyle,
    selectTemplate,
    prefillFromProfile,
    clearCv,
    setCvData,
  } = useCvBuilderStore();

  const [activeTab, setActiveTab] = useState<string>("personal");
  const [zoom, setZoom] = useState<number>(0.85);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  const style = cvData.style;
  const isCustomColor = style.themeColor.startsWith("#");
  const customColor = style.themeColor;
  const colors = isCustomColor
    ? {
        primary: "custom-cv-primary",
        bg: "custom-cv-bg",
        border: "custom-cv-border",
        accent: "custom-cv-primary",
        bgLight: "custom-cv-bg-light",
        bullets: "",
        creativeSidebar: "custom-cv-creative-sidebar",
        divider: "custom-cv-divider",
      }
    : themeColors[style.themeColor as keyof typeof themeColors] || themeColors.emerald;
  const isEn = cvData.cvLanguage === "en";

  // Dynamic headings mapping based on CV content language
  const headings = {
    contactInfo: isEn ? "Contact Info" : "Thông tin liên hệ",
    summary: isEn ? "Professional Summary" : "Tóm tắt sự nghiệp",
    experience: isEn ? "Work Experience" : "Kinh nghiệm làm việc",
    projects: isEn ? "Projects" : "Dự án phát triển",
    education: isEn ? "Education" : "Trình độ Học vấn",
    skills: isEn ? "Technical Skills" : "Kỹ năng kỹ thuật",
    present: isEn ? "Present" : "Hiện tại",
    gpa: isEn ? "GPA" : "GPA",
    techUsed: isEn ? "Technologies: " : "Công nghệ sử dụng: ",
  };

  // Convert profile backend schema to CV Builder schema
  const mapProfileToCvData = (profile: CandidateProfileApi, currentLang: "vi" | "en"): CvData => {
    return {
      personalInfo: {
        fullName: profile.account?.fullName || "",
        title: profile.jobPreference?.desiredPosition || "",
        email: profile.account?.email || "",
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        website:
          profile.links?.find((l) => l.type === "GITHUB" || l.type === "LINKEDIN")?.url || "",
      },
      summary: profile.description || "",
      experiences: (profile.experiences || []).map((exp) => ({
        id: exp.id || `exp-${Date.now()}-${Math.random()}`,
        companyName: exp.companyName || "",
        positionTitle: exp.positionTitle || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || (exp.isCurrent ? "Present" : ""),
        isCurrent: exp.isCurrent ?? false,
        description: exp.description || "",
        technologies: exp.technologies || "",
      })),
      educations: (profile.educations || []).map((edu) => ({
        id: edu.id || `edu-${Date.now()}-${Math.random()}`,
        schoolName: edu.schoolName || "",
        degree: edu.degree || "",
        major: edu.major || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || (edu.isCurrent ? "Present" : ""),
        isCurrent: edu.isCurrent ?? false,
        gpa: edu.gpa ? String(edu.gpa) : "",
        description: edu.description || "",
      })),
      projects: (profile.projects || []).map((proj) => ({
        id: proj.id || `proj-${Date.now()}-${Math.random()}`,
        name: proj.name || "",
        role: proj.role || "",
        description: proj.description || "",
        projectUrl: proj.projectUrl || "",
        deployUrl: proj.deployUrl || "",
        technologies: proj.technologies || "",
      })),
      skills: (profile.skills || []).map((sk) => ({
        id: sk.id || `sk-${Date.now()}-${Math.random()}`,
        name: sk.skill?.name || "",
        level: sk.proficiencyLevel || "ADVANCED",
      })),
      sectionsOrder: ["personal", "summary", "experience", "projects", "education", "skills"],
      style: {
        fontFamily: "font-sans",
        themeColor: "emerald",
        textSize: "base",
        marginSize: "base",
      },
      selectedTemplate: "modern",
      cvLanguage: currentLang,
    };
  };

  const syncProfileData = async (force: boolean = false) => {
    const session = getCandidateSession();
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      if (force) {
        setIsLoading(true);
      }
      const profile = await getMyCandidateProfile(session.accessToken);
      const newCvData = mapProfileToCvData(profile, cvData.cvLanguage);

      if (force) {
        setCvData(newCvData);
        void Swal.fire({
          icon: "success",
          title: "Đồng bộ thành công",
          text: "Đã cập nhật dữ liệu mới nhất từ Profile của bạn.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Auto fill if the local store is empty or has default values
        const isEmpty =
          !cvData.personalInfo.fullName &&
          !cvData.summary &&
          cvData.experiences.length === 0 &&
          cvData.educations.length === 0;

        if (isEmpty) {
          setCvData(newCvData);
        } else {
          // Ask if user wants to overwrite
          const result = await Swal.fire({
            title: "Đồng bộ từ Profile?",
            text: "Hệ thống phát hiện bạn đã có sẵn dữ liệu hồ sơ. Bạn có muốn tải dữ liệu từ Profile UpNext ghi đè lên bản nháp CV này không?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đồng bộ ngay",
            cancelButtonText: "Giữ bản nháp cũ",
            confirmButtonColor: "#0d9488",
          });

          if (result.isConfirmed) {
            setCvData(newCvData);
          }
        }
      }
    } catch (error) {
      console.error("Failed to sync profile data:", error);
      if (force) {
        void Swal.fire({
          icon: "error",
          title: "Lỗi đồng bộ",
          text: "Không thể kết nối đến máy chủ để lấy thông tin profile.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auth check & Initial fetch
  useEffect(() => {
    const session = getCandidateSession();
    if (!session) {
      router.push("/login");
      return;
    }
    void syncProfileData(false);
  }, []);

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            useCvBuilderStore.getState().redo();
          } else {
            useCvBuilderStore.getState().undo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          useCvBuilderStore.getState().redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const simulatedAiParse = () => {
    prefillFromProfile();
    alert(t("aiImportSuccess"));
  };

  const formatEndDate = (dateStr: string) => {
    if (!dateStr) return "";
    const lower = dateStr.toLowerCase().trim();
    if (lower === "present" || lower === "hiện tại" || lower === "hiện nay") {
      return headings.present;
    }
    return dateStr;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu hồ sơ từ UpNext...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 select-none">
      {/* Top Header Bar */}
      <header className="z-10 flex items-center justify-between bg-slate-900 px-6 py-4 text-white shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/candidate/profile")}
            className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
            title="Quay lại Hồ sơ"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <Image
              src={upnextLogo.whiteWordmark}
              alt="UpNext"
              width={110}
              height={26}
              priority
              className="object-contain"
            />
            <span className="mx-1 h-5 w-px bg-slate-700" />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white">{t("title")}</h1>
              <p className="text-[10px] font-semibold text-slate-400">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => syncProfileData(true)}
            variant="outline"
            className="flex items-center gap-2 rounded-lg border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-sm font-semibold text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/40"
          >
            <PlusCircle size={18} />
            Đồng bộ từ Profile
          </Button>

          <Button
            onClick={simulatedAiParse}
            variant="outline"
            className="flex items-center gap-2 rounded-lg border-slate-700 bg-transparent px-4 py-2 text-sm font-semibold text-emerald-400 hover:border-slate-500 hover:bg-slate-800"
          >
            <Sparkle size={18} weight="fill" />
            {t("aiImport")}
          </Button>

          <Button
            onClick={clearCv}
            variant="outline"
            className="flex items-center gap-2 rounded-lg border-slate-700 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-800"
          >
            <Trash size={18} />
            {t("reset")}
          </Button>

          <Button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-500"
          >
            <Printer size={18} weight="bold" />
            {t("export")}
          </Button>
        </div>
      </header>

      {/* Main Workspace split screen */}
      <div className="flex flex-1 overflow-hidden print:h-auto print:overflow-visible print:p-0">
        {/* LEFT PANEL: EDITORFORM */}
        <aside
          className={cn(
            "transition-all duration-300 flex overflow-hidden border-r border-slate-200 bg-white print:hidden",
            isEditorCollapsed ? "w-[85px] min-w-[85px]" : "w-[45%] min-w-[500px]",
          )}
        >
          {/* Tab Selection Sidebar */}
          <div className="flex w-[85px] flex-col items-center justify-between border-r border-slate-100 bg-slate-50 py-4">
            <div className="flex w-full flex-col items-center gap-2">
              {[
                { id: "personal", label: t("tabs.personal"), icon: User },
                { id: "summary", label: t("tabs.summary"), icon: FilePdf },
                { id: "experience", label: t("tabs.experience"), icon: Briefcase },
                { id: "projects", label: t("tabs.projects"), icon: Code },
                { id: "education", label: t("tabs.education"), icon: GraduationCap },
                { id: "skills", label: t("tabs.skills"), icon: PaintBrush },
                { id: "styling", label: t("tabs.styling"), icon: Layout },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsEditorCollapsed(false); // Auto expand when user clicks a tab
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center w-[72px] h-[72px] rounded-xl transition-all gap-1.5 text-[10px] font-bold outline-none",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
                    )}
                  >
                    <Icon size={22} weight={isActive ? "fill" : "regular"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Toggle collapse button */}
            <button
              onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
              className="mt-auto flex h-[52px] w-[72px] flex-col items-center justify-center rounded-xl text-slate-500 transition-colors outline-none hover:bg-slate-200 hover:text-slate-900"
              title={isEditorCollapsed ? t("preview.expand") : t("preview.collapse")}
            >
              {isEditorCollapsed ? (
                <>
                  <CaretDoubleRight size={20} />
                  <span className="mt-1 text-[8px] font-bold">{t("preview.expandLabel")}</span>
                </>
              ) : (
                <>
                  <CaretDoubleLeft size={20} />
                  <span className="mt-1 text-[8px] font-bold">{t("preview.collapseLabel")}</span>
                </>
              )}
            </button>
          </div>

          {/* Form Editing Area */}
          {!isEditorCollapsed && (
            <div className="flex-1 overflow-y-auto scroll-smooth p-6">
              {activeTab === "personal" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{t("personal.title")}</h2>
                    <p className="mt-1 text-xs text-slate-400">{t("personal.subtitle")}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">
                          {t("personal.fullName")}
                        </label>
                        <Input
                          value={cvData.personalInfo.fullName}
                          onChange={(e) => updatePersonalInfo({ fullName: e.target.value })}
                          placeholder={t("personal.fullNamePlaceholder")}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">
                          {t("personal.jobTitle")}
                        </label>
                        <Input
                          value={cvData.personalInfo.title}
                          onChange={(e) => updatePersonalInfo({ title: e.target.value })}
                          placeholder={t("personal.jobTitlePlaceholder")}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">
                          {t("personal.email")}
                        </label>
                        <Input
                          type="email"
                          value={cvData.personalInfo.email}
                          onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                          placeholder={t("personal.emailPlaceholder")}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">
                          {t("personal.phone")}
                        </label>
                        <Input
                          value={cvData.personalInfo.phoneNumber}
                          onChange={(e) => updatePersonalInfo({ phoneNumber: e.target.value })}
                          placeholder={t("personal.phonePlaceholder")}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("personal.address")}
                      </label>
                      <Input
                        value={cvData.personalInfo.address}
                        onChange={(e) => updatePersonalInfo({ address: e.target.value })}
                        placeholder={t("personal.addressPlaceholder")}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("personal.website")}
                      </label>
                      <Input
                        value={cvData.personalInfo.website}
                        onChange={(e) => updatePersonalInfo({ website: e.target.value })}
                        placeholder={t("personal.websitePlaceholder")}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "summary" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{t("summary.title")}</h2>
                    <p className="mt-1 text-xs text-slate-400">{t("summary.subtitle")}</p>
                  </div>
                  <div className="space-y-4">
                    <RichTextEditor
                      value={cvData.summary}
                      onChange={updateSummary}
                      placeholder={t("summary.placeholder")}
                    />
                  </div>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{t("experience.title")}</h2>
                      <p className="mt-1 text-xs text-slate-400">{t("experience.subtitle")}</p>
                    </div>
                    <Button
                      onClick={addExperience}
                      className="flex h-9 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus size={16} />
                      {t("experience.add")}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {cvData.experiences.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                        <p className="text-sm text-slate-400">{t("experience.empty")}</p>
                      </div>
                    ) : (
                      cvData.experiences.map((exp, index) => (
                        <div
                          key={exp.id}
                          className="relative space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <button
                              onClick={() => moveExperience(exp.id, "up")}
                              disabled={index === 0}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveExperience(exp.id, "down")}
                              disabled={index === cvData.experiences.length - 1}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => deleteExperience(exp.id)}
                              className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </button>
                          </div>

                          <div className="space-y-3 pr-20">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("experience.company")}
                                </label>
                                <Input
                                  value={exp.companyName}
                                  onChange={(e) =>
                                    updateExperience(exp.id, { companyName: e.target.value })
                                  }
                                  placeholder={t("experience.company")}
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("experience.position")}
                                </label>
                                <Input
                                  value={exp.positionTitle}
                                  onChange={(e) =>
                                    updateExperience(exp.id, { positionTitle: e.target.value })
                                  }
                                  placeholder={t("experience.position")}
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("experience.start")}
                                </label>
                                <Input
                                  value={exp.startDate}
                                  onChange={(e) =>
                                    updateExperience(exp.id, { startDate: e.target.value })
                                  }
                                  placeholder="YYYY-MM"
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("experience.end")}
                                </label>
                                <Input
                                  value={exp.endDate}
                                  onChange={(e) =>
                                    updateExperience(exp.id, { endDate: e.target.value })
                                  }
                                  placeholder="YYYY-MM or Present"
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                {t("experience.tech")}
                              </label>
                              <Input
                                value={exp.technologies}
                                onChange={(e) =>
                                  updateExperience(exp.id, { technologies: e.target.value })
                                }
                                placeholder="React, Next.js, Node.js"
                                className="h-9 bg-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                {t("experience.description")}
                              </label>
                              <RichTextEditor
                                value={exp.description}
                                onChange={(val) => updateExperience(exp.id, { description: val })}
                                placeholder="Nhập mô tả..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "projects" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{t("projects.title")}</h2>
                      <p className="mt-1 text-xs text-slate-400">{t("projects.subtitle")}</p>
                    </div>
                    <Button
                      onClick={addProject}
                      className="flex h-9 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus size={16} />
                      {t("projects.add")}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {cvData.projects.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                        <p className="text-sm text-slate-400">{t("projects.empty")}</p>
                      </div>
                    ) : (
                      cvData.projects.map((proj, index) => (
                        <div
                          key={proj.id}
                          className="relative space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <button
                              onClick={() => moveProject(proj.id, "up")}
                              disabled={index === 0}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveProject(proj.id, "down")}
                              disabled={index === cvData.projects.length - 1}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => deleteProject(proj.id)}
                              className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </button>
                          </div>

                          <div className="space-y-3 pr-20">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("projects.name")}
                                </label>
                                <Input
                                  value={proj.name}
                                  onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                                  placeholder="Project Name"
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("projects.role")}
                                </label>
                                <Input
                                  value={proj.role}
                                  onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                                  placeholder="Fullstack Developer"
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("projects.github")}
                                </label>
                                <Input
                                  value={proj.projectUrl}
                                  onChange={(e) =>
                                    updateProject(proj.id, { projectUrl: e.target.value })
                                  }
                                  placeholder="github.com/username/project"
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("projects.demo")}
                                </label>
                                <Input
                                  value={proj.deployUrl}
                                  onChange={(e) =>
                                    updateProject(proj.id, { deployUrl: e.target.value })
                                  }
                                  placeholder="project.demo.com"
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                {t("projects.tech")}
                              </label>
                              <Input
                                value={proj.technologies}
                                onChange={(e) =>
                                  updateProject(proj.id, { technologies: e.target.value })
                                }
                                placeholder="React, Next.js, Node.js"
                                className="h-9 bg-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                {t("projects.description")}
                              </label>
                              <RichTextEditor
                                value={proj.description}
                                onChange={(val) => updateProject(proj.id, { description: val })}
                                placeholder="Mô tả..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "education" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{t("education.title")}</h2>
                      <p className="mt-1 text-xs text-slate-400">{t("education.subtitle")}</p>
                    </div>
                    <Button
                      onClick={addEducation}
                      className="flex h-9 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus size={16} />
                      {t("education.add")}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {cvData.educations.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                        <p className="text-sm text-slate-400">{t("education.empty")}</p>
                      </div>
                    ) : (
                      cvData.educations.map((edu, index) => (
                        <div
                          key={edu.id}
                          className="relative space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <button
                              onClick={() => moveEducation(edu.id, "up")}
                              disabled={index === 0}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveEducation(edu.id, "down")}
                              disabled={index === cvData.educations.length - 1}
                              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => deleteEducation(edu.id)}
                              className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </button>
                          </div>

                          <div className="space-y-3 pr-20">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("education.school")}
                                </label>
                                <Input
                                  value={edu.schoolName}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { schoolName: e.target.value })
                                  }
                                  placeholder={t("education.school")}
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("education.degree")}
                                </label>
                                <Input
                                  value={edu.degree}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { degree: e.target.value })
                                  }
                                  placeholder={t("education.degree")}
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("education.major")}
                                </label>
                                <Input
                                  value={edu.major}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { major: e.target.value })
                                  }
                                  placeholder={t("education.major")}
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("education.gpa")}
                                </label>
                                <Input
                                  value={edu.gpa || ""}
                                  onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                                  placeholder="3.5/4.0"
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("education.start")}
                                </label>
                                <Input
                                  value={edu.startDate || ""}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { startDate: e.target.value })
                                  }
                                  placeholder="YYYY-MM"
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("education.end")}
                                </label>
                                <Input
                                  value={edu.endDate || ""}
                                  onChange={(e) =>
                                    updateEducation(edu.id, { endDate: e.target.value })
                                  }
                                  placeholder="YYYY-MM or Present"
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                {t("education.description")}
                              </label>
                              <RichTextEditor
                                value={edu.description}
                                onChange={(val) => updateEducation(edu.id, { description: val })}
                                placeholder="Mô tả..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{t("skills.title")}</h2>
                      <p className="mt-1 text-xs text-slate-400">{t("skills.subtitle")}</p>
                    </div>
                    <Button
                      onClick={addSkill}
                      className="flex h-9 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus size={16} />
                      {t("skills.add")}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {cvData.skills.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                        <p className="text-sm text-slate-400">{t("skills.empty")}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {cvData.skills.map((sk) => (
                          <div
                            key={sk.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                          >
                            <Input
                              value={sk.name}
                              onChange={(e) => updateSkill(sk.id, { name: e.target.value })}
                              placeholder={t("skills.name")}
                              className="h-9 flex-1 bg-white"
                            />
                            <select
                              value={sk.level}
                              onChange={(e) => updateSkill(sk.id, { level: e.target.value as any })}
                              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none"
                            >
                              <option value="BEGINNER">{t("skills.levels.beginner")}</option>
                              <option value="INTERMEDIATE">
                                {t("skills.levels.intermediate")}
                              </option>
                              <option value="ADVANCED">{t("skills.levels.advanced")}</option>
                              <option value="EXPERT">{t("skills.levels.expert")}</option>
                            </select>
                            <button
                              onClick={() => deleteSkill(sk.id)}
                              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "styling" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{t("styling.title")}</h2>
                    <p className="mt-1 text-xs text-slate-400">{t("styling.subtitle")}</p>
                  </div>

                  <div className="space-y-6">
                    {/* CV Content Language Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.cvLanguage")}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "vi", name: t("styling.cvLanguages.vi") },
                          { id: "en", name: t("styling.cvLanguages.en") },
                        ].map((l) => (
                          <button
                            key={l.id}
                            onClick={() => setCvLanguage(l.id as any)}
                            className={cn(
                              "py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all",
                              cvData.cvLanguage === l.id
                                ? "border-emerald-500 text-emerald-700 bg-emerald-50/20"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600",
                            )}
                          >
                            {l.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.template")}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "modern", name: "Modern (1 col)" },
                          { id: "minimalist", name: "Minimalist B&W" },
                          { id: "creative", name: "Creative (2 col)" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => selectTemplate(t.id as any)}
                            className={cn(
                              "py-2.5 px-3 border-2 rounded-xl text-xs font-bold transition-all text-center",
                              cvData.selectedTemplate === t.id
                                ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 text-slate-600",
                            )}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color palette */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.themeColor")}
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {[
                          { id: "teal", bg: "bg-teal-500", name: "Teal" },
                          { id: "indigo", bg: "bg-indigo-500", name: "Indigo" },
                          { id: "violet", bg: "bg-violet-500", name: "Violet" },
                          { id: "emerald", bg: "bg-emerald-500", name: "Emerald" },
                          { id: "slate", bg: "bg-slate-700", name: "Slate" },
                        ].map((c) => (
                          <button
                            key={c.id}
                            onClick={() => updateStyle({ themeColor: c.id as any })}
                            title={c.name}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                              style.themeColor === c.id
                                ? "border-slate-800 ring-2 ring-emerald-300"
                                : "border-transparent",
                            )}
                          >
                            <span className={cn("w-6 h-6 rounded-full block", c.bg)} />
                          </button>
                        ))}

                        {/* Custom Color Picker */}
                        {(() => {
                          const isCustom = style.themeColor.startsWith("#");
                          const designerColors = [
                            "#f43f5e",
                            "#ec4899",
                            "#a855f7",
                            "#8b5cf6",
                            "#6366f1",
                            "#3b82f6",
                            "#0ea5e9",
                            "#14b8a6",
                            "#10b981",
                            "#f59e0b",
                            "#f97316",
                            "#475569",
                          ];
                          return (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                title="Chọn màu tùy chỉnh"
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer relative overflow-hidden outline-none",
                                  isCustom
                                    ? "border-slate-800 ring-2 ring-emerald-300"
                                    : "border-slate-200 hover:border-slate-300",
                                )}
                                style={{
                                  background: isCustom
                                    ? style.themeColor
                                    : "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)",
                                }}
                              />

                              {showColorPicker && (
                                <>
                                  {/* Close Popover Backdrop */}
                                  <div
                                    className="fixed inset-0 z-40 cursor-default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowColorPicker(false);
                                    }}
                                  />
                                  {/* Popover Card */}
                                  <div className="animate-in fade-in slide-in-from-top-2 absolute top-10 left-0 z-50 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl duration-150">
                                    <h4 className="mb-3 text-xs font-extrabold text-slate-800 uppercase">
                                      Màu sắc tùy chỉnh
                                    </h4>

                                    {/* Palette Grid */}
                                    <div className="mb-3 grid grid-cols-6 gap-2">
                                      {designerColors.map((color) => (
                                        <button
                                          key={color}
                                          type="button"
                                          onClick={() => updateStyle({ themeColor: color })}
                                          className={cn(
                                            "w-7 h-7 rounded-full border border-slate-200/50 hover:scale-110 active:scale-95 transition-transform",
                                            style.themeColor === color
                                              ? "ring-2 ring-slate-800"
                                              : "",
                                          )}
                                          style={{ backgroundColor: color }}
                                          title={color}
                                        />
                                      ))}
                                    </div>

                                    {/* HEX input and picker */}
                                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                                      <div className="relative flex-1">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-slate-400">
                                          #
                                        </span>
                                        <input
                                          type="text"
                                          placeholder="FFFFFF"
                                          maxLength={7}
                                          value={
                                            style.themeColor.startsWith("#")
                                              ? style.themeColor.replace("#", "")
                                              : ""
                                          }
                                          onChange={(e) => {
                                            const hex = e.target.value.trim();
                                            if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                                              updateStyle({
                                                themeColor: hex ? `#${hex}` : "#10b981",
                                              });
                                            }
                                          }}
                                          className="w-full rounded-lg border border-slate-200 py-1.5 pr-3 pl-7 text-xs font-bold text-slate-700 uppercase outline-none focus:border-emerald-500"
                                        />
                                      </div>

                                      {/* Native picker proxy button */}
                                      <label
                                        title="Chọn từ bảng màu chi tiết"
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 transition-transform hover:bg-slate-50 active:scale-95"
                                      >
                                        <PaintBrush size={16} className="text-slate-600" />
                                        <input
                                          type="color"
                                          value={isCustom ? style.themeColor : "#10b981"}
                                          onChange={(e) =>
                                            updateStyle({ themeColor: e.target.value })
                                          }
                                          className="sr-only"
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Typography Font family */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.fontFamily")}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "font-sans", name: "Sans-Serif (Inter)" },
                          { id: "font-outfit", name: "Outfit (Modern)" },
                          { id: "font-serif", name: "Classic Serif" },
                          { id: "font-mono", name: "Developer Mono" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => updateStyle({ fontFamily: f.id as any })}
                            className={cn(
                              "py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all",
                              style.fontFamily === f.id
                                ? "border-emerald-500 text-emerald-700 bg-emerald-50/20"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600",
                            )}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font sizes */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.textSize")}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "sm", name: t("styling.textSizes.sm") },
                          { id: "base", name: t("styling.textSizes.base") },
                          { id: "lg", name: t("styling.textSizes.lg") },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => updateStyle({ textSize: s.id as any })}
                            className={cn(
                              "py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all",
                              style.textSize === s.id
                                ? "border-emerald-500 text-emerald-700 bg-emerald-50/20"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600",
                            )}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margins */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.marginSize")}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "sm", name: t("styling.marginSizes.sm") },
                          { id: "base", name: t("styling.marginSizes.base") },
                          { id: "lg", name: t("styling.marginSizes.lg") },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => updateStyle({ marginSize: m.id as any })}
                            className={cn(
                              "py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all",
                              style.marginSize === m.id
                                ? "border-emerald-500 text-emerald-700 bg-emerald-50/20"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600",
                            )}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Order */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">
                        {t("styling.sectionsOrder")}
                      </label>
                      <div className="space-y-2">
                        {cvData.sectionsOrder.map((sec, idx) => {
                          const secIconMap = {
                            personal: User,
                            summary: FilePdf,
                            experience: Briefcase,
                            projects: Code,
                            education: GraduationCap,
                            skills: PaintBrush,
                          };
                          return (
                            <div
                              key={sec}
                              draggable={sec !== "personal"}
                              onDragStart={(e) => {
                                if (sec === "personal") return;
                                setDraggedIndex(idx);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (sec !== "personal" && draggedIndex !== idx) {
                                  setDragOverIndex(idx);
                                }
                              }}
                              onDragEnd={() => {
                                setDraggedIndex(null);
                                setDragOverIndex(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (
                                  draggedIndex !== null &&
                                  draggedIndex !== idx &&
                                  sec !== "personal"
                                ) {
                                  const newOrder = [...cvData.sectionsOrder];
                                  const [removed] = newOrder.splice(draggedIndex, 1);
                                  if (removed) {
                                    newOrder.splice(idx, 0, removed);
                                    setSectionsOrder(newOrder);
                                  }
                                }
                                setDraggedIndex(null);
                                setDragOverIndex(null);
                              }}
                              className={cn(
                                "flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all duration-200",
                                sec === "personal"
                                  ? "bg-slate-50/20 border-slate-100 cursor-not-allowed opacity-80"
                                  : "bg-slate-50/30 border-slate-200 cursor-grab active:cursor-grabbing hover:border-emerald-200 hover:bg-slate-50",
                                draggedIndex === idx
                                  ? "opacity-30 bg-slate-100 border-dashed border-emerald-300"
                                  : "",
                                dragOverIndex === idx
                                  ? "border-emerald-500 bg-emerald-50/30 scale-[1.02]"
                                  : "",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {sec !== "personal" && (
                                  <DotsSix size={18} className="cursor-grab text-slate-400" />
                                )}
                                {(() => {
                                  const SecIcon = secIconMap[sec] || User;
                                  return <SecIcon size={16} className="text-slate-500" />;
                                })()}
                                <span className="font-semibold text-slate-700">
                                  {t(`${sec}.title`)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => moveSection(sec, "up")}
                                  disabled={idx === 0 || sec === "personal"}
                                  className="rounded p-1 hover:bg-slate-200 disabled:opacity-30"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => moveSection(sec, "down")}
                                  disabled={
                                    idx === cvData.sectionsOrder.length - 1 || sec === "personal"
                                  }
                                  className="rounded p-1 hover:bg-slate-200 disabled:opacity-30"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* RIGHT PANEL: A4 PREVIEW */}
        <main className="flex flex-1 flex-col items-center overflow-y-auto bg-slate-200 p-6 print:overflow-visible print:bg-white print:p-0">
          {/* Zoom Slider Control */}
          <div className="mb-4 flex w-full max-w-[210mm] items-center justify-between rounded-xl border border-slate-200/60 bg-white p-3 text-xs font-bold text-slate-600 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <Layout size={18} />
              <span>{t("preview.title")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{t("preview.zoom")}</span>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 cursor-pointer accent-teal-600"
              />
              <span className="w-12 text-right">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Scale wrapper for zoom */}
          <div className="flex w-full items-start justify-center print:block print:w-auto print:transform-none">
            <div
              className="print:origin-auto origin-top transform-gpu pb-12 transition-transform print:transform-none"
              style={{
                transform: `scale(${zoom})`,
                width: "210mm",
              }}
            >
              <div
                id="cv-print-area"
                className={cn(
                  "a4-sheet print-area font-sans text-slate-800 text-left relative",
                  style.fontFamily,
                  `margin-${style.marginSize}`,
                  `text-${style.textSize}`,
                )}
              >
                {/* Custom Color Styling Injection */}
                {isCustomColor && (
                  <style>{`
                    .custom-cv-primary { color: ${customColor} !important; }
                    .custom-cv-bg { background-color: ${customColor} !important; }
                    .custom-cv-border { border-color: ${customColor}30 !important; }
                    .custom-cv-bg-light { background-color: ${customColor}10 !important; }
                    .custom-cv-divider { border-color: ${customColor}20 !important; }
                    .custom-cv-creative-sidebar { background-color: ${customColor} !important; }
                  `}</style>
                )}
                {/* Page Break Dotted Indicators on Screen */}
                <div className="page-break-indicator print:hidden" style={{ top: "296mm" }} />
                <div className="page-break-indicator print:hidden" style={{ top: "593mm" }} />
                <div className="page-break-indicator print:hidden" style={{ top: "890mm" }} />

                {/* 1. MODERN TEMPLATE RENDERING */}
                {cvData.selectedTemplate === "modern" && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div
                      className="border-b pb-4 text-center"
                      style={{
                        borderColor: isCustomColor
                          ? `${customColor}20`
                          : (
                              themeColors[style.themeColor as keyof typeof themeColors] ||
                              themeColors.emerald
                            ).divider,
                      }}
                    >
                      <h1 className={cn("font-bold tracking-tight text-slate-900")}>
                        {cvData.personalInfo.fullName || (isEn ? "YOUR NAME" : "HỌ VÀ TÊN CỦA BẠN")}
                      </h1>
                      <p className={cn("font-semibold text-sm mt-1", colors.primary)}>
                        {cvData.personalInfo.title ||
                          (isEn ? "Target Position" : "Vị trí ứng tuyển")}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {cvData.personalInfo.email && (
                          <span className="flex items-center gap-1">
                            <EnvelopeSimple size={14} />
                            {cvData.personalInfo.email}
                          </span>
                        )}
                        {cvData.personalInfo.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {cvData.personalInfo.phoneNumber}
                          </span>
                        )}
                        {cvData.personalInfo.address && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {cvData.personalInfo.address}
                          </span>
                        )}
                        {cvData.personalInfo.website && (
                          <span className="flex items-center gap-1">
                            <Globe size={14} />
                            {cvData.personalInfo.website}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Sections */}
                    {cvData.sectionsOrder.map((sectionKey) => {
                      if (sectionKey === "personal") return null;

                      if (sectionKey === "summary" && cvData.summary) {
                        return (
                          <div key={sectionKey} className="space-y-2">
                            <h2
                              className={cn(
                                "text-base font-bold uppercase tracking-wider",
                                colors.primary,
                              )}
                            >
                              {headings.summary}
                            </h2>
                            <div className={cn("w-full border-t border-slate-200 mt-1 mb-2")} />
                            <div
                              className="preview-rich-text text-sm leading-relaxed text-slate-600"
                              dangerouslySetInnerHTML={{ __html: cvData.summary }}
                            />
                          </div>
                        );
                      }

                      if (sectionKey === "experience" && cvData.experiences.length > 0) {
                        return (
                          <div key={sectionKey} className="space-y-3">
                            <h2
                              className={cn(
                                "text-base font-bold uppercase tracking-wider",
                                colors.primary,
                              )}
                            >
                              {headings.experience}
                            </h2>
                            <div className={cn("w-full border-t border-slate-200 mt-1 mb-2")} />
                            <div className="space-y-4">
                              {cvData.experiences.map((exp) => (
                                <div key={exp.id} className="space-y-1.5">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="font-bold text-slate-900">
                                        {exp.companyName}
                                      </span>
                                      <span className="mx-2 text-slate-400">|</span>
                                      <span className="font-semibold text-slate-700 italic">
                                        {exp.positionTitle}
                                      </span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                      {exp.startDate} - {formatEndDate(exp.endDate)}
                                    </span>
                                  </div>

                                  {exp.technologies && (
                                    <div className="text-xs font-semibold text-slate-600">
                                      <span className="font-normal text-slate-400">
                                        {headings.techUsed}
                                      </span>
                                      {exp.technologies}
                                    </div>
                                  )}

                                  <div
                                    className="preview-rich-text pl-0 text-xs text-slate-600"
                                    dangerouslySetInnerHTML={{ __html: exp.description }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "projects" && cvData.projects.length > 0) {
                        return (
                          <div key={sectionKey} className="space-y-3">
                            <h2
                              className={cn(
                                "text-base font-bold uppercase tracking-wider",
                                colors.primary,
                              )}
                            >
                              {headings.projects}
                            </h2>
                            <div className={cn("w-full border-t border-slate-200 mt-1 mb-2")} />
                            <div className="space-y-4">
                              {cvData.projects.map((proj) => (
                                <div key={proj.id} className="space-y-1.5">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="font-bold text-slate-900">{proj.name}</span>
                                      <span className="mx-2 text-slate-400">|</span>
                                      <span className="font-semibold text-slate-600 italic">
                                        {proj.role}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      {proj.projectUrl && (
                                        <a
                                          href={`https://${proj.projectUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-0.5 font-medium text-teal-600 hover:underline"
                                        >
                                          <LinkIcon size={12} />
                                          GitHub
                                        </a>
                                      )}
                                      {proj.deployUrl && (
                                        <a
                                          href={`https://${proj.deployUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-0.5 font-medium text-indigo-600 hover:underline"
                                        >
                                          <Globe size={12} />
                                          Demo
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {proj.technologies && (
                                    <div className="text-xs font-semibold text-slate-600">
                                      <span className="font-normal text-slate-400">
                                        {headings.techUsed}
                                      </span>
                                      {proj.technologies}
                                    </div>
                                  )}

                                  <div
                                    className="preview-rich-text pl-0 text-xs text-slate-600"
                                    dangerouslySetInnerHTML={{ __html: proj.description }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "education" && cvData.educations.length > 0) {
                        return (
                          <div key={sectionKey} className="space-y-3">
                            <h2
                              className={cn(
                                "text-base font-bold uppercase tracking-wider",
                                colors.primary,
                              )}
                            >
                              {headings.education}
                            </h2>
                            <div className={cn("w-full border-t border-slate-200 mt-1 mb-2")} />
                            <div className="space-y-3">
                              {cvData.educations.map((edu) => (
                                <div key={edu.id} className="space-y-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="font-bold text-slate-900">
                                        {edu.schoolName}
                                      </span>
                                      <span className="mx-2 text-slate-400">|</span>
                                      <span className="font-semibold text-slate-700">
                                        {edu.degree} - {edu.major}
                                      </span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                      {edu.startDate} - {formatEndDate(edu.endDate)}
                                    </span>
                                  </div>
                                  {edu.gpa && (
                                    <div className="text-xs text-slate-500">
                                      {headings.gpa}: {edu.gpa}
                                    </div>
                                  )}
                                  <div
                                    className="preview-rich-text text-xs text-slate-600"
                                    dangerouslySetInnerHTML={{ __html: edu.description }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "skills" && cvData.skills.length > 0) {
                        return (
                          <div key={sectionKey} className="space-y-2">
                            <h2
                              className={cn(
                                "text-base font-bold uppercase tracking-wider",
                                colors.primary,
                              )}
                            >
                              {headings.skills}
                            </h2>
                            <div className={cn("w-full border-t border-slate-200 mt-1 mb-2")} />
                            <div className="flex flex-wrap gap-2 pt-1">
                              {cvData.skills.map((sk) => (
                                <div
                                  key={sk.id}
                                  className="flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs"
                                >
                                  <span className="font-bold text-slate-800">{sk.name}</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    {sk.level === "EXPERT"
                                      ? isEn
                                        ? "Expert"
                                        : "Chuyên gia"
                                      : sk.level === "ADVANCED"
                                        ? isEn
                                          ? "Advanced"
                                          : "Thành thạo"
                                        : sk.level === "INTERMEDIATE"
                                          ? isEn
                                            ? "Intermediate"
                                            : "Khá"
                                          : isEn
                                            ? "Beginner"
                                            : "Cơ bản"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}

                {/* 2. MINIMALIST TEMPLATE RENDERING */}
                {cvData.selectedTemplate === "minimalist" && (
                  <div className="space-y-6">
                    {/* Minimal Header */}
                    <div className="space-y-1.5">
                      <h1 className="text-3xl font-extrabold tracking-wide text-slate-900 uppercase">
                        {cvData.personalInfo.fullName || (isEn ? "YOUR NAME" : "HỌ VÀ TÊN")}
                      </h1>
                      <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                        {cvData.personalInfo.title ||
                          (isEn ? "TARGET POSITION" : "VỊ TRÍ ỨNG TUYỂN")}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-slate-600">
                        {cvData.personalInfo.email && <span>{cvData.personalInfo.email}</span>}
                        {cvData.personalInfo.phoneNumber && (
                          <span>• {cvData.personalInfo.phoneNumber}</span>
                        )}
                        {cvData.personalInfo.address && (
                          <span>• {cvData.personalInfo.address}</span>
                        )}
                        {cvData.personalInfo.website && (
                          <span>
                            • <span className="underline">{cvData.personalInfo.website}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-b-2 border-slate-800" />

                    {/* Dynamic Sections */}
                    {cvData.sectionsOrder.map((sectionKey) => {
                      if (sectionKey === "personal") return null;

                      if (sectionKey === "summary" && cvData.summary) {
                        return (
                          <div key={sectionKey} className="grid grid-cols-4 gap-4">
                            <h3 className="col-span-1 text-xs font-extrabold tracking-widest text-slate-800 uppercase">
                              {headings.summary}
                            </h3>
                            <div className="col-span-3">
                              <div
                                className="preview-rich-text text-xs leading-relaxed text-slate-700"
                                dangerouslySetInnerHTML={{ __html: cvData.summary }}
                              />
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "experience" && cvData.experiences.length > 0) {
                        return (
                          <div key={sectionKey} className="grid grid-cols-4 gap-4">
                            <h3 className="col-span-1 text-xs font-extrabold tracking-widest text-slate-800 uppercase">
                              {headings.experience}
                            </h3>
                            <div className="col-span-3 space-y-4">
                              {cvData.experiences.map((exp) => (
                                <div key={exp.id} className="space-y-1">
                                  <div className="flex items-start justify-between text-xs font-bold text-slate-900">
                                    <span>
                                      {exp.companyName} —{" "}
                                      <span className="font-normal italic">
                                        {exp.positionTitle}
                                      </span>
                                    </span>
                                    <span className="font-medium text-slate-500">
                                      {exp.startDate} - {formatEndDate(exp.endDate)}
                                    </span>
                                  </div>
                                  {exp.technologies && (
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase">
                                      Tech: {exp.technologies}
                                    </p>
                                  )}
                                  <div
                                    className="preview-rich-text text-xs leading-relaxed text-slate-600"
                                    dangerouslySetInnerHTML={{ __html: exp.description }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "projects" && cvData.projects.length > 0) {
                        return (
                          <div key={sectionKey} className="grid grid-cols-4 gap-4">
                            <h3 className="col-span-1 text-xs font-extrabold tracking-widest text-slate-800 uppercase">
                              {headings.projects}
                            </h3>
                            <div className="col-span-3 space-y-4">
                              {cvData.projects.map((proj) => (
                                <div key={proj.id} className="space-y-1">
                                  <div className="flex items-start justify-between text-xs font-bold text-slate-900">
                                    <span>
                                      {proj.name} —{" "}
                                      <span className="font-normal italic">{proj.role}</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-teal-700 underline">
                                      {proj.projectUrl || proj.deployUrl}
                                    </span>
                                  </div>
                                  <div
                                    className="preview-rich-text text-xs leading-relaxed text-slate-600"
                                    dangerouslySetInnerHTML={{ __html: proj.description }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "education" && cvData.educations.length > 0) {
                        return (
                          <div key={sectionKey} className="grid grid-cols-4 gap-4">
                            <h3 className="col-span-1 text-xs font-extrabold tracking-widest text-slate-800 uppercase">
                              {headings.education}
                            </h3>
                            <div className="col-span-3 space-y-3">
                              {cvData.educations.map((edu) => (
                                <div key={edu.id} className="space-y-1 text-xs">
                                  <div className="flex items-start justify-between font-bold text-slate-900">
                                    <span>{edu.schoolName}</span>
                                    <span className="font-medium text-slate-500">
                                      {edu.startDate} - {formatEndDate(edu.endDate)}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 italic">
                                    {edu.degree} - {edu.major} {edu.gpa && `(GPA: ${edu.gpa})`}
                                  </p>
                                  <div
                                    className="preview-rich-text text-slate-600"
                                    dangerouslySetInnerHTML={{ __html: edu.description }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sectionKey === "skills" && cvData.skills.length > 0) {
                        return (
                          <div key={sectionKey} className="grid grid-cols-4 gap-4">
                            <h3 className="col-span-1 text-xs font-extrabold tracking-widest text-slate-800 uppercase">
                              {headings.skills}
                            </h3>
                            <div className="col-span-3">
                              <p className="text-xs leading-relaxed text-slate-700">
                                {cvData.skills.map((sk, idx) => (
                                  <span key={sk.id}>
                                    <strong>{sk.name}</strong> (
                                    {sk.level === "EXPERT"
                                      ? isEn
                                        ? "Expert"
                                        : "Chuyên gia"
                                      : sk.level === "ADVANCED"
                                        ? isEn
                                          ? "Advanced"
                                          : "Thành thạo"
                                        : sk.level === "INTERMEDIATE"
                                          ? isEn
                                            ? "Intermediate"
                                            : "Khá"
                                          : isEn
                                            ? "Beginner"
                                            : "Cơ bản"}
                                    ){idx < cvData.skills.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}

                {/* 3. CREATIVE TEMPLATE RENDERING */}
                {cvData.selectedTemplate === "creative" && (
                  <div className="-m-[20mm] grid min-h-[257mm] grid-cols-3 gap-0 print:-m-[20mm]">
                    {/* Left Column (Colored Sidebar) */}
                    <div
                      className={cn(
                        "col-span-1 p-6 space-y-6 flex flex-col justify-start",
                        colors.creativeSidebar,
                      )}
                    >
                      {/* Avatar placeholder / Personal Info */}
                      <div className="space-y-4">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-black select-none">
                          {cvData.personalInfo.fullName?.charAt(0) || "U"}
                        </div>

                        <div className="text-center">
                          <h1 className="text-lg leading-snug font-bold tracking-tight">
                            {cvData.personalInfo.fullName || (isEn ? "YOUR NAME" : "TÊN CỦA BẠN")}
                          </h1>
                          <p className="mt-1 text-[11px] font-semibold tracking-wider text-teal-300 uppercase">
                            {cvData.personalInfo.title ||
                              (isEn ? "Target Position" : "Vị trí công việc")}
                          </p>
                        </div>
                      </div>

                      {/* Contacts block */}
                      <div className="space-y-3 border-t border-white/15 pt-4">
                        <h3 className="text-xs font-black tracking-widest text-teal-300 uppercase">
                          {headings.contactInfo}
                        </h3>
                        <div className="space-y-2 text-[11px] opacity-90">
                          {cvData.personalInfo.email && (
                            <div className="flex items-center gap-2">
                              <EnvelopeSimple size={14} className="opacity-70" />
                              <span className="truncate">{cvData.personalInfo.email}</span>
                            </div>
                          )}
                          {cvData.personalInfo.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="opacity-70" />
                              <span>{cvData.personalInfo.phoneNumber}</span>
                            </div>
                          )}
                          {cvData.personalInfo.address && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="opacity-70" />
                              <span className="line-clamp-2">{cvData.personalInfo.address}</span>
                            </div>
                          )}
                          {cvData.personalInfo.website && (
                            <div className="flex items-center gap-2">
                              <Globe size={14} className="opacity-70" />
                              <span className="truncate">{cvData.personalInfo.website}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills in Sidebar */}
                      {cvData.skills.length > 0 && (
                        <div className="space-y-3 border-t border-white/15 pt-4">
                          <h3 className="text-xs font-black tracking-widest text-teal-300 uppercase">
                            {headings.skills}
                          </h3>
                          <div className="space-y-2.5">
                            {cvData.skills.map((sk) => {
                              const levelPercent =
                                sk.level === "EXPERT"
                                  ? "w-full"
                                  : sk.level === "ADVANCED"
                                    ? "w-4/5"
                                    : sk.level === "INTERMEDIATE"
                                      ? "w-3/5"
                                      : "w-2/5";
                              return (
                                <div key={sk.id} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-semibold">
                                    <span>{sk.name}</span>
                                    <span className="text-[9px] uppercase opacity-75">
                                      {sk.level === "EXPERT"
                                        ? isEn
                                          ? "Expert"
                                          : "Chuyên gia"
                                        : sk.level === "ADVANCED"
                                          ? isEn
                                            ? "Advanced"
                                            : "Thành thạo"
                                          : sk.level === "INTERMEDIATE"
                                            ? isEn
                                              ? "Intermediate"
                                              : "Khá"
                                            : isEn
                                              ? "Beginner"
                                              : "Cơ bản"}
                                    </span>
                                  </div>
                                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                                    <div className={cn("h-full bg-teal-400", levelPercent)} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Education in Sidebar */}
                      {cvData.educations.length > 0 && (
                        <div className="space-y-3 border-t border-white/15 pt-4">
                          <h3 className="text-xs font-black tracking-widest text-teal-300 uppercase">
                            {headings.education}
                          </h3>
                          <div className="space-y-3">
                            {cvData.educations.map((edu) => (
                              <div key={edu.id} className="space-y-1 text-[11px]">
                                <p className="font-bold">{edu.schoolName}</p>
                                <p className="opacity-90">
                                  {edu.degree} / {edu.major}
                                </p>
                                <p className="text-[9px] opacity-70">
                                  {edu.startDate} - {formatEndDate(edu.endDate)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column (Main Content) */}
                    <div className="col-span-2 space-y-6 bg-white p-6 text-slate-800">
                      {/* Profile Summary */}
                      {cvData.summary && (
                        <div className="space-y-2">
                          <h2
                            className={cn(
                              "text-sm font-bold uppercase tracking-wider border-b pb-1.5",
                              colors.primary,
                              colors.divider,
                            )}
                          >
                            {headings.summary}
                          </h2>
                          <div
                            className="preview-rich-text text-xs leading-relaxed text-slate-600"
                            dangerouslySetInnerHTML={{ __html: cvData.summary }}
                          />
                        </div>
                      )}

                      {/* Work Experience */}
                      {cvData.experiences.length > 0 && (
                        <div className="space-y-3">
                          <h2
                            className={cn(
                              "text-sm font-bold uppercase tracking-wider border-b pb-1.5",
                              colors.primary,
                              colors.divider,
                            )}
                          >
                            {headings.experience}
                          </h2>
                          <div className="space-y-4">
                            {cvData.experiences.map((exp) => (
                              <div key={exp.id} className="space-y-1">
                                <div className="flex items-start justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">
                                      {exp.companyName}
                                    </span>
                                    <span className="mx-1.5 text-slate-400">|</span>
                                    <span className="font-semibold text-slate-700 italic">
                                      {exp.positionTitle}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {exp.startDate} - {formatEndDate(exp.endDate)}
                                  </span>
                                </div>
                                {exp.technologies && (
                                  <p className="text-[10px] font-semibold text-slate-500">
                                    Tech: {exp.technologies}
                                  </p>
                                )}
                                <div
                                  className="preview-rich-text text-xs leading-relaxed text-slate-600"
                                  dangerouslySetInnerHTML={{ __html: exp.description }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {cvData.projects.length > 0 && (
                        <div className="space-y-3">
                          <h2
                            className={cn(
                              "text-sm font-bold uppercase tracking-wider border-b pb-1.5",
                              colors.primary,
                              colors.divider,
                            )}
                          >
                            {headings.projects}
                          </h2>
                          <div className="space-y-4">
                            {cvData.projects.map((proj) => (
                              <div key={proj.id} className="space-y-1">
                                <div className="flex items-start justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">{proj.name}</span>
                                    <span className="mx-1.5 text-slate-400">|</span>
                                    <span className="font-semibold text-slate-700 italic">
                                      {proj.role}
                                    </span>
                                  </div>
                                  <div className="flex gap-2 text-[10px]">
                                    {proj.projectUrl && (
                                      <span className="text-teal-600 underline">
                                        {proj.projectUrl}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="preview-rich-text text-xs leading-relaxed text-slate-600"
                                  dangerouslySetInnerHTML={{ __html: proj.description }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CandidateCvBuilder;
