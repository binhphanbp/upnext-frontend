"use client";

import {
  CircleNotch,
  DownloadSimple,
  Envelope,
  Eye,
  IdentificationCard,
  PencilSimple,
  Star,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { ShortlistEntry } from "@/features/recruiter/api/shortlist";
import { getCompanyApplications, type Application } from "@/features/recruiter/api/team";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/shared/lib/cn";
import { toDate } from "@/shared/lib/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { CandidateProfileDetailDialog } from "./candidate-profile-detail-dialog";
import { CoverLetterDialog } from "./cover-letter-dialog";
import { getStatusBadgeClass, getStatusDotClass } from "./recruiter-candidates-page";
import { RecruiterTableLayout } from "./recruiter-table-layout";
import {
  SavePotentialCandidateDialog,
  SHORTLIST_PRIORITY_OPTIONS,
} from "./save-potential-candidate-dialog";

/** Khớp STATUS_OPTIONS ở recruiter-candidates-page.tsx (không export nên khai lại). */
function priorityBadgeClass(priority: number) {
  if (priority >= 2) return "bg-rose-50 text-rose-700 border border-rose-200/50";
  if (priority >= 1) return "bg-amber-50 text-amber-700 border border-amber-200/50";
  return "bg-slate-100 text-slate-600 border border-slate-200/50";
}

function priorityLabel(priority: number, vi: boolean) {
  const option = SHORTLIST_PRIORITY_OPTIONS.find((item) => Number(item.value) === priority);
  if (!option) return vi ? "Bình thường" : "Normal";
  return vi ? option.vi : option.en;
}

type PotentialCandidatesTabProps = Readonly<{
  token: string;
  locale: Locale;
  t: any;
  shortlist: ShortlistEntry[];
  pendingKeys: ReadonlySet<string>;
  onRemove: (entry: ShortlistEntry) => void;
  onEdit: (
    entry: ShortlistEntry,
    input: { note?: string | undefined; priority: number },
  ) => Promise<boolean>;
  resolveCvUrl: (app: Application) => string;
  onDownloadCv: (fileUrl: string, fileName: string) => void;
  onQuickView: (app: Application, title: string) => void;
  search: string;
  jobFilter: string;
  statusFilter: string;
  priorityFilter: string;
}>;

/**
 * Tab "Ứng viên tiềm năng": danh sách ứng viên ĐÃ NỘP ĐƠN mà recruiter bấm ⭐
 * để lưu lại xem sau (RecruiterCandidateShortlist ở backend) — độc lập với
 * trạng thái pipeline của đơn ứng tuyển ở tab "Danh sách ứng tuyển".
 */
export function PotentialCandidatesTab({
  token,
  locale,
  t,
  shortlist,
  pendingKeys,
  onRemove,
  onEdit,
  resolveCvUrl,
  onDownloadCv,
  onQuickView,
  search,
  jobFilter,
  statusFilter,
  priorityFilter,
}: PotentialCandidatesTabProps) {
  const vi = locale === "vi";
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [viewNoteEntry, setViewNoteEntry] = useState<{ name: string; note: string } | null>(null);
  const [editState, setEditState] = useState<{
    entry: ShortlistEntry;
    name: string;
    jobTitle: string;
  } | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [profileDetailApplicationId, setProfileDetailApplicationId] = useState<string | null>(null);
  const [coverLetterApplicationId, setCoverLetterApplicationId] = useState<string | null>(null);

  async function handleEditConfirm(input: { note?: string | undefined; priority: number }) {
    if (!editState) return;
    setEditSubmitting(true);
    const success = await onEdit(editState.entry, input);
    setEditSubmitting(false);
    if (success) setEditState(null);
  }

  useEffect(() => {
    let active = true;
    async function loadAllApplications() {
      setLoading(true);
      try {
        const data = await getCompanyApplications(token, {});
        if (active) setApplications(data);
      } catch {
        // Không chặn UI nếu lỗi — các mục vẫn hiện với thông tin tối thiểu từ shortlist.
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAllApplications();
    return () => {
      active = false;
    };
  }, [token]);

  const rows = useMemo(
    () =>
      shortlist.map((entry) => ({
        entry,
        application: applications.find(
          (app) =>
            app.candidateProfile.id === entry.candidateProfileId &&
            app.jobPost.id === entry.jobPostId,
        ),
      })),
    [shortlist, applications],
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(({ entry, application }) => {
      if (jobFilter !== "ALL" && entry.jobPostId !== jobFilter) return false;
      if (statusFilter !== "ALL" && application?.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && entry.priority !== Number(priorityFilter)) return false;
      if (term) {
        const haystack = [
          application?.candidateProfile.account.fullName,
          application?.candidateProfile.account.email,
          application?.candidateProfile.phoneNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, jobFilter, statusFilter, priorityFilter, search]);

  const totalItems = filteredRows.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, jobFilter, statusFilter, priorityFilter, totalItems]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  function formatSavedAt(value: string) {
    try {
      return format(toDate(value), "dd/MM/yyyy HH:mm");
    } catch {
      return "—";
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        {t("shell.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RecruiterTableLayout
        loading={false}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        emptyState={
          paginatedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center">
              <Image
                src="/assets/recruiter/icon/icon_cv.png"
                alt="Empty"
                width={200}
                height={150}
                unoptimized
                className="mx-auto h-auto w-[200px] max-w-full object-contain select-none"
              />
              <span className="mt-2 text-sm font-medium text-slate-600">
                {shortlist.length === 0
                  ? vi
                    ? "Hiện tại chưa có ứng viên tiềm năng nào"
                    : "No potential candidates yet"
                  : vi
                    ? "Không tìm thấy ứng viên phù hợp với bộ lọc"
                    : "No candidates match your filters"}
              </span>
            </div>
          ) : null
        }
      >
        <thead>
          <tr className="border-b border-slate-300 bg-slate-200">
            <th className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.candidate")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.jobPost")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.status")}
            </th>
            <th className="w-24 border-r border-slate-300 px-2 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.cv")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {vi ? "Mức độ quan tâm" : "Interest"}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {vi ? "Ghi chú" : "Note"}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {vi ? "Ngày lưu" : "Saved at"}
            </th>
            <th className="w-24 px-4 py-3 text-center text-xs font-bold text-slate-900">
              {vi ? "Hành động" : "Actions"}
            </th>
          </tr>
        </thead>
        {paginatedRows.length > 0 ? (
          <tbody>
            {paginatedRows.map(({ entry, application }) => {
              const name =
                application?.candidateProfile.account.fullName ?? (vi ? "Ẩn danh" : "Anonymous");
              const jobTitle = application?.jobPost.title ?? "—";
              const isPending = pendingKeys.has(
                `${entry.candidateProfileId}:${entry.jobPostId ?? ""}`,
              );
              const note = entry.note?.trim();

              return (
                <tr
                  key={entry.id}
                  className="border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30"
                >
                  <td className="min-w-[160px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    <span className="text-sm font-semibold text-slate-800">{name}</span>
                  </td>
                  <td className="min-w-[200px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-800 last:border-r-0">
                    {jobTitle}
                  </td>
                  <td className="w-[145px] min-w-[145px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    {application ? (
                      <span
                        className={cn(
                          "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                          getStatusBadgeClass(application.status),
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            getStatusDotClass(application.status),
                          )}
                        />
                        {t(`candidates.status.${application.status}` as any)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="w-[145px] min-w-[145px] border-r border-slate-100/50 px-2 py-2.5 last:border-r-0">
                    {application ? (
                      <div className="flex items-center justify-center gap-3">
                        {application.cvVersion ? (
                          <>
                            <button
                              onClick={() =>
                                onDownloadCv(
                                  resolveCvUrl(application),
                                  application.cvVersion!.fileName,
                                )
                              }
                              className="inline-flex cursor-pointer items-center justify-center text-emerald-600 transition-colors hover:text-emerald-700"
                              title={vi ? "Tải xuống CV" : "Download CV"}
                            >
                              <DownloadSimple size={18} />
                            </button>
                            <button
                              onClick={() => onQuickView(application, name)}
                              className="text-primary inline-flex cursor-pointer items-center justify-center transition-colors hover:text-emerald-700"
                              title={vi ? "Xem nhanh CV" : "Quick View CV"}
                            >
                              <Eye size={18} />
                            </button>
                            <span className="h-4 w-px bg-slate-200" />
                          </>
                        ) : null}
                        <button
                          onClick={() => setProfileDetailApplicationId(application.id)}
                          className="inline-flex cursor-pointer items-center justify-center text-slate-500 transition-colors hover:text-emerald-700"
                          title={vi ? "Xem hồ sơ ứng viên" : "View candidate profile"}
                        >
                          <IdentificationCard size={18} />
                        </button>
                        <button
                          onClick={() => setCoverLetterApplicationId(application.id)}
                          className="inline-flex cursor-pointer items-center justify-center text-slate-500 transition-colors hover:text-emerald-700"
                          title={vi ? "Xem thư ứng tuyển" : "View cover letter"}
                        >
                          <Envelope size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full text-center">
                        <span className="text-slate-400">—</span>
                      </div>
                    )}
                  </td>
                  <td className="w-[130px] min-w-[130px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
                        priorityBadgeClass(entry.priority),
                      )}
                    >
                      {priorityLabel(entry.priority, vi)}
                    </span>
                  </td>
                  <td className="max-w-[280px] min-w-[220px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-700 last:border-r-0">
                    {note ? (
                      <button
                        type="button"
                        onClick={() => setViewNoteEntry({ name, note })}
                        className="group flex w-full max-w-full cursor-pointer items-center gap-1.5 text-left"
                        title={vi ? "Bấm để xem toàn bộ ghi chú" : "Click to view the full note"}
                      >
                        <span className="truncate group-hover:text-emerald-700 group-hover:underline">
                          {note}
                        </span>
                        <Eye
                          size={14}
                          className="shrink-0 text-slate-400 group-hover:text-emerald-600"
                        />
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="w-[140px] min-w-[140px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-600 last:border-r-0">
                    {formatSavedAt(entry.createdAt)}
                  </td>
                  <td className="w-[110px] min-w-[110px] px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setEditState({ entry, name, jobTitle })}
                        title={vi ? "Sửa ghi chú / mức độ quan tâm" : "Edit note / interest level"}
                        aria-label={vi ? "Sửa ứng viên tiềm năng" : "Edit potential candidate"}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onRemove(entry)}
                        title={vi ? "Bỏ lưu" : "Unsave"}
                        aria-label={vi ? "Bỏ lưu ứng viên tiềm năng" : "Unsave potential candidate"}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-amber-300 text-amber-600 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Star size={14} weight="fill" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        ) : null}
      </RecruiterTableLayout>

      {/* Xem toàn bộ ghi chú — cột bảng chỉ hiện tối đa 2 dòng (line-clamp) nên
          ghi chú dài cần bấm vào mới xem hết được. */}
      <Dialog
        open={viewNoteEntry !== null}
        onOpenChange={(open) => !open && setViewNoteEntry(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {vi ? "Ghi chú ứng viên tiềm năng" : "Potential candidate note"}
            </DialogTitle>
            <DialogDescription>{viewNoteEntry?.name}</DialogDescription>
          </DialogHeader>
          <p className="max-h-[50vh] overflow-y-auto text-sm break-words whitespace-pre-wrap text-slate-700">
            {viewNoteEntry?.note}
          </p>
        </DialogContent>
      </Dialog>

      {/* Sửa ghi chú/mức độ quan tâm — backend không có API PATCH nên nút "Sửa"
          thực chất bỏ lưu rồi lưu lại (xử lý ở handleEditShortlist của trang cha). */}
      <SavePotentialCandidateDialog
        open={editState !== null}
        onOpenChange={(open) => {
          if (!open) setEditState(null);
        }}
        mode="edit"
        candidateName={editState?.name ?? ""}
        jobTitle={editState?.jobTitle ?? ""}
        locale={locale}
        submitting={editSubmitting}
        initialNote={editState?.entry.note ?? undefined}
        initialPriority={editState?.entry.priority}
        onConfirm={(input) => void handleEditConfirm(input)}
      />

      {/* Xem chi tiết hồ sơ ứng viên (không chỉ CV) */}
      <CandidateProfileDetailDialog
        applicationId={profileDetailApplicationId}
        onOpenChange={(open) => {
          if (!open) setProfileDetailApplicationId(null);
        }}
        token={token}
        locale={locale}
        resolveCvUrl={resolveCvUrl}
        onDownloadCv={onDownloadCv}
        onQuickView={onQuickView}
      />

      <CoverLetterDialog
        applicationId={coverLetterApplicationId}
        onOpenChange={(open) => {
          if (!open) setCoverLetterApplicationId(null);
        }}
        token={token}
        locale={locale}
      />
    </div>
  );
}
