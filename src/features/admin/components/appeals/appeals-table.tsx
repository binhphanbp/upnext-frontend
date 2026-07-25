"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import { getAdminAppeals, resolveAdminAppeal } from "@/features/admin/api/appeals";
import { getAdminSession } from "@/features/admin/session";
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
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              statusFilter === tab.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : !appeals || appeals.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          Không có kháng cáo nào.
        </div>
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal) => (
            <div
              key={appeal.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">
                    {appeal.recruiterAccount?.company?.name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">{appeal.recruiterAccount?.email}</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700">
                    {appeal.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Gửi lúc {formatAppDate(appeal.createdAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    appeal.status === "PENDING"
                      ? "warning"
                      : appeal.status === "APPROVED"
                        ? "success"
                        : "error"
                  }
                >
                  {appeal.status === "PENDING"
                    ? "Đang chờ"
                    : appeal.status === "APPROVED"
                      ? "Đã duyệt"
                      : "Đã từ chối"}
                </Badge>
              </div>

              {appeal.status === "PENDING" ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => void handleResolve(appeal.id, "APPROVED")}
                    disabled={resolveMutation.isPending}
                  >
                    Duyệt kháng cáo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleResolve(appeal.id, "REJECTED")}
                    disabled={resolveMutation.isPending}
                  >
                    Từ chối
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
