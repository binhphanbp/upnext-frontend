"use client";

import {
  ArrowsClockwise,
  Buildings,
  CalendarBlank,
  CheckCircle,
  Clock,
  Crown,
  FileText,
  Info,
  MagnifyingGlass,
  SealCheck,
  ShieldCheck,
  ShieldWarning,
  TrendDown,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import {
  getCompany,
  getRecruiterAccount,
  type CompanyDetail,
} from "@/features/recruiter/api/onboarding";
import {
  getReputationActivities,
  type ReputationActivity,
} from "@/features/recruiter/api/reputation";
import { getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

type ReputationTier = "elite" | "trusted" | "standard" | "warning" | "locked";

const REPUTATION_TIERS: ReadonlyArray<{
  id: ReputationTier;
  label: string;
  range: string;
  min: number;
  max: number;
  description: string;
  badgeTone: "success" | "info" | "warning" | "error" | "neutral";
  barColor: string;
  textColor: string;
  bgColor: string;
}> = [
  {
    id: "locked",
    label: "Bị khóa",
    range: "< 30",
    min: 0,
    max: 29,
    description: "Tài khoản bị tạm ngừng hoạt động tuyển dụng, ẩn toàn bộ bài đăng.",
    badgeTone: "error",
    barColor: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  {
    id: "warning",
    label: "Cảnh báo",
    range: "30 - 49",
    min: 30,
    max: 49,
    description:
      "Giảm mức độ hiển thị tin tuyển dụng trên hệ thống, yêu cầu cải thiện chất lượng phản hồi.",
    badgeTone: "warning",
    barColor: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
  },
  {
    id: "standard",
    label: "Tiêu chuẩn",
    range: "50 - 69",
    min: 50,
    max: 69,
    description:
      "Hồ sơ doanh nghiệp cơ bản, sử dụng các tính năng tuyển dụng theo hạn mức tiêu chuẩn.",
    badgeTone: "info",
    barColor: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "trusted",
    label: "Tin cậy",
    range: "70 - 89",
    min: 70,
    max: 89,
    description:
      "Doanh nghiệp đã xác thực thông tin đầy đủ, sử dụng toàn bộ tính năng và hỗ trợ ưu tiên.",
    badgeTone: "success",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  {
    id: "elite",
    label: "Ưu tú (Top Company)",
    range: "90 - 100",
    min: 90,
    max: 100,
    description:
      "Gắn nhãn Nhà tuyển dụng uy tín, ưu tiên vị trí hiển thị đầu trong kết quả tìm kiếm việc làm.",
    badgeTone: "success",
    barColor: "bg-emerald-600",
    textColor: "text-emerald-800",
    bgColor: "bg-emerald-50/80 border-emerald-300",
  },
];

const REPUTATION_SCALE_MAX = 100;

function getReputationTier(score: number) {
  return [...REPUTATION_TIERS].reverse().find((tier) => score >= tier.min) ?? REPUTATION_TIERS[0]!;
}

export function RecruiterCompanyReputationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [activities, setActivities] = useState<ReputationActivity[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "GAIN" | "LOSS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const session = getRecruiterSession();
      if (!session) {
        router.replace("/recruiter/login");
        return;
      }

      const account = await getRecruiterAccount(session.user.id, session.accessToken);
      if (account?.company?.id) {
        const [companyData, activitiesData] = await Promise.all([
          getCompany(account.company.id, session.accessToken),
          getReputationActivities(account.company.id, session.accessToken),
        ]);
        setCompany(companyData);
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu điểm uy tín:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const score = useMemo(() => {
    const raw = Number(company?.reputationScore ?? 100);
    return Number.isFinite(raw) ? Math.max(0, Math.min(REPUTATION_SCALE_MAX, raw)) : 100;
  }, [company?.reputationScore]);

  const currentTier = useMemo(() => getReputationTier(score), [score]);
  const scorePercent = Math.round((score / REPUTATION_SCALE_MAX) * 100);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const delta = Number(act.score);
      if (filterType === "GAIN" && delta <= 0) return false;
      if (filterType === "LOSS" && delta >= 0) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text =
          `${act.reason || ""} ${act.actionType} ${act.byAdmin?.fullName || ""}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [activities, filterType, searchQuery]);

  const totalGain = useMemo(() => {
    return activities.filter((a) => Number(a.score) > 0).length;
  }, [activities]);

  const totalLoss = useMemo(() => {
    return activities.filter((a) => Number(a.score) < 0).length;
  }, [activities]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Điểm uy tín doanh nghiệp
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hệ thống chấm điểm tín nhiệm và quản lý lịch sử biến động điểm của doanh nghiệp
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="h-9 border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowsClockwise
              size={14}
              className={cn("mr-1.5", refreshing && "animate-spin text-emerald-600")}
            />
            {refreshing ? "Đang đồng bộ..." : "Làm mới dữ liệu"}
          </Button>
        </div>
      </div>

      {/* 4 Thống kê tổng quan dạng thẻ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Điểm hiện tại */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Điểm tín nhiệm
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <ShieldCheck size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{Math.round(score)}</span>
            <span className="text-xs font-medium text-slate-400">/ 100 điểm</span>
          </div>
          <div className="mt-2">
            <Badge tone={currentTier.badgeTone} className="text-[11px] font-semibold">
              {currentTier.label}
            </Badge>
          </div>
        </Card>

        {/* Trạng thái xác thực */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Hồ sơ pháp lý
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <SealCheck size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900">
              {company?.verificationStatus === "VERIFIED"
                ? "Đã xác thực"
                : company?.verificationStatus === "PENDING"
                  ? "Đang chờ duyệt"
                  : "Chưa xác thực"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {company?.taxCode ? `MST: ${company.taxCode}` : "Chưa cập nhật mã số thuế"}
          </p>
        </Card>

        {/* Điều kiện đăng tin */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Quyền đăng tuyển
            </span>
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-md",
                score >= 30 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {score >= 30 ? (
                <CheckCircle size={16} weight="bold" />
              ) : (
                <WarningCircle size={16} weight="bold" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-base font-bold",
                score >= 30 ? "text-emerald-700" : "text-red-700",
              )}
            >
              {score >= 30 ? "Đủ điều kiện đăng bài" : "Bị hạn chế đăng bài"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Yêu cầu tối thiểu: 30 điểm</p>
        </Card>

        {/* Biến động điểm */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Lịch sử ghi nhận
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Clock size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{activities.length}</span>
            <span className="text-xs font-medium text-slate-400">lần biến động</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="font-medium text-emerald-700">+{totalGain} cộng</span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-red-700">-{totalLoss} trừ</span>
          </div>
        </Card>
      </div>

      {/* Thước đo Thang điểm Uy tín */}
      <Card className="border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Thang điểm tín nhiệm tuyển dụng</h2>
            <p className="text-xs text-slate-500">
              Điểm số hiện tại của công ty:{" "}
              <strong className="text-slate-800">{Math.round(score)}/100</strong> — Hạng:{" "}
              <strong className={currentTier.textColor}>{currentTier.label}</strong>
            </p>
          </div>
        </div>

        {/* Progress bar with marks */}
        <div className="mt-5 space-y-2">
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                currentTier.barColor,
              )}
              style={{ width: `${scorePercent}%` }}
            />
            {REPUTATION_TIERS.filter((t) => t.min > 0).map((tier) => (
              <span
                key={tier.id}
                className="absolute top-0 h-full w-px bg-white/90 shadow-xs"
                style={{ left: `${tier.min}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>0</span>
            <span>30 (Cảnh báo)</span>
            <span>50 (Tiêu chuẩn)</span>
            <span>70 (Tin cậy)</span>
            <span>90 (Ưu tú)</span>
            <span>100</span>
          </div>
        </div>

        {/* Danh sách các phân hạng */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPUTATION_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier.id;
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-lg border p-3.5 transition-colors",
                  isCurrent
                    ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{tier.label}</span>
                    {isCurrent && (
                      <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{tier.range} đ</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{tier.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bảng Lịch sử biến động điểm uy tín */}
      <Card className="border-slate-200/90 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lịch sử biến động điểm uy tín</h2>
              <p className="text-xs text-slate-500">
                Nhật ký chi tiết các sự kiện cộng hoặc trừ điểm tín nhiệm của doanh nghiệp
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setFilterType("ALL")}
                  className={cn(
                    "rounded-md px-3 py-1 transition",
                    filterType === "ALL"
                      ? "bg-white font-bold text-slate-900 shadow-xs"
                      : "hover:text-slate-900",
                  )}
                >
                  Tất cả ({activities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("GAIN")}
                  className={cn(
                    "rounded-md px-3 py-1 transition",
                    filterType === "GAIN"
                      ? "bg-white font-bold text-emerald-700 shadow-xs"
                      : "hover:text-slate-900",
                  )}
                >
                  Điểm cộng (+{totalGain})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("LOSS")}
                  className={cn(
                    "rounded-md px-3 py-1 transition",
                    filterType === "LOSS"
                      ? "bg-white font-bold text-red-700 shadow-xs"
                      : "hover:text-slate-900",
                  )}
                >
                  Điểm trừ (-{totalLoss})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm theo lý do / hành động..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3.5 pr-4 pl-5">Thời gian</th>
                <th className="px-4 py-3.5">Hành động / Sự kiện</th>
                <th className="px-4 py-3.5">Biến động</th>
                <th className="px-4 py-3.5">Lý do & Diễn giải</th>
                <th className="py-3.5 pr-5 pl-4">Thực hiện bởi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <CalendarBlank size={32} className="mx-auto mb-2 text-slate-300" />
                    Chưa có sự kiện biến động điểm nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const delta = Number(act.score);
                  const isPositive = delta > 0;
                  const isNegative = delta < 0;

                  return (
                    <tr key={act.id} className="transition hover:bg-slate-50/50">
                      <td className="py-3.5 pr-4 pl-5 font-medium whitespace-nowrap text-slate-600">
                        {new Date(act.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {act.actionType || "Điều chỉnh điểm uy tín"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                            isPositive
                              ? "bg-emerald-50 text-emerald-700"
                              : isNegative
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {isPositive && <TrendUp size={12} weight="bold" />}
                          {isNegative && <TrendDown size={12} weight="bold" />}
                          {isPositive ? `+${delta}` : delta} điểm
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3.5 text-slate-600">
                        {act.reason || "Cập nhật hệ thống định kỳ"}
                      </td>
                      <td className="py-3.5 pr-5 pl-4 whitespace-nowrap text-slate-500">
                        {act.byAdmin ? (
                          <span className="font-medium text-slate-700">
                            {act.byAdmin.fullName} (Admin)
                          </span>
                        ) : (
                          <span className="text-slate-400">Hệ thống tự động</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quy định & Hướng dẫn nghiệp vụ tính điểm */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Tiêu chuẩn cộng điểm */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <TrendUp size={16} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Cách gia tăng điểm uy tín</h3>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Hoàn thiện 100% hồ sơ:</strong> Cung cấp đầy đủ thông tin pháp lý, hình ảnh
                văn phòng, địa chỉ làm việc rõ ràng (+5 đến +10 điểm).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Xác thực giấy phép kinh doanh:</strong> Được Quản trị viên duyệt minh chứng
                doanh nghiệp hợp lệ (+20 điểm).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Tỷ lệ phản hồi CV đúng hạn:</strong> Phản hồi kết quả ứng tuyển cho ứng viên
                trong vòng 7 ngày làm việc (+5 điểm định kỳ).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Đánh giá tích cực:</strong> Nhận các phản hồi và đánh giá hài lòng từ ứng
                viên sau quá trình phỏng vấn.
              </span>
            </li>
          </ul>
        </Card>

        {/* Tiêu chuẩn trừ điểm & Chế tài */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-red-50 text-red-700">
              <ShieldWarning size={16} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Quy định trừ điểm & Chế tài</h3>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-slate-600">
            <li className="flex items-start gap-2">
              <WarningCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
              <span>
                <strong>Bỏ rơi CV ứng viên:</strong> Không xem xét hoặc để hồ sơ ứng tuyển quá hạn
                trên 14 ngày liên tục (-5 điểm).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <WarningCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
              <span>
                <strong>Tin tuyển dụng sai sự thật:</strong> Đăng tải thông tin mức lương hoặc địa
                điểm không chính xác (-10 đến -20 điểm).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <WarningCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
              <span>
                <strong>Bị ứng viên khiếu nại:</strong> Bị báo cáo thu phí ứng viên hoặc hành vi
                thiếu chuyên nghiệp sau kiểm duyệt (-30 điểm).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <WarningCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
              <span>
                <strong>Dưới 30 điểm (Bị khóa):</strong> Tài khoản tự động bị khóa đăng tin và phải
                gửi kháng cáo giải trình để mở lại.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
