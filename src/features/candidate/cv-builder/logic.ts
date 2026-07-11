import type { CandidateProfileApi } from "@/features/candidate/api/profile";

import type {
  CvContentSignals,
  CvData,
  CvEvaluation,
  CvIssue,
  CvJobMatchEvaluation,
  CvSectionEvaluation,
  CvSectionKey,
} from "./types";

export const CV_SECTION_KEYS: CvSectionKey[] = [
  "personal",
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;
const WORD_PATTERN = /[\p{L}\d][\p{L}\d+#./-]{1,}/gu;
const QUANTIFIED_RESULT_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:%|x|k|m|ms|s|giây|phút|giờ|ngày|người|users?|customers?|requests?|downloads?|vnd|usd)\b/i;

const STOP_WORDS = new Set(
  [
    "and",
    "are",
    "candidate",
    "company",
    "developer",
    "experience",
    "engineer",
    "engineering",
    "for",
    "from",
    "have",
    "job",
    "junior",
    "our",
    "position",
    "product",
    "qualification",
    "qualifications",
    "required",
    "requirement",
    "requirements",
    "responsibilities",
    "responsibility",
    "role",
    "senior",
    "team",
    "that",
    "the",
    "this",
    "with",
    "work",
    "your",
    "ban",
    "cac",
    "can",
    "cho",
    "chung",
    "cong",
    "co",
    "cua",
    "duoc",
    "kinh",
    "ky",
    "lam",
    "mot",
    "nang",
    "nghiem",
    "nguoi",
    "nhan",
    "nhom",
    "phat",
    "san",
    "se",
    "tham",
    "theo",
    "trien",
    "trong",
    "tri",
    "tu",
    "ung",
    "va",
    "viec",
    "vi",
    "voi",
    "yeu",
    "cau",
  ].map(normalizeKeyword),
);

const EVIDENCE_SECTION_KEYS = CV_SECTION_KEYS.filter(
  (section): section is Exclude<CvSectionKey, "personal"> => section !== "personal",
);

const PRIORITY_KEYWORDS = new Set(
  [
    "aws",
    "azure",
    "c#",
    "c++",
    "ci/cd",
    "css",
    "docker",
    "figma",
    "git",
    "golang",
    "graphql",
    "html",
    "java",
    "javascript",
    "kotlin",
    "kubernetes",
    "mongodb",
    "mysql",
    "nestjs",
    "next.js",
    "node.js",
    "php",
    "playwright",
    "postgresql",
    "python",
    "react",
    "redis",
    "rest",
    "spring",
    "sql",
    "tailwind",
    "typescript",
    "vue",
  ].map(normalizeKeyword),
);

const ACTION_VERBS = new Set(
  [
    "built",
    "created",
    "delivered",
    "designed",
    "developed",
    "improved",
    "implemented",
    "launched",
    "led",
    "mentored",
    "optimized",
    "reduced",
    "scaled",
    "shipped",
    "automated",
    "cai",
    "dan",
    "giam",
    "phat",
    "thiet",
    "toi",
    "trien",
    "tu",
    "xay",
  ].map(normalizeKeyword),
);

const SECTION_WEIGHTS: Record<CvSectionKey, number> = {
  personal: 25,
  summary: 15,
  experience: 20,
  projects: 10,
  education: 15,
  skills: 15,
};

function normalizeKeyword(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^[-./]+|[-./]+$/g, "");
}

function tokensFor(value: string) {
  return (value.match(WORD_PATTERN) ?? [])
    .map((raw) => ({ key: normalizeKeyword(raw), raw }))
    .filter((token) => token.key.length >= 2 && !STOP_WORDS.has(token.key));
}

function cvCorpusBySection(cvData: CvData): Record<CvSectionKey, string> {
  return {
    personal: [cvData.personalInfo.title, cvData.personalInfo.address].join(" "),
    summary: toPlainText(cvData.summary),
    experience: cvData.experiences
      .flatMap((item) => [
        item.positionTitle,
        item.companyName,
        item.description,
        item.technologies,
      ])
      .join(" "),
    projects: cvData.projects
      .flatMap((item) => [item.name, item.role, item.description, item.technologies])
      .join(" "),
    education: cvData.educations
      .flatMap((item) => [item.schoolName, item.degree, item.major, item.description])
      .join(" "),
    skills: cvData.skills.map((item) => item.name).join(" "),
  };
}

