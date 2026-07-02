import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mockProfileDataVi, mockProfileDataEn } from "./mock-profile";
import {
  CvData,
  CvPersonalInfo,
  CvExperience,
  CvEducation,
  CvProject,
  CvSkill,
  CvSectionKey,
  CvStyleConfig,
} from "./types";

const initialCvData: CvData = {
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
  sectionsOrder: ["personal", "summary", "experience", "projects", "education", "skills"],
  style: {
    fontFamily: "font-sans",
    themeColor: "emerald",
    textSize: "base",
    marginSize: "base",
  },
  selectedTemplate: "modern",
  cvLanguage: "vi",
  hiddenSections: [],
  customSectionNames: {},
};

interface CvBuilderState {
  cvData: CvData;
  past: CvData[];
  future: CvData[];
  undo: () => void;
  redo: () => void;
  updateCvData: (fn: (cvData: CvData) => CvData) => void;
  updatePersonalInfo: (info: Partial<CvPersonalInfo>) => void;
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
  prefillFromProfile: () => void;
  clearCv: () => void;
  toggleSectionVisibility: (key: CvSectionKey) => void;
  renameSection: (key: CvSectionKey, newName: string) => void;
}

export const useCvBuilderStore = create<CvBuilderState>()(
  persist(
    (set, get) => ({
      cvData: initialCvData,
      past: [],
      future: [],

      updateCvData: (fn) => {
        const { cvData, past } = get();
        const oldState = JSON.parse(JSON.stringify(cvData));
        const newState = fn(cvData);
        // Only push to history if it actually changed
        if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
          set({
            cvData: newState,
            past: [...past, oldState].slice(-50),
            future: [],
          });
        }
      },

      undo: () => {
        const { past, cvData, future } = get();
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        if (!previous) return;

        const newPast = past.slice(0, past.length - 1);

        set({
          cvData: previous,
          past: newPast,
          future: [cvData, ...future],
        });
      },

      redo: () => {
        const { past, cvData, future } = get();
        if (future.length === 0) return;

        const next = future[0];
        if (!next) return;

        const newFuture = future.slice(1);

        set({
          cvData: next,
          past: [...past, cvData],
          future: newFuture,
        });
      },

      updatePersonalInfo: (info) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          personalInfo: { ...cvData.personalInfo, ...info },
        })),

      updateSummary: (summary) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          summary,
        })),

      addExperience: () =>
        get().updateCvData((cvData) => {
          const newExp: CvExperience = {
            id: `exp-${Date.now()}`,
            companyName: "",
            positionTitle: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
            technologies: "",
          };
          return {
            ...cvData,
            experiences: [...cvData.experiences, newExp],
          };
        }),

      updateExperience: (id, experience) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          experiences: cvData.experiences.map((exp) =>
            exp.id === id ? { ...exp, ...experience } : exp,
          ),
        })),

      deleteExperience: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          experiences: cvData.experiences.filter((exp) => exp.id !== id),
        })),

      moveExperience: (id, direction) =>
        get().updateCvData((cvData) => {
          const experiences = [...cvData.experiences];
          const index = experiences.findIndex((exp) => exp.id === id);
          if (index === -1) return cvData;
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= experiences.length) return cvData;
          // Swap
          const temp = experiences[index];
          const target = experiences[targetIndex];
          if (temp && target) {
            experiences[index] = target;
            experiences[targetIndex] = temp;
          }
          return { ...cvData, experiences };
        }),

      addEducation: () =>
        get().updateCvData((cvData) => {
          const newEdu: CvEducation = {
            id: `edu-${Date.now()}`,
            schoolName: "",
            degree: "",
            major: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
          };
          return {
            ...cvData,
            educations: [...cvData.educations, newEdu],
          };
        }),

      updateEducation: (id, education) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          educations: cvData.educations.map((edu) =>
            edu.id === id ? { ...edu, ...education } : edu,
          ),
        })),

      deleteEducation: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          educations: cvData.educations.filter((edu) => edu.id !== id),
        })),

      moveEducation: (id, direction) =>
        get().updateCvData((cvData) => {
          const educations = [...cvData.educations];
          const index = educations.findIndex((edu) => edu.id === id);
          if (index === -1) return cvData;
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= educations.length) return cvData;
          // Swap
          const temp = educations[index];
          const target = educations[targetIndex];
          if (temp && target) {
            educations[index] = target;
            educations[targetIndex] = temp;
          }
          return { ...cvData, educations };
        }),

      addProject: () =>
        get().updateCvData((cvData) => {
          const newProj: CvProject = {
            id: `proj-${Date.now()}`,
            name: "",
            role: "",
            description: "",
            projectUrl: "",
            deployUrl: "",
            technologies: "",
          };
          return {
            ...cvData,
            projects: [...cvData.projects, newProj],
          };
        }),

      updateProject: (id, project) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          projects: cvData.projects.map((proj) =>
            proj.id === id ? { ...proj, ...project } : proj,
          ),
        })),

      deleteProject: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          projects: cvData.projects.filter((proj) => proj.id !== id),
        })),

      moveProject: (id, direction) =>
        get().updateCvData((cvData) => {
          const projects = [...cvData.projects];
          const index = projects.findIndex((proj) => proj.id === id);
          if (index === -1) return cvData;
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= projects.length) return cvData;
          // Swap
          const temp = projects[index];
          const target = projects[targetIndex];
          if (temp && target) {
            projects[index] = target;
            projects[targetIndex] = temp;
          }
          return { ...cvData, projects };
        }),

      addSkill: () =>
        get().updateCvData((cvData) => {
          const newSkill: CvSkill = {
            id: `sk-${Date.now()}`,
            name: "",
            level: "ADVANCED",
          };
          return {
            ...cvData,
            skills: [...cvData.skills, newSkill],
          };
        }),

      updateSkill: (id, skill) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          skills: cvData.skills.map((sk) => (sk.id === id ? { ...sk, ...skill } : sk)),
        })),

      deleteSkill: (id) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          skills: cvData.skills.filter((sk) => sk.id !== id),
        })),

      moveSection: (key, direction) =>
        get().updateCvData((cvData) => {
          const sectionsOrder = [...cvData.sectionsOrder];
          const index = sectionsOrder.indexOf(key);
          if (index === -1) return cvData;
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= sectionsOrder.length) return cvData;
          // Swap
          const temp = sectionsOrder[index];
          const target = sectionsOrder[targetIndex];
          if (temp && target) {
            sectionsOrder[index] = target;
            sectionsOrder[targetIndex] = temp;
          }
          return { ...cvData, sectionsOrder };
        }),

      setSectionsOrder: (sectionsOrder) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          sectionsOrder,
        })),

      updateStyle: (style) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          style: { ...cvData.style, ...style },
        })),

      selectTemplate: (template) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          selectedTemplate: template,
        })),

      setCvLanguage: (cvLanguage) =>
        get().updateCvData((cvData) => ({
          ...cvData,
          cvLanguage,
        })),

      setCvData: (cvData) => get().updateCvData(() => cvData),

      prefillFromProfile: () =>
        get().updateCvData((cvData) => {
          const currentLang = cvData.cvLanguage;
          const mockData = currentLang === "en" ? mockProfileDataEn : mockProfileDataVi;
          return JSON.parse(JSON.stringify(mockData));
        }),

      clearCv: () => get().updateCvData(() => initialCvData),

      toggleSectionVisibility: (key) =>
        get().updateCvData((cvData) => {
          const hiddenSections = cvData.hiddenSections || [];
          const isHidden = hiddenSections.includes(key);
          const newHidden = isHidden
            ? hiddenSections.filter((k) => k !== key)
            : [...hiddenSections, key];
          return {
            ...cvData,
            hiddenSections: newHidden,
          };
        }),

      renameSection: (key, newName) =>
        get().updateCvData((cvData) => {
          const customSectionNames = cvData.customSectionNames || {};
          return {
            ...cvData,
            customSectionNames: {
              ...customSectionNames,
              [key]: newName,
            },
          };
        }),
    }),
    {
      name: "upnext-cv-builder-draft",
      partialize: (state) => ({ cvData: state.cvData }),
    },
  ),
);
