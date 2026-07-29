"use client";

import {
  CaretRight,
  CheckCircle,
  Users,
  Clock,
  BookmarkSimple,
  X,
  SlidersHorizontal,
  ArrowRight,
  BookOpen,
  MagnifyingGlass,
  MapPin,
  Sparkle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { getCandidateSession } from "@/features/candidate/session";
import {
  countFacetOption,
  type FacetGroupKey,
  type FacetGroupMatchersFor,
  matchesAllFacetGroups,
  matchesExperienceRange,
  matchesLevelFilter,
  matchesModeFilter,
  matchesSalaryFilter,
  matchesTechnologyFilter,
} from "@/features/public/jobs/jobs-facets";
import { apiRequest } from "@/shared/api/http";
import { formatRelativeTime } from "@/shared/lib/date";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { toast } from "@/shared/ui/toast";
import {
  analyzeNaturalLanguageQuery,
  scoreNaturalLanguageSearch,
} from "@/shared/utils/natural-search";

import { getPublicJobs } from "../../home/api";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import { ApplyModal } from "./apply-modal";

import "../jobs-page.css";

type PublicJobsPageProps = {
  navigate: (path: string) => void;
  replace: (path: string) => void;
};

export function formatJobSalaryDisplay(
  job: {
    salaryIsVisible?: boolean | null;
    salaryIsNegotiable?: boolean | null;
    salaryMin?: number | string | null;
    salaryMax?: number | string | null;
  },
  suffix = "/tháng",
) {
  if (job.salaryIsVisible === false) {
    return "Thỏa thuận";
  }

  const min = job.salaryMin != null ? Number(job.salaryMin) : null;
  const max = job.salaryMax != null ? Number(job.salaryMax) : null;

  if ((!min || min <= 0) && (!max || max <= 0)) {
    return "Thỏa thuận";
  }

  if (min !== null && max !== null && min > 0 && max > 0) {
    if (min === max) {
      const formatted = Math.round(min / 1_000_000);
      return `${formatted} triệu${suffix}`;
    }
    const minM = Math.round(min / 1_000_000);
    const maxM = Math.round(max / 1_000_000);
    return `${minM} - ${maxM} triệu${suffix}`;
  }

  if (min !== null && min > 0) {
    const minM = Math.round(min / 1_000_000);
    return `Từ ${minM} triệu${suffix}`;
  }

  if (max !== null && max > 0) {
    const maxM = Math.round(max / 1_000_000);
    return `Tới ${maxM} triệu${suffix}`;
  }

  return "Thỏa thuận";
}

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  logoColor: string;
  verified: boolean;
  salary: string;
  location: string;
  mode: string;
  level: string;
  type: string;
  posted: string;
  applicants?: number;
  tags: string[];
  description: string;
  categories: string[];
  categoryName?: string | undefined;
  specializations?: string[];
  urgent?: boolean;
  featured?: boolean;
  requirements?: string | null;
  benefits?: string | null;
  expiredAt?: string | null;
  skills?: string[];
  experienceYears?: number[];
  salaryMinMillions?: number | undefined;
  salaryMaxMillions?: number | undefined;
};

type FilterGroup = {
  title: string;
  items: Array<{ label: string; value: string; count: number }>;
};

const logo = (file: string) => `/assets/marketing/home/companies/${file}`;

