const PHONE_PATTERN = /^(?:\+[1-9]\d{6,14}|0\d{6,14}|[1-9]\d{6,14})$/u;

/**
 * Removes visual separators while preserving an optional international prefix.
 * We intentionally do not infer a country: candidates can use a reachable
 * local number or an E.164 number from any country.
 */
export function normalizePhoneNumber(value: string) {
  return value.trim().replace(/[\s().-]/gu, "");
}

/**
 * Basic, country-neutral validation compatible with E.164 length limits.
 * A country selector is required before applying country-specific rules.
 */
export function isValidPhoneNumber(value: string) {
  return PHONE_PATTERN.test(normalizePhoneNumber(value));
}
