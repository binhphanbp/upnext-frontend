import { VIETNAM_PROVINCES } from "./vietnam-provinces";

const PROVINCE_ALIASES: Record<string, string[]> = {
  "Thành phố Hà Nội": ["hn", "ha noi city"],
  "Thành phố Hải Phòng": ["hai phong city"],
  "Thành phố Đà Nẵng": ["da nang city", "danang"],
  "Thành phố Hồ Chí Minh": ["hcm", "tphcm", "tp hcm", "ho chi minh city", "sai gon", "saigon"],
  "Thành phố Cần Thơ": ["can tho city"],
  "Tỉnh Bà Rịa - Vũng Tàu": ["brvt", "ba ria vung tau"],
  "Tỉnh Đắk Lắk": ["daklak", "dak lak"],
  "Tỉnh Đắk Nông": ["daknong", "dak nong"],
  "Tỉnh Thừa Thiên Huế": ["hue", "thua thien hue"],
};

export function normalizeWebsite(website: string | null | undefined) {
  const value = website?.trim();
  if (!value) return "";

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase()
    .replace(/\b(thanh pho|tp|tinh)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeProvinceName(city: string | null | undefined) {
  const needle = normalizeSearchText(city || "");
  if (!needle) return "";

  return (
    VIETNAM_PROVINCES.find((province) => getProvinceSearchKeys(province.name).includes(needle))
      ?.name ||
    VIETNAM_PROVINCES.find((province) =>
      getProvinceSearchKeys(province.name).some(
        (key) =>
          key.length >= 4 && (needle.includes(key) || (needle.length >= 4 && key.includes(needle))),
      ),
    )?.name ||
    ""
  );
}

export function extractProvinceFromAddress(address: string | null | undefined) {
  const normalizedAddress = normalizeSearchText(address || "");
  if (!normalizedAddress) return "";

  const matches = VIETNAM_PROVINCES.map((province) => ({
    province,
    keys: getProvinceSearchKeys(province.name).filter((key) => key.length >= 4),
  })).sort(
    (a, b) =>
      Math.max(...b.keys.map((key) => key.length)) - Math.max(...a.keys.map((key) => key.length)),
  );

  return (
    matches.find(({ keys }) => keys.some((key) => normalizedAddress.includes(key)))?.province
      .name || ""
  );
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

function getProvinceSearchKeys(provinceName: string) {
  const baseName = normalizeSearchText(provinceName);
  return Array.from(
    new Set([
      baseName,
      baseName.replace(/\s+/g, ""),
      ...(PROVINCE_ALIASES[provinceName] || []).map((alias) => normalizeSearchText(alias)),
      ...(PROVINCE_ALIASES[provinceName] || []).map((alias) =>
        normalizeSearchText(alias).replace(/\s+/g, ""),
      ),
    ]),
  ).filter(Boolean);
}
