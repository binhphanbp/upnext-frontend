"use client";

import { CaretLeft } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import {
  banCompanyForFraud,
  getAdminCompanyDetails,
  getAdminCompanyReputationActivities,
} from "@/features/admin/api/employers";
import { getAdminSession } from "@/features/admin/session";
import { Link } from "@/i18n/navigation";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

interface EmployerDetailsPageProps {
  employerId: string;
}

export function EmployerDetailsPage({ employerId }: EmployerDetailsPageProps) {
  const queryClient = useQueryClient();
  const [showReputationHistory, setShowReputationHistory] = useState(false);

  const {
    data: company,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminCompanyDetails", employerId],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminCompanyDetails(session.accessToken, employerId);
    },
    enabled: !!employerId,
  });

  const { data: reputationActivities } = useQuery({
    queryKey: ["adminCompanyReputationActivities", employerId],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminCompanyReputationActivities(session.accessToken, employerId);
    },
    enabled: !!employerId && showReputationHistory,
  });

  const banMutation = useMutation({
    mutationFn: async (reason: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return banCompanyForFraud(session.accessToken, employerId, reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCompanyDetails", employerId] });
      void Swal.fire({ icon: "success", title: "Đã ban công ty và đưa MST vào blacklist." });
    },
    onError: () => {
      void Swal.fire({ icon: "error", title: "Ban công ty thất bại." });
    },
  });

  async function handleBanForFraud() {
    const result = await Swal.fire({
      icon: "warning",
      title: "Ban công ty vì lừa đảo?",
      html: "Hành động này sẽ khoá vĩnh viễn công ty, ban toàn bộ tài khoản NTD trực thuộc, và đưa MST vào blacklist. Vui lòng nhập lý do:",
      input: "textarea",
      inputPlaceholder: "Lý do ban vĩnh viễn...",
      showCancelButton: true,
      confirmButtonText: "Xác nhận ban",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => (!value ? "Vui lòng nhập lý do." : undefined),
    });

    if (result.isConfirmed && result.value) {
      banMutation.mutate(result.value as string);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users/employers">
          <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
            <CaretLeft size={20} />
            Quay lại danh sách
          </Button>
        </Link>
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-error font-medium">Đã xảy ra lỗi khi tải dữ liệu công ty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/users/employers">
          <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
            <CaretLeft size={20} />
            Quay lại danh sách
          </Button>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Cover Image */}
        {company.coverFile?.publicUrl ? (
          <div className="h-48 w-full border-b border-slate-100 sm:h-72 lg:h-80">
            <img
              src={company.coverFile.publicUrl}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 w-full border-b border-slate-100 bg-gradient-to-r from-[#bfe9d6]/40 to-sky-100/50 sm:h-72 lg:h-80" />
        )}

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="z-10 -mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:-mt-16 sm:h-32 sm:w-32">
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50">
                {company.logoFile?.publicUrl ? (
                  <img
                    src={company.logoFile.publicUrl}
                    alt={company.name}
                    className="h-full w-full rounded-xl object-contain p-2"
                  />
                ) : (
                  <span className="text-4xl font-bold text-slate-400 uppercase sm:text-5xl">
                    {company.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 pt-2 sm:pt-4">
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              <p className="mt-1 text-slate-500">
                Mã số thuế:{" "}
                <span className="font-semibold text-slate-900">
                  {company.taxCode || "Chưa cập nhật"}
                </span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  tone={company.verificationStatus === "VERIFIED" ? "success" : "warning"}
                  className="px-3 py-1 text-sm"
                >
                  {company.verificationStatus === "VERIFIED" ? "Đã xác thực" : "Chờ duyệt"}
                </Badge>
                <Badge
                  tone={company.status === "ACTIVE" ? "success" : "error"}
                  className="px-3 py-1 text-sm"
                >
                  {company.status === "ACTIVE"
                    ? "Hoạt động"
                    : company.status === "RESTRICTED"
                      ? "Đang bị hạn chế"
                      : "Bị khóa"}
                </Badge>
                {company.type && (
                  <Badge tone="neutral" className="px-3 py-1 text-sm">
                    {company.type}
                  </Badge>
                )}
              </div>
            </div>
            {company.status !== "LOCKED" ? (
              <div className="pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={() => void handleBanForFraud()}
                  disabled={banMutation.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Ban vì lừa đảo
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Thông tin chi tiết</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Email liên hệ
              </p>
              <p className="font-medium text-slate-900">{company.email || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Số điện thoại
              </p>
              <p className="font-medium text-slate-900">{company.phone || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Website
              </p>
              <p className="font-medium text-slate-900">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  "Chưa cập nhật"
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Ngày tham gia
              </p>
              <p className="font-medium text-slate-900">{formatAppDate(company.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Quy mô nhân sự
              </p>
              <p className="font-medium text-slate-900">{company.companySize || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Phúc lợi
              </p>
              {company.benefits ? (
                <div
                  className="text-sm font-medium text-slate-900 [&>p]:mb-1 last:[&>p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: company.benefits }}
                />
              ) : (
                <p className="font-medium text-slate-900">Chưa cập nhật</p>
              )}
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Điểm uy tín
              </p>
              <div className="flex items-center gap-3">
                <p className="font-medium text-slate-900">{company.reputationScore || "0"}</p>
                <button
                  type="button"
                  onClick={() => setShowReputationHistory((prev) => !prev)}
                  className="text-primary text-xs font-semibold hover:underline"
                >
                  {showReputationHistory ? "Ẩn lịch sử" : "Xem lịch sử biến động"}
                </button>
              </div>
              {showReputationHistory ? (
                <ul className="mt-2 space-y-1.5 rounded-lg bg-white p-3 ring-1 ring-slate-100">
                  {!reputationActivities || reputationActivities.length === 0 ? (
                    <li className="text-xs text-slate-400">Chưa có biến động điểm nào.</li>
                  ) : (
                    reputationActivities.map((activity) => {
                      const delta = Number(activity.score);
                      return (
                        <li
                          key={activity.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-600">
                            {activity.reason || activity.actionType} —{" "}
                            {formatAppDate(activity.createdAt)}
                          </span>
                          <span
                            className={
                              delta >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"
                            }
                          >
                            {delta >= 0 ? `+${delta}` : delta}
                          </span>
                        </li>
                      );
                    })
                  )}
                </ul>
              ) : null}
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Số lượng thành viên
              </p>
              <p className="font-medium text-slate-900">{company.members?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Tài khoản tuyển dụng
              </p>
              <p className="font-medium text-slate-900">{company.recruiterAccounts?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Tin tuyển dụng
              </p>
              <p className="font-medium text-slate-900">{company.jobPosts?.length || 0}</p>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Địa chỉ
              </p>
              <p className="font-medium text-slate-900">{company.address || "Chưa cập nhật"}</p>
            </div>
            {(company.description || company.shortDescription) && (
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  Mô tả công ty
                </p>
                <div
                  className="text-sm leading-relaxed font-medium text-slate-900 [&>p]:mb-2 last:[&>p]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: company.description || company.shortDescription || "",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Future sections like Members, Job Posts can go here */}
    </div>
  );
}