export function evaluateJobMatch(cvData: CvData): CvJobMatchEvaluation {
  const description = cvData.targetJob.description.trim();
  if (description.length < 40) {
    return { hasDescription: false, matched: [], missing: [], score: null, total: 0 };
  }

  const counts = new Map<string, { count: number; raw: string }>();
  for (const token of tokensFor(description)) {
    const current = counts.get(token.key);
    counts.set(token.key, {
      count: (current?.count ?? 0) + 1,
      raw: current?.raw ?? token.raw,
    });
  }

  const keywords = [...counts.entries()]
    .filter(([key, value]) => PRIORITY_KEYWORDS.has(key) || value.count > 1 || key.length >= 5)
    .toSorted(([firstKey, first], [secondKey, second]) => {
      const priorityDifference =
        Number(PRIORITY_KEYWORDS.has(secondKey)) - Number(PRIORITY_KEYWORDS.has(firstKey));
      return priorityDifference || second.count - first.count || secondKey.length - firstKey.length;
    })
    .slice(0, 14);

  const corpus = cvCorpusBySection(cvData);
  const tokenSets = Object.fromEntries(
    CV_SECTION_KEYS.map((section) => [
      section,
      new Set(tokensFor(corpus[section]).map((token) => token.key)),
    ]),
  ) as Record<CvSectionKey, Set<string>>;
  const matched = keywords.flatMap(([key, value]) => {
    const sections = EVIDENCE_SECTION_KEYS.filter((section) => tokenSets[section].has(key));
    return sections.length > 0 ? [{ keyword: value.raw, sections }] : [];
  });
  const missing = keywords
    .filter(([key]) => !EVIDENCE_SECTION_KEYS.some((section) => tokenSets[section].has(key)))
    .map(([, value]) => value.raw);
  const total = keywords.length;

  if (total === 0) {
    return { hasDescription: false, matched: [], missing: [], score: null, total: 0 };
  }

  return {
    hasDescription: true,
    matched,
    missing,
    score: Math.round((matched.length / total) * 100),
    total,
  };
}

