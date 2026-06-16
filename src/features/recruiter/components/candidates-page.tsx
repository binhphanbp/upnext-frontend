"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  candidateKpis,
  candidates,
  candidateTabs,
  performanceMetrics,
  quickFilters,
  reminderItems,
  rightPanelTasks,
  statusLabels,
  type CandidateApplication,
  type CandidateStatus,
} from "@/features/recruiter/data/candidates-data";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Download,
  Info,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

const kpiAccent = {
  amber: "bg-amber-50 text-amber-500",
  emerald: "bg-emerald-50 text-emerald-500",
  green: "bg-green-50 text-green-500",
  teal: "bg-teal-50 text-teal-500",
  violet: "bg-violet-50 text-violet-500",
} as const;

const statusClasses: Record<CandidateStatus, string> = {
  hired: "bg-emerald-50 text-emerald-700",
  interviewScheduled: "bg-violet-50 text-violet-700",
  interviewing: "bg-orange-50 text-orange-600",
  new: "bg-blue-50 text-blue-600",
  offer: "bg-amber-50 text-amber-600",
  rejected: "bg-rose-50 text-rose-600",
  reviewed: "bg-slate-100 text-slate-700",
  screening: "bg-emerald-50 text-emerald-700",
};

const avatarClasses = {
  amber: "from-amber-100 to-orange-200 text-amber-800",
  blue: "from-blue-100 to-sky-200 text-blue-800",
  emerald: "from-emerald-100 to-teal-200 text-emerald-800",
  pink: "from-rose-100 to-pink-200 text-rose-800",
} as const;

export function CandidatesPage() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(candidates.filter((candidate) => candidate.selected).map((item) => item.id)),
  );

  const selectedCount = selectedIds.size;

  function toggleCandidate(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[26px] leading-tight font-extrabold text-slate-950">
            Ứng viên
            <Info aria-hidden className="h-4.5 w-4.5 text-slate-400" />
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Quản lý hồ sơ ứng tuyển, theo dõi trạng thái và xử lý quy trình tuyển dụng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <Download aria-hidden className="h-4.5 w-4.5" />
            Xuất danh sách
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)]">
            <CalendarDays aria-hidden className="h-4.5 w-4.5" />
            Tạo lịch phỏng vấn
          </button>
        </div>
      </div>

      <CandidateKpiGrid />
      <CandidateTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <CandidateFilters />
          <CandidateTable
            onClear={() => setSelectedIds(new Set())}
            onToggle={toggleCandidate}
            selectedCount={selectedCount}
            selectedIds={selectedIds}
          />
        </section>
        <CandidateRightPanel />
      </div>
    </div>
  );
}

function CandidateKpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {candidateKpis.map((item) => {
        const Icon = item.icon;
        const up = item.trendDirection === "up";

        return (
          <article
            className="min-h-[116px] rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={item.label}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  kpiAccent[item.accent],
                )}
              >
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl leading-none font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
              {up ? (
                <ArrowUp aria-hidden className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDown aria-hidden className="h-4 w-4 text-red-500" />
              )}
              <span className={up ? "text-emerald-600" : "text-red-500"}>
                {item.trend.split(" ")[0]}
              </span>
              <span>{item.trend.split(" ").slice(1).join(" ")}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}

function CandidateTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="mt-5 flex gap-6 overflow-x-auto border-b border-slate-200">
      {candidateTabs.map((tab) => {
        const active = activeTab === tab.label;

        return (
          <button
            className={cn(
              "flex h-10 min-w-max items-center gap-2 border-b-2 text-sm font-extrabold",
              active ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-700",
            )}
            key={tab.label}
            onClick={() => onChange(tab.label)}
          >
            {tab.label}
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-extrabold text-slate-700">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CandidateFilters() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap gap-3">
        <label className="relative block min-w-[260px] flex-[1.4_1_320px]">
          <span className="sr-only">Tìm kiếm ứng viên</span>
          <input
            aria-label="Tìm kiếm ứng viên"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-10 pl-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            placeholder="Tìm kiếm ứng viên, email, SĐT..."
            type="search"
          />
          <Search
            aria-hidden
            className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-slate-500"
          />
        </label>
        <FilterSelect label="Tin tuyển dụng" />
        <FilterSelect label="Vị trí ứng tuyển" />
        <FilterSelect label="Trạng thái" />
        <button className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-extrabold whitespace-nowrap text-emerald-700">
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Bộ lọc nâng cao
          <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] text-white">2</span>
        </button>
        <button className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold whitespace-nowrap text-slate-700">
          <RefreshCw aria-hidden className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold">
        <span className="text-slate-700">Bộ lọc nhanh:</span>
        {quickFilters.map((filter) => (
          <button
            className="inline-flex h-9 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 whitespace-nowrap text-slate-700"
            key={filter.label}
          >
            {filter.label}
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              {filter.count}
            </span>
          </button>
        ))}
        <button className="ml-auto text-sm font-semibold text-slate-400">Xóa bộ lọc</button>
      </div>
    </section>
  );
}

function FilterSelect({ label }: { label: string }) {
  return (
    <button className="flex h-11 min-w-[160px] flex-1 items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-left text-xs font-bold text-slate-600 xl:max-w-[188px]">
      <span>
        <span className="block text-[11px] text-slate-500">{label}</span>
        Tất cả
      </span>
      <ChevronDown aria-hidden className="h-4 w-4 text-slate-500" />
    </button>
  );
}

function CandidateTable({
  onClear,
  onToggle,
  selectedCount,
  selectedIds,
}: {
  onClear: () => void;
  onToggle: (id: string) => void;
  selectedCount: number;
  selectedIds: Set<string>;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm font-bold">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-white">
          −
        </span>
        <span className="text-slate-800">
          {selectedCount > 0
            ? `Đã chọn ${selectedCount} ứng viên`
            : "Chọn ứng viên để xử lý hàng loạt"}
        </span>
        <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-emerald-700">
          Chuyển trạng thái
          <ChevronDown aria-hidden className="h-4 w-4" />
        </button>
        <BatchButton>Gửi email</BatchButton>
        <BatchButton>Lưu hồ sơ</BatchButton>
        <BatchButton>Từ chối</BatchButton>
        <button
          aria-label="Thêm thao tác hàng loạt"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
        >
          <MoreHorizontal aria-hidden className="h-4 w-4" />
        </button>
        <button className="ml-auto text-sm font-semibold text-slate-500" onClick={onClear}>
          Bỏ chọn
        </button>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-white text-slate-700">
              <th className="w-10 px-4 py-3">
                <span className="inline-flex h-4 w-4 rounded bg-emerald-600 text-white" />
              </th>
              <th className="px-3 py-3">Ứng viên</th>
              <th className="px-3 py-3">Vị trí ứng tuyển</th>
              <th className="px-3 py-3">Kỹ năng chính</th>
              <th className="px-3 py-3">Kinh nghiệm</th>
              <th className="px-3 py-3">Ngày ứng tuyển</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3">Lịch phỏng vấn</th>
              <th className="px-3 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((candidate) => (
              <CandidateRow
                candidate={candidate}
                checked={selectedIds.has(candidate.id)}
                key={candidate.id}
                onToggle={() => onToggle(candidate.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 px-4 py-3 text-sm font-semibold text-slate-500 xl:grid xl:grid-cols-[1fr_auto_auto] xl:items-center">
        <span>Hiển thị 1 - 10 trong 1,248 ứng viên</span>
        <div className="flex items-center gap-2 xl:justify-center">
          <PageButton ariaLabel="Trang trước">
            <ArrowLeft aria-hidden className="h-4 w-4" />
          </PageButton>
          {["1", "2", "3", "4", "5"].map((page, index) => (
            <button
              className={cn(
                "h-8 w-8 rounded-md border text-sm font-bold",
                index === 0
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700",
              )}
              key={page}
            >
              {page}
            </button>
          ))}
          <span className="px-1">...</span>
          <button
            aria-label="Đi đến trang 125"
            className="h-8 w-10 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700"
          >
            125
          </button>
          <PageButton ariaLabel="Trang sau">
            <ArrowRight aria-hidden className="h-4 w-4" />
          </PageButton>
        </div>
        <div className="flex items-center gap-2 xl:justify-end">
          <span>Hiển thị</span>
          <button className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-slate-700">
            10 <ChevronDown aria-hidden className="h-4 w-4" />
          </button>
          <span>ứng viên/trang</span>
        </div>
      </div>
    </section>
  );
}

function CandidateRow({
  candidate,
  checked,
  onToggle,
}: {
  candidate: CandidateApplication;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <tr className="align-middle text-slate-800">
      <td className="px-4 py-2">
        <button
          aria-label={`Chọn ${candidate.name}`}
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded border",
            checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white",
          )}
          onClick={onToggle}
        >
          {checked ? "✓" : null}
        </button>
      </td>
      <td className="min-w-[196px] px-3 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-extrabold",
              avatarClasses[candidate.avatarTone],
            )}
          >
            {candidate.name.split(" ").at(-1)?.charAt(0)}
          </span>
          <div>
            <p className="font-extrabold text-slate-950">{candidate.name}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{candidate.email}</p>
          </div>
        </div>
      </td>
      <td className="min-w-[156px] px-3 py-3">
        <p className="font-bold">{candidate.jobTitle}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{candidate.jobCode}</p>
      </td>
      <td className="min-w-[170px] px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {candidate.skills.map((skill) => (
            <span
              className="rounded bg-slate-100 px-1.5 py-1 text-[11px] font-bold text-slate-600"
              key={skill}
            >
              {skill}
            </span>
          ))}
          {candidate.extraSkillCount ? (
            <span className="rounded bg-slate-100 px-1.5 py-1 text-[11px] font-bold text-slate-600">
              +{candidate.extraSkillCount}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3 font-bold whitespace-nowrap">{candidate.experience}</td>
      <td className="px-3 py-3 font-bold whitespace-nowrap">
        {candidate.appliedDate}
        <br />
        <span className="text-[11px] font-semibold">{candidate.appliedTime}</span>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "inline-flex h-7 items-center whitespace-nowrap rounded-md px-3 text-[11px] font-extrabold",
            statusClasses[candidate.status],
          )}
        >
          {statusLabels[candidate.status]}
        </span>
      </td>
      <td className="min-w-[146px] px-3 py-3">
        {candidate.interview ? (
          <div>
            <p className="font-extrabold">{candidate.interview.title}</p>
            <p className="mt-0.5 font-semibold">{candidate.interview.date}</p>
            <p className="font-semibold">
              {candidate.interview.time}
              {candidate.interview.status ? (
                <span
                  className={cn(
                    "ml-2 text-[10px] font-extrabold",
                    candidate.interview.status === "confirmed"
                      ? "text-emerald-600"
                      : "text-orange-600",
                  )}
                >
                  ● {candidate.interview.status === "confirmed" ? "Đã xác nhận" : "Chờ xác nhận"}
                </span>
              ) : null}
            </p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-2">
          <button className="h-8 rounded-md border border-emerald-200 px-3 text-xs font-extrabold whitespace-nowrap text-emerald-700">
            {candidate.actionLabel}
          </button>
          <button
            aria-label={`Thao tác thêm cho ${candidate.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
          >
            <MoreHorizontal aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CandidateRightPanel() {
  return (
    <aside className="space-y-4 xl:sticky xl:top-[88px] xl:w-[320px] xl:shrink-0 xl:self-start">
      <SideCard>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-950">Việc cần xử lý</h2>
          <button className="text-xs font-extrabold text-emerald-600" type="button">
            Xem tất cả →
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {rightPanelTasks.map((task) => {
            const Icon = task.icon;
            return (
              <div className="grid grid-cols-[24px_28px_1fr] items-center gap-3" key={task.label}>
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full",
                    task.tone === "amber" && "bg-amber-50 text-amber-500",
                    task.tone === "blue" && "bg-blue-50 text-blue-500",
                    task.tone === "violet" && "bg-violet-50 text-violet-500",
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <span className="text-lg font-extrabold text-slate-950">{task.count}</span>
                <span className="text-xs font-bold text-slate-600">{task.label}</span>
              </div>
            );
          })}
        </div>
      </SideCard>

      <SideCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-950">Hiệu suất xử lý</h2>
          <button className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600">
            7 ngày qua
            <ChevronDown aria-hidden className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {performanceMetrics.map((metric, index) => (
            <div className="grid grid-cols-[1fr_86px] items-end gap-3 py-3" key={metric.label}>
              <div>
                <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-2 text-xl font-extrabold text-slate-950">{metric.value}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs font-bold",
                    metric.trendDirection === "up" ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  {metric.trendDirection === "up" ? "↑" : "↓"} {metric.trend}
                </p>
              </div>
              <MiniSparkline color={metric.color} variant={index} />
            </div>
          ))}
        </div>
        <button
          className="mt-4 inline-flex items-center gap-2 text-left text-sm font-extrabold text-emerald-600"
          type="button"
        >
          Xem báo cáo chi tiết
          <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      </SideCard>

      <SideCard>
        <h2 className="text-base font-extrabold text-slate-950">Nhắc nhở</h2>
        <div className="mt-4 grid grid-cols-[1fr_70px] gap-3">
          <div className="space-y-3">
            {reminderItems.map((item) => (
              <p
                className="flex items-start gap-2 text-xs leading-5 font-bold text-slate-600"
                key={item}
              >
                <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500 text-[10px] text-emerald-600">
                  ✓
                </span>
                {item}
              </p>
            ))}
          </div>
          <div className="flex items-end justify-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-emerald-100 bg-emerald-50 text-emerald-600">
              <ShieldCheck aria-hidden className="h-9 w-9" />
            </span>
          </div>
        </div>
      </SideCard>
    </aside>
  );
}

function BatchButton({ children }: { children: ReactNode }) {
  return (
    <button className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
      {children}
    </button>
  );
}

function PageButton({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
    >
      {children}
    </button>
  );
}

function SideCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      {children}
    </section>
  );
}

function MiniSparkline({ color, variant }: { color: string; variant: number }) {
  const paths = [
    "M2 28 C12 20 18 31 28 18 C38 7 43 24 52 13 C61 2 66 15 74 9 C82 4 88 8 94 1",
    "M2 30 C9 22 16 31 24 18 C32 7 38 20 46 10 C54 1 58 18 66 7 C74 0 82 16 94 7",
    "M2 33 C12 25 21 29 30 21 C39 13 48 19 58 11 C68 3 74 17 84 9 C90 5 92 1 94 0",
  ];

  return (
    <svg aria-hidden className="h-12 w-24" viewBox="0 0 96 38">
      <path
        d="M2 36H94V8C84 9 78 1 70 8C62 15 56 8 48 18C40 27 32 8 24 18C16 31 10 23 2 32V36Z"
        fill={`${color}16`}
      />
      <path
        d={paths[variant] ?? paths[0]}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