const staticJobs: Job[] = [
  {
    id: "fpt-java-fresher",
    title: "Fresher Java Developer",
    company: "FPT Software",
    logo: logo("fpt.png"),
    logoColor: "#2563eb",
    verified: true,
    salary: "10 - 15 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    mode: "Full-time",
    level: "Fresher",
    type: "Onsite",
    posted: "2 ngày trước",
    applicants: 40,
    tags: ["Java", "Spring Boot", "SQL", "OOP"],
    description:
      "Tham gia chương trình đào tạo chuyên sâu và làm việc trực tiếp trên các dự án phần mềm cho khách hàng quốc tế.",
    categories: ["backend", "fresher", "onsite"],
    featured: true,
  },
  {
    id: "momo-mobile-react",
    title: "Mobile Developer React Native",
    company: "MoMo",
    logo: logo("momo.png"),
    logoColor: "#a50064",
    verified: true,
    salary: "25 - 40 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    mode: "Hybrid",
    level: "Middle",
    type: "Hybrid",
    posted: "3 ngày trước",
    applicants: 64,
    tags: ["React Native", "TypeScript", "Redux", "Firebase"],
    description:
      "Phát triển sản phẩm fintech quy mô lớn, tối ưu trải nghiệm người dùng và phối hợp cùng product, design, backend.",
    categories: ["mobile", "hybrid", "high-salary"],
    featured: true,
  },
  {
    id: "vng-frontend",
    title: "Frontend Engineer ReactJS",
    company: "VNG Corporation",
    logo: logo("vng.png"),
    logoColor: "#1a8cff",
    verified: true,
    salary: "22 - 35 triệu/tháng",
    location: "Hà Nội",
    mode: "Hybrid",
    level: "Middle",
    type: "Hybrid",
    posted: "1 ngày trước",
    applicants: 58,
    tags: ["React", "TypeScript", "Design System", "Jest"],
    description:
      "Xây dựng giao diện sản phẩm có lượng người dùng lớn, chú trọng hiệu năng, accessibility và component architecture.",
    categories: ["frontend", "hybrid", "high-salary"],
  },
  {
    id: "viettel-devops",
    title: "DevOps Engineer Kubernetes",
    company: "Viettel Solutions",
    logo: logo("viettel.png"),
    logoColor: "#ee0033",
    verified: true,
    salary: "30 - 50 triệu/tháng",
    location: "Đà Nẵng",
    mode: "Full-time",
    level: "Senior",
    type: "Onsite",
    posted: "Hôm nay",
    applicants: 27,
    tags: ["Kubernetes", "Terraform", "AWS", "CI/CD"],
    description:
      "Vận hành hạ tầng cloud, tự động hóa deployment và xây dựng quy trình observability cho hệ thống enterprise.",
    categories: ["devops", "senior", "high-salary", "onsite"],
    urgent: true,
  },
  {
    id: "tiki-data-analyst",
    title: "Data Analyst",
    company: "Tiki",
    logo: logo("tiki.png"),
    logoColor: "#1a94ff",
    verified: true,
    salary: "18 - 28 triệu/tháng",
    location: "Hà Nội",
    mode: "Hybrid",
    level: "Middle",
    type: "Hybrid",
    posted: "4 ngày trước",
    applicants: 71,
    tags: ["SQL", "Python", "Tableau", "A/B Testing"],
    description:
      "Phần tích hành vi người dùng, thiết kế dashboard kinh doanh và hỗ trợ team vận hành ra quyết định bằng dữ liệu.",
    categories: ["data-ai", "hybrid"],
  },
  {
    id: "vnpay-qa",
    title: "QA Automation Engineer",
    company: "VNPAY",
    logo: logo("vnpay.png"),
    logoColor: "#005baa",
    verified: true,
    salary: "18 - 32 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    mode: "Hybrid",
    level: "Middle",
    type: "Hybrid",
    posted: "5 ngày trước",
    applicants: 36,
    tags: ["Playwright", "Cypress", "API Testing", "Jira"],
    description:
      "Xây dựng automation framework cho hệ thống thanh toán, phối hợp chặt với dev để giảm lỗi hồi quy trước release.",
    categories: ["qa", "hybrid"],
  },
  {
    id: "nashtech-backend",
    title: "Senior Backend Engineer Golang",
    company: "NashTech Vietnam",
    logo: "",
    logoColor: "#db2777",
    verified: false,
    salary: "35 - 60 triệu/tháng",
    location: "Remote",
    mode: "Remote",
    level: "Senior",
    type: "Remote",
    posted: "6 ngày trước",
    applicants: 49,
    tags: ["Go", "gRPC", "Kafka", "PostgreSQL"],
    description:
      "Thiết kế service có tải cao, tối ưu database và làm việc cùng team quốc tế theo quy trình Agile/Scrum.",
    categories: ["backend", "senior", "remote", "high-salary"],
  },
  {
    id: "kms-fullstack",
    title: "Fullstack Developer NodeJS/ReactJS",
    company: "KMS Technology",
    logo: "",
    logoColor: "#0aa56f",
    verified: true,
    salary: "25 - 42 triệu/tháng",
    location: "Đà Nẵng",
    mode: "Hybrid",
    level: "Middle",
    type: "Hybrid",
    posted: "1 tuần trước",
    applicants: 33,
    tags: ["Node.js", "React", "MongoDB", "AWS"],
    description:
      "Phát triển sản phẩm SaaS B2B, tham gia thiết kế API, UI component và tối ưu luồng release.",
    categories: ["frontend", "backend", "hybrid", "high-salary"],
  },
  {
    id: "axon-ai",
    title: "AI Engineer",
    company: "Axon Active Vietnam",
    logo: "",
    logoColor: "#7c3aed",
    verified: true,
    salary: "30 - 55 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    mode: "Hybrid",
    level: "Senior",
    type: "Hybrid",
    posted: "Hôm qua",
    applicants: 22,
    tags: ["Python", "LLM", "PyTorch", "MLOps"],
    description:
      "Xây dựng pipeline AI nội bộ, đánh giá model và triển khai tính năng AI cho sản phẩm dùng trong doanh nghiệp.",
    categories: ["data-ai", "senior", "high-salary", "hybrid"],
    featured: true,
  },
  {
    id: "zalo-product-designer",
    title: "Product Designer",
    company: "Zalo",
    logo: "",
    logoColor: "#0068ff",
    verified: true,
    salary: "20 - 35 triệu/tháng",
    location: "Hà Nội",
    mode: "Full-time",
    level: "Middle",
    type: "Onsite",
    posted: "3 ngày trước",
    applicants: 52,
    tags: ["Figma", "UX Research", "Prototype", "Design System"],
    description:
      "Thiết kế trải nghiệm sản phẩm số, nghiên cứu hành vi người dùng và đồng hành cùng engineering trong giai đoạn delivery.",
    categories: ["frontend", "onsite"],
  },
  {
    id: "gotit-cloud",
    title: "Cloud Engineer AWS",
    company: "Got It AI",
    logo: "",
    logoColor: "#d97706",
    verified: true,
    salary: "28 - 48 triệu/tháng",
    location: "Remote",
    mode: "Remote",
    level: "Senior",
    type: "Remote",
    posted: "4 ngày trước",
    applicants: 29,
    tags: ["AWS", "Lambda", "Terraform", "Observability"],
    description:
      "Tối ưu hạ tầng cloud, chi phí vận hành và quy trình monitor cho sản phẩm AI phục vụ khách hàng toàn cầu.",
    categories: ["devops", "senior", "remote", "high-salary"],
  },
  {
    id: "saobacdau-ba",
    title: "Business Analyst IT",
    company: "Sao Bac Dau Technologies",
    logo: "",
    logoColor: "#0891b2",
    verified: false,
    salary: "16 - 27 triệu/tháng",
    location: "Cần Thơ",
    mode: "Full-time",
    level: "Junior",
    type: "Onsite",
    posted: "1 tuần trước",
    applicants: 45,
    tags: ["BPMN", "SQL", "Agile", "UAT"],
    description:
      "Làm việc với khách hàng để phân tích yêu cầu, viết tài liệu nghiệp vụ và phối hợp kiểm thử nghiệm thu.",
    categories: ["fresher", "onsite"],
  },
];

export const jobs = staticJobs;

const salaryRanges = [
  { label: "Dưới 15 triệu", value: "sal-0-15" },
  { label: "15 - 25 triệu", value: "sal-15-25" },
  { label: "25 - 40 triệu", value: "sal-25-40" },
  { label: "40 - 60 triệu", value: "sal-40-60" },
  { label: "Trên 60 triệu", value: "sal-60" },
];

const salaryLabelByValue = new Map(salaryRanges.map((item) => [item.value, item.label]));

const experienceOptions = [
  { label: "Dưới 1 năm", value: "exp-0-1" },
  { label: "1 - 2 năm", value: "exp-1-2" },
  { label: "2 - 4 năm", value: "exp-2-4" },
  { label: "4 - 6 năm", value: "exp-4-6" },
  { label: "Trên 6 năm", value: "exp-6" },
];

const experienceLabelByValue = new Map(experienceOptions.map((item) => [item.value, item.label]));

const fallbackTechOptions = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "Kubernetes",
  "Go",
];

const filterGroups: FilterGroup[] = [
  {
    title: "Hình thức làm việc",
    items: [
      { label: "Hybrid", value: "hybrid", count: 7 },
      { label: "Remote", value: "remote", count: 2 },
      { label: "Onsite", value: "onsite", count: 4 },
    ],
  },
  {
    title: "Cấp bậc",
    items: [
      { label: "Fresher / Junior", value: "fresher", count: 2 },
      { label: "Middle", value: "middle", count: 6 },
      { label: "Senior", value: "senior", count: 4 },
    ],
  },
  {
    title: "Chuyên môn",
    items: [
      { label: "Frontend", value: "frontend", count: 3 },
      { label: "Backend", value: "backend", count: 4 },
      { label: "Data / AI", value: "data-ai", count: 3 },
      { label: "DevOps", value: "devops", count: 2 },
      { label: "QA Automation", value: "qa", count: 1 },
    ],
  },
];

const filterLabelByValue = new Map(
  filterGroups.flatMap((group) => group.items.map((item) => [item.value, item.label] as const)),
);

const ALL_LOCATIONS = "Tất cả địa điểm";

