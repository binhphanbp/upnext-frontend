import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api/http";

import { resolveApplyErrorMessage } from "./apply-error-message";

/**
 * The dialog used to answer every rejection with "check your information", which left a
 * candidate no way to discover that their email was unverified or their phone number was
 * not accepted. TC_CAN_045.
 */
describe("resolveApplyErrorMessage", () => {
  const generic = "Không thể nộp hồ sơ. Vui lòng kiểm tra lại thông tin và thử lại.";

  it("shows the reason the server gave", () => {
    const error = new ApiError(
      400,
      "Vui lòng cập nhật số điện thoại Việt Nam hợp lệ trước khi nộp hồ sơ",
      null,
    );

    expect(resolveApplyErrorMessage(error)).toBe(
      "Vui lòng cập nhật số điện thoại Việt Nam hợp lệ trước khi nộp hồ sơ",
    );
  });

  it("passes through a closed posting so the candidate stops retrying", () => {
    const error = new ApiError(400, "Tin tuyển dụng đã hết hạn nộp hồ sơ", null);

    expect(resolveApplyErrorMessage(error)).toBe("Tin tuyển dụng đã hết hạn nộp hồ sơ");
  });

  it("falls back when the body carried no message", () => {
    expect(
      resolveApplyErrorMessage(new ApiError(400, "Request failed with status 400", null)),
    ).toBe(generic);
  });

  it("does not blame the candidate for a server fault", () => {
    expect(resolveApplyErrorMessage(new ApiError(500, "Internal server error", null))).toBe(
      generic,
    );
  });

  it("falls back for a failure that is not an API error at all", () => {
    expect(resolveApplyErrorMessage(new Error("network down"))).toBe(generic);
  });
});
