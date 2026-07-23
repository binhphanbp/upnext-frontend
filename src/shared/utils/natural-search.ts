/**
 * Utility to remove Vietnamese diacritics / accents for flexible natural language matching.
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export type SearchableJob = {
  title: string;
  company?: string;
  location?: string;
  mode?: string;
  level?: string;
  tags?: string[];
  description?: string;
  salary?: string;
  categories?: string[];
};

// Domain-specific synonym dictionary for IT recruitment titles
const TITLE_SYNONYMS: Record<string, string[]> = {
  frontend: [
    "frontend",
    "front-end",
    "front end",
    "fe",
    "react",
    "reactjs",
    "vue",
    "vuejs",
    "angular",
    "next.js",
    "nextjs",
    "nuxt",
    "web developer",
    "ui/ux",
  ],
  fe: [
    "frontend",
    "front-end",
    "front end",
    "fe",
    "react",
    "reactjs",
    "vue",
    "vuejs",
    "angular",
    "next.js",
    "nextjs",
    "nuxt",
    "web developer",
  ],
  backend: [
    "backend",
    "back-end",
    "back end",
    "be",
    "node",
    "nodejs",
    "express",
    "nest",
    "nestjs",
    "java",
    "spring",
    "springboot",
    "python",
    "django",
    "fastapi",
    "golang",
    "go",
    ".net",
    "c#",
    "php",
    "laravel",
  ],
  be: [
    "backend",
    "back-end",
    "back end",
    "be",
    "node",
    "nodejs",
    "express",
    "nest",
    "nestjs",
    "java",
    "spring",
    "python",
    "golang",
    ".net",
    "php",
  ],
  fullstack: ["fullstack", "full-stack", "full stack", "mern", "mean"],
  mobile: ["mobile", "react native", "flutter", "ios", "android", "swift", "kotlin"],
  devops: [
    "devops",
    "cloud",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "k8s",
    "ci/cd",
    "sysadmin",
    "infrastructure",
  ],
  data: [
    "data engineer",
    "data analyst",
    "data science",
    "data scientist",
    "ai",
    "machine learning",
    "big data",
    "spark",
    "sql",
  ],
  testing: ["tester", "qa", "qc", "automation test", "manual test", "quality assurance"],
  qa: ["tester", "qa", "qc", "automation test", "manual test", "quality assurance"],
  qc: ["tester", "qa", "qc", "automation test", "manual test", "quality assurance"],
  uiux: ["ui/ux", "ui/ux designer", "product designer", "figma", "ux designer", "ui designer"],
  ux: ["ui/ux", "ui/ux designer", "product designer", "ux designer"],
  ui: ["ui/ux", "ui/ux designer", "product designer", "ui designer"],
  pm: [
    "project manager",
    "scrum master",
    "product owner",
    "product manager",
    "ba",
    "business analyst",
  ],
  scrum: ["scrum master", "agile coach", "project manager"],
  ba: ["business analyst", "ba", "product owner"],
};

const STOP_WORDS = new Set([
  "tim",
  "viec",
  "lam",
  "tuyen",
  "gap",
  "can",
  "o",
  "tai",
  "cho",
  "muc",
  "luong",
  "thich",
  "phu",
  "hop",
  "tim",
  "việc",
  "làm",
  "tuyển",
  "gấp",
  "cần",
  "ở",
  "tại",
  "cho",
  "mức",
  "lương",
  "thích",
  "phù",
  "hợp",
  "find",
  "job",
  "jobs",
  "hiring",
  "looking",
  "for",
  "in",
  "at",
  "with",
  "salary",
  "wanted",
  "dev",
  "developer",
]);

/**
 * Keyword search matcher matching STRICTLY on job title and job title synonyms.
 */
export function matchNaturalLanguageSearch(query: string, job: SearchableJob): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const unaccentedQuery = removeVietnameseAccents(rawQuery);

  // Split query into tokens ignoring stop words
  const tokens = unaccentedQuery
    .split(/[\s,.\-+/_()]+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));

  const searchTokens = tokens.length > 0 ? tokens : [unaccentedQuery];

  // Primary text to match is STRICTLY JOB TITLE
  const titleRaw = job.title.toLowerCase();
  const titleUnaccented = removeVietnameseAccents(titleRaw);

  // Check if all search tokens match the job title directly or via title synonyms
  return searchTokens.every((token) => {
    // 1. Direct match on job title
    if (titleUnaccented.includes(token)) return true;

    // 2. Title synonym match on job title
    const synonymList = TITLE_SYNONYMS[token];
    if (synonymList) {
      return synonymList.some((syn) => {
        const unaccentedSyn = removeVietnameseAccents(syn);
        return titleUnaccented.includes(unaccentedSyn);
      });
    }

    return false;
  });
}
