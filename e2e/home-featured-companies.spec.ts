import { expect, test } from "@playwright/test";

import {
  createHomeData,
  createTopCompany,
  installCandidateSession,
  mockCandidateHomeApi,
  mockHomeApi,
} from "./fixtures/home-api";

test("uses aggregate ranking and cover data without repeating the spotlight company", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await mockHomeApi(page);

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByText("9 nhà tuyển dụng nổi bật", { exact: true })).toBeVisible();
  await expect(section.locator(".featured-company-featured")).toHaveCount(1);
  // A page holds ten employers: the first is promoted to the spotlight and the rest render
  // as cards, so nine companies fill one page as one spotlight plus eight cards.
  await expect(section.locator(".featured-company-card")).toHaveCount(8);
  await expect(section.getByText("FPT Software", { exact: true })).toHaveCount(1);
  await expect(section.locator(".featured-company-featured-cover-img")).toHaveAttribute(
    "src",
    /fpt\.jpg/,
  );
});

test("keeps only active employers in the homepage bento", async ({ page }) => {
  const companies = [
    ...Array.from({ length: 9 }, (_, index) => createTopCompany(index)),
    createTopCompany(10, { activeJobsCount: 0, name: "Inactive employer" }),
  ];
  await mockHomeApi(page, createHomeData({ topCompanies: companies }));

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.locator(".featured-company-featured")).toHaveCount(1);
  await expect(section.locator(".featured-company-card")).toHaveCount(8);
  await expect(section.getByText("Inactive employer", { exact: true })).toHaveCount(0);
});

test("keeps every returned top employer reachable across desktop carousel pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  const companies = Array.from({ length: 20 }, (_, index) => createTopCompany(index));
  await mockHomeApi(
    page,
    createHomeData({
      stats: { activeEmployersCount: 100 },
      topCompanies: companies,
    }),
  );

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByText("20 nhà tuyển dụng nổi bật", { exact: true })).toBeVisible();
  // Ten employers per page, the first of each promoted to the spotlight, so twenty fill two.
  await expect(section.locator(".marketing-home-co-dot")).toHaveCount(2);

  // The promoted employer is the point of the assertion: it leaves the card grid on its
  // page, so counting only cards would report it missing when it is on screen and largest.
  const visibleNames = async () =>
    (
      await section.locator(".featured-company-featured, .featured-company-card").allTextContents()
    ).flatMap((text) => text.match(/FPT Software|Home Company \d+/) ?? []);

  const firstPage = await visibleNames();
  expect(firstPage).toHaveLength(10);

  await section.getByRole("button", { name: "Trang sau" }).click();
  // Employer 10 leads the second page, so it renders as the spotlight rather than a card —
  // the exact case that makes a card-only assertion report a visible employer as missing.
  await expect(section.getByText("Home Company 10", { exact: true })).toBeVisible();
  const secondPage = await visibleNames();
  expect(secondPage).toHaveLength(10);

  // Every employer the aggregate returned is reachable, none twice.
  expect(new Set([...firstPage, ...secondPage]).size).toBe(20);
});

test("does not render inert carousel controls when only one company page is available", async ({
  page,
}) => {
  await mockHomeApi(
    page,
    createHomeData({
      topCompanies: Array.from({ length: 8 }, (_, index) => createTopCompany(index)),
    }),
  );

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByRole("button", { name: "Trang trước" })).toHaveCount(0);
  await expect(section.getByRole("button", { name: "Trang sau" })).toHaveCount(0);
  await expect(section.locator(".marketing-home-co-dot")).toHaveCount(0);
});

test("persists company follow state from an authenticated candidate home response", async ({
  page,
}) => {
  const companyId = "219b6dce-7203-4858-bd93-71b4ca72aa2b";
  let following = false;
  await installCandidateSession(page);
  await mockCandidateHomeApi(
    page,
    createHomeData({
      personalization: { state: "INSUFFICIENT", signalGroups: [], missingSignals: ["SKILLS"] },
      topCompanies: [
        createTopCompany(0, {
          id: companyId,
          name: "Followable UpNext Labs",
          coverImage: "/assets/marketing/home/covers/fpt.jpg",
        }),
        ...Array.from({ length: 7 }, (_, index) => createTopCompany(index + 1)),
      ],
    }),
  );
  await page.route(/\/company-follows\/me(?:\?|$)/, async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-origin": "*",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    await route.fulfill({
      body: JSON.stringify(following ? [{ companyId }] : []),
      contentType: "application/json",
      headers,
    });
  });
  await page.route(new RegExp(`/companies/${companyId}/follow$`), async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "POST, DELETE, OPTIONS",
      "access-control-allow-origin": "*",
    };
    const method = route.request().method();
    if (method === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    following = method === "POST";
    await route.fulfill({
      body: method === "POST" ? JSON.stringify({ id: "follow-1", companyId }) : "",
      contentType: "application/json",
      headers,
      status: method === "POST" ? 201 : 204,
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  const follow = section.locator(".featured-company-featured-follow");
  await expect(follow).toBeEnabled();
  await follow.hover();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Theo dõi để nhận thông báo khi công ty có việc làm mới.",
  );
  await follow.click();
  await expect.poll(() => following).toBe(true);
  await expect(follow).toHaveAttribute("aria-pressed", "true");
});

test("renders an explicit empty state when the aggregate has no active employers", async ({
  page,
}) => {
  await mockHomeApi(
    page,
    createHomeData({ topCompanies: [createTopCompany(0, { activeJobsCount: 0 })] }),
  );

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(
    section.getByText("Hiện chưa có công ty đang hoạt động.", { exact: true }),
  ).toBeVisible();
  await expect(section.locator(".featured-company-featured")).toHaveCount(0);
});

test("keeps the aggregate spotlight focused on compact screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockHomeApi(page);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator(".featured-company-featured")).toBeVisible();
  await expect(section.locator(".featured-company-card").first()).toBeHidden();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});