const MODE_FILTERS = new Set(["hybrid", "remote", "onsite"]);
const LEVEL_FILTERS = new Set(["fresher", "middle", "senior"]);
const SALARY_FILTERS = new Set(salaryRanges.map((item) => item.value));
const EXPERIENCE_FILTERS = new Set(experienceOptions.map((item) => item.value));
const SORT_OPTIONS = new Set(["relevant", "newest", "salary"]);

type JobsSearchUrlState = {
  keyword: string;
  location: string;
  category: string;
  title: string;
  skill: string;
  company: string;
  jobCategory: string;
  expertise: string;
  activeFilters: string[];
  salaryFilters: string[];
  experienceFilters: string[];
  technologyFilters: string[];
  sort: string;
  page: number;
};

function buildJobsSearchPath(state: JobsSearchUrlState) {
  const query = new URLSearchParams();
  const normalizedKeyword = state.keyword.trim();

  if (normalizedKeyword) query.set("keyword", normalizedKeyword);
  if (state.location !== ALL_LOCATIONS) query.set("location", state.location);
  if (state.category !== "all") query.set("category", state.category);
  if (state.title) query.set("title", state.title);
  if (state.skill) query.set("skill", state.skill);
  if (state.company) query.set("company", state.company);
  if (state.jobCategory) query.set("jobCategory", state.jobCategory);
  if (state.expertise) query.set("expertise", state.expertise);

  state.activeFilters.forEach((filter) => {
    if (MODE_FILTERS.has(filter)) query.append("mode", filter);
    if (LEVEL_FILTERS.has(filter)) query.append("level", filter);
  });
  state.salaryFilters.forEach((filter) => query.append("salaryRange", filter));
  state.experienceFilters.forEach((filter) => query.append("experienceRange", filter));
  state.technologyFilters.forEach((filter) => query.append("technology", filter));

  if (state.sort !== "relevant") query.set("sort", state.sort);
  if (state.page > 1) query.set("page", String(state.page));

  return `/jobs${query.size > 0 ? `?${query.toString()}` : ""}`;
}

function salaryValue(job: Job) {
  const values = job.salary.match(/\d+/g)?.map(Number) ?? [];
  return values.length ? Math.max(...values) : 0;
}

