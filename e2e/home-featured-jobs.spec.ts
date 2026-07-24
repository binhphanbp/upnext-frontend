import { expect, test } from "@playwright/test";

test("shows a transparent view count for jobs that the API marks as popular", async ({ page }) => {
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify([
        {
          id: "api-popular-job",
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

test("presents the featured-jobs rail without redundant filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await section.scrollIntoViewIfNeeded();

  const sectionHeadings = page.locator(
    ".marketing-home-urgent-head h2, .marketing-home-jobs-head h2, .jm-head h2, .marketing-home-insights-head h2",
  );
  await expect(sectionHeadings).toHaveCount(5);
  for (const heading of await sectionHeadings.all()) {
    await expect(heading).toHaveCSS("font-size", "28px");
    await expect(heading).toHaveCSS("font-weight", "700");
  }

  const viewport = section.locator(".marketing-home-jobs-viewport");
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
    await expect(heading).toHaveCSS("font-weight", "700");
  }
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
