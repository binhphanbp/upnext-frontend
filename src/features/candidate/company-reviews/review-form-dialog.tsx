"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

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

function toFormValues(review: CandidateCompanyReview | null): CompanyReviewFormValues {
  return {
    overallRating: review?.overallRating ?? 0,
    summary: review?.summary ?? "",
    overtimeSatisfaction: review?.overtimeSatisfaction ?? 0,
    overtimeReason: review?.overtimeReason ?? "",
    whatILove: review?.whatILove ?? "",
    improvementSuggestion: review?.improvementSuggestion ?? "",
    salaryBenefitsRating: review?.salaryBenefitsRating ?? 0,
    trainingLearningRating: review?.trainingLearningRating ?? 0,
    managementCareRating: review?.managementCareRating ?? 0,
    cultureFunRating: review?.cultureFunRating ?? 0,
    officeWorkspaceRating: review?.officeWorkspaceRating ?? 0,
  };
}

function toPayload(values: CompanyReviewFormValues): CompanyReviewPayload {
  const text = (value: string) => (value.trim() ? value.trim() : undefined);
  const rating = (value: number) => (value > 0 ? value : undefined);

  return {
    overallRating: values.overallRating,
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
  } = useForm<CompanyReviewFormValues>({
    defaultValues: toFormValues(existingReview),
    resolver: zodResolver(companyReviewFormSchema),
  });

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
          <div className="flex flex-col gap-2">
            <Label>Đánh giá tổng thể *</Label>
            <Controller
              control={control}
              name="overallRating"
              render={({ field }) => (
                <StarRatingInput
                  label="Đánh giá tổng thể"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.overallRating ? (
              <p className="text-destructive text-sm">{errors.overallRating.message}</p>
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
                      size={18}
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
