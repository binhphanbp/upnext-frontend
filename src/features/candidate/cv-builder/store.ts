import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  CvData,
  CvEducation,
  CvExperience,
  CvPersonalInfo,
  CvProject,
  CvSectionKey,
  CvSkill,
  CvStyleConfig,
  CvTargetJob,
} from "./types";

/** Các lần sửa cách nhau dưới ngần này được gộp thành một bước undo. */
const HISTORY_COALESCE_MS = 800;

const DEFAULT_SECTIONS: CvSectionKey[] = [
  "personal",
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
];

export const CV_BUILDER_STORAGE_NAME = "upnext-cv-builder-draft";

export function getCvBuilderStorageKey(accountId: string) {
  return `${CV_BUILDER_STORAGE_NAME}.${accountId}`;
}

export function createInitialCvData(language: CvData["cvLanguage"] = "vi"): CvData {
  return {
    targetJob: {
      role: "",
      company: "",
      description: "",
    },
    personalInfo: {
      fullName: "",
      title: "",
      email: "",
      phoneNumber: "",
      address: "",
      website: "",
    },
    summary: "",
    experiences: [],
    educations: [],
    projects: [],
    skills: [],
    sectionsOrder: [...DEFAULT_SECTIONS],
    style: {
      fontFamily: "font-sans",
      themeColor: "emerald",
      textSize: "base",
      marginSize: "base",
    },
    selectedTemplate: "modern",
    cvLanguage: language,
    hiddenSections: [],
    customSectionNames: {},
  };
}

