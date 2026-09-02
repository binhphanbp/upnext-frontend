import { ApiError } from "@/shared/api/http";

/**
 * Ánh xạ lỗi từ các endpoint AI của JD sang thông điệp cho recruiter.
 *
 * Tách ra khỏi component vì trước đây trang generator và trang import mỗi trang
 * giữ một bản riêng, và hai bản đã phân kỳ theo cách gây hại: bản ở trang import
 * coi **403 là hết session** rồi gọi `clearRecruiterSession()`. Hậu quả là gói
 * dịch vụ không bao gồm AI JD, hoặc công ty đang ở Restricted Mode, hay không có
 * subscription nào đang hoạt động — tất cả đều trả 403 — làm recruiter **bị đăng
 * xuất** khi upload một file JD, kèm thông báo sai là "phiên đăng nhập đã hết hạn".
 *
 * Nguyên tắc: **403 là phân quyền, không phải xác thực.** Người dùng vẫn đăng nhập
 * hợp lệ, họ chỉ không được phép làm việc này. Chỉ 401 mới được phép xoá session.
 */
export type AiErrorResolution = {
  /** Khoá i18n, tính từ namespace "Recruiter". */
  messageKey: string;
  /** Chỉ đúng khi xác thực thật sự thất bại. */
  signOut: boolean;
  /**
   * Thông điệp thô của backend, dùng khi nó đã là tiếng Việt và hướng dẫn được
   * người dùng làm gì tiếp (ví dụ "File PDF được đặt mật khẩu..."). Chỉ có ở 4xx
   * không khớp nhánh nào bên trên.
   */
  fallbackMessage?: string | undefined;
};

function resolution(
  messageKey: string,
  options: { signOut?: boolean; fallbackMessage?: string | undefined } = {},
): AiErrorResolution {
  return {
    messageKey,
    signOut: options.signOut ?? false,
    fallbackMessage: options.fallbackMessage,
  };
}

function errorCode(error: ApiError): string | null {
  const payload = error.payload;
  if (typeof payload !== "object" || payload === null) return null;
  const code = (payload as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function resolveAiError(error: unknown): AiErrorResolution {
  if (!(error instanceof ApiError)) {
    return resolution("jobPostsPage.aiErrors.connectionFailed");
  }

  const code = errorCode(error);

  if (error.status === 401) {
    return resolution("jobPostsPage.errors.sessionExpired", { signOut: true });
  }

  if (error.status === 403) {
    // `FEATURE_NOT_IN_PLAN` và `NO_ACTIVE_SUBSCRIPTION` do SubscriptionQuotaService
    // ném ra kèm message tiếng Anh ("Your current plan does not include..."), nên
    // phải thay bằng bản dịch chứ không phun ra nguyên văn.
    if (code === "FEATURE_NOT_IN_PLAN" || code === "NO_ACTIVE_SUBSCRIPTION") {
      return resolution("jobPostsPage.aiErrors.planNotIncluded");
    }
    // RestrictedModeGuard ném ForbiddenException với message dạng chuỗi, nên không
    // có `code` nào để phân biệt. Mọi 403 còn lại được xem là hạn chế quyền.
    return resolution("jobPostsPage.aiErrors.companyRestricted");
  }

  if (error.status === 409) {
    if (code === "QUOTA_EXHAUSTED") {
      return resolution("jobPostsPage.aiErrors.quotaExhausted");
    }
    if (code === "AI_OPERATION_IN_PROGRESS") {
      return resolution("jobPostsPage.aiErrors.inProgress");
    }
  }

  if (error.status === 429) {
    return resolution("jobPostsPage.aiErrors.rateLimited");
  }

  if (error.status >= 500) {
    return resolution("jobPostsPage.aiErrors.busy");
  }

  // Các 4xx còn lại của module này đều mang message tiếng Việt hướng người dùng
  // sửa được ("File PDF được đặt mật khẩu...", "File không có đủ nội dung..."),
  // nên hiển thị nguyên văn vẫn tốt hơn một thông điệp chung chung.
  return resolution("jobPostsPage.aiGenerator.genericError", {
    fallbackMessage: error.message || undefined,
  });
}
