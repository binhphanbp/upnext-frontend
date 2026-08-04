import { parsePhoneNumberFromString } from "libphonenumber-js/min";

const DEFAULT_PHONE_COUNTRY = "VN";

function parsePhoneNumber(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const digits = trimmedValue.replace(/[\s().-]/gu, "");
  const internationalInput = digits.startsWith("00")
    ? `+${digits.slice(2)}`
    : digits.startsWith("84")
      ? `+${digits}`
      : trimmedValue;

  if (!internationalInput.startsWith("+") && !internationalInput.startsWith("0")) {
    return null;
  }

  return parsePhoneNumberFromString(
    internationalInput,
    internationalInput.startsWith("+") ? undefined : DEFAULT_PHONE_COUNTRY,
  );
}

/**
 * Validates an international phone number. Vietnam is used only to interpret
 * a local number beginning with `0`; every other country should use `+` and
 * its country calling code to avoid ambiguity.
 */
export function isValidPhoneNumber(value: string | null | undefined) {
  if (typeof value !== "string") return false;

  return parsePhoneNumber(value)?.isValid() ?? false;
}

/** Returns a valid number in E.164 form so it can be stored consistently. */
export function normalizePhoneNumber(value: string) {
  const phoneNumber = parsePhoneNumber(value);
  return phoneNumber?.isValid() ? phoneNumber.number : value.trim();
}
