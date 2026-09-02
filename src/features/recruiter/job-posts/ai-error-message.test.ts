import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api/http";

import { resolveAiError } from "./ai-error-message";

function apiError(status: number, payload: unknown, message = "backend message") {
  return new ApiError(status, message, payload);
}

describe("resolveAiError", () => {
  it("chỉ xoá session khi xác thực thật sự thất bại", () => {
    expect(resolveAiError(apiError(401, { message: "Unauthorized" }))).toMatchObject({
      signOut: true,
      messageKey: "jobPostsPage.errors.sessionExpired",
    });
  });

  /**
   * Đây là bug đã xảy ra thật: recruiter upload một file JD và bị đăng xuất. Backend
   * trả 403 cho "gói không có tính năng" / "không có subscription" / "công ty bị hạn
   * chế", còn frontend coi 403 là hết session rồi xoá localStorage. 403 là phân
   * quyền, không phải xác thực -- không ca nào dưới đây được phép đăng xuất.
   */
  describe("403 không bao giờ được đăng xuất", () => {
    it("gói không bao gồm tính năng AI JD", () => {
      const resolved = resolveAiError(
        apiError(
          403,
          {
            code: "FEATURE_NOT_IN_PLAN",
            message: "Your current plan does not include AI_JD_GENERATE",
          },
          "Your current plan does not include AI_JD_GENERATE",
        ),
      );

      expect(resolved.signOut).toBe(false);
      expect(resolved.messageKey).toBe("jobPostsPage.aiErrors.planNotIncluded");
      // Message tiếng Anh của backend không được lọt ra UI.
      expect(resolved.fallbackMessage).toBeUndefined();
    });

    it("không có subscription đang hoạt động", () => {
      const resolved = resolveAiError(apiError(403, { code: "NO_ACTIVE_SUBSCRIPTION" }));

      expect(resolved.signOut).toBe(false);
    });

    it("công ty đang ở Restricted Mode (403 không kèm code)", () => {
      // RestrictedModeGuard ném ForbiddenException với message dạng chuỗi nên payload
      // không có `code` nào để phân biệt.
      const resolved = resolveAiError(
        apiError(403, {
          statusCode: 403,
          message: "Company is currently in Restricted Mode.",
          error: "Forbidden",
        }),
      );

      expect(resolved.signOut).toBe(false);
      expect(resolved.messageKey).toBe("jobPostsPage.aiErrors.companyRestricted");
    });
  });

  describe("409 phân biệt theo code", () => {
    it("hết lượt: báo đúng là hết lượt, không đăng xuất", () => {
      const resolved = resolveAiError(
        apiError(409, { code: "QUOTA_EXHAUSTED", message: "Quota exhausted for AI_JD_GENERATE" }),
      );

      expect(resolved.messageKey).toBe("jobPostsPage.aiErrors.quotaExhausted");
      expect(resolved.signOut).toBe(false);
      expect(resolved.fallbackMessage).toBeUndefined();
    });

    it("đang xử lý: bảo người dùng đợi thay vì gửi lại", () => {
      const resolved = resolveAiError(apiError(409, { code: "AI_OPERATION_IN_PROGRESS" }));

      expect(resolved.messageKey).toBe("jobPostsPage.aiErrors.inProgress");
    });
  });

  it("429 là thao tác quá nhanh", () => {
    expect(resolveAiError(apiError(429, {})).messageKey).toBe("jobPostsPage.aiErrors.rateLimited");
  });

  it("5xx là dịch vụ đang bận", () => {
    expect(resolveAiError(apiError(503, {})).messageKey).toBe("jobPostsPage.aiErrors.busy");
    expect(resolveAiError(apiError(500, {})).signOut).toBe(false);
  });

  it("giữ message tiếng Việt hướng người dùng sửa được ở các 4xx còn lại", () => {
    // Backend module này trả message tiếng Việt hành động được; hiện nguyên văn tốt
    // hơn một thông điệp chung chung.
    const message = "File PDF được đặt mật khẩu. Vui lòng tải lên bản không khoá.";
    const resolved = resolveAiError(apiError(400, { message }, message));

    expect(resolved.fallbackMessage).toBe(message);
    expect(resolved.signOut).toBe(false);
  });

  it("lỗi mạng (không phải ApiError) là lỗi kết nối", () => {
    expect(resolveAiError(new TypeError("Failed to fetch")).messageKey).toBe(
      "jobPostsPage.aiErrors.connectionFailed",
    );
    expect(resolveAiError(undefined).signOut).toBe(false);
  });

  it("payload không phải object không làm hàm này vỡ", () => {
    // `readResponsePayload` trả về text khi Content-Type không phải JSON.
    expect(resolveAiError(apiError(403, "Forbidden")).messageKey).toBe(
      "jobPostsPage.aiErrors.companyRestricted",
    );
    expect(resolveAiError(apiError(409, null)).fallbackMessage).toBe("backend message");
  });
});
