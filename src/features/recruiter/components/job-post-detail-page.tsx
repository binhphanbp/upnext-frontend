"use client";

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";

import {
  getJobPostDetail,
  getJobPostApplications,
  getJobPostViewStats,
} from "@/features/recruiter/api/job-posts";
import { getRecruiterAccounts } from "@/features/recruiter/api/recruiter-accounts";
import {
  ArrowLeft,
  PencilSimple,
  Users,
  Eye,
  WarningCircle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Globe2,
  MapPin,
  X,
  CheckCircle2,
  Info,
} from "@/features/recruiter/icons";
import {
  type RecruiterJobPostStatus,
  type RecruiterJobPostEffectiveness,
} from "@/features/recruiter/types";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { env } from "@/shared/lib/env";

const statusLabels: Record<RecruiterJobPostStatus, string> = {
  active: "Đang tuyển",
  draft: "Nháp",
  expired: "Hết hạn",
  expiring: "Sắp hết hạn",
  locked: "Bị khóa",
  pending: "Chờ duyệt",
};

const statusClasses: Record<RecruiterJobPostStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
  expiring: "bg-orange-50 text-orange-600 border-orange-200",
  locked: "bg-rose-50 text-rose-600 border-rose-200",
  pending: "bg-blue-50 text-blue-600 border-blue-200",
};

const effectivenessLabels: Record<RecruiterJobPostEffectiveness, string> = {
  good: "Tốt",
  needsOptimization: "Cần tối ưu",
  new: "Mới",
  ok: "Ổn",
};

const effectivenessClasses: Record<RecruiterJobPostEffectiveness, string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needsOptimization: "bg-rose-50 text-rose-600 border-rose-200",
  new: "bg-blue-50 text-blue-600 border-blue-200",
  ok: "bg-orange-50 text-orange-600 border-orange-200",
};

