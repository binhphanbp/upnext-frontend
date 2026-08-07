import { z } from "zod";

const optionalRating = z.number().int().min(0).max(5);

export const companyReviewFormSchema = z.object({
  overallRating: z
    .number({ error: "Vui lòng chọn số sao." })
    .int()
    .min(1, "Vui lòng chọn số sao.")
    .max(5),
  summary: z.string().trim().max(2000, "Không được vượt quá 2000 ký tự."),
  overtimeSatisfaction: optionalRating,
  overtimeReason: z.string().trim().max(2000, "Không được vượt quá 2000 ký tự."),
  whatILove: z.string().trim().max(2000, "Không được vượt quá 2000 ký tự."),
  improvementSuggestion: z.string().trim().max(2000, "Không được vượt quá 2000 ký tự."),
  salaryBenefitsRating: optionalRating,
  trainingLearningRating: optionalRating,
  managementCareRating: optionalRating,
  cultureFunRating: optionalRating,
  officeWorkspaceRating: optionalRating,
});

export type CompanyReviewFormValues = z.infer<typeof companyReviewFormSchema>;
