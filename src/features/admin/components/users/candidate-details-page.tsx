"use client";

import { CaretLeft } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { getAdminCandidateDetails } from "@/features/admin/api/candidates";
import { getAdminSession } from "@/features/admin/session";
import { Link } from "@/i18n/navigation";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

interface CandidateDetailsPageProps {
  candidateId: string;
}

export function CandidateDetailsPage({ candidateId }: CandidateDetailsPageProps) {
  const {
    data: candidate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminCandidateDetails", candidateId],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminCandidateDetails(session.accessToken, candidateId);
    },
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users/candidates">
          <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
            <CaretLeft size={20} />
            Quay lại danh sách
          </Button>
        </Link>
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-error font-medium">Đã xảy ra lỗi khi tải thông tin ứng viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/users/candidates">
          <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
            <CaretLeft size={20} />
            Quay lại danh sách
          </Button>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <div className="bg-muted flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-slate-200">
            <span className="text-muted-foreground text-4xl font-bold uppercase">
              {candidate.fullName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{candidate.fullName}</h1>
            <p className="mt-1 text-slate-500">
              Email: <span className="font-semibold text-slate-900">{candidate.email}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                tone={
                  candidate.candidateAccountStatus === "ACTIVE"
                    ? "success"
                    : candidate.candidateAccountStatus === "PENDING_VERIFICATION"
                      ? "warning"
                      : "error"
                }
                className="px-3 py-1 text-sm"
              >
                {candidate.candidateAccountStatus === "ACTIVE"
                  ? "Hoạt động"
                  : candidate.candidateAccountStatus === "PENDING_VERIFICATION"
                    ? "Chờ xác thực"
                    : "Bị khóa"}
              </Badge>
              <Badge tone="neutral" className="px-3 py-1 text-sm">
                Đăng nhập: {candidate.authProvider}
              </Badge>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Thông tin tài khoản</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Phương thức đăng nhập
              </p>
              <p className="font-medium text-slate-900">{candidate.authProvider}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Xác thực Email
              </p>
              <p className="font-medium text-slate-900">
                {candidate.emailVerifiedAt ? (
                  <span className="text-success">
                    Đã xác thực ({formatAppDate(candidate.emailVerifiedAt)})
                  </span>
                ) : (
                  <span className="text-warning">Chưa xác thực</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Ngày tham gia
              </p>
              <p className="font-medium text-slate-900">{formatAppDate(candidate.createdAt)}</p>
            </div>
            {candidate.providerUserId && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Provider ID
                </p>
                <p className="font-medium text-slate-900">{candidate.providerUserId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
