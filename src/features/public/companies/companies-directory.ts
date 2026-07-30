/**
 * Search, filter and sort rules for the public company directory.
 *
 * The filter dropdowns and the result grid are two views of the same rules, so both read the
 * helpers below instead of re-deriving them. The company shape is declared structurally so this
 * stays a leaf module with no dependency on the page component or the API client.
 */

export type DirectoryCompany = {
  id: string;
  name: string;
  type: string;
  activeJobsCount: number;
  address?: string | null;
  companySize?: string | null;
  reputationScore?: number | string | null;
};

export const COMPANY_SORTS = ["jobs", "reputation", "name"] as const;

export type CompanySort = (typeof COMPANY_SORTS)[number];

export function isCompanySort(value: string | null | undefined): value is CompanySort {
  return COMPANY_SORTS.includes(value as CompanySort);
}

/** An empty string means "no restriction" for every group. */
export type CompanyFilters = {
  query: string;
  type: string;
  size: string;
  city: string;
};

export const EMPTY_COMPANY_FILTERS: CompanyFilters = { query: "", type: "", size: "", city: "" };

/** Groups are AND-ed; each group holds at most one value, so there is no OR within a group. */
const FILTER_GROUPS = ["query", "type", "size", "city"] as const;

export type CompanyFilterGroup = (typeof FILTER_GROUPS)[number];

/**
 * Addresses arrive as one free-text line ending in the country, e.g.
 * "50/20 Street 45, An Hoi Tay Ward, Ho Chi Minh City, Vietnam".
 * The city is the last segment once a trailing country is dropped, which also holds for the
 * shortest observed form ("261-263 Khanh Hoi Street, Ho Chi Minh City, Vietnam") and degrades to
 * the final segment if the API ever stops appending the country.
 */
const COUNTRY_SEGMENTS = new Set(["vietnam", "viet nam", "việt nam", "vn"]);

export function extractCompanyCity(address: string | null | undefined) {
  if (!address) return "";

  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  while (
    segments.length > 1 &&
    COUNTRY_SEGMENTS.has(segments[segments.length - 1]!.toLowerCase())
  ) {
    segments.pop();
  }

  // A single remaining segment is a street-only address, which names no city.
  return segments.length > 1 ? segments[segments.length - 1]! : "";
}

