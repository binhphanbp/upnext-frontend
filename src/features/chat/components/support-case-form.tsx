"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { createSupportCase, getSupportCaseCreationOptions } from "../api/support-cases";
import { useChatSocket } from "../socket/chat-socket-provider";

const categories = [
  ["PLAN_CONSULTING", "Tư vấn gói dịch vụ"],
  ["PLAN_UPGRADE", "Nâng cấp gói"],
  ["INVOICE", "Hóa đơn"],
  ["PAYMENT", "Thanh toán"],
  ["JOB_REVIEW", "Duyệt tin tuyển dụng"],
  ["COMPANY_VERIFICATION", "Xác minh công ty"],
  ["TECHNICAL", "Sự cố kỹ thuật"],
  ["GENERAL", "Vấn đề khác"],
] as const;

const jobReviewStatusLabels = {
  PENDING: "Đang chờ duyệt",
  REJECTED: "Bị từ chối",
} as const;

const invoiceStatusLabels = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
} as const;

export function SupportCaseForm({ onCreated }: { onCreated?: (conversationId: string) => void }) {
  const { token, identity } = useChatSocket();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [categoryCode, setCategory] = useState<string>("GENERAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [relatedId, setRelatedId] = useState("");
  const isBilling = categoryCode === "INVOICE" || categoryCode === "PAYMENT";
  const needsCreationOptions =
    categoryCode === "JOB_REVIEW" || isBilling || categoryCode === "COMPANY_VERIFICATION";
  const creationOptionsQuery = useQuery({
    queryKey: ["chat", "support", "creation-options", identity?.companyId],
    queryFn: () => {
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
      return getSupportCaseCreationOptions(token);
    },
    enabled: open && needsCreationOptions && Boolean(token && identity?.companyId),
    retry: false,
  });
  const options = creationOptionsQuery.data?.data;
  const eligibleJobPosts = (options?.jobPosts ?? []).filter(
    (jobPost) => jobPost.moderationStatus === "PENDING" || jobPost.moderationStatus === "REJECTED",
  );
  const invoices = options?.invoices ?? [];
  const mutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
      return createSupportCase(token, {
        clientRequestId: crypto.randomUUID(),
        categoryCode,
        title: title.trim(),
        description: description.trim(),
        priority: "NORMAL",
        ...(categoryCode === "JOB_REVIEW" ? { jobPostId: relatedId } : {}),
        ...(categoryCode === "INVOICE" || categoryCode === "PAYMENT"
          ? { invoiceId: relatedId }
          : {}),
      });
    },
    onSuccess: async (response) => {
      setOpen(false);
      setTitle("");
      setDescription("");
      setRelatedId("");
      await queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      onCreated?.(response.data.conversationId);
    },
  });
  const needsRelated = categoryCode === "JOB_REVIEW" || isBilling;
  const hasEligibleContext =
    categoryCode === "JOB_REVIEW"
      ? creationOptionsQuery.isSuccess && eligibleJobPosts.length > 0
      : isBilling
        ? creationOptionsQuery.isSuccess && invoices.length > 0
        : categoryCode === "COMPANY_VERIFICATION"
          ? creationOptionsQuery.isSuccess &&
            Boolean(options?.company.eligibleForVerificationSupport)
          : true;
  const valid =
    title.trim().length >= 5 &&
    description.trim().length >= 10 &&
    (!needsRelated || relatedId.length > 0) &&
    hasEligibleContext;

  if (!open)
    return (
      <div className="border-b border-slate-200 bg-white p-3">
        <Button type="button" className="w-full" onClick={() => setOpen(true)}>
          Tạo yêu cầu hỗ trợ
        </Button>
      </div>
    );
  return (
    <form
      className="space-y-3 border-b border-slate-200 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <h3 className="font-semibold">Yêu cầu hỗ trợ mới</h3>
      <Select
        value={categoryCode}
        onValueChange={(value) => {
          setCategory(value);
          setRelatedId("");
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {needsCreationOptions && creationOptionsQuery.isLoading ? (
        <output className="block text-xs text-slate-500">Đang tải dữ liệu liên quan…</output>
      ) : null}
      {needsCreationOptions && creationOptionsQuery.isError ? (
        <p role="alert" className="text-xs text-red-600">
          Không thể tải dữ liệu liên quan. Vui lòng thử lại.
        </p>
      ) : null}
      {categoryCode === "JOB_REVIEW" &&
      creationOptionsQuery.isSuccess &&
      eligibleJobPosts.length === 0 ? (
        <output className="block text-sm font-medium text-emerald-700">
          Tất cả tin tuyển dụng của bạn đã được duyệt.
        </output>
      ) : null}
      {categoryCode === "JOB_REVIEW" && eligibleJobPosts.length > 0 ? (
        <Select value={relatedId} onValueChange={setRelatedId}>
          <SelectTrigger aria-label="Tin tuyển dụng cần hỗ trợ">
            <SelectValue placeholder="Chọn tin tuyển dụng chưa được duyệt" />
          </SelectTrigger>
          <SelectContent>
            {eligibleJobPosts.map((jobPost) => (
              <SelectItem key={jobPost.id} value={jobPost.id}>
                {jobPost.title} — {jobReviewStatusLabels[jobPost.moderationStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {isBilling && creationOptionsQuery.isSuccess && invoices.length === 0 ? (
        <output className="block text-sm font-medium text-amber-700">
          Công ty của bạn chưa có hóa đơn để yêu cầu hỗ trợ.
        </output>
      ) : null}
      {isBilling && invoices.length > 0 ? (
        <Select value={relatedId} onValueChange={setRelatedId}>
          <SelectTrigger aria-label="Hóa đơn cần hỗ trợ">
            <SelectValue placeholder="Chọn hóa đơn cần hỗ trợ" />
          </SelectTrigger>
          <SelectContent>
            {invoices.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id}>
                {invoice.invoiceCode} — {invoiceStatusLabels[invoice.paymentStatus]} —{` `}
                {formatInvoiceAmount(invoice.amount)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {categoryCode === "COMPANY_VERIFICATION" &&
      creationOptionsQuery.isSuccess &&
      options?.company.eligibleForVerificationSupport ? (
        <output className="block rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {options.company.name} — {companyVerificationStatus(options.company)}
        </output>
      ) : null}
      {categoryCode === "COMPANY_VERIFICATION" &&
      creationOptionsQuery.isSuccess &&
      options &&
      !options.company.eligibleForVerificationSupport ? (
        <output className="block text-sm font-medium text-emerald-700">
          {companyVerificationUnavailableMessage(options.company.verificationStatus)}
        </output>
      ) : null}
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        placeholder="Tiêu đề (ít nhất 5 ký tự)"
        required
      />
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={5_000}
        placeholder="Mô tả chi tiết (ít nhất 10 ký tự)"
        required
      />
      {mutation.error ? (
        <p role="alert" className="text-xs text-red-600">
          {mutation.error.message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={!valid || mutation.isPending}>
          {mutation.isPending ? "Đang tạo…" : "Gửi yêu cầu"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Hủy
        </Button>
      </div>
    </form>
  );
}

function formatInvoiceAmount(amount: string | number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(amount))} ₫`;
}

function companyVerificationStatus(company: {
  status: "ACTIVE" | "LOCKED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
}) {
  if (company.status === "LOCKED") return "Công ty đang bị khóa";
  if (company.verificationStatus === "PENDING") return "Đang chờ xác minh";
  return "Xác minh bị từ chối";
}

function companyVerificationUnavailableMessage(
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED",
) {
  return verificationStatus === "VERIFIED"
    ? "Công ty của bạn đã được xác minh."
    : "Công ty của bạn chưa có hồ sơ xác minh đang chờ admin xử lý.";
}
