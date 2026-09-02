import type { SubscriptionFeature } from "@/features/recruiter/api/billing";

/** Vietnamese labels for plan features, shared by pricing and billing. */
export const QUOTA_FEATURE_LABELS: Record<SubscriptionFeature, string> = {
  job_post: "Tin tuyển dụng",
  featured_job: "Tin nổi bật",
  urgent_label: "Nhãn Tuyển gấp",
  cv_pool_view: "Lượt xem hồ sơ kho CV",
  talent_contact: "Liên hệ ứng viên chủ động",
  ai_cv_matching: "AI chấm điểm CV theo JD",
  ai_jd_generate: "AI viết và tối ưu JD",
  ai_copilot_run: "Lượt trò chuyện AI Copilot",
  hr_seat: "Tài khoản HR",
};

/** Display order on plan cards and comparison tables. */
export const QUOTA_FEATURE_ORDER: SubscriptionFeature[] = [
  "job_post",
  "featured_job",
  "cv_pool_view",
  "talent_contact",
  "ai_cv_matching",
  "ai_jd_generate",
  "ai_copilot_run",
  "urgent_label",
  "hr_seat",
];
