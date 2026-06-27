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
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Việc đã ứng tuyển
          </h1>
          <p className="mt-2 text-base font-medium text-slate-600">
            Theo dõi trạng thái ứng tuyển và các bước tiếp theo.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-brand text-brand h-11 w-fit rounded-lg bg-white px-5 font-extrabold shadow-none hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Link href="/jobs">
            <SlidersHorizontal size={18} />
            Khám phá thêm việc làm
          </Link>
        </Button>
      </header>

      <StatusTabs value={status} onChange={setStatus} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(260px,1fr)_190px_190px_190px]">
              <div className="relative block">
                <label className="sr-only" htmlFor="candidate-application-search">
                  Tìm theo vị trí hoặc công ty
                </label>
                <MagnifyingGlass
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <Input
                  id="candidate-application-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white pl-12 text-sm shadow-none"
                  placeholder="Tìm theo vị trí hoặc công ty"
                />
              </div>
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
              <FilterMenu
                label="Sắp xếp"
                value={sort}
                options={sortOptions.map((item) => ({ label: item, value: item }))}
                onSelect={(value) => setSort(value as (typeof sortOptions)[number])}
              />
            </CardContent>
          </Card>

          <section className="space-y-3" aria-label="Danh sách việc đã ứng tuyển">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            ) : (
              <EmptyApplicationsState />
            )}
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <UpcomingInterviewCard />
          <TipsCard />
        </aside>
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
    <div className="flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Lọc trạng thái">
      {statusMeta.map((item) => {
        const Icon = statusIconMap[item.key];
        const active = value === item.key;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "upnext-focus inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-extrabold transition-colors",
              active
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950",
            )}
          >
            <Icon size={20} />
            {item.label}
            <span
              className={cn(
                "grid min-w-7 place-items-center rounded-full px-2 py-0.5 text-xs",
                active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700",
              )}
            >
              {item.count}
            </span>
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
          className="upnext-focus flex h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-none hover:bg-slate-50"
        >
          <span className="truncate">
            {label}: {value}
          </span>
          <CaretDown size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onSelect(option.value)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ApplicationCard({ application }: Readonly<{ application: Application }>) {
  const style = statusStyles[application.status];
  const StatusIcon = statusIconMap[application.status];

  return (
    <article className="grid gap-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:grid-cols-[92px_minmax(0,1fr)_minmax(220px,0.8fr)_minmax(180px,0.55fr)_auto] md:items-center">
      <CompanyLogo application={application} />

      <div className="min-w-0">
        <h2 className="text-lg font-extrabold text-slate-950">{application.role}</h2>
        <div className="mt-2 flex items-center gap-2 text-base font-bold text-slate-700">
          <span>{application.company}</span>
          <SealDot />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={17} />
            {application.location}
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Monitor size={17} />
            {application.workMode}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">Ứng tuyển: {application.appliedAt}</p>
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-extrabold ring-1",
            style.badge,
          )}
        >
          <StatusIcon size={17} weight="bold" />
          {application.statusTitle}
        </span>
        <p className="mt-2 flex gap-2 text-sm leading-6 font-medium text-slate-600">
          <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", style.dot)} />
          {application.statusDescription}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">CV đã dùng</p>
        <span className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
          <FilePdf className="shrink-0 text-red-500" size={18} weight="fill" />
          <span className="truncate">{application.resume}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        <Button
          asChild
          variant="outline"
          className="border-brand text-brand h-11 rounded-lg bg-white px-6 font-extrabold shadow-none hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Link href={`/candidate/applications/${application.id}`}>Xem chi tiết</Link>
        </Button>
        <button
          type="button"
          aria-label={`Thao tác với hồ sơ ${application.role}`}
          className="upnext-focus grid size-11 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <DotsThreeVertical size={22} />
        </button>
      </div>
    </article>
  );
}

function EmptyApplicationsState() {
  return (
    <Card className="rounded-2xl border-dashed border-slate-300 bg-white shadow-none">
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <MagnifyingGlass size={26} />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-slate-950">
          Không tìm thấy ứng tuyển phù hợp
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 font-medium text-slate-600">
          Thử đổi từ khóa, trạng thái hoặc khoảng thời gian để xem thêm hồ sơ ứng tuyển.
        </p>
      </CardContent>
    </Card>
  );
}

function CompanyLogo({ application }: Readonly<{ application: Application }>) {
  return (
    <div
      className={cn(
        "grid size-20 place-items-center rounded-xl border border-slate-200 bg-white text-lg font-black shadow-sm",
        application.companyTone === "blue" && "text-blue-700",
        application.companyTone === "orange" && "text-orange-600",
        application.companyTone === "green" && "text-emerald-700",
        application.companyTone === "neutral" && "text-slate-950",
      )}
    >
      {application.companyMark}
    </div>
  );
}

function SealDot() {
  return (
    <span className="bg-brand grid size-4 place-items-center rounded-full text-white">
      <Check size={10} weight="bold" />
    </span>
  );
}

function UpcomingInterviewCard() {
  if (!upcomingInterview) return null;

  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
            <CalendarBlank className="text-brand" size={22} />
            Lịch phỏng vấn sắp tới
          </h2>
          <button
            type="button"
            className="upnext-focus text-brand rounded-md text-sm font-extrabold"
          >
            Xem tất cả
          </button>
        </div>

        <div className="mt-5 flex gap-4">
          <CompanyLogo application={upcomingInterview} />
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-slate-950">{upcomingInterview.role}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-600">
              {upcomingInterview.company}
              <SealDot />
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CalendarBlank size={17} />
              {upcomingInterview.interviewAt}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <VideoCamera size={17} />
              Phỏng vấn kỹ thuật
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="border-brand text-brand mt-5 h-11 w-full rounded-lg bg-white font-extrabold shadow-none hover:bg-emerald-50 hover:text-emerald-700"
        >
          Chuẩn bị phỏng vấn
        </Button>
      </CardContent>
    </Card>
  );
}

function TipsCard() {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="p-5">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
          <FunnelSimple className="text-brand" size={22} />
          Mẹo theo dõi ứng tuyển
        </h2>
        <div className="mt-5 space-y-5">
          {applicationTips.map((tip) => {
            const Icon = tipIconMap[tip.icon];

            return (
              <div key={tip.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={21} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">{tip.title}</h3>
                  <p className="mt-1 text-sm leading-6 font-medium text-slate-600">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="upnext-focus text-brand mt-5 rounded-md text-sm font-extrabold"
        >
          Xem thêm mẹo hữu ích →
        </button>
      </CardContent>
    </Card>
  );
}