function LogoMark({ src, name, color }: { src: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white"
        style={{ backgroundColor: color || "#10b981" }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white">
      {/* Company logos come from API-controlled external hosts, so a native image avoids a brittle host allowlist. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={src}
        alt={`Logo ${name}`}
        className="size-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export function PublicJobsPage({ navigate, replace }: PublicJobsPageProps) {
  const locale = useLocale();
  const params = useSearchParams();
  const titleFilter = params.get("title")?.trim() ?? "";
  const skillFilter = params.get("skill")?.trim() ?? "";
  const companyFilter = params.get("company")?.trim() ?? "";
  const jobCategoryFilter = params.get("jobCategory")?.trim() ?? "";
  const expertiseFilter = params.get("expertise")?.trim() ?? "";
  const queryKeyword = params.get("keyword") ?? params.get("position") ?? "";
  const queryLocation = params.get("location") ?? ALL_LOCATIONS;
  const queryCategory = params.get("category") ?? "all";
  const queryActiveFilters = [
    ...params.getAll("mode").filter((filter) => MODE_FILTERS.has(filter)),
    ...params.getAll("level").filter((filter) => LEVEL_FILTERS.has(filter)),
  ];
  const querySalaryFilters = params
    .getAll("salaryRange")
    .filter((filter) => SALARY_FILTERS.has(filter));
  const queryExperienceFilters = params
    .getAll("experienceRange")
    .filter((filter) => EXPERIENCE_FILTERS.has(filter));
  const queryTechnologyFilters = params.getAll("technology").filter(Boolean);
  const querySort = SORT_OPTIONS.has(params.get("sort") ?? "")
    ? (params.get("sort") ?? "relevant")
    : "relevant";
  const queryPage = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const queryActiveFiltersKey = queryActiveFilters.join("|");
  const querySalaryFiltersKey = querySalaryFilters.join("|");
  const queryExperienceFiltersKey = queryExperienceFilters.join("|");
  const queryTechnologyFiltersKey = queryTechnologyFilters.join("|");
  const querySignature = params.toString();
  const [keyword, setKeyword] = useState(queryKeyword);
  const [location, setLocation] = useState(queryLocation);
  const [activeCategory, setActiveCategory] = useState(queryCategory);
  const [activeFilters, setActiveFilters] = useState<string[]>(queryActiveFilters);
  const [salaryFilters, setSalaryFilters] = useState<string[]>(querySalaryFilters);
  const [expFilters, setExpFilters] = useState<string[]>(queryExperienceFilters);
  const [techFilters, setTechFilters] = useState<string[]>(queryTechnologyFilters);
  const [sort, setSort] = useState(querySort);
  const {
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(queryPage);
  const pageSize = 7;
  const lastLoggedKeywordRef = useRef<string>("");
  const lastObservedQueryRef = useRef(querySignature);
  const skipNextFilterReplaceRef = useRef(false);
  const filterDialogRef = useRef<HTMLElement | null>(null);
  const filterToggleRef = useRef<HTMLButtonElement | null>(null);
  const filterCloseRef = useRef<HTMLButtonElement | null>(null);
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    if (lastObservedQueryRef.current === querySignature) return;
    lastObservedQueryRef.current = querySignature;

    const stateAlreadyMatchesUrl =
      keyword === queryKeyword &&
      location === queryLocation &&
      activeCategory === queryCategory &&
      activeFilters.join("|") === queryActiveFiltersKey &&
      salaryFilters.join("|") === querySalaryFiltersKey &&
      expFilters.join("|") === queryExperienceFiltersKey &&
      techFilters.join("|") === queryTechnologyFiltersKey &&
      sort === querySort &&
      page === queryPage;

    if (stateAlreadyMatchesUrl) return;
    skipNextFilterReplaceRef.current = true;
    setKeyword(queryKeyword);
    setLocation(queryLocation);
    setActiveCategory(queryCategory);
    setActiveFilters(queryActiveFiltersKey ? queryActiveFiltersKey.split("|") : []);
    setSalaryFilters(querySalaryFiltersKey ? querySalaryFiltersKey.split("|") : []);
    setExpFilters(queryExperienceFiltersKey ? queryExperienceFiltersKey.split("|") : []);
    setTechFilters(queryTechnologyFiltersKey ? queryTechnologyFiltersKey.split("|") : []);
    setSort(querySort);
    setPage(queryPage);
  }, [
    activeCategory,
    activeFilters,
    expFilters,
    keyword,
    location,
    page,
    queryActiveFiltersKey,
    queryCategory,
    queryExperienceFiltersKey,
    queryKeyword,
    queryLocation,
    queryPage,
    querySalaryFiltersKey,
    querySignature,
    querySort,
    queryTechnologyFiltersKey,
    salaryFilters,
    sort,
    techFilters,
  ]);

  const logKeyword = async (term: string, count: number) => {
    const normalizedTerm = term.trim();
    if (normalizedTerm.length < 2) return;
    if (lastLoggedKeywordRef.current === normalizedTerm) return;
    lastLoggedKeywordRef.current = normalizedTerm;

    try {
      const session = getCandidateSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      await apiRequest("/search-keywords/log", {
        method: "POST",
        body: JSON.stringify({
          keyword: normalizedTerm,
          source: "main_search",
          resultCount: count,
        }),
        headers,
      });
    } catch (err) {
      console.warn("Failed to log search keyword", err);
    }
  };

  const {
    data: apiJobsData,
    isError: isJobsError,
    isPending: isJobsPending,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
    staleTime: 60_000,
  });

  const jobs = useMemo(() => {
    if (!apiJobsData) return [];

    const mapped: Job[] = apiJobsData.map((job) => {
      const jobLocations = job.jobPostLocations ?? [];
      const workingModels = Array.from(
        new Set(
          jobLocations
            .map((item) => item.jobLocation.workingModel?.toLowerCase())
            .filter((model): model is string => Boolean(model)),
        ),
      );
      const primaryWorkingModel = workingModels[0];
      const isRemote =
        primaryWorkingModel === "remote" || job.title.toLowerCase().includes("remote");
      const isHighSalary =
        (job.salaryMin && job.salaryMin >= 30000000) ||
        (job.salaryMax && job.salaryMax >= 30000000);

      const categories: string[] = [];
      if (isRemote) categories.push("remote");
      if (isHighSalary) categories.push("high-salary");
      const categoryCode = job.jobCategory?.name.toLowerCase() || "";
      const titleLower = job.title.toLowerCase();
      const skillsLower = job.jobPostSkills?.map((s) => s.skill.name.toLowerCase()) || [];
      const allText = `${categoryCode} ${titleLower} ${skillsLower.join(" ")}`;

      if (
        allText.includes("frontend") ||
        allText.includes("front-end") ||
        allText.includes("react") ||
        allText.includes("vue") ||
        allText.includes("angular") ||
        allText.includes("next")
      ) {
        categories.push("frontend");
      }
      if (
        allText.includes("backend") ||
        allText.includes("back-end") ||
        allText.includes("node") ||
        allText.includes("java") ||
        allText.includes("python") ||
        allText.includes(".net") ||
        allText.includes("php") ||
        allText.includes("golang") ||
        allText.includes("express") ||
        allText.includes("nest")
      ) {
        categories.push("backend");
      }
      if (
        allText.includes("mobile") ||
        allText.includes("flutter") ||
        allText.includes("ios") ||
        allText.includes("android") ||
        allText.includes("react native") ||
        allText.includes("swift")
      ) {
        categories.push("mobile");
      }
      if (
        allText.includes("data") ||
        allText.includes("ai") ||
        allText.includes("machine learning") ||
        allText.includes("spark")
      ) {
        categories.push("data-ai");
      }
      if (
        allText.includes("devops") ||
        allText.includes("cloud") ||
        allText.includes("aws") ||
        allText.includes("docker") ||
        allText.includes("kubernetes")
      ) {
        categories.push("devops");
      }
      if (allText.includes("qa") || allText.includes("test") || allText.includes("qc")) {
        categories.push("qa");
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        logoColor: "#10b981",
        verified: job.company?.verificationStatus === "VERIFIED",
        salary: formatJobSalaryDisplay(job),
        salaryMinMillions:
          job.salaryIsVisible && typeof job.salaryMin === "number"
            ? job.salaryMin / 1_000_000
            : undefined,
        salaryMaxMillions:
          job.salaryIsVisible && typeof job.salaryMax === "number"
            ? job.salaryMax / 1_000_000
            : undefined,
        location: jobLocations[0]?.jobLocation?.city || "Việt Nam",
        mode:
          primaryWorkingModel === "onsite"
            ? "On-site"
            : primaryWorkingModel === "hybrid"
              ? "Hybrid"
              : primaryWorkingModel === "remote"
                ? "Remote"
                : job.employmentType?.name || "Full-time",
        level: job.experienceLevel?.name || "Middle",
        type: job.employmentType?.name || "Full-time",
        posted: job.publishedAt ? formatRelativeTime(job.publishedAt, locale as any) : "Mới đăng",
        skills: Array.from(
          new Set(
            (job.jobPostSkills ?? [])
              .map((item) => item.skill?.name)
              .filter((skill): skill is string => Boolean(skill)),
          ),
        ),
        tags: Array.from(
          new Set(
            [
              ...(job.jobPostSkills ?? []).map((item) => item.skill?.name),
              job.jobCategory?.name,
              job.experienceLevel?.name,
            ].filter((tag): tag is string => Boolean(tag)),
          ),
        ).slice(0, 5),
        experienceYears: (job.jobPostSkills ?? [])
          .map((item) => item.minYearsExperience)
          .filter((years): years is number => typeof years === "number"),
        description: job.description || "",
        categories,
        categoryName: job.jobCategory?.name,
        specializations: job.jobPostSpecializations?.map((item) => item.specialization.name) ?? [],
        urgent: false,
        featured: false,
        requirements: job.requirements,
        benefits: job.benefits,
        expiredAt: job.expiredAt,
      };
    });

    return mapped;
  }, [apiJobsData, locale]);

  const locationsList = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.location && j.location !== "Việt Nam") {
        set.add(j.location);
      }
    });
    return [ALL_LOCATIONS, ...Array.from(set)];
  }, [jobs]);

  const techOptionsList = useMemo(() => {
    const skills = Array.from(new Set(jobs.flatMap((job) => job.skills ?? []))).toSorted((a, b) =>
      a.localeCompare(b, "vi"),
    );

    return skills.length > 0 ? skills : fallbackTechOptions;
  }, [jobs]);

  const naturalSearchAnalysis = useMemo(
    () =>
      analyzeNaturalLanguageQuery(deferredKeyword, {
        knownLocations: locationsList.filter((item) => item !== ALL_LOCATIONS),
        knownSkills: techOptionsList,
      }),
    [deferredKeyword, locationsList, techOptionsList],
  );

  const naturalSearchScores = useMemo(
    () =>
      new Map(jobs.map((job) => [job.id, scoreNaturalLanguageSearch(naturalSearchAnalysis, job)])),
    [jobs, naturalSearchAnalysis],
  );

  /* Constraints that sit outside the sidebar facets (search box, deep links, location). Facet
     counts are always measured within this scope so they describe reachable results, not the
     whole catalogue. */
  const searchScopedJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const matchesKeyword = naturalSearchScores.get(job.id)?.matches ?? true;
        const matchesTitle = !titleFilter || job.title.toLowerCase() === titleFilter.toLowerCase();
        const matchesSkill =
          !skillFilter || job.tags.some((tag) => tag.toLowerCase() === skillFilter.toLowerCase());
        const matchesCompany =
          !companyFilter || job.company.toLowerCase() === companyFilter.toLowerCase();
        const matchesJobCategory =
          !jobCategoryFilter || job.categoryName?.toLowerCase() === jobCategoryFilter.toLowerCase();
        const matchesExpertise =
          !expertiseFilter ||
          job.specializations?.some(
            (specialization) => specialization.toLowerCase() === expertiseFilter.toLowerCase(),
          );
        const matchesLocation =
          location === ALL_LOCATIONS || job.location.toLowerCase().includes(location.toLowerCase());

        return (
          matchesKeyword &&
          matchesTitle &&
          matchesSkill &&
          matchesCompany &&
          matchesJobCategory &&
          matchesExpertise &&
          matchesLocation
        );
      }),
    [
      companyFilter,
      expertiseFilter,
      jobCategoryFilter,
      jobs,
      location,
      naturalSearchScores,
      skillFilter,
      titleFilter,
    ],
  );

  const facetGroupMatchers = useMemo(() => {
    const levelFilters = activeFilters.filter((filter) => LEVEL_FILTERS.has(filter));
    const modeFilters = activeFilters.filter((filter) => MODE_FILTERS.has(filter));

    return {
      category: (job: Job) => activeCategory === "all" || job.categories.includes(activeCategory),
      level: (job: Job) =>
        levelFilters.length === 0 || levelFilters.some((filter) => matchesLevelFilter(job, filter)),
      mode: (job: Job) =>
        modeFilters.length === 0 || modeFilters.some((filter) => matchesModeFilter(job, filter)),
      salary: (job: Job) =>
        salaryFilters.length === 0 ||
        salaryFilters.some((filter) => matchesSalaryFilter(job, filter)),
      experience: (job: Job) =>
        expFilters.length === 0 ||
        expFilters.some((filter) => matchesExperienceRange(job.experienceYears ?? [], filter)),
      technology: (job: Job) =>
        techFilters.length === 0 ||
        techFilters.some((technology) => matchesTechnologyFilter(job, technology)),
    } satisfies FacetGroupMatchersFor<Job>;
  }, [activeCategory, activeFilters, expFilters, salaryFilters, techFilters]);

  const countOptionForGroup = useCallback(
    (group: FacetGroupKey, matchesOption: (job: Job) => boolean) =>
      countFacetOption(searchScopedJobs, facetGroupMatchers, group, matchesOption),
    [facetGroupMatchers, searchScopedJobs],
  );

  const filterGroupsList = useMemo(
    () => [
      {
        title: "Hình thức làm việc",
        items: [
          { label: "Hybrid", value: "hybrid" },
          { label: "Remote", value: "remote" },
          { label: "Onsite", value: "onsite" },
        ].map((item) => ({
          ...item,
          count: countOptionForGroup("mode", (job) => matchesModeFilter(job, item.value)),
        })),
      },
      {
        title: "Cấp bậc",
        items: [
          { label: "Fresher / Junior", value: "fresher" },
          { label: "Middle", value: "middle" },
          { label: "Senior", value: "senior" },
        ].map((item) => ({
          ...item,
          count: countOptionForGroup("level", (job) => matchesLevelFilter(job, item.value)),
        })),
      },
    ],
    [countOptionForGroup],
  );

  const filteredJobs = useMemo(() => {
    return searchScopedJobs
      .filter((job) => matchesAllFacetGroups(job, facetGroupMatchers))
      .sort((a, b) => {
        if (sort === "newest") {
          if (a.posted === "Hôm nay" || a.posted === "Mới đăng") return -1;
          if (b.posted === "Hôm nay" || b.posted === "Mới đăng") return 1;
          return a.posted.localeCompare(b.posted, "vi");
        }
        if (sort === "salary") {
          return salaryValue(b) - salaryValue(a);
        }
        const naturalScoreDifference =
          (naturalSearchScores.get(b.id)?.score ?? 0) - (naturalSearchScores.get(a.id)?.score ?? 0);
        if (naturalScoreDifference !== 0) return naturalScoreDifference;
        const aScore = (a.featured ? 2 : 0) + (a.urgent ? 1 : 0);
        const bScore = (b.featured ? 2 : 0) + (b.urgent ? 1 : 0);
        return bScore - aScore;
      });
  }, [facetGroupMatchers, naturalSearchScores, searchScopedJobs, sort]);

  useEffect(() => {
    if (queryKeyword.trim().length >= 2) {
      logKeyword(queryKeyword, filteredJobs.length);
    }
  }, [filteredJobs.length, queryKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shownJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const salaryRangesList = useMemo(
    () =>
      salaryRanges.map((range) => ({
        ...range,
        count: countOptionForGroup("salary", (job) => matchesSalaryFilter(job, range.value)),
      })),
    [countOptionForGroup],
  );

  const experienceOptionsList = useMemo(
    () =>
      experienceOptions
        .map((option) => ({
          ...option,
          count: countOptionForGroup("experience", (job) =>
            matchesExperienceRange(job.experienceYears ?? [], option.value),
          ),
        }))
        // An option already picked stays listed even at zero, otherwise it would vanish while
        // still constraining the results and leave no way to clear it.
        .filter((option) => option.count > 0 || expFilters.includes(option.value)),
    [countOptionForGroup, expFilters],
  );

  const categories = useMemo(
    () =>
      [
        { key: "all", label: "Tất cả" },
        { key: "frontend", label: "Frontend" },
        { key: "backend", label: "Backend" },
        { key: "mobile", label: "Mobile" },
        { key: "data-ai", label: "Data / AI" },
        { key: "devops", label: "DevOps" },
        { key: "remote", label: "Remote" },
        { key: "high-salary", label: "Lương cao" },
      ].map((category) => ({
        ...category,
        count: countOptionForGroup("category", (job) =>
          category.key === "all" ? true : job.categories.includes(category.key),
        ),
      })),
    [countOptionForGroup],
  );

  const currentFilterPath = useMemo(
    () =>
      buildJobsSearchPath({
        keyword: queryKeyword,
        location,
        category: activeCategory,
        title: titleFilter,
        skill: skillFilter,
        company: companyFilter,
        jobCategory: jobCategoryFilter,
        expertise: expertiseFilter,
        activeFilters,
        salaryFilters,
        experienceFilters: expFilters,
        technologyFilters: techFilters,
        sort,
        page,
      }),
    [
      activeCategory,
      activeFilters,
      companyFilter,
      expFilters,
      expertiseFilter,
      jobCategoryFilter,
      location,
      page,
      queryKeyword,
      salaryFilters,
      skillFilter,
      sort,
      techFilters,
      titleFilter,
    ],
  );

  useEffect(() => {
    if (skipNextFilterReplaceRef.current) {
      skipNextFilterReplaceRef.current = false;
      return;
    }
    replace(currentFilterPath);
  }, [currentFilterPath, replace]);

  useEffect(() => {
    if (!showFilters) return undefined;

    const dialog = filterDialogRef.current;
    const filterToggle = filterToggleRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    filterCloseRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowFilters(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    dialog?.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      dialog?.removeEventListener("keydown", handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      filterToggle?.focus();
    };
  }, [showFilters]);

  const activeSummary = [
    keyword.trim() ? `Từ khóa: ${keyword.trim()}` : "",
    titleFilter ? `Chức danh: ${titleFilter}` : "",
    skillFilter ? `Kỹ năng: ${skillFilter}` : "",
    companyFilter ? `Công ty: ${companyFilter}` : "",
    jobCategoryFilter ? `Danh mục: ${jobCategoryFilter}` : "",
    expertiseFilter ? `Chuyên môn: ${expertiseFilter}` : "",
    location !== ALL_LOCATIONS ? location : "",
    activeCategory !== "all"
      ? (categories.find((category) => category.key === activeCategory)?.label ?? "")
      : "",
    ...activeFilters.map((filter) => filterLabelByValue.get(filter) ?? filter),
    ...salaryFilters.map((filter) => salaryLabelByValue.get(filter) ?? filter),
    ...expFilters.map((filter) => experienceLabelByValue.get(filter) ?? filter),
    ...techFilters,
  ].filter(Boolean);

  function toggleFilter(value: string) {
    setPage(1);
    setActiveFilters((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function toggleIn(setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) {
    setPage(1);
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function navigateToSearch(nextKeyword = keyword, nextLocation = location) {
    const nextPath = buildJobsSearchPath({
      keyword: nextKeyword,
      location: nextLocation,
      category: activeCategory,
      title: titleFilter,
      skill: skillFilter,
      company: companyFilter,
      jobCategory: jobCategoryFilter,
      expertise: expertiseFilter,
      activeFilters,
      salaryFilters,
      experienceFilters: expFilters,
      technologyFilters: techFilters,
      sort,
      page: 1,
    });
    skipNextFilterReplaceRef.current = nextPath !== currentFilterPath;
    navigate(nextPath);
  }

  function runSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPage(1);
    navigateToSearch();
  }

  function resetFilters() {
    skipNextFilterReplaceRef.current = true;
    setKeyword("");
    setLocation(ALL_LOCATIONS);
    setActiveCategory("all");
    setActiveFilters([]);
    setSalaryFilters([]);
    setExpFilters([]);
    setTechFilters([]);
    setSort("relevant");
    setPage(1);
    navigate("/jobs");
  }

  return (
    <div className="jobs-page flex min-h-screen flex-col justify-between bg-slate-50/50 font-sans text-slate-800 antialiased">
      <div>
        <PublicHeader navigate={navigate} />

        <main className="flex w-full flex-col gap-6 py-8">
          {/* Breadcrumb & Title */}
          <div className="jobs-container">
            <Breadcrumb
              className="mb-4"
              items={[
                { label: "Trang chủ", onClick: () => navigate("/") },
                { label: "Việc làm IT" },
              ]}
            />
            <h1 className="sr-only">Tìm kiếm việc làm từ các công ty hàng đầu đang tuyển dụng</h1>
          </div>

          {/* Hero Search Bar */}
          <div className="jobs-container">
            <form
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row"
              onSubmit={runSearch}
            >
              <div className="flex w-full flex-1 items-center gap-2.5 px-3">
                <MagnifyingGlass size={20} className="flex-shrink-0 text-slate-400" />
                <label className="sr-only" htmlFor="jobs-search-keyword">
                  Từ khóa tìm việc
                </label>
                <input
                  id="jobs-search-keyword"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="VD: Senior React remote ở HCM, lương từ 30 triệu"
                  aria-label="Từ khóa tìm việc"
                  aria-describedby="jobs-search-help"
                  className="w-full border-none bg-transparent py-2 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
              <div className="hidden h-8 w-px bg-slate-200 md:block"></div>
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:w-[280px] md:rounded-none md:border-none md:bg-transparent">
                <label className="sr-only" htmlFor="jobs-search-location">
                  Địa điểm làm việc
                </label>
                <select
                  id="jobs-search-location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-medium text-slate-700 outline-none"
                >
                  {locationsList.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full cursor-pointer rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700 md:w-auto"
              >
                Tìm kiếm
              </button>
            </form>
            <p id="jobs-search-help" className="mt-2 px-1 text-xs leading-relaxed text-slate-500">
              Mô tả công việc bạn muốn bằng tiếng Việt hoặc tiếng Anh; UpNext sẽ tách các tiêu chí
              có thể kiểm chứng để lọc kết quả.
            </p>

            {deferredKeyword.trim() && naturalSearchAnalysis.facets.length > 0 ? (
              <output
                className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5"
                aria-live="polite"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Sparkle size={15} weight="fill" aria-hidden="true" />
                  UpNext đã hiểu:
                </span>
                {naturalSearchAnalysis.facets.map((facet) => (
                  <span
                    key={facet.key}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                  >
                    {facet.label}
                  </span>
                ))}
                <span className="text-xs text-slate-500">
                  Bạn có thể tinh chỉnh thêm bằng bộ lọc nâng cao.
                </span>
              </output>
            ) : null}
          </div>

          {/* Popular Keywords */}
          <div className="jobs-container flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-slate-500">Tìm kiếm phổ biến:</span>
            <div className="flex flex-wrap gap-2">
              {[
                "ReactJS",
                "NodeJS",
                "Frontend",
                "Backend",
                "Fullstack",
                ".NET",
                "Python",
                "DevOps",
              ].map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => {
                    setKeyword(tech);
                    setPage(1);
                    navigateToSearch(tech);
                  }}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50/20 hover:text-emerald-600"
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          {/* Active Categories Tabs */}
          <div
            className="jobs-container flex scrollbar-none gap-2 overflow-x-auto pb-1"
            aria-label="Nhóm việc làm"
          >
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                disabled={category.count === 0}
                aria-pressed={activeCategory === category.key}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === category.key
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-45`}
                onClick={() => {
                  setActiveCategory(category.key);
                  setPage(1);
                }}
              >
                <span>{category.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    activeCategory === category.key
                      ? "bg-emerald-500/30 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {category.count}
                </span>
              </button>
            ))}
          </div>

          {/* Main Section: List & Filter */}
          <div className="jobs-container mt-2 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Job Cards List */}
            <div className="flex flex-col gap-4 lg:col-span-8 xl:col-span-9">
              {/* Sort options bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-6 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setSort("relevant");
                      setPage(1);
                    }}
                    aria-pressed={sort === "relevant"}
                    className={`cursor-pointer border-b-2 pb-3 transition ${
                      sort === "relevant"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Phù hợp nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSort("newest");
                      setPage(1);
                    }}
                    aria-pressed={sort === "newest"}
                    className={`cursor-pointer border-b-2 pb-3 transition ${
                      sort === "newest"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Mới nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSort("salary");
                      setPage(1);
                    }}
                    aria-pressed={sort === "salary"}
                    className={`cursor-pointer border-b-2 pb-3 transition ${
                      sort === "salary"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Lương cao nhất
                  </button>
                </div>
                <button
                  ref={filterToggleRef}
                  type="button"
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 lg:hidden"
                  onClick={() => setShowFilters(true)}
                  aria-controls="jobs-advanced-filters"
                  aria-expanded={showFilters}
                >
                  <SlidersHorizontal size={14} /> Bộ lọc
                </button>
              </div>

              {/* Active Filters Summary */}
              {activeSummary.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-xs">
                  <span className="font-medium text-slate-500">Đang lọc theo:</span>
                  {activeSummary.map((item) => (
                    <span
                      key={item}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="ml-auto cursor-pointer font-semibold text-emerald-700 transition hover:text-emerald-800"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}

              <output className="text-sm text-slate-600" aria-live="polite" aria-atomic="true">
                {isJobsPending ? (
                  "Đang tìm việc làm phù hợp..."
                ) : (
                  <>
                    Tìm thấy{" "}
                    <strong className="font-bold text-slate-900">{filteredJobs.length}</strong> việc
                    làm phù hợp
                  </>
                )}
              </output>

              {/* Job Cards */}
              {isJobsPending ? (
                <div
                  className="flex flex-col gap-4"
                  aria-busy="true"
                  aria-label="Đang tải danh sách việc làm"
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={index}
                      className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
                    />
                  ))}
                </div>
              ) : isJobsError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-white p-10 text-center">
                  <h3 className="mb-1 text-base font-bold text-slate-800">
                    Không thể tải danh sách việc làm
                  </h3>
                  <p className="mb-4 max-w-sm text-xs text-slate-500">
                    Kết nối dữ liệu đang gặp sự cố. Vui lòng thử lại để xem các tin tuyển dụng mới
                    nhất.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchJobs()}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Thử lại
                  </button>
                </div>
              ) : shownJobs.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {shownJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-emerald-500 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row">
                        {/* Logo */}
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                          aria-label={`Xem chi tiết ${job.title}`}
                        >
                          <LogoMark src={job.logo} name={job.company} color={job.logoColor} />
                        </button>

                        {/* Body */}
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">
                              {job.company}
                            </span>
                            {job.verified && (
                              <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                            )}
                          </div>
                          <h3 className="line-clamp-1 text-base font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className="cursor-pointer text-left transition group-hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                            >
                              {job.title}
                              {job.urgent && (
                                <span className="ml-2 inline-flex items-center rounded border border-red-100 bg-red-50 px-1.5 py-0.5 align-middle text-[10px] font-bold text-red-500">
                                  Tuyển gấp
                                </span>
                              )}
                              {job.featured && (
                                <span className="ml-2 inline-flex items-center rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 align-middle text-[10px] font-bold text-amber-600">
                                  Nổi bật
                                </span>
                              )}
                            </button>
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} className="mr-1 inline-block" /> {job.location}
                            </span>
                            {job.applicants ? (
                              <span className="flex items-center gap-1">
                                <Users size={14} className="mr-1 inline-block" /> {job.applicants}{" "}
                                ứng viên
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="mr-1 inline-block" /> {job.posted}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(() => {
                              const maxTags = 3;
                              const maxChars = 22;
                              const shown: string[] = [];
                              let currentChars = 0;
                              for (const tag of job.tags) {
                                if (shown.length >= maxTags) break;
                                if (shown.length >= 1 && currentChars + tag.length > maxChars) {
                                  break;
                                }
                                shown.push(tag);
                                currentChars += tag.length;
                              }
                              const extraCount = job.tags.length - shown.length;
                              return (
                                <>
                                  {shown.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {extraCount > 0 && (
                                    <span
                                      className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400"
                                      title={job.tags.slice(shown.length).join(", ")}
                                    >
                                      +{extraCount}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Side Actions */}
                        <div className="flex min-w-[140px] items-end justify-between gap-2.5 sm:flex-col sm:justify-start">
                          <span className="text-base font-bold whitespace-nowrap text-slate-900">
                            {job.salary}
                          </span>
                          <div className="mt-auto flex w-full items-center gap-2 sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                if (!toggleSaveJob(job.id)) {
                                  toast.info("Vui lòng đăng nhập để lưu công việc yêu thích.");
                                  navigate("/login?redirect=/jobs");
                                }
                              }}
                              disabled={!isSavedJobsSessionResolved || isSavedJobPending(job.id)}
                              className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 transition ${
                                savedJobIds.includes(job.id)
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                              }`}
                              aria-label={savedJobIds.includes(job.id) ? "Bỏ lưu tin" : "Lưu tin"}
                              aria-pressed={savedJobIds.includes(job.id)}
                            >
                              <BookmarkSimple
                                size={18}
                                weight={savedJobIds.includes(job.id) ? "fill" : "regular"}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              Chi tiết <ArrowRight size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const session = getCandidateSession();
                                if (session) {
                                  setApplyJob(job);
                                } else {
                                  navigate(`/register?job=${job.id}`);
                                }
                              }}
                              className="flex-1 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700 sm:flex-initial"
                            >
                              Ứng tuyển
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center">
                  <MagnifyingGlass size={48} className="mb-3 text-slate-300" />
                  <h3 className="mb-1 text-base font-bold text-slate-800">
                    Không tìm thấy việc làm phù hợp
                  </h3>
                  <p className="mb-4 max-w-sm text-xs text-slate-500">
                    Thử tìm kiếm với từ khóa khác hoặc điều chỉnh các tiêu chí lọc để mở rộng phạm
                    vi tìm kiếm.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}

              {/* Pagination */}
              {filteredJobs.length > 0 && totalPages > 1 && (
                <nav
                  className="mt-4 flex items-center justify-center gap-2"
                  aria-label="Phân trang"
                >
                  <button
                    type="button"
                    aria-label="Trang trước"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <CaretRight size={16} className="rotate-180" />
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((num, index) => {
                    if (num === "...") {
                      return (
                        <span key={`dots-${index}`} className="px-1 text-slate-400 select-none">
                          ...
                        </span>
                      );
                    }
                    const pageNum = num as number;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        aria-label={`Trang ${pageNum}`}
                        aria-current={pageNum === currentPage ? "page" : undefined}
                        onClick={() => setPage(pageNum)}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition ${
                          pageNum === currentPage
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-label="Trang sau"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <CaretRight size={16} />
                  </button>
                </nav>
              )}
            </div>

            {/* Right Column: Filter Sidebar (sticky on desktop, modal on mobile) */}
            <aside
              id="jobs-advanced-filters"
              ref={filterDialogRef}
              role={showFilters ? "dialog" : undefined}
              aria-modal={showFilters ? true : undefined}
              aria-labelledby="jobs-filter-heading"
              className={`lg:col-span-4 xl:col-span-3 ${
                showFilters
                  ? "fixed inset-0 z-50 flex flex-col gap-6 overflow-y-auto bg-white p-6"
                  : "hidden lg:block"
              }`}
            >
              <div className="flex flex-col gap-5 rounded-2xl bg-white lg:sticky lg:top-24 lg:border lg:border-slate-200 lg:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2
                    id="jobs-filter-heading"
                    className="flex items-center gap-1.5 text-base font-bold text-slate-900"
                  >
                    <SlidersHorizontal size={18} className="text-slate-600" />
                    Bộ lọc tìm kiếm
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Xóa tất cả
                    </button>
                    {showFilters && (
                      <button
                        ref={filterCloseRef}
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="cursor-pointer text-slate-400 hover:text-slate-600 lg:hidden"
                        aria-label="Đóng bộ lọc"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {/* The API only exposes this filter when a job carries an explicit year requirement. */}
                {experienceOptionsList.length > 0 && (
                  <fieldset>
                    <legend className="mb-3 block text-sm font-semibold text-slate-800">
                      Kinh nghiệm
                    </legend>
                    <div className="flex flex-col gap-1">
                      {experienceOptionsList.map((item) => {
                        const isChecked = expFilters.includes(item.value);
                        // A picked option keeps working at zero so it can always be cleared.
                        const isDisabled = item.count === 0 && !isChecked;

                        return (
                          <label
                            key={item.value}
                            aria-label={`${item.label}, ${item.count} việc làm`}
                            className={`jobs-filter-option group flex min-h-8 items-center gap-2.5 rounded-lg px-1.5 py-0.5 ${
                              isDisabled
                                ? "cursor-not-allowed opacity-50"
                                : "jobs-filter-option-enabled cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              aria-label={item.label}
                              disabled={isDisabled}
                              checked={isChecked}
                              onChange={() => toggleIn(setExpFilters, item.value)}
                              className="jobs-filter-checkbox h-5 w-5 shrink-0"
                            />
                            <span className="jobs-filter-option-copy flex min-w-0 flex-1 justify-between text-sm">
                              <span>{item.label}</span>
                              <span className="text-xs font-medium text-slate-400">
                                ({item.count})
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* Rank Filter */}
                <fieldset>
                  <legend className="mb-3 block text-sm font-semibold text-slate-800">
                    Cấp bậc
                  </legend>
                  <div className="flex flex-col gap-1">
                    {filterGroupsList
                      .find((g) => g.title === "Cấp bậc")
                      ?.items.map((item) => {
                        const isChecked = activeFilters.includes(item.value);
                        // A picked option keeps working at zero so it can always be cleared.
                        const isDisabled = item.count === 0 && !isChecked;

                        return (
                          <label
                            key={item.value}
                            aria-label={`${item.label}, ${item.count} việc làm`}
                            className={`jobs-filter-option group flex min-h-8 items-center gap-2.5 rounded-lg px-1.5 py-0.5 ${
                              isDisabled
                                ? "cursor-not-allowed opacity-50"
                                : "jobs-filter-option-enabled cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              aria-label={item.label}
                              disabled={isDisabled}
                              checked={isChecked}
                              onChange={() => toggleFilter(item.value)}
                              className="jobs-filter-checkbox h-5 w-5 shrink-0"
                            />
                            <span className="jobs-filter-option-copy flex min-w-0 flex-1 justify-between text-sm">
                              <span>{item.label}</span>
                              <span className="text-xs font-medium text-slate-400">
                                ({item.count})
                              </span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </fieldset>

                {/* Work Mode Filter */}
                <fieldset>
                  <legend className="mb-3 block text-sm font-semibold text-slate-800">
                    Hình thức làm việc
                  </legend>
                  <div className="flex flex-col gap-1">
                    {filterGroupsList
                      .find((g) => g.title === "Hình thức làm việc")
                      ?.items.map((item) => {
                        const isChecked = activeFilters.includes(item.value);
                        // A picked option keeps working at zero so it can always be cleared.
                        const isDisabled = item.count === 0 && !isChecked;

                        return (
                          <label
                            key={item.value}
                            aria-label={`${item.label}, ${item.count} việc làm`}
                            className={`jobs-filter-option group flex min-h-8 items-center gap-2.5 rounded-lg px-1.5 py-0.5 ${
                              isDisabled
                                ? "cursor-not-allowed opacity-50"
                                : "jobs-filter-option-enabled cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              aria-label={item.label}
                              disabled={isDisabled}
                              checked={isChecked}
                              onChange={() => toggleFilter(item.value)}
                              className="jobs-filter-checkbox h-5 w-5 shrink-0"
                            />
                            <span className="jobs-filter-option-copy flex min-w-0 flex-1 justify-between text-sm">
                              <span>{item.label}</span>
                              <span className="text-xs font-medium text-slate-400">
                                ({item.count})
                              </span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </fieldset>

                {/* Salary Filter */}
                <fieldset>
                  <legend className="mb-3 block text-sm font-semibold text-slate-800">
                    Mức lương
                  </legend>
                  <div className="flex flex-col gap-1">
                    {salaryRangesList.map((item) => {
                      const isChecked = salaryFilters.includes(item.value);
                      // A picked option keeps working at zero so it can always be cleared.
                      const isDisabled = item.count === 0 && !isChecked;

                      return (
                        <label
                          key={item.value}
                          aria-label={`${item.label}, ${item.count} việc làm`}
                          className={`jobs-filter-option group flex min-h-8 items-center gap-2.5 rounded-lg px-1.5 py-0.5 ${
                            isDisabled
                              ? "cursor-not-allowed opacity-50"
                              : "jobs-filter-option-enabled cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            aria-label={item.label}
                            disabled={isDisabled}
                            checked={isChecked}
                            onChange={() => toggleIn(setSalaryFilters, item.value)}
                            className="jobs-filter-checkbox h-5 w-5 shrink-0"
                          />
                          <span className="jobs-filter-option-copy flex min-w-0 flex-1 justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="text-xs font-medium text-slate-400">
                              ({item.count})
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* CTA Profile Promotion */}
                {showFilters && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="mt-3 w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Xem {filteredJobs.length} việc làm
                  </button>
                )}

                {!showFilters && (
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                    <h3 className="relative z-10 mb-2 text-sm font-bold text-slate-900">
                      Nhận việc làm phù hợp
                    </h3>
                    <p className="relative z-10 mb-4 w-2/3 text-xs leading-relaxed text-slate-500">
                      Tạo hồ sơ ứng viên để nhận gợi ý việc làm IT phù hợp nhất.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="relative z-10 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      Tạo hồ sơ ngay
                    </button>
                    <div className="pointer-events-none absolute right-[-10px] bottom-[-10px] h-20 w-20 opacity-20">
                      <BookOpen size={80} className="text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      <PublicFooter navigate={navigate} />

      {applyJob && (
        <ApplyModal isOpen={!!applyJob} onClose={() => setApplyJob(null)} job={applyJob} />
      )}
    </div>
  );
}
