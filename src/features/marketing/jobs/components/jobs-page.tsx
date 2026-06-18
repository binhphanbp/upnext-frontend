"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { upnextLogo } from "../../home/brand";
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Facebook,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UsersRound,
  WalletCards,
  X,
  Youtube,
} from "../../home/marketing-icons";
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

export const jobs: Job[] = [
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
      "Phân tích hành vi người dùng, thiết kế dashboard kinh doanh và hỗ trợ team vận hành ra quyết định bằng dữ liệu.",
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

const categories = [
  { key: "all", label: "Tất cả", count: jobs.length },
  { key: "frontend", label: "Frontend", count: 3 },
  { key: "backend", label: "Backend", count: 4 },
  { key: "mobile", label: "Mobile", count: 1 },
  { key: "data-ai", label: "Data / AI", count: 3 },
  { key: "devops", label: "DevOps", count: 2 },
  { key: "remote", label: "Remote", count: 2 },
  { key: "high-salary", label: "Lương cao", count: 7 },
];

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

const footerLinks = [
  { label: "Tìm việc IT", path: "/jobs" },
  { label: "Công ty công nghệ", path: "/companies" },
  { label: "Tạo hồ sơ", path: "/register" },
  { label: "Báo cáo lương", path: "/jobs" },
  { label: "Đăng tuyển dụng", path: "/register" },
  { label: "Giải pháp tuyển dụng", path: "/register" },
];

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

  const filteredJobs = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const selectedFilters = new Set(activeFilters);

    const result = jobs.filter((job) => {
      const matchesKeyword =
        !term ||
        [job.title, job.company, job.location, ...job.tags].join(" ").toLowerCase().includes(term);
      const matchesLocation = location === "Tất cả địa điểm" || job.location === location;
      const matchesCategory = activeCategory === "all" || job.categories.includes(activeCategory);
      const matchesFilters =
        selectedFilters.size === 0 ||
        Array.from(selectedFilters).every((filter) => {
          if (filter === "middle") return job.level === "Middle";
          if (filter === "fresher") {
            return job.level === "Fresher" || job.level === "Junior";
          }
          return job.categories.includes(filter);
        });

      return matchesKeyword && matchesLocation && matchesCategory && matchesFilters;
    });

    if (sort === "newest") {
      return [...result].sort((a, b) => {
        if (a.posted === "Hôm nay") return -1;
        if (b.posted === "Hôm nay") return 1;
        return a.posted.localeCompare(b.posted, "vi");
      });
    }

    if (sort === "salary") {
      return [...result].sort((a, b) => salaryValue(b) - salaryValue(a));
    }

    return [...result].sort((a, b) => {
      const aScore = (a.featured ? 2 : 0) + (a.urgent ? 1 : 0);
      const bScore = (b.featured ? 2 : 0) + (b.urgent ? 1 : 0);
      return bScore - aScore;
    });
  }, [activeCategory, activeFilters, keyword, location, sort]);

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
            {salaryRanges.map((item) => (
              <FilterCheck
                key={item.value}
                checked={salaryFilters.includes(item.value)}
                count={0}
                onClick={() => toggleIn(setSalaryFilters, item.value)}
              >
                {item.label}
              </FilterCheck>
            ))}
          </section>

          <section className="jobs-filter-group">
            <h2>Kinh nghiệm</h2>
            {experienceOptions.map((item) => (
              <FilterCheck
                key={item.value}
                checked={expFilters.includes(item.value)}
                count={0}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`jobs-page-num${num === currentPage ? " is-active" : ""}`}
                  aria-current={num === currentPage ? "page" : undefined}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
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

      <footer className="jobs-footer" aria-label="Footer UpNext">
        <section className="jobs-footer-cta">
          <span>
            <BriefcaseBusiness size={30} />
          </span>
          <div>
            <h2>Sẵn sàng tìm việc IT tốt hơn?</h2>
            <p>Tạo hồ sơ miễn phí để theo dõi việc đã lưu và ứng tuyển nhanh hơn.</p>
          </div>
          <button type="button" onClick={() => navigate("/register")}>
            Tạo hồ sơ miễn phí <ArrowRight size={18} />
          </button>
        </section>

        <section className="jobs-footer-main">
          <div className="jobs-footer-brand">
            <Image src={upnextLogo.wordmark} alt="UpNext" width={154} height={37} />
            <p>
              UpNext kết nối ứng viên IT với công ty công nghệ uy tín, tập trung vào thông tin rõ
              ràng và trải nghiệm tìm việc thực tế.
            </p>
            <div>
              <a href="https://www.linkedin.com/" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="https://www.facebook.com/" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://github.com/" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="https://www.youtube.com/" aria-label="YouTube">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <nav className="jobs-footer-links" aria-label="Liên kết nhanh">
            {footerLinks.map((link) => (
              <button key={link.label} type="button" onClick={() => navigate(link.path)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="jobs-footer-contact">
            <h2>Liên hệ</h2>
            <p>
              <Mail size={17} />
              contact@upnext.works
            </p>
            <p>
              <Phone size={17} />
              028 7303 2468
            </p>
            <p>
              <Globe size={17} />
              TP. Hồ Chí Minh, Việt Nam
            </p>
          </div>
        </section>

        <section className="jobs-footer-bottom">
          <p>© 2026 UpNext. Tất cả quyền được bảo lưu.</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowUp size={17} />
            Lên đầu trang
          </button>
        </section>
      </footer>
    </main>
  );
}
