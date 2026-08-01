import { expect, test } from "@playwright/test";

import {
  createHomeData,
  createHomeJob,
  installCandidateSession,
  mockCandidateHomeApi,
  mockHomeApi,
  mockPublicJobDetail,
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

test("loads the full source description only after a job preview is requested", async ({
  page,
}) => {
  const job = createHomeJob(50, {
    id: "preview-description-job",
    title: "Senior Platform Engineer",
  });
  let detailRequestCount = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith(`/job-posts/${job.id}`)) {
      detailRequestCount += 1;
    }
  });
  await mockHomeApi(page, createHomeData({ latestJobs: [job] }));
  await mockPublicJobDetail(page, job, {
    description: `
      <details open>
        <summary><strong>Mô tả công việc</strong></summary>
        <p>Dẫn dắt việc phát triển nền tảng dữ liệu phục vụ các sản phẩm có quy mô lớn.</p>
        <ul>
          <li>Thiết kế các dịch vụ có khả năng mở rộng và vận hành ổn định.</li>
          <li>Phối hợp cùng đội ngũ để cải thiện độ tin cậy của hệ thống.</li>
        </ul>
      </details>
    `,
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  const title = section.getByRole("button", { name: job.title, exact: true });
  await expect.poll(() => detailRequestCount).toBe(0);

  await title.hover();

  const preview = section.getByRole("dialog", { name: job.title });
  const description = preview.locator(".urgent-job-preview-description");
  await expect(description).toContainText("Dẫn dắt việc phát triển nền tảng dữ liệu");
  await expect(description).toContainText("• Thiết kế các dịch vụ có khả năng mở rộng");
  await expect.poll(() => detailRequestCount).toBe(1);
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

  await page.reload();
  await expect(
    page
      .locator(".marketing-home-jobs")
      .getByRole("button", { name: "Bỏ lưu tin Home API Engineer 0" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("removes a closing-soon job after its deadline while the homepage remains open", async ({
  page,
}) => {
  const now = new Date("2026-08-01T00:00:00.000Z");
  await page.clock.install({ time: now });
  const expiringJob = createHomeJob(40, {
    id: "live-expiring-job",
    title: "Job expiring while open",
    deadline: "2026-08-01T00:00:30.000Z",
    daysRemaining: 1,
    urgencyTone: "URGENT",
  });
  await mockHomeApi(page, createHomeData({ expiringJobs: [expiringJob] }));

  await page.goto("/vi");

  const expiring = page.locator(".marketing-home-urgent");
  await expect(expiring.getByText(expiringJob.title, { exact: true })).toBeVisible();

  await page.clock.fastForward(61_000);

  await expect(page.locator(".marketing-home-urgent")).toHaveCount(0);
  await expect(page.getByText(expiringJob.title, { exact: true })).toHaveCount(0);
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
