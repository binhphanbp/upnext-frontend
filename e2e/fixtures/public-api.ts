import type { Page } from "@playwright/test";

/**
 * Fixtures for the public job and company endpoints.
 *
 * The shapes here are taken from two places that agree: the frontend's own contracts
 * (`PublicJob` in `features/public/home/api.ts`, `PublicCompanyProfile` in
 * `features/public/companies/api.ts`) and the backend selects that produce them
 * (`publicJobPostInclude()` in `job-posts.service.ts`, and the company-by-slug handler that
 * attaches `coverFile` and `photos`). They are deliberately not invented from what a
 * component happens to read — a fixture that pins a shape the API never sends turns a green
 * test into a false report.
 */

export type PublicJobFixture = ReturnType<typeof createPublicJob>;

export function createPublicJob(
  index: number,
  overrides: Partial<ReturnType<typeof basePublicJob>> = {},
) {
  return { ...basePublicJob(index), ...overrides };
}

function basePublicJob(index: number) {
  return {
    id: `public-job-${index}`,
    slug: `public-job-${index}`,
    status: "PUBLISHED",
    moderationStatus: "APPROVED",
    isHidden: false,
    title: `Public Job ${index}`,
    description: "<p>Mô tả công việc công khai.</p>",
    requirements: "<p>Yêu cầu công việc.</p>",
    benefits: "<p>Quyền lợi hấp dẫn.</p>",
    salaryMin: 20_000_000,
    salaryMax: 35_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    vacanciesCount: 2,
    viewCount: 12,
    publishedAt: "2026-07-19T00:00:00.000Z",
    expiredAt: null,
    createdAt: "2026-07-19T00:00:00.000Z",
    company: {
      id: "public-company-1",
      name: "FPT Software",
      slug: "fpt-software",
      address: "Hà Nội",
      companySize: "1000+",
      verificationStatus: "VERIFIED",
      logoUrl: null,
      logoFile: null,
    },
    jobCategory: { name: "Backend" },
    employmentType: { name: "Full-time" },
    experienceLevel: { name: "Fresher" },
    jobPostLocations: [
      { jobLocation: { city: "Hà Nội", workingModel: "HYBRID", address: "Cầu Giấy" } },
    ],
    jobPostSkills: [{ skill: { id: "skill-java", name: "Java" } }],
    // Present in the backend's public include, so the menu group built from it has data.
    jobPostSpecializations: [
      { specialization: { id: "spec-backend", name: "Backend Engineering" } },
    ],
  };
}

export function createPublicCompanyJob(index: number) {
  return {
    id: `company-job-${index}`,
    title: `Company Job ${index}`,
    slug: `company-job-${index}`,
    status: "PUBLISHED",
    moderationStatus: "APPROVED",
    isHidden: false,
    salaryMin: 18_000_000,
    salaryMax: 28_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt: "2026-07-19T00:00:00.000Z",
    expiredAt: null,
    description: "<p>Mô tả ngắn.</p>",
    experienceLevel: { name: "Middle" },
    jobPostLocations: [
      { jobLocation: { city: "Hà Nội", district: "Cầu Giấy", address: "Toà nhà UpNext" } },
    ],
    jobPostSkills: [{ skill: { id: "skill-react", name: "React" } }],
  };
}

/** `photoCount` drives the gallery: the overflow badge only appears past the visible tiles. */
export function createPublicCompany(options: { photoCount?: number } = {}) {
  const photoCount = options.photoCount ?? 0;

  return {
    id: "public-company-1",
    name: "FPT Software",
    slug: "fpt-software",
    type: "PRODUCT",
    taxCode: "0100000000",
    address: "Hà Nội",
    email: "careers@example.test",
    phone: "02400000000",
    website: "https://example.test",
    description: "<p>Công ty công nghệ.</p>",
    benefits: "<p>Chế độ đãi ngộ.</p>",
    companySize: "1000+",
    workingDays: "Thứ 2 - Thứ 6",
    verificationStatus: "VERIFIED",
    createdAt: "2020-01-01T00:00:00.000Z",
    logoUrl: null,
    logoFile: null,
    coverFile: { id: "cover-1", publicUrl: "/assets/marketing/home/covers/fpt.jpg" },
    photos: Array.from({ length: photoCount }, (_, index) => ({
      id: `photo-${index}`,
      publicUrl: "/assets/marketing/home/covers/fpt.jpg",
    })),
    jobPosts: Array.from({ length: 3 }, (_, index) => createPublicCompanyJob(index)),
  };
}

export async function mockPublicJobs(page: Page, jobs: PublicJobFixture[]) {
  await page.route(/\/api\/v1\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({ json: jobs });
  });
}

export async function mockPublicJobDetailBySlug(page: Page, job: PublicJobFixture) {
  await page.route(/\/api\/v1\/job-posts\/[^/?]+(?:\?|$)/, async (route) => {
    // Views are recorded with POST against the same path; only the read is fixtured.
    if (route.request().method() !== "GET") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.fulfill({ json: job });
  });
}

export function createPublicCompanyListItem(
  index: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `public-company-${index}`,
    name: index === 0 ? "FPT Software" : `Public Company ${index}`,
    slug: index === 0 ? "fpt-software" : `public-company-${index}`,
    type: "PRODUCT",
    activeJobsCount: 5,
    logoUrl: null,
    logoFile: null,
    coverFile: null,
    website: "https://example.test",
    address: "Hà Nội",
    description: "Công ty công nghệ.",
    companySize: "1000+",
    reputationScore: 80,
    verificationStatus: "VERIFIED",
    ...overrides,
  };
}

export async function mockPublicCompanyList(
  page: Page,
  companies = [createPublicCompanyListItem(0)],
) {
  // Registered before the by-slug route so the bare listing is not swallowed by it.
  await page.route(/\/api\/v1\/companies(?:\?|$)/, async (route) => {
    await route.fulfill({
      json: {
        items: companies,
        meta: { total: companies.length, page: 1, limit: 12, totalPages: 1 },
      },
    });
  });
}

export async function mockPublicCompany(
  page: Page,
  company: ReturnType<typeof createPublicCompany>,
) {
  await page.route(/\/api\/v1\/companies\/[^/?]+(?:\?|$)/, async (route) => {
    await route.fulfill({ json: company });
  });
}
