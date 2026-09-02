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

function toFormValues(review: CandidateCompanyReview | null): CompanyReviewFormValues {
  return {
    overallRating: review?.overallRating ?? 0,
    summary: review?.summary ?? "",
  };
}

function toPayload(values: CompanyReviewFormValues): CompanyReviewPayload {
  const summary = values.summary.trim();

  return {
    overallRating: values.overallRating,
    summary: summary ? summary : undefined,
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
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Sửa đánh giá của bạn" : `Đánh giá ${companyName}`}
          </DialogTitle>
          <DialogDescription>
            Chọn số sao và viết một nhận xét ngắn về trải nghiệm của bạn tại công ty này.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(toPayload(values));
          })}
        >
          <div className="flex flex-col gap-2">
            <Label>Đánh giá của bạn *</Label>
            <Controller
              control={control}
              name="overallRating"
              render={({ field }) => (
                <StarRatingInput
                  label="Đánh giá của bạn"
                  size={26}
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
            <Label htmlFor="review-summary">Nhận xét</Label>
            <Textarea
              id="review-summary"
              rows={5}
              placeholder="Chia sẻ trải nghiệm của bạn về công ty này…"
              {...register("summary")}
            />
            {errors.summary ? (
              <p className="text-destructive text-sm">{errors.summary.message}</p>
            ) : null}
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
