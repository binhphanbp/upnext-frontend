import { describe, expect, it } from "vitest";

import {
  buildCompanyFacets,
  type CompanyFilters,
  companySizeLowerBound,
  type DirectoryCompany,
  EMPTY_COMPANY_FILTERS,
  extractCompanyCity,
  filterCompanies,
  hasActiveCompanyFilters,
  isCompanySort,
  localizeCompanyCity,
  matchesCompanyQuery,
  normalizeCompanySizeBand,
  parseReputationScore,
  reputationTier,
  sortCompanies,
} from "./companies-directory";

function company(overrides: Partial<DirectoryCompany> = {}): DirectoryCompany {
  return {
    id: "1",
    name: "Tiki Group",
    type: "PRODUCT",
    activeJobsCount: 3,
    address: "50/20 Street 45, An Hoi Tay Ward, Ho Chi Minh City, Vietnam",
    companySize: "1000-5000",
    reputationScore: "30",
    ...overrides,
  };
}

function filters(overrides: Partial<CompanyFilters> = {}): CompanyFilters {
  return { ...EMPTY_COMPANY_FILTERS, ...overrides };
}

describe("extractCompanyCity", () => {
  it("reads the city from a full address", () => {
    expect(extractCompanyCity("50/20 Street 45, An Hoi Tay Ward, Ho Chi Minh City, Vietnam")).toBe(
      "Ho Chi Minh City",
    );
  });

  it("reads the city from the shortest observed form", () => {
    expect(extractCompanyCity("261-263 Khanh Hoi Street, Ho Chi Minh City, Vietnam")).toBe(
      "Ho Chi Minh City",
    );
  });

  it("still finds the city when the country is not appended", () => {
    expect(extractCompanyCity("Duy Tan Street, Cau Giay Ward, Hanoi")).toBe("Hanoi");
  });

  it("names no city for a street-only address", () => {
    expect(extractCompanyCity("261-263 Khanh Hoi Street")).toBe("");
    expect(extractCompanyCity("Khanh Hoi Street, Vietnam")).toBe("");
  });

  it("treats a missing address as no city instead of throwing", () => {
    expect(extractCompanyCity(null)).toBe("");
    expect(extractCompanyCity(undefined)).toBe("");
    expect(extractCompanyCity("")).toBe("");
  });
});

