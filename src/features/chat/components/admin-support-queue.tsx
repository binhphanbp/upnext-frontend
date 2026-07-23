"use client";

import { MagnifyingGlass, UserPlus } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import { claimSupportCase, getAdminSupportCases } from "../api/support-cases";
import { useChatSocket } from "../socket/chat-socket-provider";
import type { SupportCase, SupportCaseStatus } from "../types/contracts";

const statuses: SupportCaseStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_ON_RECRUITER",
  "WAITING_ON_SUPPORT",
  "RESOLVED",
  "CLOSED",
];

export function AdminSupportQueue() {
  const { token, identity } = useChatSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = useQuery({
    queryKey: ["chat", "support-cases", "admin"],
    enabled: Boolean(token),
    queryFn: () => getAdminSupportCases(token!),
    refetchInterval: 30_000,
  });
  const claim = useMutation({
    mutationFn: (supportCase: SupportCase) =>
      claimSupportCase(token!, supportCase.id, supportCase.version),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["chat", "support-cases"] });
      router.push(`/admin/content/support/${response.data.id}`);
    },
  });
  const rows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("vi");
    return (query.data?.data ?? []).filter(
      (item) =>
        (status === "all" || item.status === status) &&
        `${item.caseNumber} ${item.title} ${item.department}`
          .toLocaleLowerCase("vi")
          .includes(normalized),
    );
  }, [query.data, search, status]);

  if (query.isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />;
  if (query.isError)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Không thể tải hàng chờ hỗ trợ. Tài khoản có thể chưa được cấp permission phù hợp.
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Tìm yêu cầu hỗ trợ"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Tìm mã hoặc tiêu đề"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {statuses.map((value) => (
              <SelectItem value={value} key={value}>
                {label(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Yêu cầu</th>
              <th className="px-4 py-3">Bộ phận</th>
              <th className="px-4 py-3">Ưu tiên</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Phụ trách</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/content/support/${item.id}`)}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {item.title}
                  </button>
                  <p className="mt-0.5 text-xs text-slate-400">{item.caseNumber}</p>
                </td>
                <td className="px-4 py-3">{label(item.department)}</td>
                <td className="px-4 py-3">
                  <Badge>{label(item.priority)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge>{label(item.status)}</Badge>
                </td>
                <td className="px-4 py-3">{item.assignedAdmin?.fullName ?? "Chưa nhận"}</td>
                <td className="px-4 py-3 text-right">
                  {!item.assignedAdminUserId && identity?.permissions.includes("support:assign") ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={claim.isPending}
                      onClick={() => claim.mutate(item)}
                    >
                      <UserPlus /> Nhận xử lý
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/content/support/${item.id}`)}
                    >
                      Mở
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <div className="p-12 text-center text-sm text-slate-500">Không có yêu cầu phù hợp.</div>
        ) : null}
      </div>
      {claim.error ? (
        <p role="alert" className="text-sm text-red-600">
          {claim.error.message}
        </p>
      ) : null}
    </div>
  );
}

export function supportLabel(value: string) {
  return label(value);
}

function label(value: string) {
  const values: Record<string, string> = {
    SALES: "Kinh doanh",
    BILLING: "Thanh toán",
    JOB_REVIEW: "Duyệt tin",
    COMPANY_VERIFICATION: "Xác minh",
    TECHNICAL: "Kỹ thuật",
    GENERAL: "Hỗ trợ chung",
    NEW: "Mới",
    IN_PROGRESS: "Đang xử lý",
    WAITING_ON_RECRUITER: "Chờ nhà tuyển dụng",
    WAITING_ON_SUPPORT: "Chờ hỗ trợ",
    RESOLVED: "Đã giải quyết",
    CLOSED: "Đã đóng",
    LOW: "Thấp",
    NORMAL: "Bình thường",
    HIGH: "Cao",
    URGENT: "Khẩn cấp",
  };
  return values[value] ?? value;
}
