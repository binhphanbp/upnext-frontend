"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import {
  ChevronLeft,
  ChevronRight,
  DotsThree,
  Eye,
  PencilSimple,
  Monitor,
  Users,
  RocketLaunch,
  PauseCircle,
  PlayCircle,
  LockSimple,
  Copy,
  PaperPlaneTilt,
  ArrowCounterClockwise,
  ClockCounterClockwise,
  WarningCircle,
  Headset,
  Trash,
  X,
  CheckCircle2,
  Info,
} from "@/features/recruiter/icons";
import {
  type RecruiterJobPost,
  type RecruiterJobPostEffectiveness,
  type RecruiterJobPostStatus,
} from "@/features/recruiter/types";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

export type JobPostActionKey =
  | "viewDetails"
  | "edit"
  | "preview"
  | "viewCandidates"
  | "boost"
  | "pause"
  | "resume"
  | "close"
  | "duplicate"
  | "submitReview"
  | "withdrawReview"
  | "renew"
  | "repost"
  | "viewBlockedReason"
  | "contactSupport"
  | "deleteDraft";

export interface JobPostAction {
  key: JobPostActionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
  requiresConfirm?: boolean;
  disabled?: boolean;
}

export function getJobPostActions(job: RecruiterJobPost): JobPostAction[] {
  switch (job.status) {
    case "draft":
      return [
        { key: "edit", label: "Chỉnh sửa", icon: PencilSimple },
        { key: "viewDetails", label: "Xem chi tiết", icon: Eye },
        { key: "submitReview", label: "Gửi duyệt", icon: PaperPlaneTilt },
        { key: "duplicate", label: "Nhân bản", icon: Copy },
        {
          key: "deleteDraft",
          label: "Xóa nháp",
          icon: Trash,
          tone: "danger",
          requiresConfirm: true,
        },
      ];
    case "active":
      return [
        { key: "viewDetails", label: "Xem chi tiết", icon: Eye },
        { key: "edit", label: "Chỉnh sửa", icon: PencilSimple },
        { key: "viewCandidates", label: "Xem ứng viên", icon: Users },
        { key: "boost", label: "Đẩy tin", icon: RocketLaunch, tone: "success" },
        {
          key: "pause",
          label: "Tạm dừng nhận hồ sơ",
          icon: PauseCircle,
          tone: "warning",
          requiresConfirm: true,
        },
        { key: "duplicate", label: "Nhân bản", icon: Copy },
        {
          key: "close",
          label: "Đóng tin",
          icon: LockSimple,
          tone: "danger",
          requiresConfirm: true,
        },
      ];
    case "pending":
      return [
        { key: "viewDetails", label: "Xem chi tiết", icon: Eye },
        { key: "edit", label: "Chỉnh sửa", icon: PencilSimple },
        {
          key: "withdrawReview",
          label: "Rút khỏi duyệt",
          icon: ArrowCounterClockwise,
          tone: "warning",
          requiresConfirm: true,
        },
        { key: "duplicate", label: "Nhân bản", icon: Copy },
      ];
    case "expiring":
      return [
        { key: "viewDetails", label: "Xem chi tiết", icon: Eye },
        { key: "renew", label: "Gia hạn tin", icon: ClockCounterClockwise },
        { key: "boost", label: "Đẩy tin", icon: RocketLaunch, tone: "success" },
        { key: "viewCandidates", label: "Xem ứng viên", icon: Users },
        { key: "edit", label: "Chỉnh sửa", icon: PencilSimple },
        {
          key: "close",
          label: "Đóng tin",
          icon: LockSimple,
          tone: "danger",
          requiresConfirm: true,
        },
      ];
    case "expired":
      return [
        { key: "viewDetails", label: "Xem chi tiết", icon: Eye },
        { key: "renew", label: "Gia hạn / Đăng lại", icon: ClockCounterClockwise },
        { key: "duplicate", label: "Nhân bản", icon: Copy },
        { key: "viewCandidates", label: "Xem ứng viên cũ", icon: Users },
      ];
    case "locked":
      return [
        {
          key: "viewBlockedReason",
          label: "Xem lý do bị khóa",
          icon: WarningCircle,
          tone: "warning",
        },
        { key: "edit", label: "Chỉnh sửa nội dung", icon: PencilSimple },
        { key: "submitReview", label: "Gửi duyệt lại", icon: PaperPlaneTilt },
        { key: "contactSupport", label: "Liên hệ hỗ trợ", icon: Headset },
        { key: "duplicate", label: "Nhân bản", icon: Copy },
      ];
    default:
      return [];
  }
}