describe("companySizeLowerBound", () => {
  it("orders bands numerically rather than as text", () => {
    // "1000-5000" would sort before "201-500" alphabetically.
    expect(companySizeLowerBound("201-500")).toBeLessThan(companySizeLowerBound("1000-5000"));
    expect(companySizeLowerBound("5000+")).toBeLessThan(companySizeLowerBound("10000+"));
  });

  it("sends an unparseable band to the end", () => {
    expect(companySizeLowerBound("unknown")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("parseReputationScore", () => {
  it("parses the numeric string the API sends", () => {
    expect(parseReputationScore("90")).toBe(90);
  });

  it("keeps a genuine zero distinct from a missing score", () => {
    expect(parseReputationScore("0")).toBe(0);
    expect(parseReputationScore(null)).toBeNull();
    expect(parseReputationScore(undefined)).toBeNull();
    expect(parseReputationScore("")).toBeNull();
    expect(parseReputationScore("n/a")).toBeNull();
  });
});

describe("normalizeCompanySizeBand", () => {
  it("folds the API's overlapping bands into disjoint buckets", () => {
    expect(normalizeCompanySizeBand("201-500")).toBe("under-1000");
    expect(normalizeCompanySizeBand("501-1000")).toBe("under-1000");
    expect(normalizeCompanySizeBand("1000-5000")).toBe("1000-5000");
    expect(normalizeCompanySizeBand("5000+")).toBe("over-5000");
    expect(normalizeCompanySizeBand("10000+")).toBe("over-5000");
  });

  it("places an open-ended band by the lower bound it actually states", () => {
    // "3000+" overlaps both "1000-5000" and "5000+"; 3000 is the only figure it commits to.
    expect(normalizeCompanySizeBand("3000+")).toBe("1000-5000");
  });

  it("treats a missing or unparseable band as unknown", () => {
    expect(normalizeCompanySizeBand(null)).toBe("");
    expect(normalizeCompanySizeBand(undefined)).toBe("");
    expect(normalizeCompanySizeBand("")).toBe("");
    expect(normalizeCompanySizeBand("unknown")).toBe("");
  });
});

describe("reputationTier", () => {
  it("buckets scores coarsely so a five-point gap is not a ranking", () => {
    expect(reputationTier(90)).toBe("excellent");
    expect(reputationTier(60)).toBe("high");
    // The live cluster at 50-55 must land in one tier, not two.
    expect(reputationTier(50)).toBe("fair");
    expect(reputationTier(55)).toBe("fair");
    expect(reputationTier(30)).toBe("low");
  });
});

describe("localizeCompanyCity", () => {
  it("gives the Vietnamese name for a unit the API stores in English", () => {
    expect(localizeCompanyCity("Ho Chi Minh City", "vi")).toBe("TP. Hồ Chí Minh");
    expect(localizeCompanyCity("Hanoi", "vi")).toBe("Hà Nội");
    expect(localizeCompanyCity("Quang Ngai Province", "vi")).toBe("Quảng Ngãi");
  });

  it("drops the administrative suffix for an unmapped unit rather than showing it raw", () => {
    expect(localizeCompanyCity("Ninh Thuan Province", "vi")).toBe("Ninh Thuan");
  });

  it("leaves the English name alone apart from the suffix", () => {
    expect(localizeCompanyCity("Ho Chi Minh City", "en")).toBe("Ho Chi Minh");
    expect(localizeCompanyCity("Gia Lai Province", "en")).toBe("Gia Lai");
  });

  it("returns nothing when there is no city", () => {
    expect(localizeCompanyCity("", "vi")).toBe("");
  });
});

describe("matchesCompanyQuery", () => {
  it("matches on name, case-insensitively", () => {
    expect(matchesCompanyQuery(company(), "tiki")).toBe(true);
    expect(matchesCompanyQuery(company(), "shopee")).toBe(false);
  });

  it("matches on type and on address so a city query still lands", () => {
    expect(matchesCompanyQuery(company(), "product")).toBe(true);
    expect(matchesCompanyQuery(company(), "Ho Chi Minh")).toBe(true);
  });

  it("treats a blank or whitespace-only query as no restriction", () => {
    expect(matchesCompanyQuery(company(), "")).toBe(true);
    expect(matchesCompanyQuery(company(), "   ")).toBe(true);
  });
});

describe("filterCompanies", () => {
  const companies = [
    company({ id: "1", name: "Tiki", type: "PRODUCT", companySize: "1000-5000" }),
    company({
      id: "2",
      name: "FPT Software",
      type: "OUTSOURCING",
      companySize: "10000+",
      address: "Duy Tan Street, Cau Giay Ward, Hanoi, Vietnam",
    }),
    company({ id: "3", name: "VNG", type: "PRODUCT", companySize: "1000-5000" }),
  ];

  it("ANDs the groups together", () => {
    const result = filterCompanies(companies, filters({ type: "PRODUCT", city: "Hanoi" }));
    expect(result).toHaveLength(0);
  });

  it("filters by a single group", () => {
    expect(filterCompanies(companies, filters({ type: "PRODUCT" })).map((c) => c.id)).toEqual([
      "1",
      "3",
    ]);
    expect(filterCompanies(companies, filters({ city: "Hanoi" })).map((c) => c.id)).toEqual(["2"]);
    // The filter value is the normalized band, so "10000+" is reached via "over-5000".
    expect(filterCompanies(companies, filters({ size: "over-5000" })).map((c) => c.id)).toEqual([
      "2",
    ]);
  });

  it("groups overlapping API bands under one filter value", () => {
    const overlapping = [
      company({ id: "a", companySize: "1000-5000" }),
      company({ id: "b", companySize: "3000+" }),
      company({ id: "c", companySize: "5000+" }),
    ];

    expect(filterCompanies(overlapping, filters({ size: "1000-5000" })).map((c) => c.id)).toEqual([
      "a",
      "b",
    ]);
    expect(filterCompanies(overlapping, filters({ size: "over-5000" })).map((c) => c.id)).toEqual([
      "c",
    ]);
  });

  it("returns everything when nothing is selected", () => {
    expect(filterCompanies(companies, EMPTY_COMPANY_FILTERS)).toHaveLength(3);
  });
});

describe("sortCompanies", () => {
  const companies = [
    company({ id: "1", name: "Beta", activeJobsCount: 1, reputationScore: "90" }),
    company({ id: "2", name: "Alpha", activeJobsCount: 7, reputationScore: "30" }),
    company({ id: "3", name: "Gamma", activeJobsCount: 1, reputationScore: "50" }),
  ];

  it("sorts by active jobs descending", () => {
    expect(sortCompanies(companies, "jobs").map((c) => c.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by reputation descending", () => {
    expect(sortCompanies(companies, "reputation").map((c) => c.id)).toEqual(["1", "3", "2"]);
  });

  it("sorts by name", () => {
    expect(sortCompanies(companies, "name").map((c) => c.id)).toEqual(["2", "1", "3"]);
  });

  it("breaks ties by name so equal companies keep a stable order", () => {
    // Beta and Gamma both have 1 job; Beta must come first regardless of input order.
    expect(
      sortCompanies(companies, "jobs")
        .slice(1)
        .map((c) => c.name),
    ).toEqual(["Beta", "Gamma"]);
  });

  it("does not mutate the input array", () => {
    const input = [...companies];
    sortCompanies(input, "name");
    expect(input.map((c) => c.id)).toEqual(["1", "2", "3"]);
  });
});

describe("buildCompanyFacets", () => {
  const companies = [
    company({ id: "1", type: "PRODUCT", companySize: "201-500" }),
    company({ id: "2", type: "PRODUCT", companySize: "1000-5000" }),
    company({
      id: "3",
      type: "OUTSOURCING",
      companySize: "1000-5000",
      address: "Duy Tan Street, Cau Giay Ward, Hanoi, Vietnam",
    }),
  ];

  it("derives options from the data with counts", () => {
    const { types, cities } = buildCompanyFacets(companies, EMPTY_COMPANY_FILTERS);

    expect(types).toEqual([
      { value: "OUTSOURCING", count: 1 },
      { value: "PRODUCT", count: 2 },
    ]);
    // Cities lead with the busiest, so Hà Nội and TP. HCM never sit below a one-company province.
    expect(cities).toEqual([
      { value: "Ho Chi Minh City", count: 2 },
      { value: "Hanoi", count: 1 },
    ]);
  });

  it("orders headcount bands low to high, not alphabetically", () => {
    const { sizes } = buildCompanyFacets(companies, EMPTY_COMPANY_FILTERS);
    expect(sizes.map((option) => option.value)).toEqual(["under-1000", "1000-5000"]);
  });

  it("narrows other groups once a filter is applied", () => {
    const { types } = buildCompanyFacets(companies, filters({ city: "Hanoi" }));
    expect(types).toEqual([{ value: "OUTSOURCING", count: 1 }]);
  });

  it("ignores a group's own selection so siblings stay switchable", () => {
    // PRODUCT picked: OUTSOURCING must still report what switching to it would yield.
    const { types } = buildCompanyFacets(companies, filters({ type: "PRODUCT" }));
    expect(types).toEqual([
      { value: "OUTSOURCING", count: 1 },
      { value: "PRODUCT", count: 2 },
    ]);
  });

  it("promises the count the filtered grid actually returns", () => {
    const active = filters({ city: "Ho Chi Minh City" });
    const { types } = buildCompanyFacets(companies, active);
    const promised = types.find((option) => option.value === "PRODUCT")!.count;

    const actual = filterCompanies(companies, { ...active, type: "PRODUCT" }).length;
    expect(actual).toBe(promised);
  });

  it("omits companies with no value for a group instead of an empty option", () => {
    const { sizes, cities } = buildCompanyFacets(
      [company({ id: "9", companySize: null, address: null })],
      EMPTY_COMPANY_FILTERS,
    );
    expect(sizes).toEqual([]);
    expect(cities).toEqual([]);
  });
});

describe("hasActiveCompanyFilters", () => {
  it("is false only when every group is blank", () => {
    expect(hasActiveCompanyFilters(EMPTY_COMPANY_FILTERS)).toBe(false);
    expect(hasActiveCompanyFilters(filters({ query: "   " }))).toBe(false);
    expect(hasActiveCompanyFilters(filters({ query: "tiki" }))).toBe(true);
    expect(hasActiveCompanyFilters(filters({ city: "Hanoi" }))).toBe(true);
  });
});

describe("isCompanySort", () => {
  it("accepts only known sorts so a URL cannot inject one", () => {
    expect(isCompanySort("jobs")).toBe(true);
    expect(isCompanySort("reputation")).toBe(true);
    expect(isCompanySort("name")).toBe(true);
    expect(isCompanySort("bogus")).toBe(false);
    expect(isCompanySort(null)).toBe(false);
  });
});
