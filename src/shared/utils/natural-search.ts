/**
 * Utility to remove Vietnamese diacritics / accents for flexible natural language matching.
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
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

// Comprehensive domain-specific synonym dictionary for IT recruitment titles
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
  react: ["react", "reactjs", "next.js", "nextjs", "frontend", "front-end", "fe"],
  reactjs: ["react", "reactjs", "next.js", "nextjs", "frontend", "front-end", "fe"],
  vue: ["vue", "vuejs", "nuxt", "frontend", "front-end", "fe"],
  vuejs: ["vue", "vuejs", "nuxt", "frontend", "front-end", "fe"],
  angular: ["angular", "frontend", "front-end", "fe"],
  backend: ["backend", "back-end", "back end", "be", "server"],
  be: ["backend", "back-end", "back end", "be"],
  node: ["node", "nodejs", "express", "nest", "nestjs"],
  nodejs: ["node", "nodejs", "express", "nest", "nestjs"],
  java: ["java", "spring", "springboot"],
  python: ["python", "django", "fastapi", "py"],
  golang: ["golang", "go"],
  go: ["golang", "go"],
  dotnet: [".net", "dotnet", "c#"],
  fullstack: ["fullstack", "full-stack", "full stack", "mern", "mean"],
  mobile: ["mobile", "react native", "flutter", "ios", "android", "swift", "kotlin"],
  flutter: ["flutter", "dart", "mobile"],
  reactnative: ["react native", "mobile", "ios", "android"],
  ios: ["ios", "swift", "mobile"],
  android: ["android", "kotlin", "mobile"],
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
  cloud: ["cloud", "aws", "azure", "gcp", "devops", "infrastructure"],
  aws: ["aws", "cloud", "devops"],
  kubernetes: ["kubernetes", "k8s", "docker", "devops"],
  docker: ["docker", "kubernetes", "devops"],
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
  ai: ["ai", "artificial intelligence", "machine learning", "ml", "deep learning", "llm", "data"],
  testing: [
    "tester",
    "qa",
    "qc",
    "automation test",
    "manual test",
    "quality assurance",
    "kiem thu",
  ],
  qa: ["tester", "qa", "qc", "automation test", "manual test", "quality assurance", "kiem thu"],
  qc: ["tester", "qa", "qc", "automation test", "manual test", "quality assurance", "kiem thu"],
  tester: ["tester", "qa", "qc", "automation test", "manual test", "quality assurance", "kiem thu"],
  uiux: ["ui/ux", "ui/ux designer", "product designer", "figma", "ux designer", "ui designer"],
  ux: ["ui/ux", "ui/ux designer", "product designer", "ux designer"],
  ui: ["ui/ux", "ui/ux designer", "product designer", "ui designer"],
  figma: ["figma", "ui/ux", "product designer"],
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
  brse: ["brse", "bridge system engineer", "cau noi", "japanese"],
  "cau noi": ["brse", "bridge system engineer", "cau noi"],
  "kiem thu": [
    "tester",
    "qa",
    "qc",
    "automation test",
    "manual test",
    "quality assurance",
    "kiem thu",
  ],
  "thiet ke": [
    "ui/ux",
    "ui/ux designer",
    "product designer",
    "figma",
    "ux designer",
    "ui designer",
  ],
  security: ["security", "cyber security", "pentest", "soc", "infosec"],
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
  "engineer",
]);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchTokenInText(text: string, token: string): boolean {
  if (!text || !token) return false;
  if (token.length <= 3) {
    const regex = new RegExp(`(?:^|\\b|\\s|_)${escapeRegExp(token)}(?:$|\\b|\\s|_)`, "i");
    return regex.test(text);
  }
  return text.includes(token);
}

/**
 * Keyword search matcher matching STRICTLY on job title and job title synonyms/tags.
 */
export function matchNaturalLanguageSearch(query: string, job: SearchableJob): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const unaccentedQuery = removeVietnameseAccents(rawQuery);

  // Primary text to match is STRICTLY JOB TITLE + TAGS
  const titleUnaccented = removeVietnameseAccents(job.title);
  const tagsUnaccented = (job.tags || []).map((t) => removeVietnameseAccents(t));

  // 0. Phrase match: if unaccentedQuery contains spaces or symbols
  if (unaccentedQuery.includes(" ")) {
    if (matchTokenInText(titleUnaccented, unaccentedQuery)) return true;
    if (tagsUnaccented.some((tag) => matchTokenInText(tag, unaccentedQuery))) return true;

    const phraseSynonyms = TITLE_SYNONYMS[unaccentedQuery];
    if (phraseSynonyms) {
      const matchedByPhraseSyn = phraseSynonyms.some((syn) => {
        const unaccentedSyn = removeVietnameseAccents(syn);
        return (
          matchTokenInText(titleUnaccented, unaccentedSyn) ||
          tagsUnaccented.some((tag) => matchTokenInText(tag, unaccentedSyn))
        );
      });
      if (matchedByPhraseSyn) return true;
    }
  }

  // Split query into tokens ignoring stop words
  const rawTokens = unaccentedQuery.split(/[\s,.\-+/_()]+/).filter((t) => t.length > 0);
  const filteredTokens = rawTokens.filter((t) => !STOP_WORDS.has(t));

  const searchTokens = filteredTokens.length > 0 ? filteredTokens : rawTokens;

  // Check if all search tokens match the job title directly or via title synonyms
  return searchTokens.every((token) => {
    // 1. Direct match on job title or tags
    if (matchTokenInText(titleUnaccented, token)) return true;
    if (tagsUnaccented.some((tag) => matchTokenInText(tag, token))) return true;

    // 2. Direct synonym match on job title or tags
    const synonymList = TITLE_SYNONYMS[token];
    if (synonymList) {
      const matchedBySyn = synonymList.some((syn) => {
        const unaccentedSyn = removeVietnameseAccents(syn);
        return (
          matchTokenInText(titleUnaccented, unaccentedSyn) ||
          tagsUnaccented.some((tag) => matchTokenInText(tag, unaccentedSyn))
        );
      });
      if (matchedBySyn) return true;
    }

    // 3. Reverse synonym lookup: check if token appears inside any category's synonyms
    for (const [key, synonyms] of Object.entries(TITLE_SYNONYMS)) {
      if (synonyms.some((syn) => removeVietnameseAccents(syn) === token)) {
        const unaccentedKey = removeVietnameseAccents(key);
        if (
          matchTokenInText(titleUnaccented, unaccentedKey) ||
          tagsUnaccented.some((tag) => matchTokenInText(tag, unaccentedKey))
        ) {
          return true;
        }
        for (const syn of synonyms) {
          const unaccentedSyn = removeVietnameseAccents(syn);
          if (
            matchTokenInText(titleUnaccented, unaccentedSyn) ||
            tagsUnaccented.some((tag) => matchTokenInText(tag, unaccentedSyn))
          ) {
            return true;
          }
        }
      }
    }

    return false;
  });
}
