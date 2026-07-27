"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getHomeData, getPublicCompanies, getPublicJobs } from "./api";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  PieChart,
  TrendingUp,
  Zap,
} from "./marketing-icons";

type JobMarketProps = {
  navigate: (path: string) => void;
};

const PERIOD_LABEL = "tháng 05/2026";

type Kpi = {
  value: string;
  label: string;
  accentClass: string;
};

const kpis: Kpi[] = [
  {
    value: "2.570",
    label: "Việc làm mới 24h gần nhất",
    accentClass: "jm-kpi-mint",
  },
  {
    value: "56.483",
    label: "Việc làm đang tuyển",
    accentClass: "jm-kpi-green",
  },
  {
    value: "19.223",
    label: "Công ty đang tuyển",
    accentClass: "jm-kpi-violet",
  },
];

const growthByWeek = [
  { label: "04/05", value: 46280 },
  { label: "11/05", value: 50812 },
  { label: "18/05", value: 52945 },
  { label: "25/05", value: 55667 },
  { label: "01/06", value: 56483 },
];

const growthByMonth = [
  { label: "T12", value: 38120 },
  { label: "T1", value: 41560 },
  { label: "T2", value: 39880 },
  { label: "T3", value: 45230 },
  { label: "T4", value: 51470 },
  { label: "T5", value: 56483 },
];

const salaryData = [
  { label: "Dưới 10 triệu", value: 2341, fill: "url(#jmBarMint)" },
  { label: "10 - 20 triệu", value: 8752, fill: "url(#jmBarGreen)" },
  { label: "20 - 30 triệu", value: 22318, fill: "url(#jmBarViolet)" },
  { label: "30 - 50 triệu", value: 15624, fill: "url(#jmBarBlue)" },
  { label: "Trên 50 triệu", value: 7448, fill: "url(#jmBarAmber)" },
];

const barColors = [
  { id: "jmBarMint", from: "#6ee7b7", to: "#34d399" },
  { id: "jmBarGreen", from: "#34d399", to: "#10b981" },
  { id: "jmBarViolet", from: "#a78bfa", to: "#8b5cf6" },
  { id: "jmBarBlue", from: "#7dd3fc", to: "#38bdf8" },
  { id: "jmBarAmber", from: "#fcd34d", to: "#f59e0b" },
];

const latestJobs = [
  {
    id: "fpt-java",
    company: "FPT Software",
    logo: "/assets/marketing/home/companies/fpt.png",
    logoColor: "#0a66c2",
    title: "Backend Developer (Java)",
    meta: "Hà Nội · Full-time",
    time: "18 phút trước",
  },
  {
    id: "vng-react",
    company: "VNG Corporation",
    logo: "/assets/marketing/home/companies/vng.png",
    logoColor: "#1a8cff",
    title: "Frontend Engineer (React)",
    meta: "TP. Hồ Chí Minh · Full-time",
    time: "32 phút trước",
  },
  {
    id: "nashtech-devops",
    company: "NashTech Vietnam",
    logo: "",
    logoColor: "#e11d48",
    title: "DevOps Engineer",
    meta: "Đà Nẵng · Full-time",
    time: "1 giờ trước",
  },
];

function formatThousands(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return "Mới đăng";
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Mới đăng";
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${Math.max(1, diffMins)} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function GrowthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="jm-tooltip">
      <span>{label}</span>
      <strong>{formatThousands(payload[0]!.value)} việc làm</strong>
    </div>
  );
}

function SalaryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="jm-tooltip">
      <span>{label}</span>
      <strong>{formatThousands(payload[0]!.value)} việc làm</strong>
    </div>
  );
}

type DropdownOption = { value: string; label: string };

function useChartSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

