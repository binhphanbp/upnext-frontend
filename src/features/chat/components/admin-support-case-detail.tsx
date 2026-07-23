"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import {
  changeSupportCaseStatus,
  claimSupportCase,
  getEligibleSupportAssignees,
  getSupportCase,
  transferSupportCase,
} from "../api/support-cases";
import { useConversation } from "../hooks/use-conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import type { SupportCaseStatus } from "../types/contracts";
import { supportLabel } from "./admin-support-queue";
import { ConversationContextPanel } from "./conversation-context-panel";
import { ConversationThread } from "./conversation-thread";

export function AdminSupportCaseDetail({ caseId }: { caseId: string }) {
  const { token, identity } = useChatSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<SupportCaseStatus>("RESOLVED");
  const [summary, setSummary] = useState("");
  const [transferAdminId, setTransferAdminId] = useState("");
  const query = useQuery({
    queryKey: ["chat", "support-cases", "admin", caseId],
    enabled: Boolean(token),
    queryFn: () => getSupportCase(token!, caseId, true),
  });
  const eligibleAssigneesQuery = useQuery({
    queryKey: ["chat", "support-cases", "admin", caseId, "eligible-assignees"],
    enabled: Boolean(
      token &&
      query.data?.data.assignedAdminUserId &&
      identity?.permissions.includes("support:transfer"),
    ),
    queryFn: () => getEligibleSupportAssignees(token!, caseId),
    retry: false,
  });
  const conversation = useConversation(query.data?.data.conversationId ?? null);
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["chat", "support-cases"] }),
      queryClient.invalidateQueries({ queryKey: ["chat", "conversation"] }),
    ]);
  };
  const claim = useMutation({
    mutationFn: () => claimSupportCase(token!, caseId, query.data!.data.version),
    onSuccess: refresh,
  });
  const changeStatus = useMutation({
    mutationFn: () =>
      changeSupportCaseStatus(token!, caseId, {
        expectedVersion: query.data!.data.version,
        status: nextStatus,
        ...(nextStatus === "RESOLVED"
          ? { resolutionSummary: summary }
          : summary
            ? { reason: summary }
            : {}),
      }),
    onSuccess: refresh,
  });
  const transfer = useMutation({
    mutationFn: () =>
      transferSupportCase(token!, caseId, {
        expectedVersion: query.data!.data.version,
        toAdminUserId: transferAdminId,
        reason: summary || "Chuyển người phụ trách",
      }),
    onSuccess: async () => {
      setTransferAdminId("");
      await refresh();
    },
  });

  if (query.isLoading) return <div className="h-[600px] animate-pulse rounded-2xl bg-slate-100" />;
  if (!query.data || query.isError)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Không thể tải yêu cầu hỗ trợ.
      </div>
    );
  const supportCase = query.data.data;
  const assignedToMe = supportCase.assignedAdminUserId === identity?.id;
  const canOverride = identity?.permissions.includes("support:view_all");
  const canAct = Boolean(supportCase.assignedAdminUserId && (assignedToMe || canOverride));
  const canTransfer = Boolean(
    canAct && identity?.permissions.includes("support:transfer") && supportCase.assignedAdminUserId,
  );
  const actionError = claim.error ?? changeStatus.error ?? transfer.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={() => router.push("/admin/content/support")}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{supportCase.title}</h1>
            <p className="text-xs text-slate-500">
              {supportCase.caseNumber} · {supportLabel(supportCase.department)} ·{" "}
              {supportLabel(supportCase.status)}
            </p>
          </div>
        </div>
        {!supportCase.assignedAdminUserId && identity?.permissions.includes("support:assign") ? (
          <Button type="button" onClick={() => claim.mutate()} disabled={claim.isPending}>
            Nhận xử lý
          </Button>
        ) : null}
      </div>
      {canAct ? (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
          <Select
            value={nextStatus}
            onValueChange={(value) => setNextStatus(value as SupportCaseStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "IN_PROGRESS",
                "WAITING_ON_RECRUITER",
                "WAITING_ON_SUPPORT",
                "RESOLVED",
                "CLOSED",
              ].map((value) => (
                <SelectItem key={value} value={value}>
                  {supportLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder={
              nextStatus === "RESOLVED" ? "Tóm tắt cách giải quyết (bắt buộc)" : "Lý do / ghi chú"
            }
          />
          <Button
            type="button"
            disabled={changeStatus.isPending || (nextStatus === "RESOLVED" && !summary.trim())}
            onClick={() => changeStatus.mutate()}
          >
            Cập nhật
          </Button>
          {canTransfer ? (
            <>
              {eligibleAssigneesQuery.isLoading ? (
                <output className="block text-sm text-slate-500 lg:col-span-3">
                  Đang tải danh sách admin…
                </output>
              ) : null}
              {eligibleAssigneesQuery.isError ? (
                <p role="alert" className="text-sm text-red-600 lg:col-span-3">
                  Không thể tải danh sách admin phù hợp.
                </p>
              ) : null}
              {eligibleAssigneesQuery.isSuccess && eligibleAssigneesQuery.data.data.length === 0 ? (
                <output className="block text-sm text-amber-700 lg:col-span-3">
                  Không có admin phù hợp để chuyển giao yêu cầu này.
                </output>
              ) : null}
              {eligibleAssigneesQuery.data?.data.length ? (
                <Select value={transferAdminId} onValueChange={setTransferAdminId}>
                  <SelectTrigger aria-label="Admin nhận chuyển giao">
                    <SelectValue placeholder="Chọn admin nhận chuyển giao" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAssigneesQuery.data.data.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.fullName} — {admin.role?.roleName ?? admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <div className="lg:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!transferAdminId || transfer.isPending}
                  onClick={() => transfer.mutate()}
                >
                  Chuyển người phụ trách
                </Button>
              </div>
            </>
          ) : null}
          {actionError ? (
            <p className="text-sm text-red-600 lg:col-span-3">{actionError.message}</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid h-[calc(100dvh-300px)] min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white xl:grid-cols-[minmax(0,1fr)_330px]">
        <ConversationThread conversationId={supportCase.conversationId} />
        <div className="hidden border-l border-slate-200 xl:block">
          {conversation.data ? <ConversationContextPanel conversation={conversation.data} /> : null}
        </div>
      </div>
    </div>
  );
}
