"use client";

import {
  Bell,
  Briefcase,
  CalendarBlank,
  CaretDown,
  Check,
  CheckCircle,
  DotsThreeVertical,
  FilePdf,
  FunnelSimple,
  HourglassMedium,
  MapPin,
  MagnifyingGlass,
  Monitor,
  Prohibit,
  SlidersHorizontal,
  Star,
  UsersThree,
  VideoCamera,
  PaperPlaneTilt,
  User,
  XCircle,
  FileText,
  Globe,
  Moon,
  Question,
  Headset,
  ArrowRight,
  CaretRight,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { PublicFooter } from "@/features/public/shared/public-footer";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import {
  applicationTips,
  applications,
  statusMeta,
  statusStyles,
  upcomingInterview,
  type Application,
  type ApplicationStatus,
} from "./applications-data";

type StatusFilter = "all" | ApplicationStatus;

const sortOptions = ["Mới nhất", "Cũ nhất", "Công ty A-Z"] as const;
const timeOptions = ["Tất cả", "7 ngày qua", "30 ngày qua"] as const;

const statusIconMap = {
  all: Briefcase,
  reviewing: HourglassMedium,
  interview: UsersThree,
  offer: Star,
  rejected: Prohibit,
} as const;

const tipIconMap = {
  bell: Bell,
  check: CheckCircle,
  clock: CalendarBlank,
} as const;

export function CandidateApplicationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState<(typeof timeOptions)[number]>("Tất cả");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Mới nhất");

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = Math.max(
      ...applications.map((application) => parseVietnameseDate(application.appliedAt).getTime()),
    );
    const maxAgeDays = timeRange === "7 ngày qua" ? 7 : timeRange === "30 ngày qua" ? 30 : null;

    return applications
      .filter((application) => status === "all" || application.status === status)
      .filter((application) => {
        if (!maxAgeDays) return true;
        const appliedTime = parseVietnameseDate(application.appliedAt).getTime();
        const ageInDays = Math.floor((now - appliedTime) / (1000 * 60 * 60 * 24));
        return ageInDays >= 0 && ageInDays <= maxAgeDays;
      })
      .filter((application) => {
        if (!normalizedQuery) return true;
        return [application.role, application.company, application.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .toSorted((a, b) => {
        if (sort === "Công ty A-Z") return a.company.localeCompare(b.company);
        const aTime = parseVietnameseDate(a.appliedAt).getTime();
        const bTime = parseVietnameseDate(b.appliedAt).getTime();
        return sort === "Mới nhất" ? bTime - aTime : aTime - bTime;
      });
  }, [query, sort, status, timeRange]);

  // Statistics derived dynamically
  const totalCount = applications.length;
  const reviewingCount = applications.filter((a) => a.status === "reviewing").length;
  const interviewCount = applications.filter((a) => a.status === "interview").length;
  const offerCount = applications.filter((a) => a.status === "offer").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumbs & Title */}
      <div>
        <nav
          className="mb-4 flex items-center gap-2 text-xs text-slate-500"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition hover:text-emerald-600">
            Trang chủ
          </Link>
          <CaretRight size={10} className="text-slate-400" />
          <span className="font-medium text-slate-900">Việc làm đã ứng tuyển</span>
        </nav>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Việc làm đã ứng tuyển
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi trạng thái các đơn ứng tuyển của bạn tại UpNext.
            </p>
          </div>
          <Button
            asChild
            className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Link href="/jobs" className="flex items-center gap-1.5">
              <SlidersHorizontal size={14} />
              Khám phá thêm việc làm
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {/* Total Applications */}
        <div className="flex h-[110px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-600">
              <FileText size={20} />
            </div>
            <div className="text-xs font-semibold text-slate-500">Tổng đơn ứng tuyển</div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
            <div className="text-[10px] text-slate-400">Tất cả thời gian</div>
          </div>
        </div>

        {/* Reviewing */}
        <div className="flex h-[110px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-lg text-blue-600">
              <PaperPlaneTilt size={20} />
            </div>
            <div className="text-xs font-semibold text-slate-500">Đang xử lý</div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-2xl font-bold text-slate-900">{reviewingCount}</div>
            <div className="text-[10px] text-slate-400">Đơn đang xem xét</div>
          </div>
        </div>

        {/* Interview */}
        <div className="flex h-[110px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-lg text-amber-500">
              <User size={20} />
            </div>
            <div className="text-xs font-semibold text-slate-500">Phỏng vấn</div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-2xl font-bold text-slate-900">{interviewCount}</div>
            <div className="text-[10px] font-medium text-slate-400">Vòng phỏng vấn</div>
          </div>
        </div>

        {/* Offer */}
        <div className="flex h-[110px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-lg text-purple-600">
              <CheckCircle size={20} />
            </div>
            <div className="text-xs font-semibold text-slate-500">Đã nhận offer</div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-2xl font-bold text-slate-900">{offerCount}</div>
            <div className="text-[10px] font-bold text-emerald-600">Chúc mừng bạn!</div>
          </div>
        </div>

        {/* Rejected */}
        <div className="flex h-[110px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600">
              <XCircle size={20} />
            </div>
            <div className="text-xs font-semibold text-slate-500">Không phù hợp</div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-2xl font-bold text-slate-900">{rejectedCount}</div>
            <div className="text-[10px] text-slate-400">Đơn dừng tuyển</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: List & Filters */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Status Tabs */}
          <StatusTabs value={status} onChange={setStatus} />

          {/* Search and Filters controls */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlass
                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                id="candidate-application-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                className="h-11 rounded-xl border-slate-200 bg-white pl-11 text-xs shadow-sm outline-none focus:border-emerald-500"
                placeholder="Tìm kiếm theo tên việc làm, công ty..."
              />
            </div>
            <div className="flex flex-wrap gap-3 sm:flex-nowrap">
              <FilterMenu
                label="Trạng thái"
                value={
                  status === "all"
                    ? "Tất cả"
                    : (statusMeta.find((item) => item.key === status)?.label ?? "Tất cả")
                }
                options={statusMeta.map((item) => ({ label: item.label, value: item.key }))}
                onSelect={(value) => setStatus(value as StatusFilter)}
              />
              <FilterMenu
                label="Thời gian"
                value={timeRange}
                options={timeOptions.map((item) => ({ label: item, value: item }))}
                onSelect={(value) => setTimeRange(value as (typeof timeOptions)[number])}
              />
            </div>
          </div>

          {/* Job Applications List */}
          <section className="flex flex-col gap-4" aria-label="Danh sách việc đã ứng tuyển">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  navigate={(path) => router.push(path)}
                />
              ))
            ) : (
              <EmptyApplicationsState />
            )}
          </section>

          {/* Simple Pagination */}
          {filteredApplications.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2" aria-label="Phân trang">
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <CaretRight size={14} className="rotate-180" />
              </button>
              <button
                type="button"
                className="h-9 w-9 rounded-lg bg-emerald-600 text-xs font-semibold text-white shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                2
              </button>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                3
              </button>
              <span className="px-1 text-slate-400 select-none">...</span>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <CaretRight size={14} />
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Question size={16} /> Bạn có thắc mắc về đơn ứng tuyển?{" "}
            <a href="#" className="font-semibold text-emerald-600 hover:underline">
              Liên hệ hỗ trợ
            </a>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* Default resume used */}
          <ActiveResumeCard navigate={(path) => router.push(path)} />

          {/* Upcoming Interview (if available) */}
          <UpcomingInterviewCard />

          {/* Tips card */}
          <TipsCard />

          {/* Support CTA card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-bold text-slate-900">Bạn cần hỗ trợ?</h3>
            <p className="mb-5 text-xs leading-relaxed text-slate-500">
              Đội ngũ UpNext luôn sẵn sàng hỗ trợ bạn trong quá trình tìm việc.
            </p>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Headset size={16} /> Liên hệ với chúng tôi
            </button>
          </div>
        </aside>
      </div>

      {/* Find more opportunities Promo Banner */}
      <div className="mt-6 flex flex-col items-center justify-between gap-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm sm:p-8 md:flex-row">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="relative h-20 w-24 flex-shrink-0">
            <div className="absolute inset-0 -rotate-6 transform rounded-xl bg-emerald-500/10"></div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
              <Briefcase size={36} />
            </div>
            <div className="absolute -right-2 -bottom-2 rounded-full bg-white p-1.5 shadow-md">
              <MagnifyingGlass className="text-blue-500" size={20} />
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">
              Tìm thêm cơ hội phù hợp với bạn
            </h2>
            <p className="text-sm text-slate-600">
              Hàng ngàn việc làm IT mới mỗi ngày đang chờ bạn khám phá.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/jobs")}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold whitespace-nowrap text-white shadow-md transition hover:bg-emerald-700"
        >
          Tìm việc ngay <ArrowRight size={14} />
        </button>
      </div>

      {/* Public Footer */}
      <div className="-mx-6 border-t border-slate-200/60 bg-white px-6 md:-mx-10 md:px-10 xl:-mx-16 xl:px-16">
        <PublicFooter navigate={(path) => router.push(path)} />
      </div>
    </div>
  );
}

