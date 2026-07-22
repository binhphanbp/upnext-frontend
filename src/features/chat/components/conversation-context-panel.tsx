"use client";

import { Buildings, Briefcase, Headset, Info, Plus, Tag, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { updateConversationTags } from "../api/conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import type { ConversationDetail } from "../types/contracts";

export function ConversationContextPanel({ conversation }: { conversation: ConversationDetail }) {
  const { actor, token } = useChatSocket();
  const queryClient = useQueryClient();
  const [draftTag, setDraftTag] = useState("");
  const tags = conversation.tags ?? [];
  const recruiter = conversation.participants.find(
    (participant) => participant.recruiterAccount,
  )?.recruiterAccount;
  const mutation = useMutation({
    mutationFn: (nextTags: string[]) => updateConversationTags(token!, conversation.id, nextTags),
    onSuccess: async () => {
      setDraftTag("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chat", "conversation", conversation.id] }),
        queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["chat", "conversation-tags"] }),
      ]);
    },
  });
  const addTag = () => {
    const normalized = normalizeTag(draftTag);
    if (!normalized || tags.includes(normalized) || tags.length >= 10 || mutation.isPending) return;
    mutation.mutate([...tags, normalized]);
  };

  return (
    <aside className="h-full min-h-0 overflow-y-auto bg-white p-5" aria-label="Thông tin hội thoại">
      <div className="mb-5 flex items-center gap-2">
        <Info className="text-blue-600" />
        <h2 className="font-bold text-slate-900">Thông tin trao đổi</h2>
      </div>
      <div className="space-y-4 text-sm">
        {actor === "CANDIDATE" && recruiter ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-blue-700 uppercase">
              Nhà tuyển dụng
            </p>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {initials(recruiter.profile?.fullName ?? recruiter.company?.name ?? "NTD")}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">
                  {recruiter.profile?.fullName ?? "Nhà tuyển dụng"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                  {recruiter.company?.name ?? "Doanh nghiệp tuyển dụng"}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {conversation.application ? (
          <>
            {actor === "CANDIDATE" ? (
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                Tin tuyển dụng đã ứng tuyển
              </p>
            ) : null}
            <ContextRow
              icon={<Briefcase />}
              label="Vị trí"
              value={conversation.application.jobPost.title}
            />
            <ContextRow
              icon={<Buildings />}
              label="Công ty"
              value={conversation.application.jobPost.company.name}
            />
            <div>
              <p className="mb-1 text-xs text-slate-500">Trạng thái hồ sơ</p>
              <Badge>{statusLabel(conversation.application.status)}</Badge>
            </div>
          </>
        ) : null}
        {conversation.talentContactRequest ? (
          <>
            <ContextRow
              icon={<Briefcase />}
              label="Cơ hội"
              value={conversation.talentContactRequest.jobPost.title}
            />
            <div>
              <p className="mb-1 text-xs text-slate-500">Lời mời kết nối</p>
              <Badge>{statusLabel(conversation.talentContactRequest.status)}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Hết hạn:{" "}
              {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(conversation.talentContactRequest.expiresAt),
              )}
            </p>
          </>
        ) : null}
        {conversation.supportCase ? (
          <>
            <ContextRow
              icon={<Headset />}
              label="Mã yêu cầu"
              value={conversation.supportCase.caseNumber}
            />
            <ContextRow icon={<Headset />} label="Tiêu đề" value={conversation.supportCase.title} />
            <div>
              <p className="mb-1 text-xs text-slate-500">Bộ phận</p>
              <Badge>{statusLabel(conversation.supportCase.department)}</Badge>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Trạng thái</p>
              <Badge>{statusLabel(conversation.supportCase.status)}</Badge>
            </div>
          </>
        ) : null}
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center gap-2">
            <Tag className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-700">Tag của bạn</p>
          </div>
          {tags.length ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 py-1 pr-1 pl-2.5 text-xs font-semibold text-slate-600"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Gỡ tag ${tag}`}
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(tags.filter((item) => item !== tag))}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-xs text-slate-400">Chưa có tag.</p>
          )}
          <div className="flex gap-2">
            <Input
              value={draftTag}
              maxLength={30}
              aria-label="Tag mới"
              placeholder="Ví dụ: cần phản hồi"
              disabled={tags.length >= 10 || mutation.isPending}
              onChange={(event) => setDraftTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              type="button"
              className="h-11 w-11 shrink-0 p-0"
              aria-label="Thêm tag"
              disabled={!normalizeTag(draftTag) || tags.length >= 10 || mutation.isPending}
              onClick={addTag}
            >
              <Plus />
            </Button>
          </div>
          {tags.length >= 10 ? (
            <p className="mt-2 text-xs text-amber-700">Mỗi hội thoại tối đa 10 tag.</p>
          ) : null}
          {mutation.error ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {mutation.error.message}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Nội dung và thông tin liên hệ chỉ được hiển thị cho thành viên có quyền trong hội thoại
          này.
        </div>
      </div>
    </aside>
  );
}

function normalizeTag(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("vi");
}

function initials(value: string) {
  return value
    .split(/\s+/u)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ContextRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    PENDING: "Đang chờ",
    ACTIVE: "Đang trao đổi",
    READ_ONLY: "Chỉ đọc",
    CLOSED: "Đã đóng",
    ACCEPTED: "Đã chấp nhận",
    DECLINED: "Đã từ chối",
    EXPIRED: "Đã hết hạn",
    BLOCKED: "Đã chặn",
    NEW: "Mới",
    IN_PROGRESS: "Đang xử lý",
    WAITING_ON_RECRUITER: "Chờ nhà tuyển dụng",
    WAITING_ON_SUPPORT: "Chờ hỗ trợ",
    RESOLVED: "Đã giải quyết",
    SALES: "Kinh doanh",
    BILLING: "Thanh toán",
    JOB_REVIEW: "Duyệt tin",
    COMPANY_VERIFICATION: "Xác minh công ty",
    TECHNICAL: "Kỹ thuật",
    GENERAL: "Hỗ trợ chung",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}
