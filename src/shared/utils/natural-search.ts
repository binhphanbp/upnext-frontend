/**
 * Deterministic, explainable natural-language search for public jobs.
 *
 * This parser intentionally does not pretend to be an LLM. It extracts only
 * constraints that UpNext can verify against public job data, exposes those
 * constraints back to the UI, and keeps unrecognised words as normal keyword
 * search terms.
 */

export function removeVietnameseAccents(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/đ/gu, "d");
}

function normalizeSearchText(value: string): string {
  return removeVietnameseAccents(value)
    .replace(/(\d),(\d)/gu, "$1.$2")
    .replace(/[^\p{L}\p{N}+#./-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export type SearchableJob = {
  title: string;
  company?: string;
  location?: string;
  mode?: string;
  level?: string;
  type?: string;
  tags?: string[];
  skills?: string[];
  description?: string;
  salary?: string;
  salaryMinMillions?: number | undefined;
  salaryMaxMillions?: number | undefined;
  experienceYears?: number[] | undefined;
  categories?: string[];
  categoryName?: string | undefined;
  specializations?: string[] | undefined;
};

export type NaturalSearchFacetType =
  | "employment"
  | "experience"
  | "keyword"
  | "location"
  | "salary"
  | "seniority"
  | "skill"
  | "work-mode";

export type NaturalSearchFacet = {
  key: string;
  label: string;
  type: NaturalSearchFacetType;
  value: string;
};

export type NaturalSearchRange = {
  min?: number | undefined;
  max?: number | undefined;
};

export type NaturalSearchAnalysis = {
  originalQuery: string;
  normalizedQuery: string;
  freeTextTokens: string[];
  concepts: string[];
  skills: string[];
  locations: string[];
  workModes: string[];
  seniority: string[];
  employmentTypes: string[];
  salary: NaturalSearchRange | null;
  experience: NaturalSearchRange | null;
  facets: NaturalSearchFacet[];
};

type NaturalSearchOptions = {
  knownLocations?: string[];
  knownSkills?: string[];
};

type SearchConcept = {
  key: string;
  label: string;
  terms: string[];
};

const SEARCH_CONCEPTS: SearchConcept[] = [
  {
    key: "frontend",
    label: "Frontend",
    terms: [
      "frontend",
      "front-end",
      "front end",
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
  },
  {
    key: "backend",
    label: "Backend",
    terms: [
      "backend",
      "back-end",
      "back end",
      "server",
      "node",
      "nodejs",
      "express",
      "nestjs",
      "java",
      "spring",
      "python",
      "django",
      "fastapi",
      "golang",
      "dotnet",
      ".net",
      "php",
    ],
  },
  {
    key: "fullstack",
    label: "Fullstack",
    terms: ["fullstack", "full-stack", "full stack", "mern", "mean"],
  },
  {
    key: "mobile",
    label: "Mobile",
    terms: ["mobile", "react native", "flutter", "ios", "android", "swift", "kotlin"],
  },
  {
    key: "devops",
    label: "DevOps / Cloud",
    terms: [
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
  },
  {
    key: "data-ai",
    label: "Data / AI",
    terms: [
      "data engineer",
      "data analyst",
      "data science",
      "data scientist",
      "ai",
      "machine learning",
      "ml",
      "deep learning",
      "llm",
      "big data",
      "spark",
    ],
  },
  {
    key: "qa",
    label: "QA / Testing",
    terms: [
      "tester",
      "qa",
      "qc",
      "automation test",
      "manual test",
      "quality assurance",
      "kiem thu",
    ],
  },
  {
    key: "ui-ux",
    label: "UI/UX",
    terms: [
      "ui/ux",
      "ui ux",
      "product designer",
      "figma",
      "ux designer",
      "ui designer",
      "thiet ke",
    ],
  },
  {
    key: "product",
    label: "Product / BA",
    terms: [
      "product manager",
      "product owner",
      "project manager",
      "scrum master",
      "business analyst",
      "ba",
    ],
  },
  {
    key: "security",
    label: "Security",
    terms: ["security", "cyber security", "cybersecurity", "pentest", "soc", "infosec"],
  },
  {
    key: "brse",
    label: "BrSE",
    terms: ["brse", "bridge system engineer", "cau noi"],
  },
];

const STOP_WORDS = new Set([
  "tim",
  "kiem",
  "viec",
  "lam",
  "tuyen",
  "gap",
  "can",
  "muon",
  "o",
  "tai",
  "cho",
  "co",
  "voi",
  "va",
  "phu",
  "hop",
  "vi",
  "tri",
  "find",
  "job",
  "jobs",
  "hiring",
  "looking",
  "for",
  "in",
  "at",
  "with",
  "and",
  "wanted",
  "role",
  "position",
  "developer",
  "engineer",
  "luong",
  "salary",
]);

const WORK_MODE_GROUPS = [
  {
    value: "remote",
    label: "Remote",
    terms: ["remote", "tu xa", "lam tu xa", "work from home", "wfh"],
  },
  {
    value: "hybrid",
    label: "Hybrid",
    terms: ["hybrid", "ket hop", "linh hoat"],
  },
  {
    value: "onsite",
    label: "Onsite",
    terms: ["onsite", "on-site", "tai van phong", "van phong"],
  },
];

const SENIORITY_GROUPS = [
  {
    value: "intern",
    label: "Thực tập",
    terms: ["intern", "internship", "thuc tap"],
  },
  {
    value: "fresher",
    label: "Fresher",
    terms: ["fresher", "moi ra truong"],
  },
  { value: "junior", label: "Junior", terms: ["junior"] },
  { value: "middle", label: "Middle", terms: ["middle", "mid-level", "mid level"] },
  { value: "senior", label: "Senior", terms: ["senior"] },
  { value: "lead", label: "Lead", terms: ["tech lead", "team lead", "lead"] },
];

const EMPLOYMENT_GROUPS = [
  {
    value: "full-time",
    label: "Full-time",
    terms: ["full-time", "full time", "toan thoi gian"],
  },
  {
    value: "part-time",
    label: "Part-time",
    terms: ["part-time", "part time", "ban thoi gian"],
  },
  {
    value: "contract",
    label: "Hợp đồng",
    terms: ["contract", "hop dong"],
  },
  {
    value: "freelance",
    label: "Freelance",
    terms: ["freelance", "freelancer"],
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function termPattern(term: string): RegExp {
  const escaped = escapeRegExp(normalizeSearchText(term)).replace(/\s+/gu, "\\s+");
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "iu");
}

function containsTerm(text: string, term: string): boolean {
  return termPattern(term).test(text);
}

function removeTerm(text: string, term: string): string {
  return text.replace(termPattern(term), " ").replace(/\s+/gu, " ").trim();
}

function addFacet(
  facets: NaturalSearchFacet[],
  type: NaturalSearchFacetType,
  value: string,
  label: string,
) {
  const key = `${type}:${normalizeSearchText(value)}`;
  if (!facets.some((facet) => facet.key === key)) {
    facets.push({ key, label, type, value });
  }
}

function locationAliases(location: string): string[] {
  const normalized = normalizeSearchText(location);
  const aliases = new Set([normalized]);

  if (normalized.includes("ho chi minh")) {
    ["ho chi minh", "tp ho chi minh", "hcm", "tp hcm", "sai gon", "saigon"].forEach((alias) =>
      aliases.add(alias),
    );
  }
  if (normalized.includes("ha noi")) {
    ["ha noi", "hanoi"].forEach((alias) => aliases.add(alias));
  }
  if (normalized.includes("da nang")) {
    ["da nang", "danang"].forEach((alias) => aliases.add(alias));
  }

  return [...aliases].toSorted((a, b) => b.length - a.length);
}

function extractRange(
  text: string,
  unitPattern: string,
): { range: NaturalSearchRange | null; nextText: string; label: string | null } {
  const parseNumber = (value: string) => Number(value.replace(",", "."));
  const rangePattern = new RegExp(
    `(^|\\s)(\\d{1,3}(?:[.,]\\d+)?)\\s*(?:-|den|toi)\\s*(\\d{1,3}(?:[.,]\\d+)?)\\s*(?:${unitPattern})(?=\\s|$)`,
    "iu",
  );
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch) {
    const min = parseNumber(rangeMatch[2]!);
    const max = parseNumber(rangeMatch[3]!);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return {
        range: { min: Math.min(min, max), max: Math.max(min, max) },
        nextText: text.replace(rangePattern, " ").replace(/\s+/gu, " ").trim(),
        label: `${Math.min(min, max)} - ${Math.max(min, max)}`,
      };
    }
  }

  const minPattern = new RegExp(
    `(^|\\s)(?:tu|tren|hon|toi thieu|it nhat|from|over|above|at least)\\s*(\\d{1,3}(?:[.,]\\d+)?)\\s*(?:${unitPattern})(?=\\s|$)`,
    "iu",
  );
  const minMatch = text.match(minPattern);
  if (minMatch) {
    const min = parseNumber(minMatch[2]!);
    return {
      range: { min },
      nextText: text.replace(minPattern, " ").replace(/\s+/gu, " ").trim(),
      label: `Từ ${min}`,
    };
  }

  const maxPattern = new RegExp(
    `(^|\\s)(?:duoi|toi da|khong qua|under|below|up to|maximum)\\s*(\\d{1,3}(?:[.,]\\d+)?)\\s*(?:${unitPattern})(?=\\s|$)`,
    "iu",
  );
  const maxMatch = text.match(maxPattern);
  if (maxMatch) {
    const max = parseNumber(maxMatch[2]!);
    return {
      range: { max },
      nextText: text.replace(maxPattern, " ").replace(/\s+/gu, " ").trim(),
      label: `Tối đa ${max}`,
    };
  }

  const exactPattern = new RegExp(
    `(^|\\s)(?:(?:luong|salary|khoang|around)\\s*)?(\\d{1,3}(?:[.,]\\d+)?)\\s*(?:${unitPattern})(?=\\s|$)`,
    "iu",
  );
  const exactMatch = text.match(exactPattern);
  if (exactMatch) {
    const value = parseNumber(exactMatch[2]!);
    return {
      range: { min: value, max: value },
      nextText: text.replace(exactPattern, " ").replace(/\s+/gu, " ").trim(),
      label: `Khoảng ${value}`,
    };
  }

  return { range: null, nextText: text, label: null };
}

export function analyzeNaturalLanguageQuery(
  query: string,
  options: NaturalSearchOptions = {},
): NaturalSearchAnalysis {
  const originalQuery = query.trim();
  const normalizedQuery = normalizeSearchText(originalQuery);
  const facets: NaturalSearchFacet[] = [];
  const locations: string[] = [];
  const skills: string[] = [];
  const workModes: string[] = [];
  const seniority: string[] = [];
  const employmentTypes: string[] = [];
  const concepts: string[] = [];
  let remaining = normalizedQuery;

  const salaryResult = extractRange(remaining, "trieu|million|m");
  remaining = salaryResult.nextText;
  if (salaryResult.range && salaryResult.label) {
    addFacet(facets, "salary", salaryResult.label, `${salaryResult.label} triệu`);
  }

  const experienceResult = extractRange(
    remaining,
    "nam(?:\\s+kinh\\s+nghiem)?|years?(?:\\s+experience)?",
  );
  remaining = experienceResult.nextText;
  if (experienceResult.range && experienceResult.label) {
    addFacet(facets, "experience", experienceResult.label, `${experienceResult.label} năm`);
  }

  const sortedLocations = [...new Set(options.knownLocations ?? [])].toSorted(
    (a, b) => normalizeSearchText(b).length - normalizeSearchText(a).length,
  );
  for (const location of sortedLocations) {
    const matchedAlias = locationAliases(location).find((alias) => containsTerm(remaining, alias));
    if (!matchedAlias) continue;
    locations.push(location);
    addFacet(facets, "location", location, location);
    remaining = removeTerm(remaining, matchedAlias);
  }

  const sortedSkills = [...new Set(options.knownSkills ?? [])].toSorted(
    (a, b) => normalizeSearchText(b).length - normalizeSearchText(a).length,
  );
  for (const skill of sortedSkills) {
    const normalizedSkill = normalizeSearchText(skill);
    if (!normalizedSkill || !containsTerm(remaining, normalizedSkill)) continue;
    skills.push(skill);
    addFacet(facets, "skill", skill, skill);
    remaining = removeTerm(remaining, normalizedSkill);
  }

  for (const group of WORK_MODE_GROUPS) {
    const matchedTerm = group.terms.find((term) => containsTerm(remaining, term));
    if (!matchedTerm) continue;
    workModes.push(group.value);
    addFacet(facets, "work-mode", group.value, group.label);
    remaining = removeTerm(remaining, matchedTerm);
  }

  for (const group of SENIORITY_GROUPS) {
    const matchedTerm = group.terms.find((term) => containsTerm(remaining, term));
    if (!matchedTerm) continue;
    seniority.push(group.value);
    addFacet(facets, "seniority", group.value, group.label);
    remaining = removeTerm(remaining, matchedTerm);
  }

  for (const group of EMPLOYMENT_GROUPS) {
    const matchedTerm = group.terms.find((term) => containsTerm(remaining, term));
    if (!matchedTerm) continue;
    employmentTypes.push(group.value);
    addFacet(facets, "employment", group.value, group.label);
    remaining = removeTerm(remaining, matchedTerm);
  }

  const conceptCandidates = SEARCH_CONCEPTS.flatMap((concept) =>
    concept.terms.map((term) => ({ concept, term })),
  ).toSorted((a, b) => normalizeSearchText(b.term).length - normalizeSearchText(a.term).length);
  while (remaining) {
    const matchedConcept = conceptCandidates.find(({ term }) => containsTerm(remaining, term));
    if (!matchedConcept) break;
    if (!concepts.includes(matchedConcept.concept.key)) {
      concepts.push(matchedConcept.concept.key);
      addFacet(facets, "keyword", matchedConcept.concept.key, matchedConcept.concept.label);
    }
    remaining = removeTerm(remaining, matchedConcept.term);
  }

  const freeTextTokens = remaining
    .split(/[\s,;|()]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));

  if (freeTextTokens.length > 0) {
    const freeText = freeTextTokens.join(" ");
    addFacet(facets, "keyword", freeText, `Từ khóa: ${freeText}`);
  }

  return {
    originalQuery,
    normalizedQuery,
    freeTextTokens,
    concepts,
    skills,
    locations,
    workModes,
    seniority,
    employmentTypes,
    salary: salaryResult.range,
    experience: experienceResult.range,
    facets,
  };
}

function parseSalaryFromText(job: SearchableJob): NaturalSearchRange | null {
  if (typeof job.salaryMinMillions === "number" || typeof job.salaryMaxMillions === "number") {
    return {
      ...(typeof job.salaryMinMillions === "number" ? { min: job.salaryMinMillions } : {}),
      ...(typeof job.salaryMaxMillions === "number" ? { max: job.salaryMaxMillions } : {}),
    };
  }

  const values = job.salary?.match(/\d+/gu)?.map(Number) ?? [];
  if (values.length === 0) return null;
  if (values.length === 1) return { min: values[0], max: values[0] };
  return { min: values[0], max: values[1] };
}

function rangesOverlap(
  jobRange: NaturalSearchRange | null,
  queryRange: NaturalSearchRange,
): boolean {
  if (!jobRange) return false;
  const jobMin = jobRange.min ?? jobRange.max;
  const jobMax = jobRange.max ?? jobRange.min;
  if (typeof jobMin !== "number" || typeof jobMax !== "number") return false;
  if (typeof queryRange.min === "number" && jobMax < queryRange.min) return false;
  if (typeof queryRange.max === "number" && jobMin > queryRange.max) return false;
  return true;
}

function matchesConcept(conceptKey: string, titleAndTags: string): boolean {
  const concept = SEARCH_CONCEPTS.find((item) => item.key === conceptKey);
  return Boolean(concept?.terms.some((term) => containsTerm(titleAndTags, term)));
}

export function scoreNaturalLanguageSearch(
  analysis: NaturalSearchAnalysis,
  job: SearchableJob,
): { matches: boolean; score: number } {
  if (!analysis.originalQuery) return { matches: true, score: 0 };

  const normalizedTitle = normalizeSearchText(job.title);
  const normalizedTags = normalizeSearchText(
    [...(job.tags ?? []), ...(job.skills ?? [])].join(" "),
  );
  const titleAndTags = `${normalizedTitle} ${normalizedTags}`.trim();
  const allText = normalizeSearchText(
    [
      job.title,
      job.company,
      job.location,
      job.mode,
      job.level,
      job.type,
      ...(job.tags ?? []),
      ...(job.skills ?? []),
      job.categoryName,
      ...(job.specializations ?? []),
      job.description,
    ]
      .filter(Boolean)
      .join(" "),
  );
  let score = 0;

  for (const skill of analysis.skills) {
    const normalizedSkill = normalizeSearchText(skill);
    if (!containsTerm(titleAndTags, normalizedSkill)) return { matches: false, score: 0 };
    score += containsTerm(normalizedTitle, normalizedSkill) ? 12 : 9;
  }

  for (const concept of analysis.concepts) {
    if (!matchesConcept(concept, titleAndTags)) return { matches: false, score: 0 };
    score += containsTerm(normalizedTitle, concept) ? 8 : 4;
  }

  for (const token of analysis.freeTextTokens) {
    if (!containsTerm(allText, token)) return { matches: false, score: 0 };
    if (containsTerm(normalizedTitle, token)) score += 8;
    else if (containsTerm(normalizedTags, token)) score += 6;
    else score += 2;
  }

  if (
    analysis.locations.length > 0 &&
    !analysis.locations.some((location) =>
      normalizeSearchText(job.location ?? "").includes(
        normalizeSearchText(location).replace(/^tp\.?\s+/u, ""),
      ),
    )
  ) {
    return { matches: false, score: 0 };
  }
  score += analysis.locations.length * 3;

  if (
    analysis.workModes.length > 0 &&
    !analysis.workModes.some((mode) => {
      const normalizedMode = normalizeSearchText(job.mode ?? "");
      if (mode === "onsite") {
        return (
          normalizedMode.includes("onsite") ||
          normalizedMode.includes("on-site") ||
          normalizedMode.includes("office")
        );
      }
      return normalizedMode.includes(mode);
    })
  ) {
    return { matches: false, score: 0 };
  }
  score += analysis.workModes.length * 3;

  if (
    analysis.seniority.length > 0 &&
    !analysis.seniority.some((level) => {
      const normalizedLevel = normalizeSearchText(job.level ?? "");
      if (level === "lead") return normalizedLevel.includes("lead");
      if (level === "intern") return normalizedLevel.includes("intern");
      return normalizedLevel.includes(level);
    })
  ) {
    return { matches: false, score: 0 };
  }
  score += analysis.seniority.length * 3;

  if (
    analysis.employmentTypes.length > 0 &&
    !analysis.employmentTypes.some((type) =>
      normalizeSearchText(`${job.type ?? ""} ${job.mode ?? ""}`).includes(
        normalizeSearchText(type),
      ),
    )
  ) {
    return { matches: false, score: 0 };
  }
  score += analysis.employmentTypes.length * 2;

  if (analysis.salary && !rangesOverlap(parseSalaryFromText(job), analysis.salary)) {
    return { matches: false, score: 0 };
  }
  if (analysis.salary) score += 3;

  if (analysis.experience) {
    const years = job.experienceYears ?? [];
    if (years.length === 0) return { matches: false, score: 0 };
    const matchesExperience = years.some((year) => {
      if (typeof analysis.experience?.min === "number" && year < analysis.experience.min) {
        return false;
      }
      if (typeof analysis.experience?.max === "number" && year > analysis.experience.max) {
        return false;
      }
      return true;
    });
    if (!matchesExperience) return { matches: false, score: 0 };
    score += 3;
  }

  return { matches: true, score };
}

export function matchNaturalLanguageSearch(
  query: string,
  job: SearchableJob,
  options: NaturalSearchOptions = {},
): boolean {
  const analysis = analyzeNaturalLanguageQuery(query, {
    knownLocations: options.knownLocations ?? (job.location ? [job.location] : []),
    knownSkills: options.knownSkills ?? [...(job.skills ?? []), ...(job.tags ?? [])],
  });
  return scoreNaturalLanguageSearch(analysis, job).matches;
}