export function evaluateContentSignals(cvData: CvData): CvContentSignals {
  const descriptions = [
    ...cvData.experiences.map((item) => toPlainText(item.description)),
    ...cvData.projects.map((item) => toPlainText(item.description)),
  ];
  const bullets = descriptions
    .flatMap((description) => description.split(/\n+|[.!?]\s+/))
    .map((line) => line.replace(/^(?:[•*-]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length >= 20);
  const evidenceCorpus = normalizeKeyword(
    [
      cvData.summary,
      ...cvData.experiences.flatMap((item) => [item.description, item.technologies]),
      ...cvData.projects.flatMap((item) => [item.description, item.technologies]),
    ].join(" "),
  );
  const namedSkills = cvData.skills.map((skill) => skill.name.trim()).filter(Boolean);
  const hasEvidence = (skill: string) => {
    const normalizedSkill = normalizeKeyword(skill).trim();
    if (!normalizedSkill) return false;
    const escapedSkill = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![\\p{L}\\p{N}])${escapedSkill}(?![\\p{L}\\p{N}])`, "u").test(
      evidenceCorpus,
    );
  };
  const skillsWithoutEvidence = namedSkills.filter((skill) => !hasEvidence(skill));

  return {
    actionLedBullets: bullets.filter((bullet) => {
      const firstWord = normalizeKeyword(bullet.split(/\s+/)[0] ?? "");
      return ACTION_VERBS.has(firstWord);
    }).length,
    quantifiedBullets: bullets.filter((bullet) => QUANTIFIED_RESULT_PATTERN.test(bullet)).length,
    skillsWithEvidence: namedSkills.length - skillsWithoutEvidence.length,
    skillsWithoutEvidence,
    totalBullets: bullets.length,
    totalSkills: namedSkills.length,
  };
}

function decodeBasicEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function toPlainText(value: string) {
  return decodeBasicEntities(
    value
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\s*\/\s*p\s*>/gi, "\n")
      .replace(/<\s*li[^>]*>/gi, "• ")
      .replace(/<\s*\/\s*li\s*>/gi, "\n")
      .replace(HTML_TAG_PATTERN, ""),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value: string) {
  const normalized = value.replace(/[\s().+-]/g, "");
  return /^\d{7,15}$/.test(normalized);
}

export function toExternalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return URL_PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isValidExternalUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const parsed = new URL(toExternalHref(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function monthValue(value: string | null) {
  if (!value) return "";
  return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : value;
}

function validDateRange(startDate: string, endDate: string, isCurrent: boolean) {
  if (!startDate || isCurrent || !endDate) return true;
  return startDate <= endDate;
}

function statusFor(completion: number, errors: number): CvSectionEvaluation["status"] {
  if (completion >= 0.85 && errors === 0) return "complete";
  return completion > 0 ? "inProgress" : "empty";
}

function sectionEvaluation(
  completion: number,
  issues: CvIssue[],
  section: CvSectionKey,
): CvSectionEvaluation {
  const sectionIssues = issues.filter((issue) => issue.section === section);
  const errors = sectionIssues.filter((issue) => issue.severity === "error").length;
  return {
    completion,
    errors,
    status: statusFor(completion, errors),
    warnings: sectionIssues.filter((issue) => issue.severity === "warning").length,
  };
}

function addIssue(
  issues: CvIssue[],
  section: CvSectionKey,
  path: string,
  code: string,
  severity: CvIssue["severity"] = "error",
) {
  issues.push({ code, path, section, severity });
}

export function evaluateCv(cvData: CvData): CvEvaluation {
  const issues: CvIssue[] = [];
  const personalChecks = [
    Boolean(cvData.personalInfo.fullName.trim()),
    Boolean(cvData.personalInfo.title.trim()),
    isValidEmail(cvData.personalInfo.email),
    isValidPhone(cvData.personalInfo.phoneNumber),
  ];

  if (!personalChecks[0]) addIssue(issues, "personal", "personalInfo.fullName", "fullNameRequired");
  if (!personalChecks[1]) addIssue(issues, "personal", "personalInfo.title", "jobTitleRequired");
  if (!cvData.personalInfo.email.trim()) {
    addIssue(issues, "personal", "personalInfo.email", "emailRequired");
  } else if (!personalChecks[2]) {
    addIssue(issues, "personal", "personalInfo.email", "emailInvalid");
  }
  if (!cvData.personalInfo.phoneNumber.trim()) {
    addIssue(issues, "personal", "personalInfo.phoneNumber", "phoneRequired");
  } else if (!personalChecks[3]) {
    addIssue(issues, "personal", "personalInfo.phoneNumber", "phoneInvalid");
  }
  if (!isValidExternalUrl(cvData.personalInfo.website)) {
    addIssue(issues, "personal", "personalInfo.website", "websiteInvalid");
  }

  const summaryLength = toPlainText(cvData.summary).length;
  const summaryCompletion = Math.min(summaryLength / 120, 1);
  if (summaryLength < 60) {
    addIssue(issues, "summary", "summary", "summaryTooShort", "warning");
  }

  let experienceCompletion = 0;
  if (cvData.experiences.length === 0) {
    addIssue(issues, "experience", "experiences", "experienceRecommended", "warning");
  } else {
    const itemScores = cvData.experiences.map((experience, index) => {
      const checks = [
        Boolean(experience.positionTitle.trim()),
        Boolean(experience.companyName.trim()),
        Boolean(experience.startDate),
        toPlainText(experience.description).length >= 60,
      ];
      const prefix = `experiences.${index}`;
      if (!checks[0]) addIssue(issues, "experience", `${prefix}.positionTitle`, "positionRequired");
      if (!checks[1]) addIssue(issues, "experience", `${prefix}.companyName`, "companyRequired");
      if (!checks[2]) addIssue(issues, "experience", `${prefix}.startDate`, "startDateRequired");
      if (!checks[3]) {
        addIssue(issues, "experience", `${prefix}.description`, "descriptionTooShort", "warning");
      }
      if (!validDateRange(experience.startDate, experience.endDate, experience.isCurrent)) {
        addIssue(issues, "experience", `${prefix}.endDate`, "endBeforeStart");
      }
      return checks.filter(Boolean).length / checks.length;
    });
    experienceCompletion =
      itemScores.reduce((total, score) => total + score, 0) / itemScores.length;
  }

  let projectCompletion = 0;
  if (cvData.projects.length === 0) {
    addIssue(issues, "projects", "projects", "projectRecommended", "warning");
  } else {
    const itemScores = cvData.projects.map((project, index) => {
      const checks = [
        Boolean(project.name.trim()),
        Boolean(project.role.trim()),
        toPlainText(project.description).length >= 40,
      ];
      const prefix = `projects.${index}`;
      if (!checks[0]) addIssue(issues, "projects", `${prefix}.name`, "projectNameRequired");
      if (!checks[1]) addIssue(issues, "projects", `${prefix}.role`, "projectRoleRequired");
      if (!checks[2]) {
        addIssue(
          issues,
          "projects",
          `${prefix}.description`,
          "projectDescriptionTooShort",
          "warning",
        );
      }
      if (!isValidExternalUrl(project.projectUrl)) {
        addIssue(issues, "projects", `${prefix}.projectUrl`, "projectUrlInvalid");
      }
      if (!isValidExternalUrl(project.deployUrl)) {
        addIssue(issues, "projects", `${prefix}.deployUrl`, "deployUrlInvalid");
      }
      return checks.filter(Boolean).length / checks.length;
    });
    projectCompletion = itemScores.reduce((total, score) => total + score, 0) / itemScores.length;
  }

  let educationCompletion = 0;
  if (cvData.educations.length === 0) {
    addIssue(issues, "education", "educations", "educationRecommended", "warning");
  } else {
    const itemScores = cvData.educations.map((education, index) => {
      const checks = [Boolean(education.schoolName.trim()), Boolean(education.degree.trim())];
      const prefix = `educations.${index}`;
      if (!checks[0]) addIssue(issues, "education", `${prefix}.schoolName`, "schoolRequired");
      if (!checks[1]) addIssue(issues, "education", `${prefix}.degree`, "degreeRequired");
      if (!validDateRange(education.startDate, education.endDate, education.isCurrent)) {
        addIssue(issues, "education", `${prefix}.endDate`, "endBeforeStart");
      }
      return checks.filter(Boolean).length / checks.length;
    });
    educationCompletion = itemScores.reduce((total, score) => total + score, 0) / itemScores.length;
  }

  const namedSkills = cvData.skills.filter((skill) => skill.name.trim());
  const skillCompletion = Math.min(namedSkills.length / 3, 1);
  if (namedSkills.length < 3) {
    addIssue(issues, "skills", "skills", "skillsRecommended", "warning");
  }
  cvData.skills.forEach((skill, index) => {
    if (!skill.name.trim()) addIssue(issues, "skills", `skills.${index}.name`, "skillNameRequired");
  });
  const normalizedSkillNames = namedSkills.map((skill) => skill.name.trim().toLocaleLowerCase());
  if (new Set(normalizedSkillNames).size !== normalizedSkillNames.length) {
    addIssue(issues, "skills", "skills", "duplicateSkills", "warning");
  }

  const completionBySection: Record<CvSectionKey, number> = {
    personal: personalChecks.filter(Boolean).length / personalChecks.length,
    summary: summaryCompletion,
    experience: experienceCompletion,
    projects: projectCompletion,
    education: educationCompletion,
    skills: skillCompletion,
  };
  const hidden = new Set(cvData.hiddenSections ?? []);
  const weightedSections = CV_SECTION_KEYS.filter(
    (section) => section === "personal" || !hidden.has(section),
  );
  const weightedScore = weightedSections.reduce(
    (total, section) => total + completionBySection[section] * SECTION_WEIGHTS[section],
    0,
  );
  const visibleIssues = issues.filter(
    (issue) => issue.section === "personal" || !hidden.has(issue.section),
  );
  const hasCareerEvidence =
    (!hidden.has("experience") && cvData.experiences.length > 0) ||
    (!hidden.has("projects") && cvData.projects.length > 0) ||
    (!hidden.has("education") && cvData.educations.length > 0);
  if (!hasCareerEvidence) {
    addIssue(visibleIssues, "projects", "careerEvidence", "careerEvidenceRequired");
  }
  const blockingIssues = visibleIssues.filter((issue) => issue.severity === "error");

  return {
    blockingIssues,
    contentSignals: evaluateContentSignals(cvData),
    exportReady: blockingIssues.length === 0,
    issues: visibleIssues,
    jobMatch: evaluateJobMatch(cvData),
    score: Math.round(weightedScore),
    sections: {
      personal: sectionEvaluation(completionBySection.personal, visibleIssues, "personal"),
      summary: sectionEvaluation(completionBySection.summary, visibleIssues, "summary"),
      experience: sectionEvaluation(completionBySection.experience, visibleIssues, "experience"),
      projects: sectionEvaluation(completionBySection.projects, visibleIssues, "projects"),
      education: sectionEvaluation(completionBySection.education, visibleIssues, "education"),
      skills: sectionEvaluation(completionBySection.skills, visibleIssues, "skills"),
    },
  };
}

export function isCvEmpty(cvData: CvData) {
  return (
    !cvData.personalInfo.fullName.trim() &&
    !cvData.personalInfo.title.trim() &&
    !cvData.personalInfo.email.trim() &&
    !cvData.personalInfo.phoneNumber.trim() &&
    !cvData.personalInfo.address.trim() &&
    !cvData.personalInfo.website.trim() &&
    !toPlainText(cvData.summary) &&
    cvData.experiences.length === 0 &&
    cvData.educations.length === 0 &&
    cvData.projects.length === 0 &&
    cvData.skills.length === 0
  );
}

export function mapProfileToCvData(profile: CandidateProfileApi, current: CvData): CvData {
  const sortByOrder = <T extends { sortOrder: number }>(items: T[]) =>
    [...items].sort((first, second) => first.sortOrder - second.sortOrder);

  return {
    ...current,
    personalInfo: {
      ...current.personalInfo,
      fullName: profile.account.fullName,
      title: profile.jobPreference?.desiredPosition ?? current.personalInfo.title,
      email: profile.account.email,
      phoneNumber: profile.phoneNumber ?? "",
      address: profile.address ?? "",
      website:
        profile.links.find((link) => ["LINKEDIN", "GITHUB", "PORTFOLIO"].includes(link.type))
          ?.url ?? "",
    },
    summary: toPlainText(profile.description ?? ""),
    experiences: sortByOrder(profile.experiences).map((experience) => ({
      id: experience.id,
      companyName: experience.companyName,
      positionTitle: experience.positionTitle,
      startDate: monthValue(experience.startDate),
      endDate: monthValue(experience.endDate),
      isCurrent: experience.isCurrent,
      description: toPlainText(experience.description ?? ""),
      technologies: experience.technologies ?? "",
    })),
    educations: sortByOrder(profile.educations).map((education) => ({
      id: education.id,
      schoolName: education.schoolName,
      degree: education.degree ?? "",
      major: education.major ?? "",
      startDate: monthValue(education.startDate),
      endDate: monthValue(education.endDate),
      isCurrent: education.isCurrent,
      gpa: education.gpa === null ? "" : String(education.gpa),
      description: toPlainText(education.description ?? ""),
    })),
    projects: sortByOrder(profile.projects).map((project) => ({
      id: project.id,
      name: project.name,
      role: project.role ?? "",
      description: toPlainText(project.description ?? ""),
      projectUrl: project.projectUrl ?? "",
      deployUrl: project.deployUrl ?? "",
      technologies: project.technologies ?? "",
    })),
    skills: sortByOrder(profile.skills).map((skill) => ({
      id: skill.id,
      name: skill.skill.name,
      level: skill.proficiencyLevel,
    })),
  };
}
