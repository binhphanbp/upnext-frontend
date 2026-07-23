import { expect, test } from "@playwright/test";

test("keeps the featured companies grid to four complete desktop rows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-card")).toHaveCount(8);
  await expect(section.locator(".featured-company-featured")).toHaveCSS("grid-row", "2 / span 3");
});