function cloneCvData(cvData: CvData): CvData {
  return JSON.parse(JSON.stringify(cvData)) as CvData;
}

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}-${randomId}`;
}

function getScopedStorageKey(name: string) {
  if (typeof window === "undefined") return `${name}.anonymous`;

  try {
    const rawUser = window.localStorage.getItem("upnext.candidate.user");
    const user = rawUser ? (JSON.parse(rawUser) as { id?: string }) : null;
    return `${name}.${user?.id ?? "anonymous"}`;
  } catch {
    return `${name}.anonymous`;
  }
}

const accountScopedStorage = createJSONStorage(() => ({
  getItem: (name: string) => window.localStorage.getItem(getScopedStorageKey(name)),
  removeItem: (name: string) => window.localStorage.removeItem(getScopedStorageKey(name)),
  setItem: (name: string, value: string) =>
    window.localStorage.setItem(getScopedStorageKey(name), value),
}));

function normalizeCvData(value: CvData | undefined): CvData {
  const fallback = createInitialCvData(value?.cvLanguage ?? "vi");
  if (!value) return fallback;

  const sections = value.sectionsOrder?.filter(
    (section, index, values) =>
      DEFAULT_SECTIONS.includes(section) && values.indexOf(section) === index,
  );
  const sectionsOrder = [...(sections ?? [])];
  for (const section of DEFAULT_SECTIONS) {
    if (!sectionsOrder.includes(section)) sectionsOrder.push(section);
  }

  return {
    ...fallback,
    ...value,
    targetJob: { ...fallback.targetJob, ...value.targetJob },
    personalInfo: { ...fallback.personalInfo, ...value.personalInfo },
    style: { ...fallback.style, ...value.style },
    experiences: value.experiences ?? [],
    educations: value.educations ?? [],
    projects: value.projects ?? [],
    skills: value.skills ?? [],
    sectionsOrder,
    hiddenSections: value.hiddenSections ?? [],
    customSectionNames: value.customSectionNames ?? {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Restores the immutable snapshot stored with a Builder CV version. Upload CVs
 * deliberately have no JSON snapshot, so callers can distinguish the two
 * preview paths without guessing from a missing file.
 */
export function parseCvSnapshot(value: unknown): CvData | null {
  try {
    const parsed = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    if (!isRecord(parsed)) return null;

    const candidate = parsed as Partial<CvData>;
    const fallback = createInitialCvData(candidate.cvLanguage === "en" ? "en" : "vi");
    return normalizeCvData({
      ...fallback,
      ...candidate,
      targetJob: isRecord(candidate.targetJob)
        ? (candidate.targetJob as CvTargetJob)
        : fallback.targetJob,
      personalInfo: isRecord(candidate.personalInfo)
        ? (candidate.personalInfo as CvPersonalInfo)
        : fallback.personalInfo,
      style: isRecord(candidate.style) ? (candidate.style as CvStyleConfig) : fallback.style,
      experiences: Array.isArray(candidate.experiences) ? candidate.experiences : [],
      educations: Array.isArray(candidate.educations) ? candidate.educations : [],
      projects: Array.isArray(candidate.projects) ? candidate.projects : [],
      skills: Array.isArray(candidate.skills) ? candidate.skills : [],
      sectionsOrder: Array.isArray(candidate.sectionsOrder) ? candidate.sectionsOrder : [],
      hiddenSections: Array.isArray(candidate.hiddenSections) ? candidate.hiddenSections : [],
      customSectionNames: isRecord(candidate.customSectionNames)
        ? (candidate.customSectionNames as Record<string, string>)
        : {},
    });
  } catch {
    return null;
  }
}

function moveItem<T extends { id: string }>(items: T[], id: string, direction: "up" | "down") {
  const nextItems = [...items];
  const currentIndex = nextItems.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextItems.length) return items;

  const current = nextItems[currentIndex];
  const target = nextItems[targetIndex];
  if (!current || !target) return items;
  nextItems[currentIndex] = target;
  nextItems[targetIndex] = current;
  return nextItems;
}

export interface CvBuilderState {
  cvData: CvData;
  draftSavedAt: string | null;
  past: CvData[];
  future: CvData[];
  /** Không persist — chỉ dùng để gộp các lần gõ liên tiếp thành một bước undo. */
  lastHistoryPushAt: number;
  undo: () => void;
  redo: () => void;
  /** `coalesce: false` marks a discrete action that must own its undo step. */
  updateCvData: (fn: (cvData: CvData) => CvData, options?: { coalesce?: boolean }) => void;
  updatePersonalInfo: (info: Partial<CvPersonalInfo>) => void;
  updateTargetJob: (target: Partial<CvTargetJob>) => void;
  updateSummary: (summary: string) => void;
  addExperience: () => void;
  updateExperience: (id: string, experience: Partial<CvExperience>) => void;
  deleteExperience: (id: string) => void;
  moveExperience: (id: string, direction: "up" | "down") => void;
  addEducation: () => void;
  updateEducation: (id: string, education: Partial<CvEducation>) => void;
  deleteEducation: (id: string) => void;
  moveEducation: (id: string, direction: "up" | "down") => void;
  addProject: () => void;
  updateProject: (id: string, project: Partial<CvProject>) => void;
  deleteProject: (id: string) => void;
  moveProject: (id: string, direction: "up" | "down") => void;
  addSkill: () => void;
  updateSkill: (id: string, skill: Partial<CvSkill>) => void;
  deleteSkill: (id: string) => void;
  moveSection: (key: CvSectionKey, direction: "up" | "down") => void;
  setSectionsOrder: (order: CvSectionKey[]) => void;
  updateStyle: (style: Partial<CvStyleConfig>) => void;
  selectTemplate: (template: CvData["selectedTemplate"]) => void;
  setCvLanguage: (lang: CvData["cvLanguage"]) => void;
  setCvData: (data: CvData) => void;
  hydrateCvData: (data: CvData) => void;
  clearCv: () => void;
  toggleSectionVisibility: (key: CvSectionKey) => void;
  renameSection: (key: CvSectionKey, newName: string) => void;
}

export const useCvBuilderStore = create<CvBuilderState>()(
  persist(
    (set, get) => ({
      cvData: createInitialCvData(),
      draftSavedAt: null,
      past: [],
      future: [],
      lastHistoryPushAt: 0,

      updateCvData: (update, options) => {
        const { cvData, past, lastHistoryPushAt } = get();
        const previous = cloneCvData(cvData);
        const next = update(cvData);
        if (JSON.stringify(previous) === JSON.stringify(next)) return;

        /**
         * Gõ liên tục trong một ô văn bản (tóm tắt, mô tả kinh nghiệm...) gọi
         * `updateCvData` ở mỗi ký tự. Nếu mỗi lần gọi đều đẩy một bước lịch sử
         * mới, Ctrl+Z lùi đúng một ký tự — vô dụng với một đoạn văn dài. Trong
         * cùng một đợt gõ (cách nhau dưới `HISTORY_COALESCE_MS`), chỉ giữ lại
         * `previous` của lần đầu tiên trong đợt đó làm điểm undo; các lần gõ
         * tiếp theo chỉ cập nhật `cvData`, không đẩy thêm bước lịch sử nào.
         *
         * Việc gộp này chỉ đúng với các ký tự gõ liên tiếp. Một thao tác rời rạc
         * — xoá một mục, đổi thứ tự, ẩn một phần — không được gộp: xoá ba kỹ năng
         * trong vòng một giây mà chỉ tốn một lần Ctrl+Z là mất dữ liệu ngoài ý
         * muốn. Thao tác như vậy vừa tự đẩy một bước riêng, vừa kết thúc đợt gõ
         * đang mở để ký tự gõ ngay sau đó không bị nhập vào cùng bước với nó.
         */
        const coalesce = options?.coalesce ?? true;
        const now = Date.now();
        const isSameBurst =
          coalesce && past.length > 0 && now - lastHistoryPushAt < HISTORY_COALESCE_MS;

        set({
          cvData: next,
          draftSavedAt: new Date().toISOString(),
          past: isSameBurst ? past : [...past, previous].slice(-60),
          future: [],
          lastHistoryPushAt: coalesce ? now : 0,
        });
      },

      undo: () => {
        const { past, cvData, future } = get();
        const previous = past.at(-1);
        if (!previous) return;
        set({
          cvData: previous,
          draftSavedAt: new Date().toISOString(),
          past: past.slice(0, -1),
          future: [cloneCvData(cvData), ...future].slice(0, 60),
        });
      },

      redo: () => {
        const { past, cvData, future } = get();
        const next = future[0];
        if (!next) return;
        set({
          cvData: next,
          draftSavedAt: new Date().toISOString(),
          past: [...past, cloneCvData(cvData)].slice(-60),
          future: future.slice(1),
        });
      },

      updatePersonalInfo: (info) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          personalInfo: { ...cvData.personalInfo, ...info },
        })),
      updateTargetJob: (targetJob) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          targetJob: { ...cvData.targetJob, ...targetJob },
        })),
      updateSummary: (summary) => get().updateCvData((cvData) => ({ ...cvData, summary })),

      addExperience: () =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            experiences: [
              ...cvData.experiences,
              {
                id: createId("experience"),
                companyName: "",
                positionTitle: "",
                startDate: "",
                endDate: "",
                isCurrent: false,
                description: "",
                technologies: "",
              },
            ],
          }),
          { coalesce: false },
        ),
      updateExperience: (id, experience) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          experiences: cvData.experiences.map((item) =>
            item.id === id ? { ...item, ...experience } : item,
          ),
        })),
      deleteExperience: (id) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            experiences: cvData.experiences.filter((item) => item.id !== id),
          }),
          { coalesce: false },
        ),
      moveExperience: (id, direction) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            experiences: moveItem(cvData.experiences, id, direction),
          }),
          { coalesce: false },
        ),

      addEducation: () =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            educations: [
              ...cvData.educations,
              {
                id: createId("education"),
                schoolName: "",
                degree: "",
                major: "",
                startDate: "",
                endDate: "",
                isCurrent: false,
                gpa: "",
                description: "",
              },
            ],
          }),
          { coalesce: false },
        ),
      updateEducation: (id, education) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          educations: cvData.educations.map((item) =>
            item.id === id ? { ...item, ...education } : item,
          ),
        })),
      deleteEducation: (id) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            educations: cvData.educations.filter((item) => item.id !== id),
          }),
          { coalesce: false },
        ),
      moveEducation: (id, direction) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            educations: moveItem(cvData.educations, id, direction),
          }),
          { coalesce: false },
        ),

      addProject: () =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            projects: [
              ...cvData.projects,
              {
                id: createId("project"),
                name: "",
                role: "",
                description: "",
                projectUrl: "",
                deployUrl: "",
                technologies: "",
              },
            ],
          }),
          { coalesce: false },
        ),
      updateProject: (id, project) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          projects: cvData.projects.map((item) =>
            item.id === id ? { ...item, ...project } : item,
          ),
        })),
      deleteProject: (id) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            projects: cvData.projects.filter((item) => item.id !== id),
          }),
          { coalesce: false },
        ),
      moveProject: (id, direction) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            projects: moveItem(cvData.projects, id, direction),
          }),
          { coalesce: false },
        ),

      addSkill: () =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            skills: [...cvData.skills, { id: createId("skill"), name: "", level: "INTERMEDIATE" }],
          }),
          { coalesce: false },
        ),
      updateSkill: (id, skill) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          skills: cvData.skills.map((item) => (item.id === id ? { ...item, ...skill } : item)),
        })),
      deleteSkill: (id) =>
        get().updateCvData(
          (cvData) => ({
            ...cvData,
            skills: cvData.skills.filter((item) => item.id !== id),
          }),
          { coalesce: false },
        ),

      moveSection: (key, direction) =>
        get().updateCvData(
          (cvData) => {
            const sectionsOrder = [...cvData.sectionsOrder];
            const currentIndex = sectionsOrder.indexOf(key);
            const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
            if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sectionsOrder.length)
              return cvData;
            const target = sectionsOrder[targetIndex];
            if (!target) return cvData;
            sectionsOrder[targetIndex] = key;
            sectionsOrder[currentIndex] = target;
            return { ...cvData, sectionsOrder };
          },
          { coalesce: false },
        ),
      setSectionsOrder: (sectionsOrder) =>
        get().updateCvData((cvData) => ({ ...cvData, sectionsOrder }), { coalesce: false }),
      updateStyle: (style) =>
        get().updateCvData((cvData) => ({ ...cvData, style: { ...cvData.style, ...style } })),
      selectTemplate: (selectedTemplate) =>
        get().updateCvData((cvData) => ({ ...cvData, selectedTemplate }), { coalesce: false }),
      setCvLanguage: (cvLanguage) =>
        get().updateCvData((cvData) => ({ ...cvData, cvLanguage }), { coalesce: false }),
      setCvData: (cvData) => get().updateCvData(() => normalizeCvData(cvData)),
      hydrateCvData: (cvData) =>
        set({
          cvData: normalizeCvData(cvData),
          draftSavedAt: new Date().toISOString(),
          past: [],
          future: [],
          lastHistoryPushAt: 0,
        }),
      clearCv: () =>
        get().updateCvData(
          (cvData) => ({
            ...createInitialCvData(cvData.cvLanguage),
            targetJob: { ...cvData.targetJob },
            style: { ...cvData.style },
            selectedTemplate: cvData.selectedTemplate,
            sectionsOrder: [...cvData.sectionsOrder],
          }),
          { coalesce: false },
        ),
      toggleSectionVisibility: (key) =>
        get().updateCvData(
          (cvData) => {
            const hiddenSections = cvData.hiddenSections ?? [];
            return {
              ...cvData,
              hiddenSections: hiddenSections.includes(key)
                ? hiddenSections.filter((section) => section !== key)
                : [...hiddenSections, key],
            };
          },
          { coalesce: false },
        ),
      renameSection: (key, newName) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          customSectionNames: {
            ...(cvData.customSectionNames ?? {}),
            [key]: newName.trim(),
          },
        })),
    }),
    {
      name: CV_BUILDER_STORAGE_NAME,
      storage: accountScopedStorage,
      version: 3,
      partialize: (state) => ({ cvData: state.cvData, draftSavedAt: state.draftSavedAt }),
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<CvBuilderState>;
        return {
          ...persisted,
          cvData: normalizeCvData(persisted.cvData),
          draftSavedAt: persisted.draftSavedAt ?? null,
        } as CvBuilderState;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CvBuilderState>;
        return {
          ...currentState,
          ...persisted,
          cvData: normalizeCvData(persisted.cvData),
          past: [],
          future: [],
        };
      },
    },
  ),
);