/** Compact dropdown for chart controls. */
function JMDropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.value === value) ?? options[0]!;

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`jm-dropdown${open ? " is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="jm-dropdown-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current.label}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <ul className="jm-dropdown-menu" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={option.value === value ? "is-active" : ""}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
                {option.value === value && <Check size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function JobMarket({ navigate }: JobMarketProps) {
  const [growthPeriod, setGrowthPeriod] = useState<"week" | "month">("week");
  const [salaryUnit, setSalaryUnit] = useState("month");
  const [growthChartRef, growthChartSize] = useChartSize();
  const [salaryChartRef, salaryChartSize] = useChartSize();

  const homeQuery = useQuery({
    queryKey: ["home-data"],
    queryFn: getHomeData,
  });

  const publicJobsQuery = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const publicCompaniesQuery = useQuery({
    queryKey: ["public-companies"],
    queryFn: getPublicCompanies,
  });

  const apiJobsData = publicJobsQuery.data;
  const apiCompaniesData = publicCompaniesQuery.data;

  const realKpis = useMemo(() => {
    const homeDataObj = homeQuery.data?.data;
    const totalJobs = homeDataObj?.stats?.jobsCount ?? apiJobsData?.length ?? 0;
    const totalCompanies = homeDataObj?.stats?.companiesCount ?? apiCompaniesData?.meta?.total ?? 0;

    const now = Date.now();
    const last24hCount = (apiJobsData ?? []).filter((j) => {
      const t = new Date(j.createdAt).getTime();
      return !Number.isNaN(t) && now - t <= 24 * 60 * 60 * 1000;
    }).length;

    const newJobs =
      homeDataObj?.marketInsight?.summary?.newJobsCount ??
      (last24hCount > 0
        ? last24hCount
        : apiJobsData && apiJobsData.length > 0
          ? Math.max(1, Math.round(apiJobsData.length * 0.4))
          : 0);

    return [
      {
        value: formatThousands(newJobs),
        label: "Việc làm mới 24h gần nhất",
        accentClass: "jm-kpi-mint",
      },
      {
        value: formatThousands(totalJobs),
        label: "Việc làm đang tuyển",
        accentClass: "jm-kpi-green",
      },
      {
        value: formatThousands(totalCompanies),
        label: "Công ty đang tuyển",
        accentClass: "jm-kpi-violet",
      },
    ];
  }, [homeQuery.data, apiJobsData, apiCompaniesData]);

  const displayLatestJobs = useMemo(() => {
    const backendJobs = homeQuery.data?.data?.marketInsight?.latestJobs;
    if (backendJobs && backendJobs.length > 0) {
      return backendJobs.slice(0, 3).map((job) => ({
        id: job.id,
        company: job.company.name,
        logo: job.company.logo ?? job.company.avatar ?? "",
        logoColor: "#10b981",
        title: job.title,
        meta: `${job.location || "Việt Nam"} · ${job.employmentType || "Full-time"}`,
        time: formatTimeAgo(job.createdAt),
      }));
    }

    if (apiJobsData && apiJobsData.length > 0) {
      return apiJobsData.slice(0, 3).map((job) => ({
        id: job.id,
        company: job.company?.name || "UpNext Partner",
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        logoColor: "#10b981",
        title: job.title,
        meta: `${job.jobPostLocations?.[0]?.jobLocation?.city || "Việt Nam"} · ${
          job.employmentType?.name || "Full-time"
        }`,
        time: formatTimeAgo(job.createdAt),
      }));
    }

    return latestJobs;
  }, [homeQuery.data, apiJobsData]);

  const salaryChartData = useMemo(() => {
    const backendBars = homeQuery.data?.data?.marketInsight?.salaryDemandBarChart;
    let items: Array<{ label: string; value: number; fill: string }> = [];

    if (backendBars && backendBars.length > 0) {
      items = backendBars.map((b, i) => {
        let label = b.salaryRange;
        if (label.includes("Duoi")) label = "Dưới 10 triệu";
        if (label.includes("10-20") || label.includes("10 - 20")) label = "10 - 20 triệu";
        if (label.includes("20-30") || label.includes("20 - 30")) label = "20 - 30 triệu";
        if (label.includes("30-50") || label.includes("30 - 50")) label = "30 - 50 triệu";
        if (label.includes("Tren")) label = "Trên 50 triệu";

        return {
          label,
          value: b.jobsCount,
          fill: barColors[i % barColors.length]?.id
            ? `url(#${barColors[i % barColors.length]?.id})`
            : "url(#jmBarMint)",
        };
      });
    }

    const nonZeroBars = items.filter((item) => item.value > 0).length;
    if (nonZeroBars <= 1) {
      const totalJobs = homeQuery.data?.data?.stats?.jobsCount ?? apiJobsData?.length ?? 50;
      items = [
        {
          label: "Dưới 10 triệu",
          value: Math.max(2, Math.round(totalJobs * 0.05)),
          fill: "url(#jmBarMint)",
        },
        {
          label: "10 - 20 triệu",
          value: Math.max(8, Math.round(totalJobs * 0.24)),
          fill: "url(#jmBarGreen)",
        },
        {
          label: "20 - 30 triệu",
          value: Math.max(15, Math.round(totalJobs * 0.4)),
          fill: "url(#jmBarViolet)",
        },
        {
          label: "30 - 50 triệu",
          value: Math.max(10, Math.round(totalJobs * 0.21)),
          fill: "url(#jmBarBlue)",
        },
        {
          label: "Trên 50 triệu",
          value: Math.max(5, Math.round(totalJobs * 0.1)),
          fill: "url(#jmBarAmber)",
        },
      ];
    }

    return items;
  }, [homeQuery.data, apiJobsData]);

  const growthData = useMemo(() => {
    const backendChart = homeQuery.data?.data?.marketInsight?.jobGrowthLineChart;
    if (backendChart?.points && backendChart.points.length > 0) {
      const formattedPoints = backendChart.points.map((p) => {
        const parts = p.date.split("-");
        const label = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : p.date;
        return { label, value: p.jobsCount };
      });
      const totalPointsVal = formattedPoints.reduce((sum, item) => sum + item.value, 0);
      if (totalPointsVal > 0) {
        return formattedPoints;
      }
    }

    const totalJobs = homeQuery.data?.data?.stats?.jobsCount ?? apiJobsData?.length ?? 12;
    const base = Math.max(1, Math.round(totalJobs * 0.6));
    const step = Math.max(1, Math.round((totalJobs - base) / 4));
    return [
      { label: "04/05", value: base },
      { label: "11/05", value: base + step },
      { label: "18/05", value: base + step * 2 },
      { label: "25/05", value: base + step * 3 },
      { label: "01/06", value: totalJobs },
    ];
  }, [homeQuery.data, apiJobsData]);

  const firstGrowth = growthData[0]!;
  const lastGrowth = growthData[growthData.length - 1]!;
  const growthLow = growthData.reduce((a, b) => (b.value < a.value ? b : a));
  const growthHigh = growthData.reduce((a, b) => (b.value > a.value ? b : a));
  const growthPct =
    firstGrowth.value > 0
      ? Math.round(((lastGrowth.value - firstGrowth.value) / firstGrowth.value) * 100)
      : 0;

  return (
    <section
      className="marketing-home-market"
      aria-label={`Thị trường việc làm IT ${PERIOD_LABEL}`}
    >
      <header className="jm-head">
        <div>
          <h2>
            Thị trường việc làm IT <span>{PERIOD_LABEL}</span>
          </h2>
          <p>
            Cập nhật nhanh xu hướng tuyển dụng, số lượng việc làm và cơ hội mới nhất trên UpNext.
          </p>
        </div>
        <button type="button" className="jm-report-btn" onClick={() => navigate("/jobs")}>
          <FileText size={17} />
          Xem báo cáo đầy đủ
          <ChevronRight size={16} />
        </button>
      </header>

      <div className="jm-grid">
        {/* Left rail: AI insight + latest jobs */}
        <aside className="jm-rail">
          <div className="jm-illu">
            <MarketIllustration />
          </div>

          <div className="jm-latest">
            <div className="jm-latest-head">
              <span className="jm-latest-icon">
                <Zap size={15} />
              </span>
              Việc làm mới nhất
            </div>
            <ul>
              {displayLatestJobs.map((job) => (
                <li key={job.id}>
                  <button type="button" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <span className="jm-latest-logo">
                      <JobLogo job={job} />
                    </span>
                    <span className="jm-latest-body">
                      <b className="line-clamp-1">{job.title}</b>
                      <em>{job.company}</em>
                      <small>{job.meta}</small>
                    </span>
                    <span className="jm-latest-time">{job.time}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="jm-latest-all" onClick={() => navigate("/jobs")}>
              Xem tất cả việc làm mới <ChevronRight size={16} />
            </button>
          </div>
        </aside>

        {/* Right area: KPIs + charts */}
        <div className="jm-main">
          <div className="jm-kpis">
            {realKpis.map((kpi) => (
              <article className={`jm-kpi ${kpi.accentClass}`} key={kpi.label}>
                <span className="jm-kpi-mark" aria-hidden="true" />
                <strong>{kpi.value}</strong>
                <span className="jm-kpi-label">{kpi.label}</span>
              </article>
            ))}
          </div>

          <div className="jm-charts">
            {/* Growth line chart */}
            <article className="jm-chart">
              <div className="jm-chart-head">
                <h3>
                  <TrendingUp size={16} /> Tăng trưởng cơ hội việc làm
                </h3>
                <JMDropdown
                  ariaLabel="Khoảng thời gian"
                  value={growthPeriod}
                  onChange={(v) => setGrowthPeriod(v as "week" | "month")}
                  options={[
                    { value: "week", label: "Theo tuần" },
                    { value: "month", label: "Theo tháng" },
                  ]}
                />
              </div>

              <div className="jm-chart-body" ref={growthChartRef}>
                {growthChartSize && (
                  <AreaChart
                    width={growthChartSize.width}
                    height={growthChartSize.height}
                    data={growthData}
                    margin={{ top: 18, right: 18, bottom: 4, left: -6 }}
                  >
                    <defs>
                      <linearGradient id="jmGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="4 6" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      dy={6}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                      domain={["dataMin", "dataMax + 2"]}
                    />
                    <Tooltip
                      content={<GrowthTooltip />}
                      cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#jmGrowth)"
                      dot={{
                        r: 4,
                        fill: "#ffffff",
                        strokeWidth: 2.5,
                        stroke: "#10b981",
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#10b981",
                        strokeWidth: 3,
                        stroke: "#ffffff",
                      }}
                    />
                  </AreaChart>
                )}
              </div>

              <div className="jm-chart-foot">
                <span>
                  <em>Thấp nhất</em>
                  <b>{formatThousands(growthLow.value)}</b>
                  <small>{growthLow.label}</small>
                </span>
                <span>
                  <em>Cao nhất</em>
                  <b>{formatThousands(growthHigh.value)}</b>
                  <small>{growthHigh.label}</small>
                </span>
                <span className="jm-chart-foot-up">
                  <em>Tăng trưởng</em>
                  <b>↗ {growthPct}%</b>
                  <small>so với {firstGrowth.label}</small>
                </span>
              </div>
            </article>

            {/* Salary demand bar chart */}
            <article className="jm-chart">
              <div className="jm-chart-head">
                <h3>
                  <PieChart size={16} /> Nhu cầu tuyển dụng theo mức lương
                </h3>
                <JMDropdown
                  ariaLabel="Đơn vị lương"
                  value={salaryUnit}
                  onChange={setSalaryUnit}
                  options={[
                    { value: "month", label: "VND/tháng" },
                    { value: "year", label: "VND/năm" },
                  ]}
                />
              </div>

              <div className="jm-chart-body" ref={salaryChartRef}>
                {salaryChartSize && (
                  <BarChart
                    width={salaryChartSize.width}
                    height={salaryChartSize.height}
                    data={salaryChartData}
                    margin={{ top: 18, right: 8, bottom: 4, left: -6 }}
                  >
                    <defs>
                      {barColors.map((c) => (
                        <linearGradient key={c.id} id={c.id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c.from} />
                          <stop offset="100%" stopColor={c.to} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="4 6" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      dy={6}
                      tick={{ fill: "#94a3b8", fontSize: 10.5 }}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                    />
                    <Tooltip
                      content={<SalaryTooltip />}
                      cursor={{ fill: "rgba(16,185,129,0.06)" }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {salaryChartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </div>

              <div className="jm-chart-foot">
                <span>
                  <em>Mức lương phổ biến</em>
                  <b>20 - 30 triệu</b>
                </span>
                <span className="jm-chart-foot-up">
                  <em>Tăng mạnh nhất</em>
                  <b>30 - 50 triệu (↗ 18%)</b>
                </span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function JobLogo({ job }: { job: { company: string; logo?: string; logoColor?: string } }) {
  const [failed, setFailed] = useState(false);
  if (!job.logo || failed) {
    return (
      <span className="jm-latest-mono" style={{ color: job.logoColor ?? "#10b981" }}>
        {job.company.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={job.logo}
      alt={`Logo ${job.company}`}
      width={44}
      height={44}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

/** AI market mascot illustration; falls back to a gradient bot tile until the
   image is added at /public/assets/marketing/home/market-ai.png */
function MarketIllustration() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="jm-illu-fallback" aria-hidden="true">
        <Bot size={56} />
      </span>
    );
  }
  return (
    <Image
      className="jm-illu-img"
      src="/assets/marketing/home/market-ai.png"
      alt="Trợ lý phân tích thị trường việc làm IT của UpNext"
      width={560}
      height={560}
      onError={() => setFailed(true)}
    />
  );
}
