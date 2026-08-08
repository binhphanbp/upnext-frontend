"use client";

import { CaretDown, CaretUp, Flag, Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import { CompanyReviewFormDialog } from "@/features/candidate/company-reviews/review-form-dialog";
import { useCandidateCompanyReview } from "@/features/candidate/company-reviews/use-candidate-company-review";
import { getPublicCompanyReviews, type PublicCompanyReview } from "@/features/public/companies/api";
import { promptReviewReport } from "@/features/recruiter/company-reviews/prompt-review-report";
import { useRecruiterReviewReporter } from "@/features/recruiter/company-reviews/use-recruiter-review-reporter";
import { cn } from "@/shared/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ReviewerByline } from "@/shared/ui/reviewer-byline";
import { toast } from "@/shared/ui/toast";

const toastMixin = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

const SUB_RATING_LABELS: Record<string, string> = {
  salaryBenefits: "Lương thưởng & phúc lợi",
  trainingLearning: "Đào tạo & học hỏi",
  managementCare: "Sự quan tâm đến nhân viên",
  cultureFun: "Văn hoá công ty",
  officeWorkspace: "Văn phòng làm việc",
  overtimeSatisfaction: "Mức hài lòng về tăng ca",
};

function formatReviewDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      "Tháng Một",
      "Tháng Hai",
      "Tháng Ba",
      "Tháng Tư",
      "Tháng Năm",
      "Tháng Sáu",
      "Tháng Bảy",
      "Tháng Tám",
      "Tháng Chín",
      "Tháng Mười",
      "Tháng Mười Một",
      "Tháng Mười Hai",
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function StarDisplay({ value, size = 16 }: { value: number; size?: number }) {
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

function ReviewRatingPopover({
  overallRating,
  subRatings,
}: {
  overallRating: number;
  subRatings: Array<{ label: string; score: number }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-100"
          aria-label="Xem chi tiết điểm số"
        >
          <StarDisplay value={overallRating} size={18} />
          <span className="text-sm font-bold text-slate-800">{overallRating}</span>
          <CaretDown
            size={14}
            className="text-slate-500 transition-transform group-hover:text-slate-800"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="flex flex-col">
          {subRatings.map(({ label, score }, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center justify-between py-2.5 text-xs text-slate-700",
                index < subRatings.length - 1 && "border-b border-dashed border-slate-200",
              )}
            >
              <span className="font-medium text-slate-800">{label}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <StarDisplay value={score} size={14} />
                <span className="text-xs font-bold text-slate-900">{score}</span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ReviewCardItem({
  review,
  recruiterReporter,
  onReportReview,
}: {
  review: PublicCompanyReview;
  recruiterReporter: ReturnType<typeof useRecruiterReviewReporter>;
  onReportReview: (review: PublicCompanyReview) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const subRatingsList = [
    { label: "Lương thưởng & phúc lợi", score: review.salaryBenefitsRating },
    { label: "Đào tạo & học hỏi", score: review.trainingLearningRating },
    { label: "Sự quan tâm đến nhân viên", score: review.managementCareRating },
    { label: "Văn hoá công ty", score: review.cultureFunRating },
    { label: "Văn phòng làm việc", score: review.officeWorkspaceRating },
    { label: "Mức hài lòng về tăng ca", score: review.overtimeSatisfaction },
  ].filter((item): item is { label: string; score: number } => Boolean(item.score));

  const hasExtraContent = Boolean(
    review.whatILove || review.improvementSuggestion || review.overtimeReason,
  );

  const dateFormatted = formatReviewDate(review.createdAt);

  return (
    <li className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all">
      {/* Date Header */}
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-400">
        <span>{dateFormatted}</span>
        <div className="flex items-center gap-3">
          <ReviewerByline fullName={review.reviewer.fullName} createdAt={review.createdAt} />
        </div>
      </div>

      {/* Title / Summary */}
      <h3 className="text-base leading-snug font-bold text-slate-900 sm:text-lg">
        {review.summary || "Đánh giá về công ty"}
      </h3>

      {/* Rating Line: Stars + 3 ∨ -> Hover Popover for sub-ratings */}
      <div className="flex items-center gap-2">
        {subRatingsList.length > 0 ? (
          <ReviewRatingPopover overallRating={review.overallRating} subRatings={subRatingsList} />
        ) : (
          <div className="flex items-center gap-1.5">
            <StarDisplay value={review.overallRating} size={18} />
            <span className="text-sm font-bold text-slate-800">{review.overallRating}</span>
          </div>
        )}
      </div>

      {/* Collapsible Detailed Text Sections */}
      {expanded && hasExtraContent ? (
        <div className="space-y-3 border-t border-slate-100 pt-2">
          {review.whatILove ? (
            <div className="space-y-1 text-sm text-slate-800">
              <h4 className="font-bold text-slate-900">Điều tôi thích:</h4>
              <p className="leading-relaxed whitespace-pre-line text-slate-700">
                {review.whatILove}
              </p>
            </div>
          ) : null}

          {review.improvementSuggestion ? (
            <div className="space-y-1 text-sm text-slate-800">
              <h4 className="font-bold text-slate-900">Đề nghị cải thiện:</h4>
              <p className="leading-relaxed whitespace-pre-line text-slate-700">
                {review.improvementSuggestion}
              </p>
            </div>
          ) : null}

          {review.overtimeReason ? (
            <div className="space-y-1 text-sm text-slate-800">
              <h4 className="font-bold text-slate-900">Ý kiến về tăng ca (OT):</h4>
              <p className="leading-relaxed whitespace-pre-line text-slate-700">
                {review.overtimeReason}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* "Xem thêm" / "Thu gọn" Toggle Button */}
      {hasExtraContent ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            {expanded ? (
              <>
                Thu gọn <CaretUp size={13} weight="bold" />
              </>
            ) : (
              <>
                Xem thêm <CaretDown size={13} weight="bold" />
              </>
            )}
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function CompanyReviewsSection({
  companyId,
  companyName,
  navigate,
}: {
  companyId: string;
  companyName: string;
  navigate: (path: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ["public-company-reviews", companyId],
    queryFn: () => getPublicCompanyReviews(companyId),
  });

  const candidateReview = useCandidateCompanyReview(companyId);
  const recruiterReporter = useRecruiterReviewReporter(companyId);

  function handleWriteReviewClick() {
    if (!candidateReview.isSessionResolved) return;
    if (!candidateReview.isAuthenticated) {
      toast.info("Vui lòng đăng nhập bằng tài khoản ứng viên để đánh giá công ty.");
      navigate(`/login?redirect=/companies/${encodeURIComponent(companyId)}`);
      return;
    }
    setFormOpen(true);
  }

  async function handleDeleteReview() {
    const result = await Swal.fire({
      title: "Xóa đánh giá của bạn?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    try {
      await candidateReview.remove();
      void toastMixin.fire({ icon: "success", title: "Đã xóa đánh giá." });
    } catch {
      void toastMixin.fire({ icon: "error", title: "Không thể xóa đánh giá. Vui lòng thử lại." });
    }
  }

  async function handleReportReview(review: PublicCompanyReview) {
    const input = await promptReviewReport();
    if (!input) return;

    try {
      await recruiterReporter.report(review.id, input.reason, input.evidence);
      void toastMixin.fire({ icon: "success", title: "Đã gửi báo cáo tới quản trị viên." });
    } catch {
      void toastMixin.fire({ icon: "error", title: "Không thể gửi báo cáo. Vui lòng thử lại." });
    }
  }

  const summary = reviewsQuery.data?.summary;
  const items = reviewsQuery.data?.items ?? [];

  return (
    <section className="company-profile-section" aria-label="Đánh giá từ ứng viên">
      <div className="company-section-head">
        <h2>Đánh giá từ ứng viên</h2>
        <button
          type="button"
          className="company-review-cta"
          onClick={handleWriteReviewClick}
          disabled={!candidateReview.isSessionResolved}
        >
          {candidateReview.myReview ? "Sửa đánh giá của bạn" : "Viết đánh giá"}
        </button>
      </div>

      {summary && summary.totalReviews > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <StarDisplay value={summary.averageOverallRating ?? 0} size={20} />
            <strong className="text-lg">{summary.averageOverallRating?.toFixed(1)}</strong>
            <span className="text-sm text-slate-500">({summary.totalReviews} đánh giá)</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            {Object.entries(summary.averageBySection)
              .filter(([, value]) => value !== null)
              .map(([key, value]) => (
                <span key={key}>
                  {SUB_RATING_LABELS[key] ?? key}: <strong>{value?.toFixed(1)}</strong>
                </span>
              ))}
          </div>
        </div>
      ) : null}

      {candidateReview.myReview ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>Bạn đã đánh giá công ty này.</span>
          <button type="button" className="font-semibold underline" onClick={handleDeleteReview}>
            Xóa đánh giá
          </button>
        </div>
      ) : null}

      {reviewsQuery.isPending ? (
        <p className="company-empty-copy">Đang tải đánh giá…</p>
      ) : items.length === 0 ? (
        <p className="company-empty-copy">Chưa có đánh giá nào cho công ty này.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {items.map((review) => (
            <ReviewCardItem
              key={review.id}
              review={review}
              recruiterReporter={recruiterReporter}
              onReportReview={handleReportReview}
            />
          ))}
        </ul>
      )}

      <CompanyReviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        companyName={companyName}
        existingReview={candidateReview.myReview}
        isSubmitting={candidateReview.isSubmitting}
        onSubmit={async (values) => {
          try {
            await candidateReview.submit(values);
            setFormOpen(false);
            void toastMixin.fire({ icon: "success", title: "Đã lưu đánh giá của bạn." });
          } catch {
            void toastMixin.fire({
              icon: "error",
              title: "Không thể lưu đánh giá. Vui lòng thử lại.",
            });
          }
        }}
      />
    </section>
  );
}
