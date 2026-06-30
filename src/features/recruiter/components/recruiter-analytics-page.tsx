"use client";

import {
  ArrowUp,
  Briefcase,
  CaretLeft,
  CaretRight,
  ChartBar,
  ChartLineUp,
  CircleNotch,
  Eye,
  Users,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { RecruiterTableLayout } from "./recruiter-table-layout";

type JobStatusKey = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

const STATUS_LABELS: Record<JobStatusKey, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đang đăng",
  CLOSED: "Đã đóng",
  ARCHIVED: "Lưu trữ",
};

const STATUS_COLORS: Record<JobStatusKey, string> = {
  DRAFT: "bg-slate-400",
  PUBLISHED: "bg-emerald-500",
  CLOSED: "bg-red-400",
  ARCHIVED: "bg-amber-400",
};

const MODERATION_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
      <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
      Đang tải dữ liệu phân tích...
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`flex size-10 items-center justify-center rounded-xl ${accent} text-white`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
      </div>
    </div>
  );
}

function StatusDistributionChart({ jobPosts }: { jobPosts: RecruiterJobPost[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { DRAFT: 0, PUBLISHED: 0, CLOSED: 0, ARCHIVED: 0 };
    for (const jp of jobPosts) {
      if (jp.status in map) map[jp.status] = (map[jp.status] ?? 0) + 1;
    }
    return map;
  }, [jobPosts]);

  const total = jobPosts.length || 1;
  const statuses: JobStatusKey[] = ["PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ChartBar size={22} weight="bold" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Phân bổ theo trạng thái</h3>
          <p className="text-xs text-slate-400">Tổng {jobPosts.length} tin tuyển dụng</p>
        </div>
      </div>

      <div className="space-y-3">
        {statuses.map((status) => {
          const count = counts[status] ?? 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{STATUS_LABELS[status]}</span>
                <span>
                  {count} tin · {pct}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopJobPostsChart({ jobPosts }: { jobPosts: RecruiterJobPost[] }) {
  const top5 = useMemo(() => {
    return [...jobPosts]
      .sort((a, b) => (b._count?.applications ?? 0) - (a._count?.applications ?? 0))
      .slice(0, 5);
  }, [jobPosts]);

  const maxApplications = Math.max(...top5.map((jp) => jp._count?.applications ?? 0).concat(1));

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ArrowUp size={22} weight="bold" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Top tin tuyển dụng thu hút</h3>
          <p className="text-xs text-slate-400">Theo số lượng hồ sơ ứng tuyển</p>
        </div>
      </div>

      <div className="space-y-4">
        {top5.map((jp) => {
          const apps = jp._count?.applications ?? 0;
          const pct = Math.round((apps / maxApplications) * 100);
          return (
            <div key={jp.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="max-w-[70%] truncate text-slate-700">{jp.title}</span>
                <span className="text-slate-500">{apps} ứng viên</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {top5.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-slate-400">
            Chưa có dữ liệu tin tuyển dụng
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const toneMap: Record<string, "success" | "neutral" | "warning" | "error"> = {
    PUBLISHED: "success",
    DRAFT: "neutral",
    CLOSED: "error",
    ARCHIVED: "warning",
  };
  return (
    <Badge tone={toneMap[status] ?? "neutral"}>
      {STATUS_LABELS[status as JobStatusKey] ?? status}
    </Badge>
  );
}

function ModerationBadge({ status }: { status: string }) {
  const toneMap: Record<string, "success" | "neutral" | "warning" | "error"> = {
    APPROVED: "success",
    PENDING: "warning",
    REJECTED: "error",
  };
  return <Badge tone={toneMap[status] ?? "neutral"}>{MODERATION_LABELS[status] ?? status}</Badge>;
}

function JobPostsTable({ jobPosts }: { jobPosts: RecruiterJobPost[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalItems = jobPosts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedJobPosts = useMemo(() => {
    return jobPosts.slice(startIndex, endIndex);
  }, [jobPosts, startIndex, endIndex]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const showStart = totalItems === 0 ? 0 : startIndex + 1;

  return (
    <div>
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-base font-bold text-slate-800">Chi tiết hiệu quả từng tin</h3>
      </div>
      <RecruiterTableLayout loading={false}>
        <thead className="bg-slate-50/75 text-left text-xs font-bold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3" scope="col">
              Tin tuyển dụng
            </th>
            <th className="px-5 py-3" scope="col">
              Trạng thái
            </th>
            <th className="px-5 py-3" scope="col">
              Kiểm duyệt
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              Ứng viên
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              Lượt xem
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              Ngày đăng
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedJobPosts.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-xs font-semibold text-slate-400">
                Chưa có tin tuyển dụng nào được tạo
              </td>
            </tr>
          ) : (
            paginatedJobPosts.map((jp) => (
              <tr key={jp.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-4 font-bold text-slate-800">{jp.title}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={jp.status} />
                </td>
                <td className="px-5 py-4">
                  <ModerationBadge status={jp.moderationStatus} />
                </td>
                <td className="px-5 py-4 text-right font-semibold text-slate-700">
                  {jp._count?.applications ?? 0}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-slate-700">
                  {jp._count?.views ?? 0}
                </td>
                <td className="px-5 py-4 text-right text-xs text-slate-400">
                  {jp.publishedAt ? formatDate(jp.publishedAt) : formatDate(jp.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </RecruiterTableLayout>

      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Hiển thị {showStart} - {endIndex} trên tổng số {totalItems} tin tuyển dụng.
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Trang trước</span>
              <CaretLeft weight="bold" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "primary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Trang tiếp</span>
              <CaretRight weight="bold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RecruiterAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobPosts, setJobPosts] = useState<RecruiterJobPost[]>([]);

  const loadData = useCallback(
    async (token: string, recruiterId: string) => {
      try {
        setLoading(true);
        const jobPostsData = await getRecruiterJobPosts(token, recruiterId);
        setJobPosts(jobPostsData);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          localStorage.removeItem("upnext.recruiter.accessToken");
          localStorage.removeItem("upnext.recruiter.tokenType");
          localStorage.removeItem("upnext.recruiter.user");
          router.replace("/recruiter/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
    const rawUser = localStorage.getItem("upnext.recruiter.user");

    if (!accessToken || !rawUser) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as { id: string };
      void loadData(accessToken, parsedUser.id);
    } catch {
      router.replace("/recruiter/login");
    }
  }, [loadData, router]);

  // Derived KPIs
  const totalJobPosts = jobPosts.length;

  const totalCandidates = useMemo(
    () => jobPosts.reduce((sum, jp) => sum + (jp._count?.applications ?? 0), 0),
    [jobPosts],
  );

  const publishedCount = useMemo(
    () => jobPosts.filter((jp) => jp.status === "PUBLISHED").length,
    [jobPosts],
  );

  const applicationRate = useMemo(() => {
    if (totalJobPosts === 0) return "—";
    return (totalCandidates / totalJobPosts).toFixed(1);
  }, [totalCandidates, totalJobPosts]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">Phân tích tuyển dụng</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tổng quan hiệu quả hoạt động tuyển dụng của công ty bạn
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <section aria-label="Chỉ số tuyển dụng" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Tổng tin tuyển dụng"
          value={totalJobPosts.toLocaleString("vi-VN")}
          sub="Tất cả trạng thái"
          icon={<Briefcase size={20} weight="bold" />}
          accent="bg-[#10a778]"
        />
        <KpiCard
          title="Tổng ứng viên"
          value={totalCandidates.toLocaleString("vi-VN")}
          sub="Tổng lượt ứng tuyển"
          icon={<Users size={20} weight="bold" />}
          accent="bg-[#5d87ff]"
        />
        <KpiCard
          title="Tin đang đăng"
          value={publishedCount.toLocaleString("vi-VN")}
          sub="Trạng thái công khai"
          icon={<Eye size={20} weight="bold" />}
          accent="bg-emerald-600"
        />
        <KpiCard
          title="Tỷ lệ ứng tuyển / tin"
          value={applicationRate}
          sub="Ứng viên trung bình mỗi tin"
          icon={<ChartLineUp size={20} weight="bold" />}
          accent="bg-amber-500"
        />
      </section>

      {/* Charts */}
      <section aria-label="Biểu đồ phân tích" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StatusDistributionChart jobPosts={jobPosts} />
        <TopJobPostsChart jobPosts={jobPosts} />
      </section>

      {/* Detail table */}
      <section aria-label="Chi tiết tin tuyển dụng">
        <JobPostsTable jobPosts={jobPosts} />
      </section>
    </div>
  );
}
