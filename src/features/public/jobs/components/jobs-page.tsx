"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getCandidateSession } from "@/features/candidate/session";
import { apiRequest } from "@/shared/api/http";
import { formatRelativeTime } from "@/shared/lib/date";

import { getPublicJobs } from "../../home/api";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Monitor,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UsersRound,
  WalletCards,
  X,
} from "../../home/marketing-icons";
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
      <span className="jobs-logo-mark jobs-logo-fallback" style={{ color }}>
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <span className="jobs-logo-mark">
      <Image
        src={src}
        alt={`Logo ${name}`}
        width={48}
        height={48}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function FilterCheck({
  checked,
  children,
  count,
  onClick,
}: {
  checked: boolean;
  children: ReactNode;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`jobs-filter-row${checked ? " is-active" : ""}`}
      aria-pressed={checked}
      onClick={onClick}
    >
      <span className="jobs-filter-box">{checked && <Check size={13} />}</span>
      <span>{children}</span>
      <em>{count}</em>
    </button>
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
      };
    });

    return [...mapped, ...staticJobs];
  }, [apiJobsData, locale]);

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

  const filterGroups = useMemo(() => {
    return [
      {
        title: "Hình thức làm việc",
        items: [
          {
            label: "Hybrid",
            value: "hybrid",
            count: jobs.filter((j) => j.categories.includes("hybrid")).length,
          },
          {
            label: "Remote",
            value: "remote",
            count: jobs.filter((j) => j.categories.includes("remote")).length,
          },
          {
            label: "Onsite",
            value: "onsite",
            count: jobs.filter((j) => j.categories.includes("onsite")).length,
          },
        ],
      },
      {
        title: "Cấp bậc",
        items: [
          {
            label: "Fresher / Junior",
            value: "fresher",
            count: jobs.filter(
              (j) =>
                j.level.toLowerCase().includes("fresher") ||
                j.level.toLowerCase().includes("junior"),
            ).length,
          },
          {
            label: "Middle / Senior",
            value: "middle",
            count: jobs.filter(
              (j) =>
                j.level.toLowerCase().includes("middle") ||
                j.level.toLowerCase().includes("mid") ||
                j.level.toLowerCase().includes("senior"),
            ).length,
          },
          {
            label: "Lead / Manager",
            value: "lead",
            count: jobs.filter(
              (j) =>
                j.level.toLowerCase().includes("lead") || j.level.toLowerCase().includes("manager"),
            ).length,
          },
        ],
      },
      {
        title: "Chuyên môn",
        items: [
          {
            label: "Frontend",
            value: "frontend",
            count: jobs.filter((j) => j.categories.includes("frontend")).length,
          },
          {
            label: "Backend",
            value: "backend",
            count: jobs.filter((j) => j.categories.includes("backend")).length,
          },
          {
            label: "Data / AI",
            value: "data-ai",
            count: jobs.filter((j) => j.categories.includes("data-ai")).length,
          },
          {
            label: "DevOps",
            value: "devops",
            count: jobs.filter((j) => j.categories.includes("devops")).length,
          },
          {
            label: "QA Automation",
            value: "qa",
            count: jobs.filter((j) => j.categories.includes("qa")).length,
          },
        ],
      },
    ];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const selectedFilters = new Set(activeFilters);

    return jobs
      .filter((job) => {
        const matchesKeyword =
          !term ||
          [job.title, job.company, job.location, job.description, ...job.tags]
            .join(" ")
            .toLowerCase()
            .includes(term);

        const matchesLocation = location === "Tất cả địa điểm" || job.location === location;

        const matchesCategory = activeCategory === "all" || job.categories.includes(activeCategory);

        const matchesActiveFilters =
          selectedFilters.size === 0 ||
          Array.from(selectedFilters).every((filter) => {
            if (filter === "middle") {
              return (
                job.level.toLowerCase().includes("middle") ||
                job.level.toLowerCase().includes("mid")
              );
            }
            if (filter === "fresher") {
              return (
                job.level.toLowerCase().includes("fresher") ||
                job.level.toLowerCase().includes("junior")
              );
            }
            if (filter === "senior") {
              return (
                job.level.toLowerCase().includes("senior") ||
                job.level.toLowerCase().includes("lead")
              );
            }
            return job.categories.includes(filter);
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
          matchesActiveFilters &&
          matchesSalary &&
          matchesExperience &&
          matchesTech
        );
      })
      .sort((a, b) => {
        if (sort === "newest") {
          if (a.posted === "Hôm nay") return -1;
          if (b.posted === "Hôm nay") return 1;
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
  const techMatches = techOptions.filter((tech) =>
    tech.toLowerCase().includes(techQuery.trim().toLowerCase()),
  );
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
    setSort("relevant");
    setPage(1);
  }

  return (
    <main className="jobs-page">
      <PublicHeader navigate={navigate} />

      <section className="jobs-hero">
        <nav className="jobs-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={() => navigate("/")}>
            Trang chủ
          </button>
          <ChevronRight size={14} />
          <span>Việc làm IT</span>
        </nav>

        <div className="jobs-hero-copy">
          <h1>
            Khám phá <span>việc làm IT</span>
          </h1>
          <p>Hàng ngàn cơ hội việc làm IT chất lượng từ các công ty hàng đầu đang chờ bạn.</p>
        </div>

        <div className="jobs-hero-art" aria-hidden="true">
          <Image
            src="/assets/marketing/jobs/job-search.png"
            alt=""
            width={720}
            height={520}
            draggable={false}
            priority
          />
        </div>

        <form className="jobs-search" onSubmit={runSearch}>
          <label className="jobs-search-field jobs-search-keyword">
            <span className="sr-only">Từ khóa</span>
            <i>
              <Search size={19} />
              <input
                aria-label="Từ khóa"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Nhập tên công việc, kỹ năng, công ty..."
              />
            </i>
          </label>
          <label className="jobs-search-field">
            <span>Địa điểm</span>
            <i>
              <select
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setPage(1);
                }}
              >
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </i>
          </label>
          <button type="submit">
            <Search size={18} /> Tìm việc
          </button>
        </form>
      </section>

      <section className="jobs-categories" aria-label="Nhóm việc làm">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={activeCategory === category.key ? "is-active" : ""}
            onClick={() => {
              setActiveCategory(category.key);
              setPage(1);
            }}
          >
            <span>{category.label}</span>
            <em>{category.count}</em>
          </button>
        ))}
      </section>

      <section className="jobs-layout">
        <aside className={`jobs-filter-panel${showFilters ? " is-open" : ""}`}>
          <div className="jobs-filter-head">
            <div>
              <span>Bộ lọc</span>
              <strong>Tinh chỉnh kết quả</strong>
            </div>
            <button type="button" onClick={resetFilters}>
              Xóa lọc
            </button>
            <button
              type="button"
              className="jobs-filter-close"
              aria-label="Đóng bộ lọc"
              onClick={() => setShowFilters(false)}
            >
              <X size={18} />
            </button>
          </div>

          <section className="jobs-filter-group">
            <h2>Mức lương (VND)</h2>
            {salaryRangesList.map((item) => (
              <FilterCheck
                key={item.value}
                checked={salaryFilters.includes(item.value)}
                count={item.count}
                onClick={() => toggleIn(setSalaryFilters, item.value)}
              >
                {item.label}
              </FilterCheck>
            ))}
          </section>

          <section className="jobs-filter-group">
            <h2>Kinh nghiệm</h2>
            {experienceOptionsList.map((item) => (
              <FilterCheck
                key={item.value}
                checked={expFilters.includes(item.value)}
                count={item.count}
                onClick={() => toggleIn(setExpFilters, item.value)}
              >
                {item.label}
              </FilterCheck>
            ))}
          </section>

          {filterGroups.map((group) => (
            <section className="jobs-filter-group" key={group.title}>
              <h2>{group.title}</h2>
              {group.items.map((item) => (
                <FilterCheck
                  key={item.value}
                  checked={activeFilters.includes(item.value)}
                  count={item.count}
                  onClick={() => toggleFilter(item.value)}
                >
                  {item.label}
                </FilterCheck>
              ))}
            </section>
          ))}

          <section className="jobs-filter-group">
            <h2>Công nghệ</h2>
            <div className="jobs-filter-search">
              <Search size={15} />
              <label className="sr-only" htmlFor="jobs-tech-filter">
                Tìm công nghệ
              </label>
              <input
                id="jobs-tech-filter"
                aria-label="Tìm công nghệ"
                value={techQuery}
                onChange={(event) => setTechQuery(event.target.value)}
                placeholder="Tìm công nghệ..."
              />
            </div>
            {techMatches.map((tech) => (
              <FilterCheck
                key={tech}
                checked={techFilters.includes(tech)}
                count={0}
                onClick={() => toggleIn(setTechFilters, tech)}
              >
                {tech}
              </FilterCheck>
            ))}
          </section>

          <section className="jobs-filter-group">
            <h2>Địa điểm</h2>
            {locations.slice(1).map((item) => (
              <FilterCheck
                key={item}
                checked={location === item}
                count={0}
                onClick={() => {
                  setPage(1);
                  setLocation((current) => (current === item ? "Tất cả địa điểm" : item));
                }}
              >
                {item}
              </FilterCheck>
            ))}
          </section>

          <section className="jobs-filter-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Mẹo lọc việc hiệu quả</strong>
              <p>
                Bắt đầu từ chuyên môn và hình thức làm việc. Chỉ chọn thêm cấp bậc khi danh sách còn
                quá rộng.
              </p>
            </div>
          </section>
        </aside>

        <section className="jobs-results" aria-label="Danh sách việc làm">
          <div className="jobs-results-head">
            <div>
              <span>Hiển thị</span>
              <h2>{filteredJobs.length} việc làm IT phù hợp</h2>
            </div>
            <div className="jobs-results-actions">
              <button
                type="button"
                className="jobs-filter-toggle"
                onClick={() => setShowFilters(true)}
              >
                <SlidersHorizontal size={18} />
                Bộ lọc
              </button>
              <label>
                <span>Sắp xếp</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="relevant">Phù hợp nhất</option>
                  <option value="newest">Mới nhất</option>
                  <option value="salary">Lương cao nhất</option>
                </select>
              </label>
            </div>
          </div>

          {activeSummary.length > 0 && (
            <div className="jobs-active-filters" aria-label="Bộ lọc đang dùng">
              <span>Đang lọc theo</span>
              {activeSummary.map((item) => (
                <em key={item}>{item}</em>
              ))}
              <button type="button" onClick={resetFilters}>
                Xóa tất cả
                <X size={13} />
              </button>
            </div>
          )}

          {shownJobs.length > 0 ? (
            <div className="jobs-list">
              {shownJobs.map((job) => (
                <article className="jobs-card" key={job.id}>
                  <div className="jobs-card-main">
                    <div className="jobs-card-logo">
                      <LogoMark src={job.logo} name={job.company} color={job.logoColor} />
                    </div>
                    <div className="jobs-card-body">
                      <div className="jobs-card-title-row">
                        <div>
                          <h3>{job.title}</h3>
                          <p>
                            {job.company}
                            {job.verified && (
                              <span>
                                <ShieldCheck size={14} /> Đã xác thực
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`jobs-save${saved[job.id] ? " is-saved" : ""}`}
                          aria-label={saved[job.id] ? "Bỏ lưu tin" : "Lưu tin"}
                          aria-pressed={saved[job.id] ?? false}
                          onClick={() =>
                            setSaved((current) => ({
                              ...current,
                              [job.id]: !current[job.id],
                            }))
                          }
                        >
                          <Bookmark size={18} fill={saved[job.id] ? "currentColor" : "none"} />
                          <span>Lưu</span>
                        </button>
                      </div>

                      <p className="jobs-desc">{job.description}</p>

                      <div className="jobs-meta">
                        <span>
                          <WalletCards size={15} />
                          {job.salary}
                        </span>
                        <span>
                          <MapPin size={15} />
                          {job.location}
                        </span>
                        <span>
                          <Monitor size={15} />
                          {job.mode}
                        </span>
                        <span>
                          <UsersRound size={15} />
                          {job.applicants} ứng viên
                        </span>
                      </div>

                      <div className="jobs-tags">
                        {job.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="jobs-card-side">
                    <div>
                      {job.urgent && <span className="jobs-urgent">Tuyển gấp</span>}
                      {job.featured && (
                        <span className="jobs-featured">
                          <Star size={13} /> Nổi bật
                        </span>
                      )}
                      <small>{job.posted}</small>
                    </div>
                    <a
                      className="jobs-detail"
                      href={`/${locale}/jobs/${job.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(`/jobs/${job.id}`);
                      }}
                    >
                      Xem chi tiết <ArrowRight size={16} />
                    </a>
                    <button
                      type="button"
                      className="jobs-apply"
                      onClick={() => navigate(`/register?job=${job.id}`)}
                    >
                      Ứng tuyển ngay
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <section className="jobs-empty">
              <Search size={28} />
              <h2>Không tìm thấy việc làm phù hợp</h2>
              <p>
                Thử giảm bớt bộ lọc hoặc dùng từ khóa rộng hơn như Frontend, Backend, Data hoặc
                DevOps.
              </p>
              <button type="button" onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            </section>
          )}

          {filteredJobs.length > 0 && totalPages > 1 && (
            <nav className="jobs-pagination" aria-label="Phân trang">
              <button
                type="button"
                className="jobs-page-arrow"
                disabled={currentPage === 1}
                aria-label="Trang trước"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
              {getPageNumbers(currentPage, totalPages).map((num, index) => {
                if (num === "...") {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="jobs-pagination-dots px-3 py-2 text-slate-400 select-none"
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = num as number;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`jobs-page-num${pageNum === currentPage ? " is-active" : ""}`}
                    aria-current={pageNum === currentPage ? "page" : undefined}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                className="jobs-page-arrow"
                disabled={currentPage === totalPages}
                aria-label="Trang sau"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ArrowRight size={16} />
              </button>
            </nav>
          )}
        </section>
      </section>

      <PublicFooter navigate={navigate} />
    </main>
  );
}
