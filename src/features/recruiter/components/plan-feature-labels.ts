import type { SubscriptionFeature } from "@/features/recruiter/api/billing";

/** Vietnamese labels for plan features, shared by pricing and billing. */
export const QUOTA_FEATURE_LABELS: Record<SubscriptionFeature, string> = {
  JOB_POST: "Tin tuyển dụng",
  FEATURED_JOB: "Tin nổi bật",
  URGENT_LABEL: "Nhãn Tuyển gấp",
  CV_POOL_VIEW: "Lượt xem hồ sơ kho CV",
  TALENT_CONTACT: "Liên hệ ứng viên chủ động",
  AI_CV_MATCHING: "AI chấm điểm CV theo JD",
  AI_JD_GENERATE: "AI viết và tối ưu JD",
  AI_COPILOT_RUN: "Lượt trò chuyện AI Copilot",
  HR_SEAT: "Tài khoản HR",
};

/** Display order on plan cards and comparison tables. */
export const QUOTA_FEATURE_ORDER: SubscriptionFeature[] = [
  "JOB_POST",
  "FEATURED_JOB",
  "CV_POOL_VIEW",
  "TALENT_CONTACT",
  "AI_CV_MATCHING",
  "AI_JD_GENERATE",
  "AI_COPILOT_RUN",
  "URGENT_LABEL",
  "HR_SEAT",
];
