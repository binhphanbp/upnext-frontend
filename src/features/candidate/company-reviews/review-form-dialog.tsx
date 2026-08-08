"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import type {
  CandidateCompanyReview,
  CompanyReviewPayload,
} from "@/features/candidate/company-reviews/api";
import {
  companyReviewFormSchema,
  type CompanyReviewFormValues,
} from "@/features/candidate/company-reviews/review-form-schema";
import { StarRatingInput } from "@/features/candidate/company-reviews/star-rating-input";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

const SUB_RATINGS: Array<{ key: keyof CompanyReviewFormValues; label: string }> = [
  { key: "salaryBenefitsRating", label: "Lương & phúc lợi" },
  { key: "trainingLearningRating", label: "Đào tạo & học hỏi" },
  { key: "managementCareRating", label: "Sự quan tâm của quản lý" },
  { key: "cultureFunRating", label: "Văn hóa & hoạt động" },
  { key: "officeWorkspaceRating", label: "Văn phòng, không gian làm việc" },
  { key: "overtimeSatisfaction", label: "Mức hài lòng về tăng ca" },
];

export function calculateOverallRating(values: Partial<CompanyReviewFormValues>): number {
  const ratings = [
    values.salaryBenefitsRating,
    values.trainingLearningRating,
    values.managementCareRating,
    values.cultureFunRating,
    values.officeWorkspaceRating,
    values.overtimeSatisfaction,
  ].filter((v): v is number => typeof v === "number" && v > 0);

  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return Math.max(1, Math.min(5, Math.round(sum / ratings.length)));
}

function toFormValues(review: CandidateCompanyReview | null): CompanyReviewFormValues {
  const initialSubRatings = {
    salaryBenefitsRating: review?.salaryBenefitsRating ?? 0,
    trainingLearningRating: review?.trainingLearningRating ?? 0,
    managementCareRating: review?.managementCareRating ?? 0,
    cultureFunRating: review?.cultureFunRating ?? 0,
    officeWorkspaceRating: review?.officeWorkspaceRating ?? 0,
    overtimeSatisfaction: review?.overtimeSatisfaction ?? 0,
  };

  const calculatedOverall = calculateOverallRating(initialSubRatings);

  return {
    overallRating: calculatedOverall || (review?.overallRating ?? 0),
    summary: review?.summary ?? "",
    overtimeSatisfaction: initialSubRatings.overtimeSatisfaction,
    overtimeReason: review?.overtimeReason ?? "",
    whatILove: review?.whatILove ?? "",
    improvementSuggestion: review?.improvementSuggestion ?? "",
    salaryBenefitsRating: initialSubRatings.salaryBenefitsRating,
    trainingLearningRating: initialSubRatings.trainingLearningRating,
    managementCareRating: initialSubRatings.managementCareRating,
    cultureFunRating: initialSubRatings.cultureFunRating,
    officeWorkspaceRating: initialSubRatings.officeWorkspaceRating,
  };
}

function toPayload(values: CompanyReviewFormValues): CompanyReviewPayload {
  const text = (value: string) => (value.trim() ? value.trim() : undefined);
  const rating = (value: number) => (value > 0 ? value : undefined);

  const calculatedOverall = calculateOverallRating(values);

  return {
    overallRating: calculatedOverall,
    summary: text(values.summary),
    overtimeSatisfaction: rating(values.overtimeSatisfaction),
    overtimeReason: text(values.overtimeReason),
    whatILove: text(values.whatILove),
    improvementSuggestion: text(values.improvementSuggestion),
    salaryBenefitsRating: rating(values.salaryBenefitsRating),
    trainingLearningRating: rating(values.trainingLearningRating),
    managementCareRating: rating(values.managementCareRating),
    cultureFunRating: rating(values.cultureFunRating),
    officeWorkspaceRating: rating(values.officeWorkspaceRating),
  };
}

export function CompanyReviewFormDialog({
  open,
  onOpenChange,
  companyName,
  existingReview,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  existingReview: CandidateCompanyReview | null;
  onSubmit: (payload: CompanyReviewPayload) => Promise<unknown>;
  isSubmitting: boolean;
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CompanyReviewFormValues>({
    defaultValues: toFormValues(existingReview),
    resolver: zodResolver(companyReviewFormSchema),
  });

  const salaryBenefits = useWatch({ control, name: "salaryBenefitsRating" });
  const trainingLearning = useWatch({ control, name: "trainingLearningRating" });
  const managementCare = useWatch({ control, name: "managementCareRating" });
  const cultureFun = useWatch({ control, name: "cultureFunRating" });
  const officeWorkspace = useWatch({ control, name: "officeWorkspaceRating" });
  const overtimeSatisfaction = useWatch({ control, name: "overtimeSatisfaction" });

  const computedOverall = calculateOverallRating({
    salaryBenefitsRating: salaryBenefits,
    trainingLearningRating: trainingLearning,
    managementCareRating: managementCare,
    cultureFunRating: cultureFun,
    officeWorkspaceRating: officeWorkspace,
    overtimeSatisfaction,
  });

  useEffect(() => {
    setValue("overallRating", computedOverall, { shouldValidate: true });
  }, [computedOverall, setValue]);

  useEffect(() => {
    if (open) reset(toFormValues(existingReview));
  }, [open, existingReview, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Sửa đánh giá của bạn" : `Đánh giá ${companyName}`}
          </DialogTitle>
          <DialogDescription>
            Chia sẻ trải nghiệm của bạn để giúp các ứng viên khác hiểu rõ hơn về công ty này.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(toPayload(values));
          })}
        >
          {/* Read-Only Calculated Overall Rating Box */}
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-bold text-slate-900">Đánh giá tổng thể</Label>
                <p className="text-xs text-slate-500">
                  Tự động tính từ trung bình cộng các tiêu chí đánh giá bên dưới
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StarRatingInput
                  label="Đánh giá tổng thể (tự động tính)"
                  value={computedOverall}
                  size={24}
                  readOnly
                />
                <span className="text-lg font-extrabold text-slate-900">
                  {computedOverall > 0 ? `${computedOverall}/5` : "--/5"}
                </span>
              </div>
            </div>
            {errors.overallRating ? (
              <p className="text-destructive text-xs font-semibold">
                {errors.overallRating.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-summary">Nhận xét chung</Label>
            <Textarea id="review-summary" rows={3} {...register("summary")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SUB_RATINGS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-2">
                <Label>{label}</Label>
                <Controller
                  control={control}
                  name={key}
                  render={({ field }) => (
                    <StarRatingInput
                      label={label}
                      size={20}
                      value={(field.value as number) ?? 0}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-overtime-reason">Lý do (về tăng ca)</Label>
            <Textarea id="review-overtime-reason" rows={2} {...register("overtimeReason")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-what-i-love">Điều bạn yêu thích</Label>
            <Textarea id="review-what-i-love" rows={2} {...register("whatILove")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-improvement">Đề xuất cải thiện</Label>
            <Textarea id="review-improvement" rows={2} {...register("improvementSuggestion")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {existingReview ? "Lưu thay đổi" : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
