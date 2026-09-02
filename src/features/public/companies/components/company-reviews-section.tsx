"use client";

import { Flag, Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";

import { CompanyReviewFormDialog } from "@/features/candidate/company-reviews/review-form-dialog";
import { useCandidateCompanyReview } from "@/features/candidate/company-reviews/use-candidate-company-review";
import { getPublicCompanyReviews, type PublicCompanyReview } from "@/features/public/companies/api";
import {
  ReviewReportDialog,
  type ReviewReportInput,
} from "@/features/recruiter/company-reviews/review-report-dialog";
import { useRecruiterReviewReporter } from "@/features/recruiter/company-reviews/use-recruiter-review-reporter";
import { ApiError } from "@/shared/api/http";
import { ReviewerByline } from "@/shared/ui/reviewer-byline";
import { toast } from "@/shared/ui/toast";

const toastMixin = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

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
  const [reportTarget, setReportTarget] = useState<PublicCompanyReview | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["public-company-reviews", companyId],
    queryFn: async () => {
      const data = await getPublicCompanyReviews(companyId);
      return (
        data ?? {
          items: [],
          summary: {
            totalReviews: 0,
            averageRating: 0,
            starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        }
      );
    },
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

  /**
   * Reporting a review belongs to the reported company alone — a candidate cannot report
   * one at all, and the server refuses it (`POST /reports` rejects COMPANY_REVIEW from a
   * candidate). So anyone browsing with a candidate session sees no report button, even
   * on someone else's review.
   *
   * Both sessions can be signed in at once in the same browser, which is exactly how a
   * recruiter used to end up with the button on their own review. Waiting for the
   * candidate session to resolve keeps it from flashing in before that is known.
   */
  const canReportReviews =
    recruiterReporter.canReport &&
    candidateReview.isSessionResolved &&
    !candidateReview.isAuthenticated;

  async function handleSubmitReport(input: ReviewReportInput) {
    if (!reportTarget) return;

    try {
      await recruiterReporter.report(reportTarget.id, input.reason, input.evidence);
      setReportTarget(null);
      void toastMixin.fire({ icon: "success", title: "Đã gửi báo cáo tới quản trị viên." });
    } catch (error) {
      // 403 là server từ chối (không phải công ty của bạn, hoặc đánh giá do chính bạn viết)
      // và message của nó đã nói rõ; 409 là đã báo cáo đánh giá này rồi.
      const title =
        error instanceof ApiError && error.status === 409
          ? "Bạn đã báo cáo đánh giá này rồi."
          : error instanceof ApiError && error.status === 403
            ? error.message
            : "Không thể gửi báo cáo. Vui lòng thử lại.";
      void toastMixin.fire({ icon: "error", title });
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <ReviewerByline
                    fullName={review.reviewer.fullName}
                    createdAt={review.createdAt}
                  />
                  <StarDisplay value={review.overallRating} />
                </div>
                {canReportReviews ? (
                  <button
                    type="button"
                    className="company-review-report"
                    onClick={() => setReportTarget(review)}
                    disabled={recruiterReporter.isReporting}
                  >
                    <Flag size={14} /> Báo cáo
                  </button>
                ) : null}
              </div>
              {review.summary ? (
                <p className="mt-2 text-sm text-slate-700">{review.summary}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ReviewReportDialog
        open={reportTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        reviewerName={reportTarget?.reviewer.fullName}
        isSubmitting={recruiterReporter.isReporting}
        onSubmit={handleSubmitReport}
      />

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
