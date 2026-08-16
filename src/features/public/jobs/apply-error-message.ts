import { ApiError } from "@/shared/api/http";

export const GENERIC_APPLY_ERROR =
  "Không thể nộp hồ sơ. Vui lòng kiểm tra lại thông tin và thử lại.";

/**
 * Prefers the reason the server gave over a generic apology.
 *
 * The apply dialog answered every rejection with "check your information", so a candidate
 * whose email was unverified, whose phone number the server would not accept, or whose
 * posting had closed mid-dialog had nothing to check and no way forward.
 *
 * `apiRequest` synthesises "Request failed with status N" when the body carries no message,
 * and a 5xx is never something the candidate can act on — both keep the generic line.
 */
export function resolveApplyErrorMessage(error: unknown) {
  if (!(error instanceof ApiError) || error.status >= 500) return GENERIC_APPLY_ERROR;

  const message = error.message?.trim();
  if (!message || message.startsWith("Request failed with status")) return GENERIC_APPLY_ERROR;

  return message;
}
