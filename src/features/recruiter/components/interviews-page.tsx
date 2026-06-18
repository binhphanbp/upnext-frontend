"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  createInterviewDefaults,
  dialogOptions,
  interviewKpis,
  interviews,
  interviewTabs,
  resultLabels,
  statusLabels,
  type InterviewResult,
  type InterviewStatus,
  type RecruiterInterview,
} from "@/features/recruiter/data/interviews-data";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calendar,
  CalendarCheck2,
  ChevronDown,
  DotsThreeVertical,
  Filter,
  MapPin,
  NotePencil,
  Plus,
  Search,
  VideoCamera,
  WarningCircle,
  X,
} from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

type DialogType = "create" | "feedback" | "noShow" | null;

const kpiAccentClasses = {
  amber: "bg-amber-50 text-amber-500",
  emerald: "bg-emerald-50 text-emerald-600",
  green: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-500",
  violet: "bg-violet-100 text-violet-600",
} as const;

const avatarClasses = {
  amber: "from-amber-100 to-orange-200 text-amber-800",
  blue: "from-blue-100 to-sky-200 text-blue-800",
  emerald: "from-emerald-100 to-teal-200 text-emerald-800",
  rose: "from-rose-100 to-pink-200 text-rose-800",
  violet: "from-violet-100 to-indigo-200 text-violet-800",
} as const;

const statusClasses: Record<InterviewStatus, string> = {
  CANCELLED: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-teal-50 text-teal-700",
  NEEDS_FEEDBACK: "bg-orange-50 text-orange-600",
  NO_SHOW: "bg-rose-50 text-rose-600",
  SCHEDULED: "bg-blue-50 text-blue-600",
  UPCOMING: "bg-emerald-50 text-emerald-700",
};

const statusDotClasses: Record<InterviewStatus, string> = {
  CANCELLED: "bg-slate-400",
  COMPLETED: "bg-emerald-500",
  IN_PROGRESS: "bg-teal-500",
  NEEDS_FEEDBACK: "bg-orange-500",
  NO_SHOW: "bg-rose-500",
  SCHEDULED: "bg-blue-500",
  UPCOMING: "bg-emerald-500",
};

const resultClasses: Record<InterviewResult, string> = {
  CONSIDER: "bg-amber-50 text-amber-700",
  FAIL: "bg-rose-50 text-rose-600",
  NONE: "bg-transparent text-slate-500",
  NO_SHOW: "bg-rose-50 text-rose-600",
  PASS: "bg-emerald-50 text-emerald-700",
};

const desktopRowColumns = "xl:grid-cols-[118px_minmax(260px,1.7fr)_minmax(240px,1.25fr)_376px]";

export function RecruiterInterviewsPage() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [dialog, setDialog] = useState<DialogType>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    function openCreateDialog() {
      setDialog("create");
    }

    window.addEventListener("upnext:open-create-interview", openCreateDialog);

    return () => window.removeEventListener("upnext:open-create-interview", openCreateDialog);
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function handleSubmit(message: string) {
    setDialog(null);
    showToast(message);
  }

  return (
    <div className="w-full overflow-x-clip pb-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-normal text-slate-950">
            Lịch phỏng vấn
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-500">
            Quản lý lịch hẹn, theo dõi phỏng vấn và đánh giá ứng viên sau từng vòng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:border-emerald-200 hover:text-emerald-700"
            type="button"
          >
            <Calendar aria-hidden className="h-4.5 w-4.5" />
            Đồng bộ Calendar
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
            onClick={() => setDialog("create")}
            type="button"
          >
            <Plus aria-hidden className="h-5 w-5" />
            Tạo lịch phỏng vấn
          </button>
        </div>
      </div>

      <InterviewKpiGrid />
      <InterviewStatusTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="mt-6 min-w-0 space-y-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.045)]">
          <InterviewFilters />
          <InterviewsTable
            onFeedback={() => setDialog("feedback")}
            onNoShow={() => setDialog("noShow")}
          />
        </div>
      </section>

      {toast ? (
        <div className="fixed right-5 bottom-5 z-50 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_20px_48px_rgba(15,23,42,0.16)]">
          {toast}
        </div>
      ) : null}

      {dialog === "create" ? (
        <CreateInterviewDialog
          onClose={() => setDialog(null)}
          onSubmit={() => handleSubmit("Đã tạo lịch phỏng vấn với trạng thái Đã lên lịch.")}
        />
      ) : null}
      {dialog === "feedback" ? (
        <InterviewFeedbackDialog
          onClose={() => setDialog(null)}
          onSubmit={() => handleSubmit("Đã lưu đánh giá phỏng vấn.")}
        />
      ) : null}
      {dialog === "noShow" ? (
        <NoShowDialog
          onClose={() => setDialog(null)}
          onSubmit={() => handleSubmit("Đã đánh dấu ứng viên không tham gia.")}
        />
      ) : null}
    </div>
  );
}

function InterviewKpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {interviewKpis.map((item) => {
        const Icon = item.icon;
        const up = item.trendDirection === "up";

        return (
          <article
            className="min-h-[128px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={item.label}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  kpiAccentClasses[item.accent],
                )}
              >
                <Icon aria-hidden className="h-5.5 w-5.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-600">{item.label}</p>
                <p className="mt-2 text-[28px] leading-none font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500">
              {up ? (
                <ArrowUp aria-hidden className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDown aria-hidden className="h-4 w-4 text-red-500" />
              )}
              <span className={up ? "text-emerald-600" : "text-red-500"}>{item.trendValue}</span>
              <span>{item.trendLabel}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}

function InterviewStatusTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-200 pb-1">
      {interviewTabs.map((tab) => {
        const active = activeTab === tab.label;

        return (
          <button
            className={cn(
              "flex h-11 items-center gap-2 border-b-2 text-sm font-extrabold transition",
              active
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-950",
            )}
            key={tab.label}
            onClick={() => onChange(tab.label)}
            type="button"
          >
            {tab.label}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-extrabold",
                active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InterviewFilters() {
  return (
    <section className="border-b border-slate-200 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_150px_170px]">
        <label className="relative block">
          <span className="sr-only">Tìm lịch phỏng vấn</span>
          <Search
            aria-hidden
            className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Tìm lịch phỏng vấn"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-11 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            placeholder="Tìm theo ứng viên, vị trí, email..."
            type="search"
          />
        </label>
        <FilterButton label="Trạng thái" />
        <FilterButton label="Người phỏng vấn" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterButton label="Vòng phỏng vấn" />
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold whitespace-nowrap text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          type="button"
        >
          <Calendar aria-hidden className="h-4.5 w-4.5" />
          Ngày phỏng vấn
        </button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold whitespace-nowrap text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          type="button"
        >
          <Filter aria-hidden className="h-4.5 w-4.5" />
          Bộ lọc
        </button>
      </div>
    </section>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button
      className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
      type="button"
    >
      <span className="truncate">{label}</span>
      <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-slate-500" />
    </button>
  );
}

function InterviewsTable({
  onFeedback,
  onNoShow,
}: {
  onFeedback: () => void;
  onNoShow: () => void;
}) {
  return (
    <div className="min-w-0">
      <div className="hidden border-b border-slate-200 bg-slate-50/80 px-5 py-3 xl:block">
        <div
          className={cn(
            "grid items-center gap-4 text-xs font-bold tracking-[0.01em] text-slate-500",
            desktopRowColumns,
          )}
        >
          <span>Thời gian</span>
          <span>Ứng viên & vị trí</span>
          <span>Phỏng vấn</span>
          <span className="text-right">Xử lý</span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {interviews.map((item) => (
          <InterviewRow item={item} key={item.id} onFeedback={onFeedback} onNoShow={onNoShow} />
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm font-bold text-slate-500 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
        <p>Hiển thị 1-5 trên 32 lịch phỏng vấn</p>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
            type="button"
          >
            10 / trang
            <ChevronDown aria-hidden className="h-4 w-4" />
          </button>
          <PaginationButton ariaLabel="Trang trước">
            <ArrowLeft aria-hidden className="h-4 w-4" />
          </PaginationButton>
          {[1, 2, 3, 4].map((page) => (
            <PaginationButton active={page === 1} key={page}>
              {page}
            </PaginationButton>
          ))}
          <PaginationButton ariaLabel="Trang sau">
            <ArrowRight aria-hidden className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}

function InterviewRow({
  item,
  onFeedback,
  onNoShow,
}: {
  item: RecruiterInterview;
  onFeedback: () => void;
  onNoShow: () => void;
}) {
  const actionHandler = item.status === "NEEDS_FEEDBACK" ? onFeedback : undefined;
  const moreHandler = item.status === "UPCOMING" ? onNoShow : undefined;

  return (
    <article className="px-4 py-3.5 transition hover:bg-slate-50/70 sm:px-5">
      <div className="space-y-4 xl:hidden">
        <div className="flex items-start justify-between gap-3">
          <TimeCell item={item} />
          <InterviewStatusBadge status={item.status} />
        </div>
        <CandidateColumn item={item} />
        <InterviewRoundColumn item={item} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <InterviewResultBadge result={item.result} />
          <div className="flex items-center gap-2">
            <ActionButton
              label={item.actionLabel}
              onClick={actionHandler}
              primary={item.status === "UPCOMING"}
            />
            <MoreButton candidateName={item.candidateName} onClick={moreHandler} />
          </div>
        </div>
      </div>

      <div className={cn("hidden items-center gap-4 xl:grid", desktopRowColumns)}>
        <TimeCell item={item} />
        <CandidateColumn item={item} />
        <InterviewRoundColumn item={item} />
        <RowActions
          actionLabel={item.actionLabel}
          candidateName={item.candidateName}
          onAction={actionHandler}
          onMore={moreHandler}
          primary={item.status === "UPCOMING"}
          result={item.result}
          status={item.status}
        />
      </div>
    </article>
  );
}

function TimeCell({ item }: { item: RecruiterInterview }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
        {item.dateLabel}
      </p>
      <p className="mt-1 text-[15px] font-bold text-slate-950">{item.timeRange}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <ModeIcon mode={item.mode} />
        {item.durationLabel}
      </p>
    </div>
  );
}

function CandidateColumn({ item }: { item: RecruiterInterview }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-extrabold",
          avatarClasses[item.candidateTone],
        )}
      >
        {item.candidateInitials}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{item.candidateName}</p>
        <p className="truncate text-xs text-slate-500">{item.candidateEmail}</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-800">
          {item.jobTitle}
          {item.jobStack ? ` ${item.jobStack}` : ""}
        </p>
      </div>
    </div>
  );
}

function InterviewRoundColumn({ item }: { item: RecruiterInterview }) {
  const [roundTitle, roundSubtitle] = item.roundLabel.split("\n");

  return (
    <div className="min-w-0 self-start">
      <p className="truncate text-sm font-semibold text-slate-950">
        {roundTitle} · {roundSubtitle}
      </p>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-extrabold",
            avatarClasses.amber,
          )}
        >
          {item.interviewerInitials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{item.interviewerName}</p>
          <p className="truncate text-xs text-slate-500">{item.interviewerTitle}</p>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  actionLabel,
  candidateName,
  onAction,
  onMore,
  primary,
  result,
  status,
}: {
  actionLabel: string;
  candidateName: string;
  onAction: (() => void) | undefined;
  onMore: (() => void) | undefined;
  primary: boolean;
  result: InterviewResult;
  status: InterviewStatus;
}) {
  return (
    <div className="ml-auto grid grid-cols-[152px_84px_104px_32px] items-center justify-items-start gap-2">
      <InterviewStatusBadge className="w-full justify-center" status={status} />
      <ResultSlot result={result} show={shouldShowResultBadge(status, result)} />
      <ActionButton className="w-full" label={actionLabel} onClick={onAction} primary={primary} />
      <MoreButton candidateName={candidateName} onClick={onMore} />
    </div>
  );
}

function ResultSlot({ result, show }: { result: InterviewResult; show: boolean }) {
  if (!show) {
    return <span aria-hidden className="block h-8 w-[84px]" />;
  }

  if (result === "NONE") {
    return (
      <span className="inline-flex h-8 w-[84px] items-center justify-center text-xs font-extrabold text-slate-500">
        —
      </span>
    );
  }

  return <InterviewResultBadge className="w-full justify-center" result={result} />;
}

function shouldShowResultBadge(status: InterviewStatus, result: InterviewResult) {
  if (result === "NONE") {
    return true;
  }

  if (
    (status === "COMPLETED" && result === "PASS") ||
    (status === "NO_SHOW" && result === "NO_SHOW")
  ) {
    return false;
  }

  return true;
}

function ActionButton({
  className,
  label,
  onClick,
  primary = false,
}: {
  className?: string;
  label: string;
  onClick: (() => void) | undefined;
  primary?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 min-w-[84px] items-center justify-center whitespace-nowrap rounded-xl border px-3 text-xs font-extrabold transition",
        primary
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function MoreButton({
  candidateName,
  onClick,
}: {
  candidateName: string;
  onClick: (() => void) | undefined;
}) {
  return (
    <button
      aria-label={`Mở thao tác lịch phỏng vấn cho ${candidateName}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      onClick={onClick}
      type="button"
    >
      <DotsThreeVertical aria-hidden className="h-5 w-5" />
    </button>
  );
}

function InterviewStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: InterviewStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-max items-center gap-2 rounded-lg px-3 text-xs font-extrabold",
        statusClasses[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClasses[status])} />
      {statusLabels[status]}
    </span>
  );
}

function InterviewResultBadge({
  className,
  result,
}: {
  className?: string;
  result: InterviewResult;
}) {
  if (result === "NONE") {
    return <span className="px-1 text-xs font-extrabold text-slate-500">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-max items-center rounded-lg px-3 text-xs font-extrabold",
        resultClasses[result],
        className,
      )}
    >
      {resultLabels[result]}
    </span>
  );
}

function PaginationButton({
  active = false,
  ariaLabel,
  children,
}: {
  active?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-extrabold",
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_10px_20px_rgba(5,150,105,0.2)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700",
      )}
      type="button"
    >
      {children}
    </button>
  );
}

function BaseDialog({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <dialog
      aria-labelledby="interview-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-auto max-h-none w-full max-w-none items-center justify-center border-0 bg-slate-950/35 p-4 backdrop-blur-sm"
      open
    >
      <div className="max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-950" id="interview-dialog-title">
            {title}
          </h2>
          <button
            aria-label="Đóng hộp thoại"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function CreateInterviewDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <BaseDialog onClose={onClose} title="Tạo lịch phỏng vấn">
      <form
        className="space-y-5 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogField label="Ứng viên *" value={createInterviewDefaults.candidate} />
          <DialogField label="Tin tuyển dụng *" value={createInterviewDefaults.job} />
          <DialogSelect label="Vòng phỏng vấn *" options={dialogOptions.rounds} />
          <DialogField label="Ngày phỏng vấn *" type="date" />
          <DialogField label="Giờ bắt đầu *" type="time" value="09:00" />
          <DialogSelect label="Thời lượng *" options={dialogOptions.durations} />
          <DialogSelect label="Hình thức *" options={dialogOptions.modes} />
          <DialogField label="Người phỏng vấn *" value={createInterviewDefaults.interviewer} />
          <DialogField label="Link meeting nếu Online" value="https://meet.upnext.works/minh-anh" />
          <DialogField label="Địa điểm nếu Offline" value="Phòng họp UpNext 02" />
        </div>
        <DialogTextarea label="Ghi chú nội bộ" value="Chuẩn bị câu hỏi về React performance." />
        <label className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-slate-700">
          <input
            aria-label="Gửi thông báo lịch cho ứng viên"
            className="mt-0.5 h-4 w-4 accent-emerald-600"
            defaultChecked={createInterviewDefaults.notifyCandidate}
            type="checkbox"
          />
          <span>Gửi thông báo lịch cho ứng viên</span>
        </label>
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Ứng viên sẽ nhận thông tin lịch phỏng vấn. Hệ thống không yêu cầu ứng viên xác nhận hoặc
          đổi lịch.
        </p>
        <DialogActions
          onClose={onClose}
          submitLabel="Gửi lịch phỏng vấn"
          submitIcon={<CalendarCheck2 aria-hidden className="h-4.5 w-4.5" />}
        />
      </form>
    </BaseDialog>
  );
}

function InterviewFeedbackDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <BaseDialog onClose={onClose} title="Đánh giá phỏng vấn">
      <form
        className="space-y-5 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogSelect label="Kết quả phỏng vấn *" options={dialogOptions.feedbackResults} />
          <DialogField label="Điểm kỹ thuật" type="number" value="8" />
          <DialogField label="Điểm giao tiếp" type="number" value="8" />
          <DialogField label="Điểm phù hợp" type="number" value="7" />
          <DialogSelect label="Bước tiếp theo *" options={dialogOptions.nextSteps} />
        </div>
        <DialogTextarea label="Ghi chú đánh giá *" value="Ứng viên có nền tảng React tốt." />
        <DialogActions
          onClose={onClose}
          submitLabel="Lưu đánh giá"
          submitIcon={<NotePencil aria-hidden className="h-4.5 w-4.5" />}
        />
      </form>
    </BaseDialog>
  );
}

function NoShowDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return (
    <BaseDialog onClose={onClose} title="Đánh dấu không tham gia">
      <form
        className="space-y-5 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogSelect label="Lý do *" options={dialogOptions.noShowReasons} />
        <DialogTextarea label="Ghi chú" value="Ứng viên không vào meeting sau 15 phút chờ." />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold text-slate-700">
            <input
              aria-label="Chuyển ứng viên sang Từ chối"
              className="h-4 w-4 accent-emerald-600"
              name="pipeline"
              type="radio"
            />
            Chuyển ứng viên sang Từ chối
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold text-slate-700">
            <input
              aria-label="Giữ trong pipeline"
              className="h-4 w-4 accent-emerald-600"
              defaultChecked
              name="pipeline"
              type="radio"
            />
            Giữ trong pipeline
          </label>
        </div>
        <DialogActions
          danger
          onClose={onClose}
          submitLabel="Xác nhận không tham gia"
          submitIcon={<WarningCircle aria-hidden className="h-4.5 w-4.5" />}
        />
      </form>
    </BaseDialog>
  );
}

function DialogField({
  label,
  type = "text",
  value,
}: {
  label: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <input
        aria-label={label}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        defaultValue={value}
        type={type}
      />
    </label>
  );
}

function DialogSelect({ label, options }: { label: string; options: readonly string[] }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <select
        aria-label={label}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function DialogTextarea({ label, value }: { label: string; value?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <textarea
        aria-label={label}
        className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        defaultValue={value}
      />
    </label>
  );
}

function DialogActions({
  danger = false,
  onClose,
  submitIcon,
  submitLabel,
}: {
  danger?: boolean;
  onClose: () => void;
  submitIcon: ReactNode;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
      <button
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
        onClick={onClose}
        type="button"
      >
        Hủy
      </button>
      <button
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]",
          danger ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
        )}
        type="submit"
      >
        {submitIcon}
        {submitLabel}
      </button>
    </div>
  );
}

function ModeIcon({ mode }: { mode: RecruiterInterview["mode"] }) {
  return mode === "ONLINE" ? (
    <VideoCamera aria-hidden className="h-4 w-4 text-emerald-600" />
  ) : (
    <MapPin aria-hidden className="h-4 w-4 text-amber-600" />
  );
}
