import { z } from "zod";

/** Một đánh giá = 1 số sao tổng thể + 1 ô nhận xét. Không còn chấm điểm theo hạng mục. */
export const companyReviewFormSchema = z.object({
  overallRating: z
    .number({ error: "Vui lòng chọn số sao." })
    .int()
    .min(1, "Vui lòng chọn số sao.")
    .max(5),
  summary: z.string().trim().max(2000, "Không được vượt quá 2000 ký tự."),
});

export type CompanyReviewFormValues = z.infer<typeof companyReviewFormSchema>;
