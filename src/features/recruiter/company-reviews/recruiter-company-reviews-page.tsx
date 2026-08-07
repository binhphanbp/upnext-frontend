"use client";

import { ArrowsCounterClockwise, CaretLeft, CaretRight, Flag, Star } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getMyCompanyReviews,
  reportCompanyReview,
  type MyCompanyReview,
  type MyCompanyReviewsSummary,
} from "@/features/recruiter/company-reviews/api";
import { getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
});

const PAGE_SIZE = 10;
const ALL_RATINGS = "all";
const STARS = [5, 4, 3, 2, 1] as const;

const SECTION_LABELS: Array<{
  key: keyof MyCompanyReviewsSummary["averageBySection"];
  label: string;
}> = [
  { key: "salaryBenefits", label: "Lương & phúc lợi" },
  { key: "trainingLearning", label: "Đào tạo & học hỏi" },
  { key: "managementCare", label: "Sự quan tâm của quản lý" },
  { key: "cultureFun", label: "Văn hóa & hoạt động" },
  { key: "officeWorkspace", label: "Văn phòng, không gian" },
  { key: "overtimeSatisfaction", label: "Mức hài lòng tăng ca" },
];

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-400"
      aria-label={`${value} trên 5 sao`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} weight={star <= Math.round(value) ? "fill" : "regular"} />
      ))}
    </span>
  );
}

/** A report can only be filed once per recruiter, so the state drives the action. */
function ReportState({
  review,
  isReporting,
  onReport,
}: {
  review: MyCompanyReview;
  isReporting: boolean;
  onReport: () => void;
}) {
  if (!review.myReport) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-slate-200 text-slate-600"
        disabled={isReporting}
        onClick={onReport}
      >
        <Flag size={14} />
        Báo cáo
      </Button>
    );
  }

  if (review.myReport.status === "REJECTED") {
    return (
      <Badge tone="error" title={`Lý do bạn đã gửi: ${review.myReport.reason}`}>
        Báo cáo bị từ chối
      </Badge>
    );
  }

  return (
    <Badge tone="warning" title={`Lý do bạn đã gửi: ${review.myReport.reason}`}>
      Đang chờ admin xử lý
    </Badge>
  );
}

export function RecruiterCompanyReviewsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>(ALL_RATINGS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }
    setToken(session.accessToken);
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [ratingFilter]);

  const reviewsQuery = useQuery({
    enabled: Boolean(token),
    queryKey: ["recruiter-company-reviews", ratingFilter, page],
    queryFn: () =>
      getMyCompanyReviews(token!, {
        page,
        limit: PAGE_SIZE,
        overallRating: ratingFilter === ALL_RATINGS ? undefined : Number(ratingFilter),
      }),
  });

  const reportMutation = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      reportCompanyReview(token!, reviewId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recruiter-company-reviews"] });
      void toast.fire({ icon: "success", title: "Đã gửi báo cáo tới quản trị viên." });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status === 409
          ? "Bạn đã báo cáo đánh giá này rồi."
          : "Không thể gửi báo cáo. Vui lòng thử lại.";
      void toast.fire({ icon: "error", title: message });
    },
  });

  async function handleReport(review: MyCompanyReview) {
    const result = await Swal.fire({
      title: "Báo cáo đánh giá này",
      input: "textarea",
      inputLabel: "Lý do báo cáo",
      inputPlaceholder: "Vì sao bạn cho rằng đánh giá này không phù hợp?",
      showCancelButton: true,
      confirmButtonText: "Gửi báo cáo",
      cancelButtonText: "Hủy",
      inputValidator: (value) => (!value ? "Vui lòng nhập lý do." : undefined),
    });

    if (result.isConfirmed && result.value) {
      reportMutation.mutate({ reviewId: review.id, reason: result.value as string });
    }
  }

  // A recruiter with no company gets a 403 from the endpoint rather than an empty list.
  const isMissingCompany =
    reviewsQuery.error instanceof ApiError && reviewsQuery.error.status === 403;

  if (isMissingCompany) {
    return (
      <Card className="flex h-56 flex-col items-center justify-center gap-2 border border-slate-200 p-6 text-center">
        <p className="font-semibold text-slate-900">Tài khoản của bạn chưa thuộc công ty nào.</p>
        <p className="text-sm text-slate-500">
          Hãy hoàn tất hồ sơ công ty trước khi xem đánh giá từ ứng viên.
        </p>
      </Card>
    );
  }

  if (!token || reviewsQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  if (reviewsQuery.isError) {
    return (
      <Card className="flex h-56 flex-col items-center justify-center gap-3 border border-slate-200 p-6 text-center">
        <p className="text-error font-medium">Không thể tải danh sách đánh giá.</p>
        <Button variant="outline" size="sm" onClick={() => void reviewsQuery.refetch()}>
          Thử lại
        </Button>
      </Card>
    );
  }

  const { items, summary, meta } = reviewsQuery.data;
  const maxInDistribution = Math.max(
    1,
    ...STARS.map((star) => summary.ratingDistribution[String(star)] ?? 0),
  );

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center gap-1 lg:w-44">
            <span className="text-4xl font-bold text-slate-900">
              {summary.averageOverallRating?.toFixed(1) ?? "—"}
            </span>
            <StarRow value={summary.averageOverallRating ?? 0} size={18} />
            <span className="text-sm text-slate-500">{summary.totalReviews} đánh giá</span>
          </div>

          <div className="flex-1 space-y-1.5">
            {STARS.map((star) => {
              const count = summary.ratingDistribution[String(star)] ?? 0;
              const isActive = ratingFilter === String(star);
              return (
                <button
                  key={star}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setRatingFilter(isActive ? ALL_RATINGS : String(star))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-slate-50",
                    isActive && "bg-slate-100",
                  )}
                >
                  <span className="w-8 shrink-0 text-left font-semibold text-slate-600">
                    {star}★
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${(count / maxInDistribution) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-slate-500 tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid shrink-0 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:w-80">
            {SECTION_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-900">
                  {summary.averageBySection[key]?.toFixed(1) ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Tất cả số sao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RATINGS}>Tất cả số sao</SelectItem>
            {STARS.map((star) => (
              <SelectItem key={star} value={String(star)}>
                {star} sao
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-slate-200 p-0 text-slate-600"
          onClick={() => void reviewsQuery.refetch()}
          aria-label="Làm mới danh sách đánh giá"
        >
          <ArrowsCounterClockwise size={18} />
        </Button>

        <span className="text-sm text-slate-500">
          {ratingFilter === ALL_RATINGS
            ? `${meta.total} đánh giá`
            : `${meta.total} đánh giá ${ratingFilter} sao`}
        </span>
      </div>

      {items.length === 0 ? (
        <Card className="flex h-40 items-center justify-center border border-dashed border-slate-300 text-sm text-slate-500">
          {ratingFilter === ALL_RATINGS
            ? "Công ty bạn chưa có đánh giá nào."
            : `Không có đánh giá ${ratingFilter} sao.`}
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((review) => (
            <Card key={review.id} className="border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StarRow value={review.overallRating} />
                  <span className="text-sm font-semibold text-slate-900">
                    {review.overallRating}/5
                  </span>
                  <span className="text-xs text-slate-400">{formatAppDate(review.createdAt)}</span>
                </div>
                <ReportState
                  review={review}
                  isReporting={reportMutation.isPending}
                  onReport={() => void handleReport(review)}
                />
              </div>

              {review.summary ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.summary}</p>
              ) : null}

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {review.whatILove ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">Điều yêu thích</dt>
                    <dd className="text-slate-700">{review.whatILove}</dd>
                  </div>
                ) : null}
                {review.improvementSuggestion ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">Đề xuất cải thiện</dt>
                    <dd className="text-slate-700">{review.improvementSuggestion}</dd>
                  </div>
                ) : null}
                {review.overtimeReason ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-slate-500">Lý do (về tăng ca)</dt>
                    <dd className="text-slate-700">{review.overtimeReason}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                {SECTION_LABELS.map(({ key, label }) => {
                  const field =
                    key === "overtimeSatisfaction"
                      ? review.overtimeSatisfaction
                      : key === "salaryBenefits"
                        ? review.salaryBenefitsRating
                        : key === "trainingLearning"
                          ? review.trainingLearningRating
                          : key === "managementCare"
                            ? review.managementCareRating
                            : key === "cultureFun"
                              ? review.cultureFunRating
                              : review.officeWorkspaceRating;

                  if (field === null) return null;
                  return (
                    <span key={key}>
                      {label}: <strong className="text-slate-700">{field}★</strong>
                    </span>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <CaretLeft size={14} />
            Trước
          </Button>
          <span className="text-sm text-slate-600">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sau
            <CaretRight size={14} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