const statusLabels: Record<RecruiterJobPostStatus, string> = {
  active: "Đang tuyển",
  draft: "Nháp",
  expired: "Hết hạn",
  expiring: "Sắp hết hạn",
  locked: "Bị khóa",
  pending: "Chờ duyệt",
};

const statusClasses: Record<RecruiterJobPostStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-700",
  expired: "bg-slate-100 text-slate-600",
  expiring: "bg-orange-50 text-orange-600",
  locked: "bg-rose-50 text-rose-600",
  pending: "bg-blue-50 text-blue-600",
};

const effectivenessLabels: Record<RecruiterJobPostEffectiveness, string> = {
  good: "Tốt",
  needsOptimization: "Cần tối ưu",
  new: "Mới",
  ok: "Ổn",
};

const effectivenessClasses: Record<RecruiterJobPostEffectiveness, string> = {
  good: "bg-emerald-50 text-emerald-700",
  needsOptimization: "bg-rose-50 text-rose-600",
  new: "bg-blue-50 text-blue-600",
  ok: "bg-orange-50 text-orange-600",
};

export function JobPostsTable({
  isLoading,
  items,
  totalItems,
}: {
  isLoading: boolean;
  items: RecruiterJobPost[];
  totalItems: number;
}) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState<RecruiterJobPost[]>(items);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    isAbove: boolean;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: JobPostActionKey;
    job: RecruiterJobPost;
  } | null>(null);
  const [blockedReasonJob, setBlockedReasonJob] = useState<RecruiterJobPost | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "danger" | "info";
  } | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (openJobId === null) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-actions-dropdown]")) {
        setOpenJobId(null);
        setDropdownPos(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenJobId(null);
        setDropdownPos(null);
      }
    }

    function handleScroll(event: Event) {
      const target = event.target as HTMLElement;
      if (target.closest && target.closest("[data-actions-dropdown]")) return;
      setOpenJobId(null);
      setDropdownPos(null);
    }

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [openJobId]);

  function showToast(message: string, type: "success" | "warning" | "danger" | "info" = "success") {
    setToast({ message, type });
  }

  function executeAction(actionKey: JobPostActionKey, job: RecruiterJobPost) {
    switch (actionKey) {
      case "viewDetails":
        router.push(`/recruiter/job-posts/${job.id}`);
        break;
      case "edit":
        router.push(`/recruiter/job-posts/${job.id}/edit`);
        break;
      case "preview":
        showToast(`Đang mở xem trước tin tuyển dụng: ${job.title}`, "info");
        console.log(`Preview job: ${job.id}`);
        break;
      case "viewCandidates":
        router.push(`/recruiter/candidates?jobId=${job.id}`);
        break;
      case "boost":
        showToast(`Đẩy tin "${job.title}" thành công!`, "success");
        break;
      case "submitReview":
        setLocalItems((prev) =>
          prev.map((item) => (item.id === job.id ? { ...item, status: "pending" as const } : item)),
        );
        showToast(`Đã gửi duyệt tin "${job.title}" thành công!`, "success");
        break;
      case "duplicate": {
        const duplicatedJob: RecruiterJobPost = {
          ...job,
          id: `dup-${Date.now()}`,
          title: `${job.title} (Bản sao)`,
          status: "draft",
          views: 0,
          applications: 0,
          conversionRate: null,
          newCandidates: 0,
          daysLeft: null,
          effectiveness: "new",
          updatedAt: new Date().toISOString(),
        };
        setLocalItems((prev) => [duplicatedJob, ...prev]);
        showToast(`Đã tạo bản sao nháp thành công từ tin "${job.title}".`, "success");
        break;
      }
      case "renew":
        setLocalItems((prev) =>
          prev.map((item) =>
            item.id === job.id ? { ...item, status: "active" as const, daysLeft: 30 } : item,
          ),
        );
        showToast(`Đã gia hạn tin "${job.title}" thành công thêm 30 ngày!`, "success");
        break;
      case "viewBlockedReason":
        setBlockedReasonJob(job);
        break;
      case "contactSupport":
        showToast("Đang liên hệ với bộ phận hỗ trợ khách hàng của UpNext...", "info");
        break;
      default:
        break;
    }
  }

  function handleActionClick(action: JobPostAction, job: RecruiterJobPost) {
    setOpenJobId(null);
    setDropdownPos(null);
    if (action.requiresConfirm) {
      setConfirmAction({ type: action.key, job });
    } else {
      executeAction(action.key, job);
    }
  }

  function handleConfirmExecute() {
    if (!confirmAction) return;
    const { type, job } = confirmAction;
    setConfirmAction(null);

    switch (type) {
      case "deleteDraft":
        setLocalItems((prev) => prev.filter((item) => item.id !== job.id));
        showToast(`Đã xóa tin nháp "${job.title}" thành công.`, "success");
        break;
      case "close":
        setLocalItems((prev) =>
          prev.map((item) =>
            item.id === job.id ? { ...item, status: "expired" as const, daysLeft: -1 } : item,
          ),
        );
        showToast(`Đã đóng nhận hồ sơ tin tuyển dụng "${job.title}".`, "success");
        break;
      case "withdrawReview":
        setLocalItems((prev) =>
          prev.map((item) => (item.id === job.id ? { ...item, status: "draft" as const } : item)),
        );
        showToast(`Đã rút tin tuyển dụng "${job.title}" khỏi danh sách duyệt.`, "success");
        break;
      case "pause":
        setLocalItems((prev) =>
          prev.map((item) =>
            item.id === job.id ? { ...item, status: "expired" as const, daysLeft: -1 } : item,
          ),
        );
        showToast(`Đã tạm dừng nhận hồ sơ cho tin tuyển dụng "${job.title}".`, "warning");
        break;
      default:
        break;
    }
  }

  const confirmDialogContent: Record<
    string,
    { title: string; description: string; confirmText: string; tone: "danger" | "warning" }
  > = {
    deleteDraft: {
      title: "Xóa tin nháp?",
      description: "Tin nháp này sẽ bị xóa khỏi danh sách và không thể khôi phục.",
      confirmText: "Xóa nháp",
      tone: "danger",
    },
    close: {
      title: "Đóng tin tuyển dụng?",
      description: "Tin sẽ ngừng nhận hồ sơ mới. Bạn vẫn có thể xem lại ứng viên đã ứng tuyển.",
      confirmText: "Đóng tin",
      tone: "danger",
    },
    withdrawReview: {
      title: "Rút tin khỏi duyệt?",
      description: "Tin sẽ quay về trạng thái nháp để bạn chỉnh sửa trước khi gửi lại.",
      confirmText: "Rút khỏi duyệt",
      tone: "warning",
    },
    pause: {
      title: "Tạm dừng nhận hồ sơ?",
      description: "Tin sẽ tạm ngừng nhận ứng viên mới cho đến khi bạn mở lại.",
      confirmText: "Tạm dừng",
      tone: "warning",
    },
  };

  const itemClass = (action: JobPostAction) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:bg-slate-50",
      action.tone === "danger"
        ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        : action.tone === "warning"
          ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
          : action.tone === "success"
            ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
      action.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-inherit",
    );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <h2 className="text-lg font-extrabold text-slate-950">Danh sách tin tuyển dụng</h2>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500">
              <th className="px-3 py-4">Tin tuyển dụng</th>
              <th className="px-2 py-4 text-center">Trạng thái</th>
              <th className="px-2 py-4 text-center">Lượt xem</th>
              <th className="px-2 py-4 text-center">Hồ sơ</th>
              <th className="px-2 py-4 text-center">Tỷ lệ ứng tuyển</th>
              <th className="px-2 py-4 text-center">Ứng viên mới</th>
              <th className="px-2 py-4 text-center">Còn hạn</th>
              <th className="px-2 py-4 text-center">Hiệu quả</th>
              <th className="px-2 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-sm font-semibold text-slate-500"
                  colSpan={9}
                >
                  Đang tải danh sách tin tuyển dụng…
                </td>
              </tr>
            ) : null}
            {!isLoading && localItems.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-sm font-semibold text-slate-500"
                  colSpan={9}
                >
                  Chưa có tin tuyển dụng nào khớp bộ lọc hiện tại.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? localItems.map((job) => {
                  const actions = getJobPostActions(job);
                  const normalActions = actions.filter((a) => a.tone !== "danger");
                  const dangerActions = actions.filter((a) => a.tone === "danger");

                  return (
                    <tr className="text-sm font-bold text-slate-700" key={job.id}>
                      <td className="px-3 py-4">
                        <div className="min-w-[260px]">
                          <p className="font-extrabold text-slate-900">{job.title}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {job.companyName} • {job.locationSummary}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {job.experienceLevel} • {job.employmentType}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex h-7 items-center rounded-md px-3 text-xs font-extrabold",
                            statusClasses[job.status],
                          )}
                        >
                          {statusLabels[job.status]}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-center">{formatInteger(job.views)}</td>
                      <td className="px-2 py-4 text-center">{formatInteger(job.applications)}</td>
                      <td className="px-2 py-4 text-center">{formatPercent(job.conversionRate)}</td>
                      <td className="px-2 py-4 text-center">{formatInteger(job.newCandidates)}</td>
                      <td
                        className={cn(
                          "px-2 py-4 text-center",
                          job.daysLeft !== null &&
                            job.daysLeft <= 7 &&
                            job.daysLeft >= 0 &&
                            "text-red-500",
                        )}
                      >
                        {formatDaysLeft(job.daysLeft)}
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex h-7 items-center rounded-md px-3 text-xs font-extrabold",
                            effectivenessClasses[job.effectiveness],
                          )}
                        >
                          {effectivenessLabels[job.effectiveness]}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <div className="relative inline-block text-left" data-actions-dropdown>
                          <button
                            aria-label="Mở thao tác tin tuyển dụng"
                            className="inline-flex h-8 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openJobId === job.id) {
                                setOpenJobId(null);
                                setDropdownPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const estimatedDropdownHeight = 300;

                                if (spaceBelow < estimatedDropdownHeight && rect.top > spaceBelow) {
                                  setDropdownPos({
                                    bottom: window.innerHeight - rect.top + 6,
                                    right: window.innerWidth - rect.right,
                                    isAbove: true,
                                  });
                                } else {
                                  setDropdownPos({
                                    top: rect.bottom + 6,
                                    right: window.innerWidth - rect.right,
                                    isAbove: false,
                                  });
                                }
                                setOpenJobId(job.id);
                              }
                            }}
                            type="button"
                          >
                            <DotsThree className="h-5 w-5" />
                          </button>

                          {openJobId === job.id &&
                            dropdownPos &&
                            typeof document !== "undefined" &&
                            createPortal(
                              <div
                                className={cn(
                                  "animate-in fade-in fixed z-[100] w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_36px_rgba(15,23,42,0.12)] duration-150",
                                  dropdownPos.isAbove
                                    ? "slide-in-from-bottom-2"
                                    : "slide-in-from-top-2",
                                )}
                                style={{
                                  ...(dropdownPos.top !== undefined
                                    ? { top: dropdownPos.top }
                                    : {}),
                                  ...(dropdownPos.bottom !== undefined
                                    ? { bottom: dropdownPos.bottom }
                                    : {}),
                                  right: dropdownPos.right,
                                }}
                                data-actions-dropdown
                              >
                                {normalActions.map((action) => (
                                  <button
                                    key={action.key}
                                    className={itemClass(action)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!action.disabled) handleActionClick(action, job);
                                    }}
                                    type="button"
                                  >
                                    <action.icon className="h-4.5 w-4.5 shrink-0" />
                                    <span>{action.label}</span>
                                  </button>
                                ))}

                                {dangerActions.length > 0 && (
                                  <>
                                    <div className="my-1 border-t border-slate-100" />
                                    {dangerActions.map((action) => (
                                      <button
                                        key={action.key}
                                        className={itemClass(action)}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!action.disabled) handleActionClick(action, job);
                                        }}
                                        type="button"
                                      >
                                        <action.icon className="h-4.5 w-4.5 shrink-0" />
                                        <span>{action.label}</span>
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>,
                              document.body,
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Hiển thị {localItems.length === 0 ? 0 : 1}-{localItems.length} / {totalItems} tin
        </p>
        <div className="flex items-center gap-2">
          <PaginationButton ariaLabel="Trang trước">
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </PaginationButton>
          <button
            aria-label="Trang 1"
            className="h-9 w-9 rounded-lg border border-emerald-500 bg-emerald-50 text-sm font-bold text-emerald-700"
            type="button"
          >
            1
          </button>
          <PaginationButton ariaLabel="Trang sau">
            <ChevronRight aria-hidden className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="animate-in fade-in zoom-in-95 w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)] duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-slate-950">
              {confirmDialogContent[confirmAction.type]?.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed font-semibold text-slate-500">
              {confirmDialogContent[confirmAction.type]?.description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none"
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className={cn(
                  "h-10 rounded-lg px-5 text-sm font-bold text-white transition focus:outline-none",
                  confirmDialogContent[confirmAction.type]?.tone === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-[0_12px_26px_rgba(225,29,72,0.22)]"
                    : "bg-amber-600 hover:bg-amber-700 shadow-[0_12px_26px_rgba(217,119,6,0.22)]",
                )}
                onClick={handleConfirmExecute}
                type="button"
              >
                {confirmDialogContent[confirmAction.type]?.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Reason Dialog */}
      {blockedReasonJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
          onClick={() => setBlockedReasonJob(null)}
        >
          <div
            className="animate-in fade-in zoom-in-95 w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)] duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-950">Lý do tin bị khóa</h3>
              <button
                aria-label="Đóng"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50"
                onClick={() => setBlockedReasonJob(null)}
                type="button"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="mt-4 text-sm leading-relaxed font-semibold text-slate-700">
              <p className="text-slate-800">
                Tin tuyển dụng{" "}
                <strong className="font-extrabold text-slate-950">
                  “{blockedReasonJob.title}”
                </strong>{" "}
                đã bị khóa/từ chối duyệt bởi quản trị viên hệ thống UpNext.
              </p>
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-700">
                <p className="font-bold">Nội dung vi phạm:</p>
                <p className="mt-1 text-xs leading-relaxed font-semibold">
                  Tin tuyển dụng chứa thông tin liên hệ trực tiếp (Email/Số điện thoại/Link liên kết
                  ngoài) trong phần Mô tả công việc hoặc Yêu cầu công việc, vi phạm Quy chế đăng tin
                  của nền tảng UpNext.
                </p>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Vui lòng nhấn{" "}
                <strong className="font-bold text-slate-700">Chỉnh sửa nội dung</strong> để loại bỏ
                các thông tin trên và gửi duyệt lại, hoặc liên hệ hỗ trợ nếu cần thêm thông tin chi
                tiết.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setBlockedReasonJob(null)}
                type="button"
              >
                Đóng
              </button>
              <button
                className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
                onClick={() => {
                  const job = blockedReasonJob;
                  setBlockedReasonJob(null);
                  executeAction("edit", job);
                }}
                type="button"
              >
                Chỉnh sửa nội dung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 z-[100] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-3">
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 shadow-[0_18px_42px_rgba(15,23,42,0.12)] bg-white animate-in fade-in slide-in-from-top-5 duration-200",
              toast.type === "success" && "border-emerald-100",
              toast.type === "warning" && "border-amber-100",
              toast.type === "danger" && "border-rose-100",
              toast.type === "info" && "border-blue-100",
            )}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {toast.type === "warning" && <WarningCircle className="h-5 w-5 text-amber-600" />}
              {toast.type === "danger" && <WarningCircle className="h-5 w-5 text-rose-600" />}
              {toast.type === "info" && <Info className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-sm leading-snug font-semibold text-slate-800">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              type="button"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

function formatDaysLeft(daysLeft: number | null) {
  if (daysLeft === null) {
    return "—";
  }

  if (daysLeft < 0) {
    return "Đã hết hạn";
  }

  return `${daysLeft} ngày`;
}

function PaginationButton({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
      type="button"
    >
      {children}
    </button>
  );
}
