"use client";

import { Buildings, CalendarBlank, Check, EnvelopeSimple, X } from "@phosphor-icons/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import { getAdminAppeals, resolveAdminAppeal } from "@/features/admin/api/appeals";
import { getAdminSession } from "@/features/admin/session";
import { cn } from "@/shared/lib/cn";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

const STATUS_TABS = [
  { value: "PENDING", label: "Đang chờ xử lý" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
] as const;

export function AppealsTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const { data: appeals, isLoading } = useQuery({
    queryKey: ["adminAppeals", statusFilter],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminAppeals(session.accessToken, statusFilter);
    },
  });

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
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
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
      ) : !appeals || appeals.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          Không có kháng cáo nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {appeals.map((appeal) => (
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
