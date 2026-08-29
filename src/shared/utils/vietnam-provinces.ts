/**
 * Canonical province/city data for the whole app.
 *
 * Vietnamese addresses are written smallest-unit-first, and both our own free-form profile
 * addresses and third-party geocoders hand back a district or ward far more often than the
 * province. Every search surface filters by province, so anything that resolves a location has to
 * climb back up to the province level through this module instead of trusting the raw string.
 */

export const VIETNAM_PROVINCES = [
  { code: 1, name: "Thành phố Hà Nội" },
  { code: 2, name: "Tỉnh Hà Giang" },
  { code: 4, name: "Tỉnh Cao Bằng" },
  { code: 6, name: "Tỉnh Bắc Kạn" },
  { code: 8, name: "Tỉnh Tuyên Quang" },
  { code: 10, name: "Tỉnh Lào Cai" },
  { code: 11, name: "Tỉnh Điện Biên" },
  { code: 12, name: "Tỉnh Lai Châu" },
  { code: 14, name: "Tỉnh Sơn La" },
  { code: 15, name: "Tỉnh Yên Bái" },
  { code: 17, name: "Tỉnh Hoà Bình" },
  { code: 19, name: "Tỉnh Thái Nguyên" },
  { code: 20, name: "Tỉnh Lạng Sơn" },
  { code: 22, name: "Tỉnh Quảng Ninh" },
  { code: 24, name: "Tỉnh Bắc Giang" },
  { code: 25, name: "Tỉnh Phú Thọ" },
  { code: 26, name: "Tỉnh Vĩnh Phúc" },
  { code: 27, name: "Tỉnh Bắc Ninh" },
  { code: 30, name: "Tỉnh Hải Dương" },
  { code: 31, name: "Thành phố Hải Phòng" },
  { code: 33, name: "Tỉnh Hưng Yên" },
  { code: 34, name: "Tỉnh Thái Bình" },
  { code: 35, name: "Tỉnh Hà Nam" },
  { code: 36, name: "Tỉnh Nam Định" },
  { code: 37, name: "Tỉnh Ninh Bình" },
  { code: 38, name: "Tỉnh Thanh Hóa" },
  { code: 40, name: "Tỉnh Nghệ An" },
  { code: 42, name: "Tỉnh Hà Tĩnh" },
  { code: 44, name: "Tỉnh Quảng Bình" },
  { code: 45, name: "Tỉnh Quảng Trị" },
  { code: 46, name: "Tỉnh Thừa Thiên Huế" },
  { code: 48, name: "Thành phố Đà Nẵng" },
  { code: 49, name: "Tỉnh Quảng Nam" },
  { code: 51, name: "Tỉnh Quảng Ngãi" },
  { code: 52, name: "Tỉnh Bình Định" },
  { code: 54, name: "Tỉnh Phú Yên" },
  { code: 56, name: "Tỉnh Khánh Hòa" },
  { code: 58, name: "Tỉnh Ninh Thuận" },
  { code: 60, name: "Tỉnh Bình Thuận" },
  { code: 62, name: "Tỉnh Kon Tum" },
  { code: 64, name: "Tỉnh Gia Lai" },
  { code: 66, name: "Tỉnh Đắk Lắk" },
  { code: 67, name: "Tỉnh Đắk Nông" },
  { code: 68, name: "Tỉnh Lâm Đồng" },
  { code: 70, name: "Tỉnh Bình Phước" },
  { code: 72, name: "Tỉnh Tây Ninh" },
  { code: 74, name: "Tỉnh Bình Dương" },
  { code: 75, name: "Tỉnh Đồng Nai" },
  { code: 77, name: "Tỉnh Bà Rịa - Vũng Tàu" },
  { code: 79, name: "Thành phố Hồ Chí Minh" },
  { code: 80, name: "Tỉnh Long An" },
  { code: 82, name: "Tỉnh Tiền Giang" },
  { code: 83, name: "Tỉnh Bến Tre" },
  { code: 84, name: "Tỉnh Trà Vinh" },
  { code: 86, name: "Tỉnh Vĩnh Long" },
  { code: 87, name: "Tỉnh Đồng Tháp" },
  { code: 89, name: "Tỉnh An Giang" },
  { code: 91, name: "Tỉnh Kiên Giang" },
  { code: 92, name: "Thành phố Cần Thơ" },
  { code: 93, name: "Tỉnh Hậu Giang" },
  { code: 94, name: "Tỉnh Sóc Trăng" },
  { code: 95, name: "Tỉnh Bạc Liêu" },
  { code: 96, name: "Tỉnh Cà Mau" },
] as const;

export const PROVINCE_ALIASES: Record<string, string[]> = {
  "Thành phố Hà Nội": ["hn", "ha noi city", "hanoi"],
  "Thành phố Hải Phòng": ["hai phong city", "haiphong"],
  "Thành phố Đà Nẵng": ["da nang city", "danang"],
  "Thành phố Hồ Chí Minh": [
    "hcm",
    "tphcm",
    "tp hcm",
    "hcmc",
    "ho chi minh city",
    "sai gon",
    "saigon",
  ],
  "Thành phố Cần Thơ": ["can tho city", "cantho"],
  "Tỉnh Bà Rịa - Vũng Tàu": ["brvt", "ba ria vung tau", "vung tau"],
  "Tỉnh Đắk Lắk": ["daklak", "dak lak", "buon ma thuot"],
  "Tỉnh Đắk Nông": ["daknong", "dak nong"],
  "Tỉnh Thừa Thiên Huế": ["hue", "thua thien hue"],
  "Tỉnh Khánh Hòa": ["nha trang"],
  "Tỉnh Lâm Đồng": ["da lat", "dalat"],
  "Tỉnh Quảng Ninh": ["ha long", "halong"],
  "Tỉnh Đồng Nai": ["bien hoa"],
  "Tỉnh Bình Dương": ["thu dau mot", "di an", "thuan an"],
};

/**
 * The label each search surface shows. Only Hồ Chí Minh keeps an administrative prefix, because
 * "TP. Hồ Chí Minh" is what the job-search dropdowns and the seeded job data already use.
 */
const SEARCH_LABEL_OVERRIDES: Record<string, string> = {
  "Thành phố Hồ Chí Minh": "TP. Hồ Chí Minh",
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\b(thanh pho|tp|tinh)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

/**
 * Resolves any location string — a bare province, an alias, or a full street address — to the
 * province it belongs to. Returns the canonical `Tỉnh …`/`Thành phố …` name, or "" when nothing
 * in the string maps to a Vietnamese province.
 */
export function resolveProvinceName(value: string | null | undefined) {
  return normalizeProvinceName(value) || extractProvinceFromAddress(value);
}

/** Turns a canonical province name into the shorter label the search inputs display. */
export function toProvinceSearchLabel(provinceName: string) {
  return (
    SEARCH_LABEL_OVERRIDES[provinceName] ??
    provinceName.replace(/^(Thành phố|Tỉnh)\s+/iu, "").trim()
  );
}