function parseVietnameseDate(value: string) {
  const [day = "1", month = "1", year = "1970"] = value.split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function StatusTabs({
  onChange,
  value,
}: Readonly<{
  onChange: (value: StatusFilter) => void;
  value: StatusFilter;
}>) {
  return (
    <div
      className="hide-scroll flex items-center gap-6 overflow-x-auto border-b border-slate-200 text-sm font-medium"
      role="tablist"
      aria-label="Lọc trạng thái"
    >
      {statusMeta.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "pb-3 whitespace-nowrap transition cursor-pointer border-b-2 text-xs md:text-sm",
              active
                ? "border-emerald-600 text-emerald-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            )}
          >
            {item.label} ({item.count})
          </button>
        );
      })}
    </div>
  );
}

function FilterMenu({
  label,
  onSelect,
  options,
  value,
}: Readonly<{
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  onSelect: (value: string) => void;
}>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 min-w-[140px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:min-w-[160px]"
        >
          <span className="truncate">
            {label}: {value}
          </span>
          <CaretDown size={14} className="text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border border-slate-100 bg-white p-1 shadow-lg"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="cursor-pointer rounded-lg p-2 text-xs font-medium text-slate-600 transition hover:bg-emerald-50/20 hover:text-emerald-600"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CompanyLogo({ application }: Readonly<{ application: Application }>) {
  const toneBg = cn(
    application.companyTone === "blue" && "bg-blue-50 text-blue-600",
    application.companyTone === "orange" && "bg-orange-50 text-orange-600",
    application.companyTone === "green" && "bg-emerald-50 text-emerald-600",
    application.companyTone === "neutral" && "bg-slate-100 text-slate-800",
  );
  return (
    <div
      className={cn(
        "w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xl border border-slate-100",
        toneBg,
      )}
    >
      {application.companyMark.toUpperCase()}
    </div>
  );
}

function ApplicationCard({
  application,
  navigate,
}: Readonly<{
  application: Application;
  navigate: (path: string) => void;
}>) {
  const badgeClass = cn(
    "inline-flex text-xs font-semibold px-3 py-1 rounded-full w-fit transition-colors",
    application.status === "reviewing" && "bg-blue-50 text-blue-600",
    application.status === "interview" && "bg-orange-50 text-orange-600",
    application.status === "offer" && "bg-emerald-50 text-emerald-700",
    application.status === "rejected" && "bg-slate-100 text-slate-600",
  );

  return (
    <div
      onClick={() => navigate(`/candidate/applications/${application.id}`)}
      className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-emerald-500 hover:shadow-lg sm:flex-row sm:items-center"
    >
      <CompanyLogo application={application} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="truncate text-base font-bold text-slate-900 transition group-hover:text-emerald-600">
              {application.role}
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-600">{application.company}</span>
              <CheckCircle size={14} className="text-emerald-500" weight="fill" />
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="Thao tác"
          >
            <DotsThreeVertical size={20} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {application.location}
          </span>
          <span className="flex items-center gap-1">
            <Monitor size={14} /> {application.workMode}
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} /> {application.salary || "Thỏa thuận"}
          </span>
        </div>

        <div className="mt-3 text-xs font-medium text-slate-400">
          Ứng tuyển ngày:{" "}
          <span className="font-semibold text-slate-700">{application.appliedAt}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col justify-center border-t border-slate-100 pt-3 sm:mt-0 sm:w-[220px] sm:items-end sm:border-t-0 sm:pt-0 sm:text-right">
        <span className={badgeClass}>{application.statusTitle}</span>
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>{application.statusDescription}</span>
          <CaretRight
            size={14}
            className="text-slate-400 transition group-hover:text-emerald-600"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyApplicationsState() {
  return (
    <Card className="rounded-2xl border-dashed border-slate-300 bg-white shadow-none">
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <MagnifyingGlass size={26} />
        </span>
        <h2 className="mt-4 text-base font-bold text-slate-800">
          Không tìm thấy ứng tuyển phù hợp
        </h2>
        <p className="mt-2 max-w-md text-xs leading-6 font-medium text-slate-500">
          Thử đổi từ khóa, trạng thái hoặc khoảng thời gian để xem thêm hồ sơ ứng tuyển.
        </p>
      </CardContent>
    </Card>
  );
}

function ActiveResumeCard({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Hồ sơ đang dùng</h3>
        <button
          type="button"
          onClick={() => navigate("/candidate/profile")}
          className="flex cursor-pointer items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:underline"
        >
          Xem chi tiết <ArrowRight size={12} />
        </button>
      </div>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl text-emerald-600">
          <FilePdf size={20} weight="fill" className="text-red-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-800">CV_NguyenQuocVuong.pdf</h4>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
              Mặc định
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cập nhật lần cuối: 10/06/2025</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/candidate/cv-builder")}
        className="w-full cursor-pointer rounded-xl border border-emerald-600 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50/40"
      >
        Quản lý hồ sơ
      </button>
    </div>
  );
}

function UpcomingInterviewCard() {
  if (!upcomingInterview) return null;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <CalendarBlank className="text-emerald-600" size={18} />
            Lịch phỏng vấn sắp tới
          </h2>
          <button
            type="button"
            className="cursor-pointer text-xs font-semibold text-emerald-600 hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        <div className="mt-5 flex gap-4">
          <CompanyLogo application={upcomingInterview} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800">{upcomingInterview.role}</h3>
            <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
              {upcomingInterview.company}
              <CheckCircle size={12} className="text-emerald-500" weight="fill" />
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <CalendarBlank size={14} />
              {upcomingInterview.interviewAt}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <VideoCamera size={14} />
              Phỏng vấn kỹ thuật
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-5 h-10 w-full rounded-xl border-emerald-600 bg-white text-xs font-bold text-emerald-600 shadow-none hover:bg-emerald-50 hover:text-emerald-700"
        >
          Chuẩn bị phỏng vấn
        </Button>
      </CardContent>
    </Card>
  );
}

function TipsCard() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <FunnelSimple className="text-emerald-600" size={18} />
          Mẹo theo dõi ứng tuyển
        </h2>
        <div className="mt-5 space-y-5">
          {applicationTips.map((tip) => {
            const Icon = tipIconMap[tip.icon];

            return (
              <div key={tip.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{tip.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed font-medium text-slate-500">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="mt-5 cursor-pointer text-xs font-semibold text-emerald-600 hover:underline"
        >
          Xem thêm mẹo hữu ích →
        </button>
      </CardContent>
    </Card>
  );
}
