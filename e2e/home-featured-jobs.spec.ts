import { expect, test } from "@playwright/test";

import {
  createHomeData,
  createHomeJob,
  installCandidateSession,
  mockCandidateHomeApi,
  mockHomeApi,
} from "./fixtures/home-api";

test("renders latest and closing-soon jobs from the aggregate home contract", async ({ page }) => {
  const homeRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/home")) homeRequests.push(request.url());
  });
  await mockHomeApi(page);

  await page.goto("/vi");

  const latest = page.locator(".marketing-home-jobs");
  const activeLatestSlide = latest.locator(".marketing-home-jobs-slide.is-active");
  const firstJobCard = activeLatestSlide
    .locator(".featured-job-card")
    .filter({ hasText: "Home API Engineer 0" });
  const expiring = page.locator(".marketing-home-urgent");
  await expect(latest.getByRole("heading", { name: "Việc làm mới nhất" })).toBeVisible();
  await expect(firstJobCard.getByText("Home API Engineer 0", { exact: true })).toBeVisible();
  await expect(firstJobCard.getByText("TP. Hồ Chí Minh", { exact: true })).toBeVisible();
  await expect(latest.getByText("Việt Nam", { exact: true })).toHaveCount(0);
  await expect(expiring.getByRole("heading", { name: "Sắp hết hạn ứng tuyển" })).toBeVisible();
  await expect(expiring.getByText("Closing Soon Platform Engineer", { exact: true })).toBeVisible();
  await expect(expiring.locator(".urgent-job-deadline-badge.is-critical")).toHaveCount(1);
  await expect(latest.getByText(/lượt xem/i)).toHaveCount(0);
  expect(homeRequests).toHaveLength(1);
});

test("does not duplicate an expiring job in the primary latest-jobs section", async ({ page }) => {
  const duplicate = createHomeJob(30, {
    id: "closing-soon-job",
    title: "Closing Soon Platform Engineer",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 3,
    urgencyTone: "URGENT",
  });
  await mockHomeApi(
    page,
    createHomeData({ latestJobs: [duplicate, createHomeJob(31), createHomeJob(32)] }),
  );

  await page.goto("/vi");

  await expect(
    page
      .locator(".marketing-home-urgent")
      .getByText("Closing Soon Platform Engineer", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page
      .locator(".marketing-home-jobs")
      .getByText("Closing Soon Platform Engineer", { exact: true }),
  ).toHaveCount(0);
});

test("persists a featured job bookmark for a signed-in candidate", async ({ page }) => {
  const jobId = "6af4aef4-4dfe-4e3b-a39e-52bbf4765f77";
  let saved = false;
  await installCandidateSession(page);
  await mockCandidateHomeApi(
    page,
    createHomeData({
      latestJobs: [
        createHomeJob(0, { id: jobId }),
        ...Array.from({ length: 7 }, (_, index) => createHomeJob(index + 1)),
      ],
      personalization: { state: "INSUFFICIENT", signalGroups: [], missingSignals: ["SKILLS"] },
    }),
  );
  await page.route(/\/saved-jobs(?:\/[^?]+)?(?:\?|$)/, async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
      "access-control-allow-origin": "*",
    };
    const method = route.request().method();

    if (method === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }

    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    if (method === "POST") {
      expect(JSON.parse(route.request().postData() ?? "{}")).toEqual({ jobPostId: jobId });
      saved = true;
      await route.fulfill({
        body: JSON.stringify({ id: "saved-1", candidateProfileId: "profile-1", jobPostId: jobId }),
        contentType: "application/json",
        headers,
        status: 201,
      });
      return;
    }

    if (method === "DELETE") {
      saved = false;
      await route.fulfill({ headers, status: 204 });
      return;
    }

    await route.fulfill({
      body: JSON.stringify(saved ? [{ jobPostId: jobId }] : []),
      contentType: "application/json",
      headers,
      status: 200,
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  const saveButton = section.getByRole("button", { name: "Lưu tin Home API Engineer 0" });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect.poll(() => saved).toBe(true);
  await expect(saveButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Đã lưu Home API Engineer 0", { exact: true })).toBeVisible();
});

test("keeps the aggregate jobs UI responsive without redundant filters", async ({ page }) => {
  await mockHomeApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator(".marketing-home-jobs-head h2")).toHaveCSS("font-size", "28px");
  await expect(section.locator(".marketing-home-jobs-head h2")).toHaveCSS("font-weight", "700");
  await expect(section.getByRole("tablist")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator(".marketing-home-jobs-head h2")).toHaveCSS("font-size", "24px");
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});
