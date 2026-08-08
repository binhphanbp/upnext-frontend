"use client";

import {
  ArrowsCounterClockwise,
  CalendarPlus,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterSession } from "@/features/recruiter/session";
import {
  getShortlist,
  removeFromShortlist,
  type ShortlistEntry,
} from "@/features/recruiter/shortlists/api";
import { BatchInterviewDialog } from "@/features/recruiter/shortlists/batch-interview-dialog";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { ReviewerByline } from "@/shared/ui/reviewer-byline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
});

const PAGE_SIZE = 10;
const ALL_OWNERS = "company";

const JOB_SEARCH_LABELS: Record<string, string> = {
  ACTIVELY_LOOKING: "Đang tìm việc",
  OPEN_TO_OFFERS: "Cân nhắc cơ hội",
  NOT_LOOKING: "Chưa tìm việc",
};

export function RecruiterShortlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [recruiterAccountId, setRecruiterAccountId] = useState<string | null>(null);
  const [owner, setOwner] = useState<string>(ALL_OWNERS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }
    setToken(session.accessToken);
    setRecruiterAccountId(session.user.id);
  }, [router]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [owner, debouncedSearch]);

  const shortlistQuery = useQuery({
    enabled: Boolean(token),
    // Both filters are applied server-side, so both belong in the key.
    queryKey: ["recruiter-shortlist", owner, debouncedSearch, page],
    queryFn: () =>
      getShortlist(token!, {
        page,
        limit: PAGE_SIZE,
        ...(owner === ALL_OWNERS ? {} : { mine: true }),
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
      }),
  });

  const items = useMemo(() => shortlistQuery.data?.items ?? [], [shortlistQuery.data]);

  // A selection made on page 1 must not schedule someone the recruiter can no longer see.
  const selected = useMemo(
    () => items.filter((entry) => selectedIds.includes(entry.id)),
    [items, selectedIds],
  );

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromShortlist(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiter-shortlist"] });
      void toast.fire({ icon: "success", title: "Đã xóa khỏi danh sách." });
    },
    onError: () => {
      void toast.fire({ icon: "error", title: "Không xóa được. Vui lòng thử lại." });
    },
  });

  async function handleRemove(entry: ShortlistEntry) {
    const result = await Swal.fire({
      title: "Xóa khỏi danh sách?",
      text: `${entry.candidateProfile.account.fullName} sẽ không còn trong danh sách ứng viên đã lưu của công ty.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      setSelectedIds((prev) => prev.filter((id) => id !== entry.id));
      removeMutation.mutate(entry.id);
    }
  }

  const isMissingCompany =
    shortlistQuery.error instanceof ApiError && shortlistQuery.error.status === 403;

  if (isMissingCompany) {
    return (
      <Card className="flex h-56 flex-col items-center justify-center gap-2 border border-slate-200 p-6 text-center">
        <p className="font-semibold text-slate-900">Tài khoản của bạn chưa thuộc công ty nào.</p>
        <p className="text-sm text-slate-500">
          Hãy hoàn tất hồ sơ công ty trước khi lưu ứng viên tiềm năng.
        </p>
      </Card>
    );
  }

  if (!token || shortlistQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  if (shortlistQuery.isError) {
    return (
      <Card className="flex h-56 flex-col items-center justify-center gap-3 border border-slate-200 p-6 text-center">
        <p className="text-error font-medium">Không thể tải danh sách ứng viên đã lưu.</p>
        <Button variant="outline" size="sm" onClick={() => void shortlistQuery.refetch()}>
          Thử lại
        </Button>
      </Card>
    );
  }

  const { meta } = shortlistQuery.data;
  const allOnPageSelected =
    items.length > 0 && items.every((entry) => selectedIds.includes(entry.id));

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[280px]">
              <MagnifyingGlass
                className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                className="h-10 pl-10"
                placeholder="Tìm theo tên ứng viên"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger className="h-10 w-full sm:w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OWNERS}>Cả công ty lưu</SelectItem>
                <SelectItem value="mine">Tôi lưu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void shortlistQuery.refetch()}
              aria-label="Làm mới"
            >
              <ArrowsCounterClockwise size={16} />
            </Button>
            <Button
              size="sm"
              disabled={selected.length === 0}
              onClick={() => setIsSchedulerOpen(true)}
            >
              <CalendarPlus size={16} />
              Đặt lịch phỏng vấn
              {selected.length > 0 ? ` (${selected.length})` : ""}
            </Button>
          </div>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="flex h-56 flex-col items-center justify-center gap-2 border border-slate-200 p-6 text-center">
          <p className="font-semibold text-slate-900">Chưa có ứng viên nào được lưu.</p>
          <p className="max-w-md text-sm text-slate-500">
            Ở trang Ứng viên, bấm &ldquo;Lưu ứng viên&rdquo; trên hồ sơ bạn thấy phù hợp. Cả đội
            tuyển dụng sẽ thấy chung danh sách này.
          </p>
        </Card>
      ) : (
        <Card className="border border-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Checkbox
              checked={allOnPageSelected}
              onCheckedChange={(checked) => {
                const pageIds = items.map((entry) => entry.id);
                setSelectedIds((prev) =>
                  checked
                    ? [...new Set([...prev, ...pageIds])]
                    : prev.filter((id) => !pageIds.includes(id)),
                );
              }}
              aria-label="Chọn tất cả ứng viên trong trang"
            />
            <span className="text-sm text-slate-500">
              {selected.length > 0 ? `Đã chọn ${selected.length}` : `${meta.total} ứng viên đã lưu`}
            </span>
          </div>

          <ul className="divide-y divide-slate-100">
            {items.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-4">
                <Checkbox
                  className="mt-3"
                  checked={selectedIds.includes(entry.id)}
                  onCheckedChange={(checked) =>
                    setSelectedIds((prev) =>
                      checked ? [...prev, entry.id] : prev.filter((id) => id !== entry.id),
                    )
                  }
                  aria-label={`Chọn ${entry.candidateProfile.account.fullName}`}
                />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <ReviewerByline fullName={entry.candidateProfile.account.fullName} />
                    <Badge tone="neutral">
                      {JOB_SEARCH_LABELS[entry.candidateProfile.jobSearchStatus] ??
                        entry.candidateProfile.jobSearchStatus}
                    </Badge>
                    {entry.latestCv ? null : (
                      <Badge tone="warning" title="Cần có CV mới đặt được lịch phỏng vấn">
                        Chưa có CV
                      </Badge>
                    )}
                  </div>

                  {entry.candidateProfile.description ? (
                    <p className="line-clamp-2 text-sm text-slate-600">
                      {entry.candidateProfile.description}
                    </p>
                  ) : null}

                  <p className="text-xs text-slate-400">
                    {entry.recruiterAccount.profile?.fullName ?? entry.recruiterAccount.email} đã
                    lưu ngày {formatAppDate(entry.createdAt)}
                    {entry.jobPost ? ` · từ tin ${entry.jobPost.title}` : ""}
                    {entry.candidateProfile.preferredSearchCity
                      ? ` · ${entry.candidateProfile.preferredSearchCity}`
                      : ""}
                  </p>

                  {entry.note ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {entry.note}
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-error text-slate-400"
                  onClick={() => void handleRemove(entry)}
                  aria-label={`Xóa ${entry.candidateProfile.account.fullName} khỏi danh sách`}
                >
                  <Trash size={16} />
                </Button>
              </li>
            ))}
          </ul>

          {meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <span className="text-sm text-slate-500">
                Trang {meta.page}/{meta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {token && recruiterAccountId ? (
        <BatchInterviewDialog
          open={isSchedulerOpen}
          onOpenChange={setIsSchedulerOpen}
          token={token}
          recruiterAccountId={recruiterAccountId}
          selected={selected}
          onScheduled={() => {
            setSelectedIds([]);
            void queryClient.invalidateQueries({ queryKey: ["recruiter-shortlist"] });
          }}
        />
      ) : null}
    </div>
  );
}
