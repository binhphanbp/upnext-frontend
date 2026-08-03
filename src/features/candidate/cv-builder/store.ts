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
  undo: () => void;
  redo: () => void;
  updateCvData: (fn: (cvData: CvData) => CvData) => void;
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

      updateCvData: (update) => {
        const { cvData, past } = get();
        const previous = cloneCvData(cvData);
        const next = update(cvData);
        if (JSON.stringify(previous) === JSON.stringify(next)) return;

        set({
          cvData: next,
          draftSavedAt: new Date().toISOString(),
          past: [...past, previous].slice(-60),
          future: [],
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
        get().updateCvData((cvData) => ({
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
        })),
      updateExperience: (id, experience) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          experiences: cvData.experiences.map((item) =>
            item.id === id ? { ...item, ...experience } : item,
          ),
        })),
      deleteExperience: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          experiences: cvData.experiences.filter((item) => item.id !== id),
        })),
      moveExperience: (id, direction) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          experiences: moveItem(cvData.experiences, id, direction),
        })),

      addEducation: () =>
        get().updateCvData((cvData) => ({
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
        })),
      updateEducation: (id, education) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          educations: cvData.educations.map((item) =>
            item.id === id ? { ...item, ...education } : item,
          ),
        })),
      deleteEducation: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          educations: cvData.educations.filter((item) => item.id !== id),
        })),
      moveEducation: (id, direction) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          educations: moveItem(cvData.educations, id, direction),
        })),

      addProject: () =>
        get().updateCvData((cvData) => ({
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
        })),
      updateProject: (id, project) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          projects: cvData.projects.map((item) =>
            item.id === id ? { ...item, ...project } : item,
          ),
        })),
      deleteProject: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          projects: cvData.projects.filter((item) => item.id !== id),
        })),
      moveProject: (id, direction) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          projects: moveItem(cvData.projects, id, direction),
        })),

      addSkill: () =>
        get().updateCvData((cvData) => ({
          ...cvData,
          skills: [...cvData.skills, { id: createId("skill"), name: "", level: "INTERMEDIATE" }],
        })),
      updateSkill: (id, skill) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          skills: cvData.skills.map((item) => (item.id === id ? { ...item, ...skill } : item)),
        })),
      deleteSkill: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          skills: cvData.skills.filter((item) => item.id !== id),
        })),

      moveSection: (key, direction) =>
        get().updateCvData((cvData) => {
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
        }),
      setSectionsOrder: (sectionsOrder) =>
        get().updateCvData((cvData) => ({ ...cvData, sectionsOrder })),
      updateStyle: (style) =>
        get().updateCvData((cvData) => ({ ...cvData, style: { ...cvData.style, ...style } })),
      selectTemplate: (selectedTemplate) =>
        get().updateCvData((cvData) => ({ ...cvData, selectedTemplate })),
      setCvLanguage: (cvLanguage) => get().updateCvData((cvData) => ({ ...cvData, cvLanguage })),
      setCvData: (cvData) => get().updateCvData(() => normalizeCvData(cvData)),
      hydrateCvData: (cvData) =>
        set({
          cvData: normalizeCvData(cvData),
          draftSavedAt: new Date().toISOString(),
          past: [],
          future: [],
        }),
      clearCv: () =>
        get().updateCvData((cvData) => ({
          ...createInitialCvData(cvData.cvLanguage),
          targetJob: { ...cvData.targetJob },
          style: { ...cvData.style },
          selectedTemplate: cvData.selectedTemplate,
          sectionsOrder: [...cvData.sectionsOrder],
        })),
      toggleSectionVisibility: (key) =>
        get().updateCvData((cvData) => {
          const hiddenSections = cvData.hiddenSections ?? [];
          return {
            ...cvData,
            hiddenSections: hiddenSections.includes(key)
              ? hiddenSections.filter((section) => section !== key)
              : [...hiddenSections, key],
          };
        }),
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
