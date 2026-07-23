import { expect, test } from "@playwright/test";

test("uses the complete logo frame in public company and job cards", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/vi");

  await expect(page.locator(".featured-job-logo img").first()).toHaveCSS("padding", "0px");
  await expect(page.locator(".featured-company-logo img").first()).toHaveCSS("padding", "0px");
});
