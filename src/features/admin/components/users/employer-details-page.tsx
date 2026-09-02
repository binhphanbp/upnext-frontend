"use client";

import { CaretDown, CaretLeft, CaretUp, Check, Prohibit, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import {
  banCompanyForFraud,
  getAdminCompanyDetails,
  getAdminCompanyReputationActivities,
  uploadVerificationEvidenceIds,
  verifyCompany,
} from "@/features/admin/api/employers";
import {
  CompanyRejectDialog,
  type CompanyRejectInput,
} from "@/features/admin/components/users/company-reject-dialog";
import { getAdminSession } from "@/features/admin/session";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
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
  // Cover images come from user uploads, so a stale or unreachable URL must fall
  // back to the placeholder instead of rendering a broken-image icon.
  const [isCoverBroken, setIsCoverBroken] = useState(false);
  const [isLogoBroken, setIsLogoBroken] = useState(false);
  const [areBenefitsExpanded, setAreBenefitsExpanded] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

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

  function invalidateCompany() {
    void queryClient.invalidateQueries({ queryKey: ["adminCompanyDetails", employerId] });
    void queryClient.invalidateQueries({ queryKey: ["adminEmployers"] });
  }

  const approveMutation = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return verifyCompany(session.accessToken, employerId, "VERIFIED");
    },
    onSuccess: () => {
      invalidateCompany();
      void Swal.fire({ icon: "success", title: "Đã duyệt hồ sơ và gửi email cho nhà tuyển dụng." });
    },
    onError: (mutationError) => {
      void Swal.fire({
        icon: "error",
        title:
          mutationError instanceof ApiError && mutationError.status === 409
            ? mutationError.message
            : "Duyệt hồ sơ thất bại.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (input: CompanyRejectInput) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      const evidenceFileIds = await uploadVerificationEvidenceIds(
        input.evidence,
        session.accessToken,
      );
      return verifyCompany(session.accessToken, employerId, "REJECTED", {
        reason: input.reason,
        guidance: input.guidance,
        evidenceFileIds,
      });
    },
    onSuccess: () => {
      setIsRejectOpen(false);
      invalidateCompany();
      void Swal.fire({
        icon: "success",
        title: "Đã từ chối hồ sơ và gửi email cho nhà tuyển dụng.",
      });
    },
    onError: (mutationError) => {
      void Swal.fire({
        icon: "error",
        title:
          mutationError instanceof ApiError && mutationError.status === 409
            ? mutationError.message
            : "Từ chối hồ sơ thất bại.",
      });
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

  // Measure the text without its markup so the toggle only appears when the copy is
  // actually long enough to be clamped.
  const benefitsTextLength = (company.benefits ?? "")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim().length;
  const isBenefitsLong = benefitsTextLength > 180;

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
        {company.coverFile?.publicUrl && !isCoverBroken ? (
          <div className="h-36 w-full border-b border-slate-100 sm:h-48 lg:h-56">
            {/* Covers are served from whichever storage provider is configured. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.coverFile.publicUrl}
              alt={`Ảnh bìa ${company.name}`}
              className="h-full w-full object-cover"
              onError={() => setIsCoverBroken(true)}
            />
          </div>
        ) : (
          <div className="h-36 w-full border-b border-slate-100 bg-gradient-to-r from-[#bfe9d6]/40 to-sky-100/50 sm:h-48 lg:h-56" />
        )}

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="z-10 -mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:-mt-16 sm:h-32 sm:w-32">
              {company.logoFile?.publicUrl && !isLogoBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoFile.publicUrl}
                  alt={`Logo ${company.name}`}
                  className="h-full w-full object-cover"
                  onError={() => setIsLogoBroken(true)}
                />
              ) : (
                <span className="text-4xl font-bold text-slate-400 uppercase sm:text-5xl">
                  {company.name.charAt(0)}
                </span>
              )}
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
                  tone={
                    company.verificationStatus === "VERIFIED"
                      ? "success"
                      : company.verificationStatus === "REJECTED"
                        ? "error"
                        : "warning"
                  }
                  className="px-3 py-1 text-sm"
                >
                  {company.verificationStatus === "VERIFIED"
                    ? "Đã xác thực"
                    : company.verificationStatus === "REJECTED"
                      ? "Hồ sơ bị từ chối"
                      : company.verificationStatus === "PENDING"
                        ? "Chờ duyệt"
                        : "Chưa xác thực"}
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
              <div className="flex shrink-0 flex-wrap gap-2 pt-2 sm:pt-4">
                {/* Chỉ hồ sơ đang chờ duyệt mới có gì để quyết định; gọi lại cùng một
                    trạng thái sẽ bị server trả 409. */}
                {company.verificationStatus === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Check size={16} weight="bold" />
                      {approveMutation.isPending ? "Đang duyệt…" : "Duyệt hồ sơ"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-error text-error"
                      onClick={() => setIsRejectOpen(true)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <X size={16} weight="bold" />
                      Từ chối
                    </Button>
                  </>
                ) : null}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleBanForFraud()}
                  disabled={banMutation.isPending}
                >
                  <Prohibit size={16} weight="bold" />
                  {banMutation.isPending ? "Đang chặn…" : "Chặn vì lừa đảo"}
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
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Email liên hệ
              </p>
              <p className="font-medium text-slate-900">{company.email || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Số điện thoại
              </p>
              <p className="font-medium text-slate-900">{company.phone || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Ngày tham gia
              </p>
              <p className="font-medium text-slate-900">{formatAppDate(company.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Quy mô nhân sự
              </p>
              <p className="font-medium text-slate-900">{company.companySize || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Phúc lợi
              </p>
              {company.benefits ? (
                <div>
                  {/* Benefits are authored in a rich-text editor, so the collapsed state caps
                      the height rather than slicing the string and breaking the markup. */}
                  <div className="relative">
                    <div
                      className={cn(
                        "text-sm font-medium text-slate-900 [&>p]:mb-1 last:[&>p]:mb-0",
                        !areBenefitsExpanded && isBenefitsLong && "max-h-24 overflow-hidden",
                      )}
                      dangerouslySetInnerHTML={{ __html: company.benefits }}
                    />
                    {!areBenefitsExpanded && isBenefitsLong ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
                    ) : null}
                  </div>
                  {isBenefitsLong ? (
                    <button
                      type="button"
                      onClick={() => setAreBenefitsExpanded((prev) => !prev)}
                      className="text-primary mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    >
                      {areBenefitsExpanded ? (
                        <>
                          Thu gọn <CaretUp size={12} weight="bold" />
                        </>
                      ) : (
                        <>
                          Xem thêm <CaretDown size={12} weight="bold" />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="font-medium text-slate-900">Chưa cập nhật</p>
              )}
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
                              delta >= 0
                                ? "font-semibold text-emerald-600"
                                : "font-semibold text-red-600"
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
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Số lượng thành viên
              </p>
              <p className="font-medium text-slate-900">{company.members?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Tài khoản tuyển dụng
              </p>
              <p className="font-medium text-slate-900">{company.recruiterAccounts?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Tin tuyển dụng
              </p>
              <p className="font-medium text-slate-900">{company.jobPosts?.length || 0}</p>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Địa chỉ
              </p>
              <p className="font-medium text-slate-900">{company.address || "Chưa cập nhật"}</p>
            </div>
            {(company.description || company.shortDescription) && (
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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

      <CompanyRejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        companyName={company.name}
        isSubmitting={rejectMutation.isPending}
        onSubmit={async (input) => {
          try {
            await rejectMutation.mutateAsync(input);
          } catch {
            // `onError` đã báo lỗi; giữ dialog mở để admin thử lại.
          }
        }}
      />
    </div>
  );
}