/** Headcount bands are free text ("201-500", "10000+"), so order them by their lower bound. */
export function companySizeLowerBound(size: string) {
  const match = size.match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

/**
 * The API's headcount bands overlap, so they cannot be offered as filter options verbatim.
 * Live data holds "201-500", "501-1000", "1000-5000", "3000+", "5000+" and "10000+" — a company
 * tagged "3000+" also belongs to "1000-5000" and possibly "5000+", so a candidate picking one band
 * could never be sure what it excluded.
 *
 * Each raw band is therefore folded into one of three disjoint buckets by its lower bound, which is
 * the only figure every band states unambiguously. "3000+" lands in the middle bucket because 3000
 * is where it starts, even though it may reach higher.
 */
export const COMPANY_SIZE_BANDS = ["under-1000", "1000-5000", "over-5000"] as const;

export type CompanySizeBand = (typeof COMPANY_SIZE_BANDS)[number];

export function normalizeCompanySizeBand(size: string | null | undefined): CompanySizeBand | "" {
  if (!size) return "";

  const lowerBound = companySizeLowerBound(size);
  if (!Number.isFinite(lowerBound)) return "";
  if (lowerBound < 1000) return "under-1000";
  if (lowerBound < 5000) return "1000-5000";
  return "over-5000";
}

/**
 * Administrative units arrive in English ("Ho Chi Minh City", "Gia Lai Province") because that is
 * how the API stores them — there is no Vietnamese variant to read. Rendering that verbatim on a
 * Vietnamese page is jarring, so known units get a proper Vietnamese name here.
 *
 * Anything unmapped falls back to the name with its "Province"/"City" suffix dropped, so a new
 * unit reads as "Ninh Thuan" rather than "Ninh Thuan Province" while it waits to be added.
 */
const CITY_NAMES_VI: Record<string, string> = {
  "ha noi": "Hà Nội",
  hanoi: "Hà Nội",
  "ho chi minh": "TP. Hồ Chí Minh",
  "hai phong": "Hải Phòng",
  "da nang": "Đà Nẵng",
  "can tho": "Cần Thơ",
  hue: "Huế",
  "thua thien hue": "Huế",
  "an giang": "An Giang",
  "bac giang": "Bắc Giang",
  "bac ninh": "Bắc Ninh",
  "binh duong": "Bình Dương",
  "ca mau": "Cà Mau",
  "cao bang": "Cao Bằng",
  "dak lak": "Đắk Lắk",
  "dien bien": "Điện Biên",
  "dong nai": "Đồng Nai",
  "dong thap": "Đồng Tháp",
  "gia lai": "Gia Lai",
  "ha tinh": "Hà Tĩnh",
  "hung yen": "Hưng Yên",
  "khanh hoa": "Khánh Hòa",
  "lai chau": "Lai Châu",
  "lam dong": "Lâm Đồng",
  "lang son": "Lạng Sơn",
  "lao cai": "Lào Cai",
  "nghe an": "Nghệ An",
  "ninh binh": "Ninh Bình",
  "phu tho": "Phú Thọ",
  "quang ngai": "Quảng Ngãi",
  "quang ninh": "Quảng Ninh",
  "quang tri": "Quảng Trị",
  "son la": "Sơn La",
  "tay ninh": "Tây Ninh",
  "thai nguyen": "Thái Nguyên",
  "thanh hoa": "Thanh Hóa",
  "tuyen quang": "Tuyên Quang",
  "vinh long": "Vĩnh Long",
};

/** Drops the administrative suffix the API appends, e.g. "Gia Lai Province" -> "Gia Lai". */
function stripAdministrativeSuffix(city: string) {
  return city.replace(/\s+(province|city|municipality)$/iu, "").trim();
}

export function localizeCompanyCity(city: string, locale: "vi" | "en") {
  if (!city) return "";

  const bare = stripAdministrativeSuffix(city);
  if (locale === "en") return bare;

  return CITY_NAMES_VI[bare.toLowerCase()] ?? bare;
}

/**
 * The reputation score arrives as a numeric string ("55"), so it must be parsed before any compare.
 * Returns null rather than 0 for a missing score, because "not scored yet" and "scored zero" are
 * different claims and the card must not present the first as the second.
 */
export function parseReputationScore(score: number | string | null | undefined) {
  if (score === null || score === undefined || score === "") return null;

  const parsed = typeof score === "number" ? score : Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

export const REPUTATION_SCORE_MAX = 100;

export type ReputationTier = "excellent" | "high" | "fair" | "low";

/**
 * Buckets a score for display. Live data clusters hard — 94 of 100 companies sit at 50 or 55 — so
 * the tier is deliberately coarse: a one-off difference of five points is noise, not a ranking, and
 * labelling every company differently would imply precision the score does not carry.
 */
export function reputationTier(score: number): ReputationTier {
  if (score >= 80) return "excellent";
  if (score >= 60) return "high";
  if (score >= 40) return "fair";
  return "low";
}

/** Matches the name, the company type and the address so a city or "product" query still lands. */
export function matchesCompanyQuery(company: DirectoryCompany, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [company.name, company.type, company.address ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

const GROUP_MATCHERS: Record<
  CompanyFilterGroup,
  (company: DirectoryCompany, value: string) => boolean
> = {
  query: matchesCompanyQuery,
  type: (company, value) => !value || company.type === value,
  size: (company, value) => !value || normalizeCompanySizeBand(company.companySize) === value,
  city: (company, value) => !value || extractCompanyCity(company.address) === value,
};

export function matchesAllCompanyFilters(company: DirectoryCompany, filters: CompanyFilters) {
  return FILTER_GROUPS.every((group) => GROUP_MATCHERS[group](company, filters[group]));
}

export function filterCompanies<TCompany extends DirectoryCompany>(
  companies: TCompany[],
  filters: CompanyFilters,
) {
  return companies.filter((company) => matchesAllCompanyFilters(company, filters));
}

/**
 * Sorts a copy so the caller's array is never mutated. Ties fall back to name for a stable,
 * predictable order rather than leaving equal-scoring companies in arbitrary API order.
 */
export function sortCompanies<TCompany extends DirectoryCompany>(
  companies: TCompany[],
  sort: CompanySort,
) {
  const byName = (a: TCompany, b: TCompany) => a.name.localeCompare(b.name, "vi");

  return [...companies].sort((a, b) => {
    if (sort === "name") return byName(a, b);
    if (sort === "reputation") {
      // Unscored companies sort last instead of tying with a genuine zero.
      const scoreOf = (company: TCompany) =>
        parseReputationScore(company.reputationScore) ?? Number.NEGATIVE_INFINITY;
      const difference = scoreOf(b) - scoreOf(a);
      return difference !== 0 ? difference : byName(a, b);
    }
    const difference = b.activeJobsCount - a.activeJobsCount;
    return difference !== 0 ? difference : byName(a, b);
  });
}

export type FacetOption = {
  value: string;
  count: number;
};

/**
 * Counts what each dropdown option would yield.
 *
 * The option's own group is skipped, so a number answers "how many companies if I switch to this"
 * rather than collapsing every unselected sibling to zero — these dropdowns are single-select, so
 * picking an option replaces the current value instead of narrowing it further.
 */
function countOptions<TCompany extends DirectoryCompany>(
  companies: TCompany[],
  filters: CompanyFilters,
  group: CompanyFilterGroup,
  readValue: (company: TCompany) => string,
): FacetOption[] {
  const counts = new Map<string, number>();

  for (const company of companies) {
    const passesOtherGroups = FILTER_GROUPS.every(
      (other) => other === group || GROUP_MATCHERS[other](company, filters[other]),
    );
    if (!passesOtherGroups) continue;

    const value = readValue(company);
    if (!value) continue;

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts].map(([value, count]) => ({ value, count }));
}

export type CompanyFacets = {
  types: FacetOption[];
  sizes: FacetOption[];
  cities: FacetOption[];
};

/**
 * Options come from the data rather than a hardcoded list, so a new company type or city appears
 * without a code change.
 *
 * Cities are ordered by how many companies they hold, not alphabetically: live data is 47 in Hà Nội
 * and 45 in TP. Hồ Chí Minh against eight provinces holding one company each, so the two choices
 * that matter must not be buried mid-list. Headcount bands keep their fixed low-to-high order, and
 * types read alphabetically because none of the three dominates.
 */
export function buildCompanyFacets<TCompany extends DirectoryCompany>(
  companies: TCompany[],
  filters: CompanyFilters,
): CompanyFacets {
  const byValue = (a: FacetOption, b: FacetOption) => a.value.localeCompare(b.value, "vi");
  const byCountThenValue = (a: FacetOption, b: FacetOption) => b.count - a.count || byValue(a, b);
  // Unknown bands sort last rather than to the front, which a raw -1 from indexOf would do.
  const bandOrder = (value: string) => {
    const index = COMPANY_SIZE_BANDS.indexOf(value as CompanySizeBand);
    return index === -1 ? COMPANY_SIZE_BANDS.length : index;
  };

  return {
    types: countOptions(companies, filters, "type", (company) => company.type).sort(byValue),
    sizes: countOptions(companies, filters, "size", (company) =>
      normalizeCompanySizeBand(company.companySize),
    ).sort((a, b) => bandOrder(a.value) - bandOrder(b.value)),
    cities: countOptions(companies, filters, "city", (company) =>
      extractCompanyCity(company.address),
    ).sort(byCountThenValue),
  };
}

export function hasActiveCompanyFilters(filters: CompanyFilters) {
  return FILTER_GROUPS.some((group) => filters[group].trim() !== "");
}
