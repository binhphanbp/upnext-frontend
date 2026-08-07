"use client";

import { Flag, Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import { CompanyReviewFormDialog } from "@/features/candidate/company-reviews/review-form-dialog";
import { useCandidateCompanyReview } from "@/features/candidate/company-reviews/use-candidate-company-review";
import { getPublicCompanyReviews, type PublicCompanyReview } from "@/features/public/companies/api";
import { useRecruiterReviewReporter } from "@/features/recruiter/company-reviews/use-recruiter-review-reporter";
import { toast } from "@/shared/ui/toast";

const toastMixin = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

const SUB_RATING_LABELS: Record<string, string> = {
  salaryBenefits: "Lương & phúc lợi",
  trainingLearning: "Đào tạo & học hỏi",
  managementCare: "Sự quan tâm của quản lý",
  cultureFun: "Văn hóa & hoạt động",
  officeWorkspace: "Văn phòng, không gian làm việc",
  overtimeSatisfaction: "Mức hài lòng về tăng ca",
};

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
    if (!result.isConfirmed || !result.value) return;

    try {
      await recruiterReporter.report(review.id, result.value);
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
        <ul className="flex flex-col gap-4">
          {items.map((review) => (
            <li key={review.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarDisplay value={review.overallRating} />
                  <span className="text-xs text-slate-400">
                    {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
                      new Date(review.createdAt),
                    )}
                  </span>
                </div>
                {recruiterReporter.canReport ? (
                  <button
                    type="button"
                    className="company-review-report"
                    onClick={() => void handleReportReview(review)}
                    disabled={recruiterReporter.isReporting}
                  >
                    <Flag size={14} /> Báo cáo
                  </button>
                ) : null}
              </div>
              {review.summary ? (
                <p className="mt-2 text-sm text-slate-700">{review.summary}</p>
              ) : null}
              {review.whatILove ? (
                <p className="mt-1 text-sm text-slate-600">
                  <strong>Điều yêu thích:</strong> {review.whatILove}
                </p>
              ) : null}
              {review.improvementSuggestion ? (
                <p className="mt-1 text-sm text-slate-600">
                  <strong>Đề xuất cải thiện:</strong> {review.improvementSuggestion}
                </p>
              ) : null}
            </li>
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
