import { expect, test } from "@playwright/test";

import { createHomeData, mockHomeApi, mockHomeApiError } from "./fixtures/home-api";

test("renders the market snapshot from the aggregate home contract", async ({ page }) => {
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: "Unavailable for this homepage test" }),
      contentType: "application/json",
      status: 503,
    });
  });
  await mockHomeApi(page, createHomeData());

  await page.goto("/vi");

  const section = page.locator(".marketing-home-market");
  await expect(
    section.getByRole("heading", { name: "Xu hướng tuyển dụng IT trên UpNext" }),
  ).toBeVisible();
  await expect(section.locator(".jm-scope")).toContainText("Dữ liệu từ 24 việc làm đang tuyển");
  await expect(section.locator(".jm-kpi strong")).toHaveText(["3", "24", "9"]);
  await expect(section.locator(".jm-latest-link")).toHaveCount(3);
  await expect(section.locator(".jm-chart-weekly tbody tr")).toHaveCount(5);
  await expect(section.locator(".jm-chart-salary tbody tr")).toHaveCount(5);
  await expect(section.getByRole("link", { name: "Khám phá việc làm" })).toHaveAttribute(
    "href",
    "/vi/jobs",
  );
});

test("keeps the localized mobile market controls compact and keyboard-operable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockHomeApi(page, createHomeData());

  await page.goto("/en");

  const section = page.locator(".marketing-home-market");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading", { name: "IT hiring trends on UpNext" })).toBeVisible();
  await expect(section.locator(".jm-chart-weekly")).toBeVisible();
  await expect(section.locator(".jm-chart-salary")).toBeHidden();
  await expect(section.locator(".jm-latest-body b")).toHaveCount(3);

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

test("shows one clear homepage error when aggregate data is unavailable", async ({ page }) => {
  await mockHomeApiError(page);

  await page.goto("/en");

  await expect(page.getByRole("heading", { name: "We could not load the homepage" })).toBeVisible();
  await expect(
    page.getByText("Try again to see the latest jobs and hiring trends.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
  await expect(page.locator(".marketing-home-market")).toHaveCount(0);
});

test("shows aggregate loading feedback and recovers through the single retry action", async ({
  page,
}) => {
  let shouldSucceed = false;
  let releaseInitialRequest: (() => void) | undefined;
  const initialRequest = new Promise<void>((resolve) => {
    releaseInitialRequest = resolve;
  });
  let requestCount = 0;

  await page.route(/\/home(?:\?.*)?$/, async (route) => {
    requestCount += 1;
    if (requestCount === 1) await initialRequest;

    if (!shouldSucceed) {
      await route.fulfill({
        body: JSON.stringify({ message: "Unavailable" }),
        contentType: "application/json",
        status: 503,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify({ success: true, data: createHomeData() }),
      contentType: "application/json",
    });
  });

  await page.goto("/vi", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Đang tải việc làm mới nhất…", { exact: true })).toBeVisible();

  releaseInitialRequest?.();
  await expect(
    page.getByRole("heading", { name: "Chưa thể tải nội dung trang chủ" }),
  ).toBeVisible();

  shouldSucceed = true;
  await page.getByRole("button", { name: "Thử lại" }).click();

  await expect(
    page.locator(".marketing-home-jobs").getByRole("heading", { name: "Việc làm mới nhất" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Xu hướng tuyển dụng IT trên UpNext" }),
  ).toBeVisible();
  expect(requestCount).toBeGreaterThanOrEqual(2);
});
