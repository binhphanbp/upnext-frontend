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
  salaryMin: number | string;
  salaryMax: number | string;
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
      title: "Senior Platform Engineer for Distributed Cloud Infrastructure",
      companyId: "company-1",
      companyName: "UpNext Labs",
      publishedAt: relativeIso({ hours: 1 }),
      salaryMin: "4000000",
      salaryMax: "6000000",
    }),
    marketJob({
      id: "market-job-2",
      title: "Frontend Engineer",
      companyId: "company-1",
      companyName: "UpNext Labs",
      publishedAt: relativeIso({ days: 3 }),
      salaryMin: "12000000",
      salaryMax: "18000000",
    }),
    marketJob({
      id: "market-job-3",
      title: "Backend Engineer",
      companyId: "company-2",
      companyName: "UpNext Core",
      publishedAt: relativeIso({ days: 8 }),
      salaryMin: "22000000",
      salaryMax: "28000000",
    }),
    marketJob({
      id: "market-job-4",
      title: "Data Engineer",
      companyId: "company-2",
      companyName: "UpNext Core",
      publishedAt: relativeIso({ days: 15 }),
      salaryMin: "35000000",
      salaryMax: "45000000",
    }),
    marketJob({
      id: "market-job-5",
      title: "Engineering Manager",
      companyId: "company-3",
      companyName: "UpNext Cloud",
      publishedAt: relativeIso({ days: 22 }),
      salaryMin: "55000000",
      salaryMax: "65000000",
    }),
    marketJob({
      id: "market-job-expired",
      title: "Expired job must not be counted",
      companyId: "company-4",
      companyName: "Expired Company",
      publishedAt: relativeIso({ days: 2 }),
      expiredAt: relativeIso({ hours: 1 }),
      salaryMin: "12000000",
      salaryMax: "18000000",
    }),
    marketJob({
      id: "market-job-future",
      title: "Future job must not be counted",
      companyId: "company-5",
      companyName: "Future Company",
      publishedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      salaryMin: "22000000",
      salaryMax: "28000000",
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
    section.getByRole("heading", { name: "Xu hướng tuyển dụng IT trên UpNext" }),
  ).toBeVisible();
  await expect(section.locator(".jm-scope")).toContainText("Dữ liệu từ 5 việc làm đang tuyển");
  await expect(section.locator(".jm-kpi strong")).toHaveText(["1", "5", "3"]);
  await expect(section.locator(".jm-latest-link")).toHaveCount(3);
  const illustration = section.locator(".jm-illu-img");
  await expect(illustration).toHaveAttribute("loading", "eager");
  await expect
    .poll(() =>
      illustration.evaluate(
        (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const [railHeight, mainHeight] = await Promise.all([
    section.locator(".jm-rail").evaluate((element) => element.getBoundingClientRect().height),
    section.locator(".jm-main").evaluate((element) => element.getBoundingClientRect().height),
  ]);
  expect(Math.abs(railHeight - mainHeight)).toBeLessThanOrEqual(1);
  await expect(section.getByText("Expired job must not be counted", { exact: true })).toHaveCount(
    0,
  );
  await expect(section.getByText("Future job must not be counted", { exact: true })).toHaveCount(0);
  const salaryTable = section.locator(".jm-chart-salary table");
  for (const salaryBand of [
    "Dưới 10 triệu",
    "10 – 20 triệu",
    "20 – 30 triệu",
    "30 – 50 triệu",
    "Từ 50 triệu",
  ]) {
    const row = salaryTable.locator("tbody tr").filter({ hasText: salaryBand });
    await expect(row.locator("td").nth(1)).toHaveText("1");
  }
  const weeklyCounts = await section
    .locator(".jm-chart-weekly tbody td:nth-child(2)")
    .allTextContents();
  expect(weeklyCounts.reduce((sum, value) => sum + Number(value), 0)).toBe(5);
  const weeklyFooter = section.locator(".jm-chart-weekly .jm-chart-foot");
  await expect(weeklyFooter).toContainText("TB 4 tuần trước");
  await expect(weeklyFooter).toContainText("Cao nhất 4 tuần");
  await expect(weeklyFooter).toContainText("Tuần này");
  await expect(section.locator(".jm-chart-salary .jm-chart-foot")).toContainText(
    "Có dữ liệu lương5/5 việc làm",
  );
  await expect(section.getByRole("link", { name: "Khám phá việc làm" })).toHaveAttribute(
    "href",
    "/vi/jobs",
  );
  expect(legacyHomeRequests).toEqual([]);
});

test("keeps the localized mobile snapshot compact and keyboard-operable", async ({ page }) => {
  const zeroSizeChartWarnings: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "warning" &&
      message.text().includes("of chart should be greater than 0")
    ) {
      zeroSizeChartWarnings.push(message.text());
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await mockMarketData(page);

  await page.goto("/en");

  const section = page.locator(".marketing-home-market");
  await section.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(section.getByRole("heading", { name: "IT hiring trends on UpNext" })).toBeVisible();
  await expect(section.locator(".jm-chart-weekly")).toBeVisible();
  await expect(section.locator(".jm-chart-salary")).toBeHidden();
  await expect(section.locator(".jm-latest-body b")).toHaveCount(3);
  await expect(section.locator(".jm-latest-meta time")).toHaveCount(3);
  const latestTitleStyle = await section
    .locator(".jm-latest-body b")
    .nth(0)
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        lineClamp: style.getPropertyValue("-webkit-line-clamp"),
        whiteSpace: style.whiteSpace,
        fitsHorizontally: element.scrollWidth <= element.clientWidth,
      };
    });
  expect(latestTitleStyle).toEqual({
    lineClamp: "2",
    whiteSpace: "normal",
    fitsHorizontally: true,
  });
  const kpisFit = await section
    .locator(".jm-kpi")
    .evaluateAll((elements) =>
      elements.every(
        (element) =>
          element.scrollWidth <= element.clientWidth &&
          element.scrollHeight <= element.clientHeight,
      ),
    );
  expect(kpisFit).toBe(true);

  const salaryTab = section.getByRole("button", { name: "Salary" });
  await salaryTab.focus();
  await page.keyboard.press("Enter");

  await expect(salaryTab).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".jm-chart-weekly")).toBeHidden();
  await expect(section.locator(".jm-chart-salary")).toBeVisible();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  expect(zeroSizeChartWarnings).toEqual([]);
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
  await expect(section.getByRole("heading", { name: "IT hiring trends on UpNext" })).toBeVisible();
  await expect(section.getByText("We could not load hiring trends", { exact: true })).toBeVisible();
  await expect(section).toContainText("Please try again in a few minutes");
  await expect(section.getByRole("button", { name: "Try again" })).toBeEnabled();
  await expect(section.locator(".jm-kpi")).toHaveCount(0);
});
