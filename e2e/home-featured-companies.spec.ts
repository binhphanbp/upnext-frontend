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
  await expect(section.getByText("9 công ty tuyển dụng", { exact: true })).toBeVisible();
  await expect(section.locator(".featured-company-featured")).toHaveCount(1);
  await expect(section.locator(".featured-company-card")).toHaveCount(7);
  await expect(section.getByText("FPT Software", { exact: true })).toHaveCount(1);
  await expect(section.locator(".featured-company-featured-cover-img")).toHaveAttribute(
    "src",
    /fpt\.jpg/,
  );
});

test("keeps only active employers and caps the homepage bento to one spotlight plus seven cards", async ({
  page,
}) => {
  const companies = [
    ...Array.from({ length: 9 }, (_, index) => createTopCompany(index)),
    createTopCompany(10, { activeJobsCount: 0, name: "Inactive employer" }),
  ];
  await mockHomeApi(page, createHomeData({ topCompanies: companies }));

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.locator(".featured-company-featured")).toHaveCount(1);
  await expect(section.locator(".featured-company-card")).toHaveCount(7);
  await expect(section.getByText("Inactive employer", { exact: true })).toHaveCount(0);
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
