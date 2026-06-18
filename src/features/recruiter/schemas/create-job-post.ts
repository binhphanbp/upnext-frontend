import { z } from "zod";

export const createJobPostSchema = z
  .object({
    benefits: z.string().trim().min(10, "Vui lòng nhập quyền lợi."),
    description: z.string().trim().min(20, "Vui lòng nhập mô tả công việc."),
    employmentTypeId: z.string().uuid("Vui lòng chọn loại hình làm việc."),
    experienceLevelId: z.string().uuid("Vui lòng chọn cấp độ kinh nghiệm."),
    jobCategoryId: z.string().uuid("Vui lòng chọn danh mục công việc."),
    requirements: z.string().trim().min(20, "Vui lòng nhập yêu cầu công việc."),
    salaryCurrency: z.literal("VND"),
    salaryIsNegotiable: z.boolean(),
    salaryIsVisible: z.boolean(),
    salaryMax: z.number().int().positive("Lương tối đa phải lớn hơn 0."),
    salaryMin: z.number().int().nonnegative("Lương tối thiểu không hợp lệ."),
    salaryPeriod: z.literal("MONTH"),
    title: z.string().trim().min(5, "Vui lòng nhập tiêu đề tuyển dụng."),
    vacanciesCount: z.number().int().positive("Số lượng tuyển phải lớn hơn 0."),
  })
  .refine((value) => value.salaryMax >= value.salaryMin, {
    message: "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.",
    path: ["salaryMax"],
  });

export type CreateJobPostFormValues = z.infer<typeof createJobPostSchema>;

export const createJobPostDefaultValues: CreateJobPostFormValues = {
  benefits: "",
  description: "",
  employmentTypeId: "",
  experienceLevelId: "",
  jobCategoryId: "",
  requirements: "",
  salaryCurrency: "VND",
  salaryIsNegotiable: false,
  salaryIsVisible: true,
  salaryMax: 20000000,
  salaryMin: 12000000,
  salaryPeriod: "MONTH",
  title: "",
  vacanciesCount: 1,
};
