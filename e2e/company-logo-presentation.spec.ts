import { expect, test } from "@playwright/test";

import { mockHomeApi } from "./fixtures/home-api";

test("uses the complete logo frame in public company and job cards", async ({ page }) => {
  // Without the home fixture the page renders no cards at all, so both locators resolve to
  // nothing and the assertion fails for a reason that has nothing to do with logo padding.
  await mockHomeApi(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/vi");

  await expect(page.locator(".featured-job-logo img").first()).toHaveCSS("padding", "0px");
  await expect(page.locator(".featured-company-logo img").first()).toHaveCSS("padding", "0px");
});
