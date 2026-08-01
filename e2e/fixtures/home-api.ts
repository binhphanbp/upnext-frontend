import type { Page } from "@playwright/test";

import type {
  HomeData,
  HomeJobCard,
  HomeMarketInsight,
  HomePostCard,
  HomeTopCompany,
} from "@/features/public/home/api";

type HomeFixtureOptions = {
  expiringJobs?: HomeJobCard[];
  latestJobs?: HomeJobCard[];
  latestPosts?: HomePostCard[];
  marketInsight?: HomeMarketInsight;
  personalization?: HomeData["personalization"];
  actions?: HomeData["actions"];
  recommendations?: HomeData["recommendations"];
  stats?: Partial<HomeData["stats"]>;
  topCompanies?: HomeTopCompany[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isoFromNow(days: number) {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function formatDayMonth(value: string) {
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function emptySection() {
  return {
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
}

export function createHomeJob(index: number, overrides: Partial<HomeJobCard> = {}): HomeJobCard {
  const publishedAt = isoFromNow(-(index + 1));

  return {
    id: `home-job-${index}`,
    title: `Home API Engineer ${index}`,
    slug: `home-api-engineer-${index}`,
    skills: [
      { id: "typescript", name: "TypeScript" },
      { id: `skill-${index}`, name: index % 2 ? "React" : "Node.js" },
    ],
    location: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh, Việt Nam",
    workMode: index % 2 ? "HYBRID" : "REMOTE",
    employmentType: "Full-time",
    experience: "Middle",
    salary: {
      min: 25_000_000,
      max: 40_000_000,
      currency: "VND",
      label: "25 – 40 triệu",
    },
    company: {
      id: `home-company-${index}`,
      name: index === 0 ? "FPT Software" : `Home Company ${index}`,
      logo: "/assets/marketing/home/companies/fpt.svg",
    },
    deadline: isoFromNow(index + 21),
    publishedAt,
    daysRemaining: index + 21,
    urgencyTone: "NORMAL",
    badges: index === 0 ? ["NEW", "REMOTE"] : ["NEW"],
    createdAt: publishedAt,
    ...overrides,
  };
}

export function createTopCompany(
  index: number,
  overrides: Partial<HomeTopCompany> = {},
): HomeTopCompany {
  return {
    id: `home-company-${index}`,
    name: index === 0 ? "FPT Software" : `Home Company ${index}`,
    logo: "/assets/marketing/home/companies/fpt.svg",
    ...(index === 0 ? { coverImage: "/assets/marketing/home/covers/fpt.jpg" } : {}),
    companyType: index % 2 ? "Product" : "Outsourcing",
    shortDescription: `Thông tin tuyển dụng được cung cấp bởi công ty ${index}.`,
    activeJobsCount: Math.max(1, 12 - index),
    applicationsCount: Math.max(1, 120 - index * 7),
    latestPublishedAt: isoFromNow(-(index + 1)),
    ...overrides,
  };
}

export function createHomePost(index: number): HomePostCard {
  return {
    id: `home-post-${index}`,
    title: `Home API post ${index + 1}`,
    slug: `home-api-post-${index + 1}`,
    type: "BLOG",
    metaDescription: `Practical career advice ${index + 1}`,
    category: {
      id: "career-advice",
      name: "Career advice",
      slug: "career-advice",
    },
    createdAt: isoFromNow(-(index + 1)),
  };
}

export function createHomeData(options: HomeFixtureOptions = {}): HomeData {
  const latestJobs =
    options.latestJobs ?? Array.from({ length: 8 }, (_, index) => createHomeJob(index));
  const expiringJobs = options.expiringJobs ?? [
    createHomeJob(20, {
      id: "closing-soon-job",
      title: "Closing Soon Platform Engineer",
      deadline: isoFromNow(3),
      daysRemaining: 3,
      urgencyTone: "URGENT",
    }),
    createHomeJob(21, {
      id: "closing-this-week-job",
      title: "Closing This Week Backend Engineer",
      deadline: isoFromNow(6),
      daysRemaining: 6,
      urgencyTone: "WARNING",
    }),
  ];
  const topCompanies =
    options.topCompanies ?? Array.from({ length: 9 }, (_, index) => createTopCompany(index));
  const latestPosts =
    options.latestPosts ?? Array.from({ length: 6 }, (_, index) => createHomePost(index));
  const marketDates = [-28, -21, -14, -7, 0].map((days) => isoFromNow(days));
  const marketInsight: HomeMarketInsight = options.marketInsight ?? {
    summary: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      newJobsCount: 18,
      activeJobsCount: 24,
      hiringCompaniesCount: 9,
      openJobsCount: 24,
      activeEmployersCount: 9,
      newJobs7dCount: 12,
      newJobs24hCount: 3,
    },
    jobGrowthLineChart: {
      from: marketDates[0]!,
      to: marketDates.at(-1)!,
      minValue: 8,
      maxValue: 24,
      growthPercent: 50,
      points: marketDates.map((date, index) => ({
        date: formatDayMonth(date),
        jobsCount: [8, 12, 18, 24, 20][index]!,
      })),
    },
    salaryDemandBarChart: [
      { salaryRange: "Dưới 10 triệu", jobsCount: 1 },
      { salaryRange: "10 - 20 triệu", jobsCount: 4 },
      { salaryRange: "20 - 30 triệu", jobsCount: 8 },
      { salaryRange: "30 - 50 triệu", jobsCount: 7 },
      { salaryRange: "Trên 50 triệu", jobsCount: 2 },
    ],
    latestJobs: latestJobs.slice(0, 3).map((job) => ({
      id: job.id,
      title: job.title,
      ...(job.slug ? { slug: job.slug } : {}),
      company: job.company,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      positionName: job.experience,
      createdAt: job.createdAt,
      ...(job.publishedAt ? { publishedAt: job.publishedAt } : {}),
    })),
  };
  const allJobs = [...latestJobs, ...expiringJobs];

  return {
    stats: {
      jobsCount: 24,
      companiesCount: topCompanies.length,
      candidatesCount: 0,
      openJobsCount: 24,
      activeEmployersCount: topCompanies.length,
      newJobs7dCount: 12,
      ...options.stats,
    },
    jobsSection: {
      all: {
        items: allJobs,
        pagination: {
          page: 1,
          limit: 12,
          total: allJobs.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      remote: emptySection(),
      partTime: emptySection(),
      latest: {
        items: latestJobs,
        pagination: {
          page: 1,
          limit: 12,
          total: latestJobs.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      expiring: {
        items: expiringJobs,
        pagination: {
          page: 1,
          limit: 8,
          total: expiringJobs.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    },
    topCompanies,
    marketInsight,
    companyLogos: topCompanies.flatMap((company) =>
      company.logo ? [{ slug: company.id, name: company.name, logo: company.logo }] : [],
    ),
    latestPosts,
    ...(options.personalization ? { personalization: options.personalization } : {}),
    ...(options.actions ? { actions: options.actions } : {}),
    ...(options.recommendations ? { recommendations: options.recommendations } : {}),
  };
}

export async function mockHomeApi(page: Page, data = createHomeData()) {
  await page.route(/\/home(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data }),
    });
  });
}

export async function mockCandidateHomeApi(page: Page, data: HomeData) {
  await page.route(/\/home\/candidate(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data }),
    });
  });
}

export async function mockHomeApiError(page: Page, status = 503) {
  await page.route(/\/home(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ message: "Unavailable" }),
      status,
    });
  });
}

export async function installCandidateSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("upnext.candidate.accessToken", "candidate-token");
    localStorage.setItem("upnext.candidate.tokenType", "Bearer");
    localStorage.setItem(
      "upnext.candidate.user",
      JSON.stringify({ id: "candidate-1", email: "candidate@example.com", role: "CANDIDATE" }),
    );
  });
}
