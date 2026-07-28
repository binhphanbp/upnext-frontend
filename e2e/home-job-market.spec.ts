import { expect, type Page, test } from "@playwright/test";

function relativeIso({ days = 0, hours = 0 }: { days?: number; hours?: number }) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000).toISOString();
}

function marketJob({
  id,
  title,
  companyId,
  companyName,
  publishedAt,
  expiredAt,
  salaryMin,
  salaryMax,
}: {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  publishedAt: string;
  expiredAt?: string;
  salaryMin: number;
  salaryMax: number;
}) {
  return {
    id,
    title,
    description: `${title} description`,
    requirements: null,
    benefits: null,
    salaryMin,
    salaryMax,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt,
    expiredAt: expiredAt ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: publishedAt,
    company: { id: companyId, name: companyName },
    jobCategory: { name: "Software Engineering" },
    employmentType: { name: "Full-time" },
    experienceLevel: { name: "Middle" },
    jobPostLocations: [{ jobLocation: { city: "Hà Nội" } }],
    jobPostSkills: [{ skill: { id: `skill-${id}`, name: "TypeScript" } }],
  };
}

async function mockMarketData(page: Page) {
  const jobs = [
    marketJob({
      id: "market-job-1",
      title: "Platform Engineer",
      companyId: "company-1",
      companyName: "UpNext Labs",
      publishedAt: relativeIso({ hours: 1 }),
      salaryMin: 4_000_000,
      salaryMax: 6_000_000,
    }),
    marketJob({
      id: "market-job-2",
      title: "Frontend Engineer",
      companyId: "company-1",
      companyName: "UpNext Labs",
      publishedAt: relativeIso({ days: 3 }),
      salaryMin: 12_000_000,
      salaryMax: 18_000_000,
    }),
    marketJob({
      id: "market-job-3",
      title: "Backend Engineer",
      companyId: "company-2",
      companyName: "UpNext Core",
      publishedAt: relativeIso({ days: 8 }),
      salaryMin: 22_000_000,
      salaryMax: 28_000_000,
    }),
    marketJob({
      id: "market-job-4",
      title: "Data Engineer",
      companyId: "company-2",
      companyName: "UpNext Core",
      publishedAt: relativeIso({ days: 15 }),
      salaryMin: 35_000_000,
      salaryMax: 45_000_000,
    }),
    marketJob({
      id: "market-job-5",
      title: "Engineering Manager",
      companyId: "company-3",
      companyName: "UpNext Cloud",
      publishedAt: relativeIso({ days: 29 }),
      salaryMin: 55_000_000,
      salaryMax: 65_000_000,
    }),
    marketJob({
      id: "market-job-expired",
      title: "Expired job must not be counted",
      companyId: "company-4",
      companyName: "Expired Company",
      publishedAt: relativeIso({ days: 2 }),
      expiredAt: relativeIso({ hours: 1 }),
      salaryMin: 12_000_000,
      salaryMax: 18_000_000,
    }),
  ];

  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify(jobs),
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.route(/\/companies(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 1 },
      }),
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.route(/\/posts\/public\/home(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
    });
  });
}

test("builds the market snapshot from public jobs without requesting the legacy home endpoint", async ({
  page,
}) => {
  const legacyHomeRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/home")) {
      legacyHomeRequests.push(request.url());
    }
  });
  await mockMarketData(page);

  await page.goto("/vi");

  const section = page.locator(".marketing-home-market");
  await expect(
    section.getByRole("heading", { name: "Toàn cảnh thị trường việc làm IT" }),
  ).toBeVisible();
  await expect(section.locator(".jm-scope")).toContainText(
    "Dựa trên 5 tin tuyển dụng đang hiển thị",
  );
  await expect(section.locator(".jm-kpi strong")).toHaveText(["1", "5", "3"]);
  await expect(section.locator(".jm-latest-link")).toHaveCount(3);
  await expect(section.getByText("Expired job must not be counted", { exact: true })).toHaveCount(
    0,
  );
  const salaryTable = section.locator(".jm-chart-salary table");
  for (const salaryBand of [
    "Dưới 10 triệu",
    "10 – 20 triệu",
    "20 – 30 triệu",
    "30 – 50 triệu",
    "Trên 50 triệu",
  ]) {
    await expect(salaryTable).toContainText(salaryBand);
  }
  await expect(section.getByRole("link", { name: "Khám phá việc làm" })).toHaveAttribute(
    "href",
    "/vi/jobs",
  );
  expect(legacyHomeRequests).toEqual([]);
});

test("keeps the localized mobile snapshot compact and keyboard-operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockMarketData(page);

  await page.goto("/en");

  const section = page.locator(".marketing-home-market");
  await section.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(section.getByRole("heading", { name: "IT job market snapshot" })).toBeVisible();
  await expect(section.locator(".jm-chart-weekly")).toBeVisible();
  await expect(section.locator(".jm-chart-salary")).toBeHidden();

  const salaryTab = section.getByRole("button", { name: "Salary" });
  await salaryTab.focus();
  await page.keyboard.press("Enter");

  await expect(salaryTab).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".jm-chart-weekly")).toBeHidden();
  await expect(section.locator(".jm-chart-salary")).toBeVisible();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});

test("shows an honest error state instead of estimated market figures", async ({ page }) => {
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: "Unavailable" }),
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      status: 503,
    });
  });

  await page.goto("/en");

  const section = page.locator(".marketing-home-market");
  await expect(section.getByRole("heading", { name: "IT job market snapshot" })).toBeVisible();
  await expect(section.getByText("We could not load market data", { exact: true })).toBeVisible();
  await expect(section).toContainText("UpNext does not substitute estimates for real data.");
  await expect(section.getByRole("button", { name: "Try again" })).toBeEnabled();
  await expect(section.locator(".jm-kpi")).toHaveCount(0);
});
