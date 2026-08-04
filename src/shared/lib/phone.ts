const VIETNAMESE_PHONE_PATTERN = /^(?:\+?84|0)[235789]\d{8,9}$/u;

/** Removes presentation characters while preserving the optional `+84` prefix. */
export function normalizeVietnamesePhoneNumber(value: string) {
  return value.trim().replace(/[\s().-]/gu, "");
}

/**
 * Accepts current Vietnamese mobile and landline numbers in local (`0…`) or
 * international (`+84…` / `84…`) form.
 */
export function isValidVietnamesePhoneNumber(value: string) {
  return VIETNAMESE_PHONE_PATTERN.test(normalizeVietnamesePhoneNumber(value));
}