export function JobPostDetailPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updated = searchParams.get("updated") === "true";
  const [toast, setToast] = useState<{ message: string; type: "success" } | null>(null);

  const companyId = env.NEXT_PUBLIC_RECRUITER_COMPANY_ID;
  const recruiterAccountsQuery = useQuery({
    queryKey: ["recruiter-accounts"],
    queryFn: getRecruiterAccounts,
  });

  const recruiterAccount = useMemo(() => {
    return (
      recruiterAccountsQuery.data?.items.find(
        (account) => account.companyId === companyId && account.status === "ACTIVE",
      ) ?? null
    );
  }, [companyId, recruiterAccountsQuery.data?.items]);

  const recruiterId = recruiterAccount?.id ?? null;

  const jobDetailQuery = useQuery({
    queryKey: ["recruiter-job-post-detail", id],
    queryFn: () => getJobPostDetail(id),
    retry: false,
  });

  const jobApplicationsQuery = useQuery({
    enabled: Boolean(recruiterId),
    queryKey: ["recruiter-job-post-applications", id, recruiterId],
    queryFn: () => getJobPostApplications(id, recruiterId as string),
  });

  const jobViewsQuery = useQuery({
    enabled: Boolean(recruiterId),
    queryKey: ["recruiter-job-post-views", id, recruiterId],
    queryFn: () => getJobPostViewStats(id, recruiterId as string),
  });

  useEffect(() => {
    if (updated) {
      setToast({ message: "Đã lưu thay đổi tin tuyển dụng thành công!", type: "success" });
      router.replace(`/recruiter/job-posts/${id}`);
    }
  }, [updated, id, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const isLoading =
    recruiterAccountsQuery.isLoading ||
    jobDetailQuery.isLoading ||
    jobApplicationsQuery.isLoading ||
    jobViewsQuery.isLoading;

  const jobDetail = jobDetailQuery.data;

  if (isLoading) {
    return (
      <div className="w-full py-12 text-center text-sm font-semibold text-slate-500">
        Đang tải thông tin chi tiết tin tuyển dụng...
      </div>
    );
  }

  if (jobDetailQuery.error || !jobDetail) {
    return (
      <div className="w-full py-16 text-center">
        <WarningCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">
          Không tìm thấy tin tuyển dụng
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Tin tuyển dụng không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/recruiter/job-posts"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const applications = normalizeApplicationsCount(jobApplicationsQuery.data);
  const views = jobViewsQuery.data?.views ?? 0;
  const conversionRate = views > 0 ? (applications / views) * 100 : null;
  const daysLeft = getDaysLeft(jobDetail.expiredAt);
  const status = mapJobPostStatus(jobDetail.status, jobDetail.moderationStatus, daysLeft);
  const effectiveness = getEffectiveness(applications, conversionRate, status);
  const locationSummary = buildLocationSummary(jobDetail);

  return (
    <div className="w-full pb-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 z-[100] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-3">
          <div className="animate-in fade-in slide-in-from-top-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.12)] duration-200">
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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

      {/* Header Back Button */}
      <div className="mb-4">
        <Link
          href="/recruiter/job-posts"
          className="inline-flex h-9 items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Quay lại danh sách
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-tight font-extrabold text-slate-950">
              {jobDetail.title}
            </h1>
            <span
              className={cn(
                "inline-flex h-7 items-center rounded-md px-3 text-xs font-extrabold border",
                statusClasses[status],
              )}
            >
              {statusLabels[status]}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {locationSummary} • Cập nhật {new Date(jobDetail.updatedAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
            href={`/recruiter/job-posts/${id}/edit`}
          >
            <PencilSimple aria-hidden className="h-4.5 w-4.5 text-slate-500" />
            Chỉnh sửa
          </Link>
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
            href={`/recruiter/candidates?jobId=${id}`}
          >
            <Users aria-hidden className="h-5 w-5" />
            Xem ứng viên
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Metrics Grid */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard label="Lượt xem" value={formatInteger(views)} />
            <MetricCard label="Hồ sơ" value={formatInteger(applications)} />
            <MetricCard label="Tỷ lệ ứng tuyển" value={formatPercent(conversionRate)} />
            <MetricCard label="Ứng viên mới" value="0" />
          </section>

          {/* Overview Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="mb-4 text-lg font-extrabold text-slate-950">Tổng quan tin tuyển dụng</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <OverviewItem
                icon={Building2}
                label="Công ty"
                value={jobDetail.company?.name ?? "Công ty tuyển dụng"}
              />
              <OverviewItem icon={MapPin} label="Địa điểm" value={locationSummary} />
              <OverviewItem
                icon={BriefcaseBusiness}
                label="Loại hình"
                value={jobDetail.employmentType?.name ?? "-"}
              />
              <OverviewItem
                icon={Globe2}
                label="Cấp độ kinh nghiệm"
                value={jobDetail.experienceLevel?.name ?? "-"}
              />
              <OverviewItem
                icon={Users}
                label="Số lượng tuyển"
                value={`${jobDetail.vacanciesCount} người`}
              />
              <OverviewItem
                icon={Clock3}
                label="Lương"
                value={
                  jobDetail.salaryIsVisible
                    ? jobDetail.salaryIsNegotiable
                      ? "Thương lượng"
                      : `${formatCurrency(jobDetail.salaryMin)} - ${formatCurrency(jobDetail.salaryMax)}`
                    : "Lương thỏa thuận"
                }
              />
              <OverviewItem icon={CalendarDays} label="Còn hạn" value={formatDaysLeft(daysLeft)} />
            </div>
          </section>

          {/* Content sections */}
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
            <ContentSection title="Mô tả công việc" content={jobDetail.description} />
            <div className="border-t border-slate-100" />
            <ContentSection title="Yêu cầu công việc" content={jobDetail.requirements} />
            <div className="border-t border-slate-100" />
            <ContentSection title="Quyền lợi" content={jobDetail.benefits} />
          </section>
        </div>

        {/* Right Sidebar Card */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="mb-4 text-lg font-extrabold text-slate-950">Hiệu quả tuyển dụng</h2>

            <div className="mb-5">
              <span className="mb-2 block text-xs font-bold text-slate-400">ĐÁNH GIÁ CHUNG</span>
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold",
                  effectivenessClasses[effectiveness],
                )}
              >
                Hiệu quả: {effectivenessLabels[effectiveness]}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <span className="mb-2 block text-xs font-bold text-slate-400">
                VIỆC NÊN LÀM TIẾP THEO
              </span>
              <p className="text-sm leading-relaxed font-semibold text-slate-600">
                {effectiveness === "good" &&
                  "Tin tuyển dụng đang hoạt động tốt. Bạn có thể đẩy tin để tiếp cận nhiều ứng viên hơn."}
                {effectiveness === "needsOptimization" &&
                  "Tỷ lệ ứng tuyển hơi thấp. Bạn nên cập nhật mô tả công việc hoặc tăng khoảng lương để thu hút thêm hồ sơ."}
                {effectiveness === "new" &&
                  "Tin tuyển dụng đang chờ duyệt hoặc mới tạo. Bạn có thể xem trước nội dung."}
                {effectiveness === "ok" &&
                  "Tin hoạt động ở mức ổn định. Tiếp tục theo dõi hồ sơ ứng tuyển từ các ứng viên."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-slate-950">{value}</p>
    </article>
  );
}

function OverviewItem({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}>) {
  return (
    <div className="flex gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon aria-hidden className="h-4.5 w-4.5" />
      </span>
      <div>
        <span className="block text-xs font-bold text-slate-400 uppercase">{label}</span>
        <span className="mt-0.5 block text-sm font-semibold text-slate-800">{value}</span>
      </div>
    </div>
  );
}

function ContentSection({ title, content }: Readonly<{ title: string; content: string | null }>) {
  if (!content) return null;
  return (
    <div>
      <h3 className="mb-3 text-base font-extrabold text-slate-950">{title}</h3>
      <div
        className="prose prose-slate prose-sm max-w-none text-sm leading-relaxed font-semibold text-slate-600"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
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

function formatCurrency(value: number | string | null) {
  if (value === null) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function buildLocationSummary(detail?: any) {
  const location = detail?.jobPostLocations?.[0]?.jobLocation;
  if (!location) {
    return "-";
  }
  return [location.city, location.district, location.country].filter(Boolean).join(", ");
}

function getDaysLeft(expiredAt: string | null) {
  if (!expiredAt) {
    return null;
  }
  return differenceInCalendarDays(new Date(expiredAt), new Date());
}

function mapJobPostStatus(
  status: string,
  moderationStatus: string | null,
  daysLeft: number | null,
): RecruiterJobPostStatus {
  if (moderationStatus === "REJECTED" || moderationStatus === "BLOCKED") {
    return "locked";
  }
  if (status === "DRAFT") {
    return "draft";
  }
  if (moderationStatus === "PENDING" || moderationStatus === "IN_REVIEW") {
    return "pending";
  }
  if (status === "CLOSED" || (daysLeft !== null && daysLeft < 0)) {
    return "expired";
  }
  if (status === "PUBLISHED" && daysLeft !== null && daysLeft <= 7) {
    return "expiring";
  }
  return "active";
}

function getEffectiveness(
  applications: number,
  conversionRate: number | null,
  status: RecruiterJobPostStatus,
) {
  if (status === "pending" || status === "draft") {
    return "new";
  }
  if (conversionRate !== null && conversionRate >= 8) {
    return "good";
  }
  if (applications >= 1) {
    return "ok";
  }
  return "needsOptimization";
}

function normalizeApplicationsCount(response: unknown) {
  if (Array.isArray(response)) {
    return response.length;
  }
  if (
    typeof response === "object" &&
    response !== null &&
    "items" in response &&
    Array.isArray(response.items)
  ) {
    return response.items.length;
  }
  if (
    typeof response === "object" &&
    response !== null &&
    "total" in response &&
    typeof response.total === "number"
  ) {
    return response.total;
  }
  return 0;
}
