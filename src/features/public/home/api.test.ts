import { afterEach, describe, expect, it, vi } from "vitest";

import type { HomeData, HomeJobCard } from "./api";
import {
  getHomeData,
  getHomeJobCity,
  getHomeTrustCompanies,
  getPublicJobDetail,
  mapHomeCompanies,
  mapHomeJobCard,
} from "./api";

function homeJob(overrides: Partial<HomeJobCard> = {}): HomeJobCard {
  return {
    id: "job-1",
    title: "Platform Engineer",
    skills: [{ id: "skill-1", name: "TypeScript" }],
    location: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh, Việt Nam",
    workMode: "HYBRID",
    employmentType: "Full-time",
    experience: "Middle",
    salary: {
      min: 25_000_000,
      max: 35_000_000,
      currency: "VND",
      label: "25 triệu - 35 triệu",
    },
    company: { id: "company-1", name: "UpNext Labs" },
    deadline: "2026-08-10T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function homeData(): HomeData {
  const emptySection = {
    items: [],
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  return {
    stats: {
      jobsCount: 12,
      companiesCount: 3,
      candidatesCount: 0,
      openJobsCount: 12,
      activeEmployersCount: 3,
      newJobs7dCount: 4,
    },
    jobsSection: {
      all: emptySection,
      remote: emptySection,
      partTime: emptySection,
      latest: emptySection,
      expiring: emptySection,
    },
    topCompanies: [
      {
        id: "rank-1",
        name: "Ranked first",
        logo: "/rank-1.svg",
        companyType: "Product",
        shortDescription: "Has no cover yet.",
        activeJobsCount: 8,
        applicationsCount: 10,
      },
      {
        id: "spotlight-ready",
        name: "Spotlight ready",
        logo: "/spotlight.svg",
        coverImage: "/spotlight-cover.jpg",
        companyType: "Outsourcing",
        shortDescription: "Complete company profile.",
        activeJobsCount: 7,
        applicationsCount: 9,
      },
      {
        id: "inactive",
        name: "No open jobs",
        logo: "/inactive.svg",
        coverImage: "/inactive-cover.jpg",
        companyType: "Product",
        shortDescription: "Should not appear.",
        activeJobsCount: 0,
        applicationsCount: 0,
      },
    ],
    marketInsight: {
      summary: {
        month: 7,
        year: 2026,
        newJobsCount: 0,
        activeJobsCount: 0,
        hiringCompaniesCount: 0,
        openJobsCount: 0,
        activeEmployersCount: 0,
        newJobs7dCount: 0,
        newJobs24hCount: 0,
      },
      jobGrowthLineChart: {
        from: "2026-07-01",
        to: "2026-08-01",
        minValue: 0,
        maxValue: 0,
        growthPercent: 0,
        points: [],
      },
      salaryDemandBarChart: [],
      latestJobs: [],
    },
    companyLogos: [],
    latestPosts: [],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("homepage API adapters", () => {
  it("targets the unversioned aggregate routes used by the deployed backend", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () =>
        Promise.resolve(
          new Response(JSON.stringify({ success: true, data: homeData() }), {
            headers: { "content-type": "application/json" },
            status: 200,
          }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getHomeData();
    await getHomeData("candidate-token");

    const publicRequestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), "https://upnext.local");
    const candidateRequestUrl = new URL(
      String(fetchMock.mock.calls[1]?.[0]),
      "https://upnext.local",
    );
    expect(publicRequestUrl.pathname).toBe("/api/home");
    expect(publicRequestUrl.searchParams.get("topCompaniesLimit")).toBe("30");
    expect(candidateRequestUrl.pathname).toBe("/api/home/candidate");
    const candidateHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);
    expect(candidateHeaders.get("Authorization")).toBe("Bearer candidate-token");
  });

  it("keeps the full address for previews but displays only the city on job cards", () => {
    const mapped = mapHomeJobCard(homeJob());

    expect(mapped.jobPostLocations?.[0]?.jobLocation).toEqual({
      address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh, Việt Nam",
      city: "TP. Hồ Chí Minh",
      workingModel: "HYBRID",
    });
  });

  it("honours the API salary label when a negotiable job still contains salary bounds", () => {
    const mapped = mapHomeJobCard(
      homeJob({
        salary: {
          min: 25_000_000,
          max: 35_000_000,
          currency: "VND",
          label: "Thỏa thuận",
        },
      }),
    );

    expect(mapped.salaryIsNegotiable).toBe(true);
    expect(mapped.salaryIsVisible).toBe(false);
  });

  it("uses Remote when the API has no address for a remote job", () => {
    expect(getHomeJobCity("", "REMOTE")).toBe("Remote");
    expect(getHomeJobCity("Việt Nam", "ONSITE")).toBe("");
  });

  it("filters inactive companies, picks a complete spotlight, and routes by stable UUID", () => {
    const mapped = mapHomeCompanies(homeData());

    expect(mapped.items.map((company) => company.id)).toEqual(["spotlight-ready", "rank-1"]);
    expect(mapped.items[0]?.slug).toBe("spotlight-ready");
    expect(mapped.items.some((company) => company.id === "inactive")).toBe(false);
  });

  it("uses only the dedicated logo payload for the hero trust strip", () => {
    const data = homeData();
    data.companyLogos = [
      { slug: "fpt", name: "FPT Software", logo: "https://cdn.example.com/fpt.png" },
      { slug: "missing-logo", name: "Missing logo", logo: "" },
    ];

    expect(getHomeTrustCompanies(data)).toEqual([
      { slug: "fpt", name: "FPT Software", logo: "https://cdn.example.com/fpt.png" },
    ]);
  });

  it("loads and normalizes one public job detail on demand", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              id: "job-detail",
              description: "<p>Mô tả đầy đủ</p>",
              salaryMin: "25000000",
              salaryMax: "",
            }),
            {
              headers: { "content-type": "application/json" },
              status: 200,
            },
          ),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const job = await getPublicJobDetail("job-detail");

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), "https://upnext.local");
    expect(requestUrl.pathname).toBe("/api/v1/job-posts/job-detail");
    expect(job.salaryMin).toBe(25_000_000);
    expect(job.salaryMax).toBeNull();
  });
});
