import {
  extractProvinceFromAddress,
  normalizeProvinceName,
  normalizeSearchText,
  PROVINCE_ALIASES,
} from "@/shared/utils/vietnam-provinces";

export { extractProvinceFromAddress, normalizeProvinceName, normalizeSearchText };

export function normalizeWebsite(website: string | null | undefined) {
  const value = website?.trim();
  if (!value) return "";

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function stripProvinceFromAddress(address: string | null | undefined, city: string) {
  const value = address?.trim();
  if (!value || !city) return value || "";

  const cityCore = city.replace(/^(Thành phố|Tỉnh)\s+/i, "").trim();
  const aliases = PROVINCE_ALIASES[city] || [];
  const escapedNames = [city, cityCore, ...aliases]
    .filter(Boolean)
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  return value.replace(new RegExp(`\\s*,?\\s*(?:${escapedNames.join("|")})\\s*$`, "iu"), "").trim();
}
