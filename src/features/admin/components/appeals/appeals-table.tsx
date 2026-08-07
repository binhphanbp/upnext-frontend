"use client";

import {
  ArrowsCounterClockwise,
  CalendarBlank,
  EnvelopeSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";

import { getAdminAppeals, resolveAdminAppeal } from "@/features/admin/api/appeals";
import { AdminHeaderFilterPortal } from "@/features/admin/components/admin-header-filter-portal";
import { getAdminSession } from "@/features/admin/session";
import { cn } from "@/shared/lib/cn";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";

const STATUS_TABS = [
  { value: "PENDING", label: "Đang chờ xử lý" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
] as const;

export function AppealsTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: appeals,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminAppeals", statusFilter],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminAppeals(session.accessToken, statusFilter);
    },
  });

  const visibleAppeals = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return appeals ?? [];

    return (appeals ?? []).filter((appeal) =>
      [appeal.recruiterAccount?.company?.name, appeal.recruiterAccount?.email, appeal.content].some(
        (field) => field?.toLowerCase().includes(keyword),
      ),
    );
  }, [appeals, searchTerm]);

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return resolveAdminAppeal(session.accessToken, id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminAppeals"] });
    },
    onError: () => {
      void Swal.fire({ icon: "error", title: "Xử lý kháng cáo thất bại." });
    },
  });

  async function handleResolve(id: string, status: "APPROVED" | "REJECTED") {
    const result = await Swal.fire({
      icon: "question",
      title: status === "APPROVED" ? "Duyệt kháng cáo này?" : "Từ chối kháng cáo này?",
      text:
        status === "APPROVED"
          ? "Công ty sẽ được khôi phục về trạng thái hoạt động bình thường và điểm uy tín trước khi bị hạn chế."
          : "Công ty sẽ tiếp tục ở trạng thái bị hạn chế.",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Huỷ",
    });

    if (result.isConfirmed) {
      resolveMutation.mutate({ id, status });
    }
  }

  return (
    <div className="space-y-4">
      {/* This screen renders cards instead of a table, so it portals its own filter
          row into the shell header the way AdminTableLayout does for the others. */}
      <AdminHeaderFilterPortal
        filterBar={
          <div className="relative w-full sm:w-[350px]">
            <MagnifyingGlass
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              className="border-input focus:border-primary h-10 w-full rounded-xl border bg-white pl-10 text-sm shadow-none focus:outline-none"
              placeholder="Tìm theo công ty, email, nội dung..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
        actionBar={
          <Button
            variant="outline"
            size="icon"
            className="flex h-10 w-10 items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none hover:bg-slate-50"
            onClick={() => void refetch()}
            aria-label="Làm mới danh sách kháng cáo"
          >
            <ArrowsCounterClockwise size={18} />
          </Button>
        }
      />

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : visibleAppeals.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          {searchTerm.trim() ? "Không tìm thấy kháng cáo phù hợp." : "Không có kháng cáo nào."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {visibleAppeals.map((appeal) => (
              <div key={appeal.id} className="p-6 transition-colors hover:bg-slate-50/50">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-900">
                        {appeal.recruiterAccount?.company?.name ?? "Công ty ẩn danh"}
                      </h3>
                      <Badge
                        tone={
                          appeal.status === "PENDING"
                            ? "warning"
                            : appeal.status === "APPROVED"
                              ? "success"
                              : "error"
                        }
                        className="shadow-sm"
                      >
                        {appeal.status === "PENDING"
                          ? "Đang chờ xử lý"
                          : appeal.status === "APPROVED"
                            ? "Đã duyệt"
                            : "Đã từ chối"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <EnvelopeSimple size={16} />
                        {appeal.recruiterAccount?.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarBlank size={16} />
                        {formatAppDate(appeal.createdAt)}
                      </span>
                    </div>

                    <div className="max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                      {appeal.content}
                    </div>
                  </div>

                  {appeal.status === "PENDING" ? (
                    <div className="mt-4 flex shrink-0 items-center gap-2 md:mt-0">
                      <Button
                        variant="outline"
                        onClick={() => void handleResolve(appeal.id, "REJECTED")}
                        disabled={resolveMutation.isPending}
                        className="bg-white text-slate-600 shadow-sm"
                      >
                        Từ chối
                      </Button>
                      <Button
                        onClick={() => void handleResolve(appeal.id, "APPROVED")}
                        disabled={resolveMutation.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      >
                        Duyệt kháng cáo
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
