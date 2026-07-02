"use client";

import {
  House,
  CaretRight,
  CaretDown,
  Check,
  CheckCircle,
  Buildings,
  Users,
  Clock,
  BookmarkSimple,
  X,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Star,
  BookOpen,
  MagnifyingGlass,
  MapPin,
  Monitor,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCandidateSession } from "@/features/candidate/session";
import { apiRequest } from "@/shared/api/http";
import { formatRelativeTime } from "@/shared/lib/date";

import { getPublicJobs } from "../../home/api";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";

import "../jobs-page.css";

type PublicJobsPageProps = {
  navigate: (path: string) => void;
};

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
  applicants: number;
  tags: string[];
  description: string;
  categories: string[];
  urgent?: boolean;
  featured?: boolean;
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

const experienceOptions = [
  { label: "Dưới 1 năm", value: "exp-0-1" },
  { label: "1 - 2 năm", value: "exp-1-2" },
  { label: "2 - 4 năm", value: "exp-2-4" },
  { label: "4 - 6 năm", value: "exp-4-6" },
  { label: "Trên 6 năm", value: "exp-6" },
];

const techOptions = [
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

const locations = ["Tất cả địa điểm", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Remote", "Cần Thơ"];

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
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-2">
      <img
        src={src}
        alt={`Logo ${name}`}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function parseSalaryRange(job: Job) {
  const values = job.salary.match(/\d+/g)?.map(Number) ?? [];
  if (values.length === 1) return { min: values[0]!, max: values[0]! };
  if (values.length >= 2) return { min: values[0]!, max: values[1]! };
  return { min: 0, max: 0 };
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

export function PublicJobsPage({ navigate }: PublicJobsPageProps) {
  const locale = useLocale();
  const params = useSearchParams();
  const [keyword, setKeyword] = useState(params.get("keyword") ?? params.get("position") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "Tất cả địa điểm");
  const [activeCategory, setActiveCategory] = useState(params.get("category") ?? "all");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [salaryFilters, setSalaryFilters] = useState<string[]>([]);
  const [expFilters, setExpFilters] = useState<string[]>([]);
  const [techFilters, setTechFilters] = useState<string[]>([]);
  const [techQuery, setTechQuery] = useState("");
  const [customMinSalary, setCustomMinSalary] = useState("");
  const [customMaxSalary, setCustomMaxSalary] = useState("");
  const [sort, setSort] = useState("relevant");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 7;
  const lastLoggedKeywordRef = useRef<string>("");

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

  const { data: apiJobsData } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const jobs = useMemo(() => {
    if (!apiJobsData) return staticJobs;

    const mapped: Job[] = apiJobsData.map((job) => {
      const isRemote =
        job.employmentType?.name.toLowerCase().includes("remote") ||
        job.title.toLowerCase().includes("remote");
      const isHighSalary =
        (job.salaryMin && job.salaryMin >= 30000000) ||
        (job.salaryMax && job.salaryMax >= 30000000);

      const categories: string[] = [];
      if (isRemote) categories.push("remote");
      if (isHighSalary) categories.push("high-salary");
      const categoryCode = job.jobCategory?.name.toLowerCase() || "";
      if (categoryCode.includes("frontend")) categories.push("frontend");
      if (categoryCode.includes("backend")) categories.push("backend");
      if (categoryCode.includes("mobile")) categories.push("mobile");
      if (categoryCode.includes("data") || categoryCode.includes("ai")) {
        categories.push("data-ai");
      }
      if (categoryCode.includes("devops")) categories.push("devops");
      if (categoryCode.includes("qa") || categoryCode.includes("test")) {
        categories.push("qa");
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        logo: job.company?.logoUrl || "",
        logoColor: "#10b981",
        verified: true,
        salary:
          job.salaryIsVisible && job.salaryMin && job.salaryMax
            ? `${Math.round(job.salaryMin / 1000000)} - ${Math.round(job.salaryMax / 1000000)} triệu/tháng`
            : "Thỏa thuận",
        location: job.jobPostLocations?.[0]?.jobLocation?.city || "Việt Nam",
        mode: job.employmentType?.name || "Full-time",
        level: job.experienceLevel?.name || "Middle",
        type: job.employmentType?.name || "Full-time",
        posted: job.publishedAt ? formatRelativeTime(job.publishedAt, locale as any) : "Mới đăng",
        applicants: 12,
        tags: [job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
          Boolean,
        ) as string[],
        description: job.description || "",
        categories,
        urgent: false,
        featured: false,
      };
    });

    return [...mapped, ...staticJobs];
  }, [apiJobsData, locale]);

  const locationsList = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.location && j.location !== "Việt Nam") {
        set.add(j.location);
      }
    });
    return ["Tất cả địa điểm", ...Array.from(set)];
  }, [jobs]);

  const filterGroupsList = useMemo(() => {
    return [
      {
        title: "Hình thức làm việc",
        items: [
          {
            label: "Hybrid",
            value: "hybrid",
            count: jobs.filter((j) => j.mode.toLowerCase().includes("hybrid")).length,
          },
          {
            label: "Remote",
            value: "remote",
            count: jobs.filter((j) => j.mode.toLowerCase().includes("remote")).length,
          },
          {
            label: "Onsite",
            value: "onsite",
            count: jobs.filter(
              (j) =>
                j.mode.toLowerCase().includes("onsite") || j.mode.toLowerCase().includes("office"),
            ).length,
          },
        ],
      },
      {
        title: "Cấp bậc",
        items: [
          {
            label: "Fresher / Junior",
            value: "fresher",
            count: jobs.filter((j) => {
              const lvl = j.level.toLowerCase();
              return lvl.includes("fresher") || lvl.includes("junior") || lvl.includes("intern");
            }).length,
          },
          {
            label: "Middle",
            value: "middle",
            count: jobs.filter((j) => {
              const lvl = j.level.toLowerCase();
              return lvl.includes("middle") || lvl.includes("mid");
            }).length,
          },
          {
            label: "Senior",
            value: "senior",
            count: jobs.filter((j) => {
              const lvl = j.level.toLowerCase();
              return lvl.includes("senior") || lvl.includes("lead");
            }).length,
          },
        ],
      },
    ];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const matchesKeyword =
          !keyword.trim() ||
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.company.toLowerCase().includes(keyword.toLowerCase()) ||
          job.tags.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase())) ||
          job.description.toLowerCase().includes(keyword.toLowerCase());

        const matchesLocation =
          location === "Tất cả địa điểm" ||
          job.location.toLowerCase().includes(location.toLowerCase());

        const matchesCategory = activeCategory === "all" || job.categories.includes(activeCategory);

        // Group filters in activeFilters (work modes & ranks) to perform proper OR inside each group, and AND between them
        const rankFilters = activeFilters.filter((f) =>
          ["fresher", "middle", "senior"].includes(f),
        );
        const matchesRank =
          rankFilters.length === 0 ||
          rankFilters.some((filter) => {
            const lvl = job.level.toLowerCase();
            if (filter === "fresher") {
              return lvl.includes("fresher") || lvl.includes("junior") || lvl.includes("intern");
            }
            if (filter === "middle") {
              return lvl.includes("middle") || lvl.includes("mid");
            }
            if (filter === "senior") {
              return lvl.includes("senior") || lvl.includes("lead");
            }
            return false;
          });

        const modeFilters = activeFilters.filter((f) => ["hybrid", "remote", "onsite"].includes(f));
        const matchesMode =
          modeFilters.length === 0 ||
          modeFilters.some((filter) => {
            if (filter === "hybrid") return job.mode.toLowerCase().includes("hybrid");
            if (filter === "remote") return job.mode.toLowerCase().includes("remote");
            if (filter === "onsite") {
              return (
                job.mode.toLowerCase().includes("onsite") ||
                job.mode.toLowerCase().includes("office")
              );
            }
            return false;
          });

        const matchesSalary =
          salaryFilters.length === 0 ||
          salaryFilters.some((filter) => {
            const { min, max } = parseSalaryRange(job);
            if (filter === "sal-0-15") return min > 0 && min <= 15;
            if (filter === "sal-15-25") return !(max < 15 || min > 25);
            if (filter === "sal-25-40") return !(max < 25 || min > 40);
            if (filter === "sal-40-60") return !(max < 40 || min > 60);
            if (filter === "sal-60") return max >= 60;
            return false;
          });

        const matchesCustomSalary = (() => {
          const { min, max } = parseSalaryRange(job);
          if (customMinSalary && max < parseInt(customMinSalary)) return false;
          if (customMaxSalary && min > parseInt(customMaxSalary)) return false;
          return true;
        })();

        const matchesExperience =
          expFilters.length === 0 ||
          expFilters.some((filter) => {
            const lvl = job.level.toLowerCase();
            if (filter === "exp-0-1") {
              return (
                lvl.includes("fresher") || lvl.includes("intern") || lvl.includes("dưới 1 năm")
              );
            }
            if (filter === "exp-1-2") {
              return lvl.includes("junior") || lvl.includes("1 - 2 năm") || lvl.includes("1-2");
            }
            if (filter === "exp-2-4") {
              return (
                lvl.includes("middle") ||
                lvl.includes("mid") ||
                lvl.includes("2 - 4 năm") ||
                lvl.includes("2-4")
              );
            }
            if (filter === "exp-4-6") {
              return lvl.includes("senior") || lvl.includes("4 - 6 năm") || lvl.includes("4-6");
            }
            if (filter === "exp-6") {
              return (
                lvl.includes("lead") ||
                lvl.includes("manager") ||
                lvl.includes("trên 6 năm") ||
                lvl.includes("6+")
              );
            }
            return false;
          });

        const matchesTech =
          techFilters.length === 0 ||
          techFilters.some(
            (tech) =>
              job.tags.some((tag) => tag.toLowerCase() === tech.toLowerCase()) ||
              job.title.toLowerCase().includes(tech.toLowerCase()),
          );

        return (
          matchesKeyword &&
          matchesLocation &&
          matchesCategory &&
          matchesRank &&
          matchesMode &&
          matchesSalary &&
          matchesCustomSalary &&
          matchesExperience &&
          matchesTech
        );
      })
      .sort((a, b) => {
        if (sort === "newest") {
          if (a.posted === "Hôm nay" || a.posted === "Mới đăng") return -1;
          if (b.posted === "Hôm nay" || b.posted === "Mới đăng") return 1;
          return a.posted.localeCompare(b.posted, "vi");
        }
        if (sort === "salary") {
          return salaryValue(b) - salaryValue(a);
        }
        const aScore = (a.featured ? 2 : 0) + (a.urgent ? 1 : 0);
        const bScore = (b.featured ? 2 : 0) + (b.urgent ? 1 : 0);
        return bScore - aScore;
      });
  }, [
    activeCategory,
    activeFilters,
    expFilters,
    jobs,
    keyword,
    location,
    salaryFilters,
    customMinSalary,
    customMaxSalary,
    sort,
    techFilters,
  ]);

  useEffect(() => {
    const term = params.get("keyword") ?? params.get("position") ?? "";
    if (term.trim().length >= 2) {
      logKeyword(term, filteredJobs.length);
    }
  }, [params, filteredJobs.length]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shownJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const salaryRangesList = useMemo(() => {
    return salaryRanges.map((range) => {
      let count = 0;
      if (range.value === "sal-0-15") {
        count = jobs.filter((j) => {
          const { min } = parseSalaryRange(j);
          return min > 0 && min <= 15;
        }).length;
      } else if (range.value === "sal-15-25") {
        count = jobs.filter((j) => {
          const { min, max } = parseSalaryRange(j);
          return !(max < 15 || min > 25);
        }).length;
      } else if (range.value === "sal-25-40") {
        count = jobs.filter((j) => {
          const { min, max } = parseSalaryRange(j);
          return !(max < 25 || min > 40);
        }).length;
      } else if (range.value === "sal-40-60") {
        count = jobs.filter((j) => {
          const { min, max } = parseSalaryRange(j);
          return !(max < 40 || min > 60);
        }).length;
      } else if (range.value === "sal-60") {
        count = jobs.filter((j) => {
          const { max } = parseSalaryRange(j);
          return max >= 60;
        }).length;
      }
      return { ...range, count };
    });
  }, [jobs]);

  const experienceOptionsList = useMemo(() => {
    return experienceOptions.map((opt) => {
      let count = 0;
      const val = opt.value;
      if (val === "exp-0-1") {
        count = jobs.filter((j) => {
          const lvl = j.level.toLowerCase();
          return lvl.includes("fresher") || lvl.includes("intern") || lvl.includes("dưới 1 năm");
        }).length;
      } else if (val === "exp-1-2") {
        count = jobs.filter((j) => {
          const lvl = j.level.toLowerCase();
          return lvl.includes("junior") || lvl.includes("1 - 2 năm") || lvl.includes("1-2");
        }).length;
      } else if (val === "exp-2-4") {
        count = jobs.filter((j) => {
          const lvl = j.level.toLowerCase();
          return (
            lvl.includes("middle") ||
            lvl.includes("mid") ||
            lvl.includes("2 - 4 năm") ||
            lvl.includes("2-4")
          );
        }).length;
      } else if (val === "exp-4-6") {
        count = jobs.filter((j) => {
          const lvl = j.level.toLowerCase();
          return lvl.includes("senior") || lvl.includes("4 - 6 năm") || lvl.includes("4-6");
        }).length;
      } else if (val === "exp-6") {
        count = jobs.filter((j) => {
          const lvl = j.level.toLowerCase();
          return (
            lvl.includes("lead") ||
            lvl.includes("manager") ||
            lvl.includes("trên 6 năm") ||
            lvl.includes("6+")
          );
        }).length;
      }
      return { ...opt, count };
    });
  }, [jobs]);

  const categories = useMemo(() => {
    return [
      { key: "all", label: "Tất cả", count: jobs.length },
      {
        key: "frontend",
        label: "Frontend",
        count: jobs.filter((j) => j.categories.includes("frontend")).length,
      },
      {
        key: "backend",
        label: "Backend",
        count: jobs.filter((j) => j.categories.includes("backend")).length,
      },
      {
        key: "mobile",
        label: "Mobile",
        count: jobs.filter((j) => j.categories.includes("mobile")).length,
      },
      {
        key: "data-ai",
        label: "Data / AI",
        count: jobs.filter((j) => j.categories.includes("data-ai")).length,
      },
      {
        key: "devops",
        label: "DevOps",
        count: jobs.filter((j) => j.categories.includes("devops")).length,
      },
      {
        key: "remote",
        label: "Remote",
        count: jobs.filter((j) => j.categories.includes("remote")).length,
      },
      {
        key: "high-salary",
        label: "Lương cao",
        count: jobs.filter((j) => j.categories.includes("high-salary")).length,
      },
    ];
  }, [jobs]);

  const activeSummary = [
    keyword.trim() ? `Từ khóa: ${keyword.trim()}` : "",
    location !== "Tất cả địa điểm" ? location : "",
    activeCategory !== "all"
      ? (categories.find((category) => category.key === activeCategory)?.label ?? "")
      : "",
    ...activeFilters.map((filter) => filterLabelByValue.get(filter) ?? filter),
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

  function runSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPage(1);
    logKeyword(keyword, filteredJobs.length);
  }

  function resetFilters() {
    setKeyword("");
    setLocation("Tất cả địa điểm");
    setActiveCategory("all");
    setActiveFilters([]);
    setSalaryFilters([]);
    setExpFilters([]);
    setTechFilters([]);
    setTechQuery("");
    setCustomMinSalary("");
    setCustomMaxSalary("");
    setSort("relevant");
    setPage(1);
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/50 font-sans text-slate-800 antialiased">
      <div>
        <PublicHeader navigate={navigate} />

        <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8">
          {/* Breadcrumb & Title */}
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
              <House size={14} className="text-slate-400" />
              <button
                type="button"
                onClick={() => navigate("/")}
                className="cursor-pointer transition hover:text-emerald-600"
              >
                Trang chủ
              </button>
              <CaretRight size={10} className="text-slate-400" />
              <span className="font-medium text-slate-900">Việc làm IT</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              Tìm kiếm <span className="text-emerald-600">{filteredJobs.length}</span> việc làm từ
              các công ty hàng đầu đang tuyển dụng
            </h1>
          </div>

          {/* Hero Search Bar */}
          <form
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row"
            onSubmit={runSearch}
          >
            <div className="flex w-full flex-1 items-center gap-2.5 px-3">
              <MagnifyingGlass size={20} className="flex-shrink-0 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm kiếm theo vị trí, kỹ năng, công ty..."
                className="w-full border-none bg-transparent py-2 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
            <div className="hidden h-8 w-px bg-slate-200 md:block"></div>
            <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:w-[280px] md:rounded-none md:border-none md:bg-transparent">
              <select
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

          {/* Popular Keywords */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
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
            className="flex scrollbar-none gap-2 overflow-x-auto pb-1"
            aria-label="Nhóm việc làm"
          >
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === category.key
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
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
          <div className="mt-2 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Job Cards List */}
            <div className="flex flex-col gap-4 lg:col-span-8 xl:col-span-9">
              {/* Sort options bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-6 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setSort("relevant")}
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
                    onClick={() => setSort("newest")}
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
                    onClick={() => setSort("salary")}
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
                  type="button"
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 lg:hidden"
                  onClick={() => setShowFilters(true)}
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

              {/* Job Cards */}
              {shownJobs.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {shownJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-emerald-500 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row">
                        {/* Logo */}
                        <div onClick={() => navigate(`/jobs/${job.id}`)} className="cursor-pointer">
                          <LogoMark src={job.logo} name={job.company} color={job.logoColor} />
                        </div>

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
                          <h3
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="line-clamp-1 cursor-pointer text-base font-bold text-slate-900 transition group-hover:text-emerald-600"
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
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} className="mr-1 inline-block" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} className="mr-1 inline-block" /> {job.applicants} ứng
                              viên
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="mr-1 inline-block" /> {job.posted}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {job.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
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
                              onClick={() =>
                                setSaved((current) => ({
                                  ...current,
                                  [job.id]: !current[job.id],
                                }))
                              }
                              className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 transition ${
                                saved[job.id]
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                              }`}
                              aria-label={saved[job.id] ? "Bỏ lưu tin" : "Lưu tin"}
                            >
                              <BookmarkSimple
                                size={18}
                                weight={saved[job.id] ? "fill" : "regular"}
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
                              onClick={() => navigate(`/register?job=${job.id}`)}
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
                <div
                  className="mt-4 flex items-center justify-center gap-2"
                  aria-label="Phân trang"
                >
                  <button
                    type="button"
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
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <CaretRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Filter Sidebar (sticky on desktop, modal on mobile) */}
            <aside
              className={`lg:col-span-4 xl:col-span-3 ${
                showFilters
                  ? "fixed inset-0 z-50 flex flex-col gap-6 overflow-y-auto bg-white p-6"
                  : "hidden lg:block"
              }`}
            >
              <div className="flex flex-col gap-5 rounded-2xl bg-white lg:sticky lg:top-24 lg:border lg:border-slate-200 lg:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
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
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="cursor-pointer text-slate-400 hover:text-slate-600 lg:hidden"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Keyword Filter */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Từ khóa</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Nhập vị trí, kỹ năng, công ty..."
                      className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm text-slate-700 transition outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <MagnifyingGlass
                      size={16}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Địa điểm
                  </label>
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setPage(1);
                      }}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {locationsList.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <CaretDown
                      size={14}
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-800">
                    Kinh nghiệm
                  </label>
                  <div className="flex flex-col gap-2.5">
                    {experienceOptionsList.map((item) => (
                      <label
                        key={item.value}
                        className="group flex cursor-pointer items-center gap-2.5"
                      >
                        <input
                          type="checkbox"
                          checked={expFilters.includes(item.value)}
                          onChange={() => toggleIn(setExpFilters, item.value)}
                          className="custom-checkbox h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-500"
                        />
                        <span className="flex flex-1 justify-between text-sm text-slate-600 transition group-hover:text-slate-900">
                          <span>{item.label}</span>
                          <span className="text-xs font-medium text-slate-400">({item.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rank Filter */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-800">Cấp bậc</label>
                  <div className="flex flex-col gap-2.5">
                    {filterGroupsList
                      .find((g) => g.title === "Cấp bậc")
                      ?.items.map((item) => (
                        <label
                          key={item.value}
                          className="group flex cursor-pointer items-center gap-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={activeFilters.includes(item.value)}
                            onChange={() => toggleFilter(item.value)}
                            className="custom-checkbox h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-500"
                          />
                          <span className="flex flex-1 justify-between text-sm text-slate-600 transition group-hover:text-slate-900">
                            <span>{item.label}</span>
                            <span className="text-xs font-medium text-slate-400">
                              ({item.count})
                            </span>
                          </span>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Work Mode Filter */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-800">
                    Hình thức làm việc
                  </label>
                  <div className="flex flex-col gap-2.5">
                    {filterGroupsList
                      .find((g) => g.title === "Hình thức làm việc")
                      ?.items.map((item) => (
                        <label
                          key={item.value}
                          className="group flex cursor-pointer items-center gap-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={activeFilters.includes(item.value)}
                            onChange={() => toggleFilter(item.value)}
                            className="custom-checkbox h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-500"
                          />
                          <span className="flex flex-1 justify-between text-sm text-slate-600 transition group-hover:text-slate-900">
                            <span>{item.label}</span>
                            <span className="text-xs font-medium text-slate-400">
                              ({item.count})
                            </span>
                          </span>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Salary Filter */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-800">
                    Mức lương
                  </label>
                  <div className="mb-3 flex flex-col gap-2.5">
                    {salaryRangesList.map((item) => (
                      <label
                        key={item.value}
                        className="group flex cursor-pointer items-center gap-2.5"
                      >
                        <input
                          type="checkbox"
                          checked={salaryFilters.includes(item.value)}
                          onChange={() => toggleIn(setSalaryFilters, item.value)}
                          className="custom-checkbox h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-500"
                        />
                        <span className="flex flex-1 justify-between text-sm text-slate-600 transition group-hover:text-slate-900">
                          <span>{item.label}</span>
                          <span className="text-xs font-medium text-slate-400">({item.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Skills Filter */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Công nghệ / Kỹ năng
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Tìm công nghệ..."
                      value={techQuery}
                      onChange={(e) => setTechQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm text-slate-700 transition outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <MagnifyingGlass
                      size={16}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {techOptions
                      .filter((tech) => tech.toLowerCase().includes(techQuery.toLowerCase()))
                      .map((tech) => {
                        const isChecked = techFilters.includes(tech);
                        return (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => toggleIn(setTechFilters, tech)}
                            className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                              isChecked
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {tech}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* CTA Profile Promotion */}
                {showFilters && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="mt-3 w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Áp dụng bộ lọc
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
    </div>
  );
}
