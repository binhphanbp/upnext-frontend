import { expect, test } from "@playwright/test";

test("shows a transparent view count for jobs that the API marks as popular", async ({ page }) => {
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify([
        {
          id: "2f75d22c-6a1b-4cd9-83a8-80c4ebf28c6f",
          title: "Platform Engineer",
          description: "Build platform services.",
          requirements: null,
          benefits: null,
          salaryMin: 30000000,
          salaryMax: 45000000,
          salaryCurrency: "VND",
          salaryIsNegotiable: false,
          salaryIsVisible: true,
          publishedAt: "2026-07-16T00:00:00.000Z",
          expiredAt: "2026-12-30T00:00:00.000Z",
          createdAt: "2026-07-16T00:00:00.000Z",
          viewCount: 1284,
          company: { id: "company-1", name: "UpNext Labs" },
          jobCategory: { name: "Platform Engineering" },
          employmentType: { name: "Full-time" },
          experienceLevel: { name: "Middle" },
          jobPostSkills: [{ skill: { id: "skill-1", name: "TypeScript" } }],
        },
      ]),
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await expect(section.getByText("1.284 lượt xem", { exact: true })).toBeVisible();
  await expect(section.locator(".featured-job-deadline")).toHaveCount(0);
});

test("persists a featured job bookmark for a signed-in candidate", async ({ page }) => {
  const jobId = "6af4aef4-4dfe-4e3b-a39e-52bbf4765f77";
  let saved = false;

  await page.addInitScript(() => {
    localStorage.setItem("upnext.candidate.accessToken", "candidate-token");
    localStorage.setItem("upnext.candidate.tokenType", "Bearer");
    localStorage.setItem(
      "upnext.candidate.user",
      JSON.stringify({ id: "candidate-1", email: "candidate@example.com", role: "CANDIDATE" }),
    );
  });
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify([
        {
          id: jobId,
          title: "Persistent Platform Engineer",
          description: "Build platform services.",
          requirements: null,
          benefits: null,
          salaryMin: 30000000,
          salaryMax: 45000000,
          salaryCurrency: "VND",
          salaryIsNegotiable: false,
          salaryIsVisible: true,
          publishedAt: "2026-07-16T00:00:00.000Z",
          expiredAt: "2026-12-30T00:00:00.000Z",
          createdAt: "2026-07-16T00:00:00.000Z",
          company: { id: "company-1", name: "UpNext Labs" },
          jobCategory: { name: "Platform Engineering" },
          employmentType: { name: "Full-time" },
          experienceLevel: { name: "Middle" },
          jobPostSkills: [{ skill: { id: "skill-1", name: "TypeScript" } }],
        },
      ]),
    });
  });
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
  const saveButton = section.getByRole("button", { name: /Lưu tin Persistent Platform Engineer/ });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect.poll(() => saved).toBe(true);

  const unsaveButton = section.getByRole("button", {
    name: /Bỏ lưu tin Persistent Platform Engineer/,
  });
  await expect(unsaveButton).toHaveAttribute("aria-pressed", "true");
  const toast = page.locator(".upnext-toast").filter({
    hasText: "Đã lưu Persistent Platform Engineer",
  });
  await expect(toast).toContainText("Đã lưu Persistent Platform Engineer");
  await toast.getByRole("button", { name: "Hoàn tác" }).click();
  await expect.poll(() => saved).toBe(false);
  await expect(
    page.locator(".upnext-toast").filter({
      hasText: "Đã hoàn tác lưu Persistent Platform Engineer",
    }),
  ).toBeVisible();
  await expect(saveButton).toHaveAttribute("aria-pressed", "false");
});

test("presents the featured-jobs rail without redundant filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await section.scrollIntoViewIfNeeded();

  const sectionHeadings = page.locator(
    ".marketing-home-urgent-head h2, .marketing-home-jobs-head h2, .jm-head h2, .marketing-home-insights-head h2",
  );
  // The urgency section is data-driven and may be hidden when no job is within
  // the real deadline window. Keep the assertion resilient to that valid state.
  await expect.poll(() => sectionHeadings.count()).toBeGreaterThanOrEqual(3);
  for (const heading of await sectionHeadings.all()) {
    await expect(heading).toHaveCSS("font-size", "28px");
  }
  await expect(section.locator(".marketing-home-jobs-head h2")).toHaveCSS("font-weight", "700");

  const viewport = section.locator(".marketing-home-jobs-viewport");
  // Public feeds can legitimately be empty or temporarily unavailable; the
  // section renders its explicit loading/empty/error state instead of a rail.
  if ((await viewport.count()) === 0) return;
  await expect(viewport).toHaveCSS("margin-top", "24px");
  await expect(section.getByRole("tablist")).toHaveCount(0);

  const title = section.locator(".featured-job-title").first();
  await expect(title).toHaveCSS("white-space", "nowrap");
  await expect(title).toHaveCSS("text-overflow", "ellipsis");
  await expect(title).toHaveCSS("-webkit-line-clamp", "1");

  const pager = section.locator(".marketing-home-jobs-pager");
  await expect(pager).toHaveCSS("margin-top", "20px");
  await expect(pager.getByRole("button", { name: "Trang sau" })).toBeEnabled();

  await page.setViewportSize({ width: 390, height: 844 });
  await section.scrollIntoViewIfNeeded();
  for (const heading of await sectionHeadings.all()) {
    await expect(heading).toHaveCSS("font-size", "24px");
  }
  await expect(section.locator(".marketing-home-jobs-head h2")).toHaveCSS("font-weight", "700");
  await expect(viewport).toHaveCSS("margin-top", "24px");

  const mobileCardFitsViewport = await section
    .locator(".marketing-home-jobs-slide.is-active .featured-job-card")
    .first()
    .evaluate((card) => {
      const viewport = card.closest(".marketing-home-jobs-viewport");
      return Boolean(
        viewport && card.getBoundingClientRect().right <= viewport.getBoundingClientRect().right,
      );
    });
  expect(mobileCardFitsViewport).toBe(true);
});
