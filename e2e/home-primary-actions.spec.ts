import { expect, test, type Locator } from "@playwright/test";

import { mockHomeApi } from "./fixtures/home-api";

const primaryBackground = "rgb(10, 165, 111)";
const primaryBorder = "rgb(16, 167, 120)";
const primaryHoverBackground = "rgb(9, 143, 99)";

async function primarySurface(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const sheen = window.getComputedStyle(element, "::after");
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      sheen: sheen.content,
    };
  });
}

test("uses the header registration treatment for homepage primary actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHomeApi(page);
  await page.goto("/vi");

  const register = page.locator(".marketing-home-header-actions .marketing-home-register");
  const search = page.locator(".marketing-home-search-submit");
  const urgentAll = page.locator(".marketing-home-urgent-all");
  const newsletter = page.locator(".marketing-home-footer-newsletter button");

  await expect(register).toBeVisible();
  await expect(search).toBeVisible();
  await expect(urgentAll).toBeVisible();
  await newsletter.scrollIntoViewIfNeeded();
  await expect(newsletter).toBeVisible();

  for (const action of [register, search, urgentAll, newsletter]) {
    await expect
      .poll(() => primarySurface(action))
      .toEqual({
        background: primaryBackground,
        border: primaryBorder,
        sheen: '""',
      });
  }

  await search.hover();
  await expect
    .poll(() => search.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(primaryHoverBackground);
});

test("keeps the primary job-search action within a compact viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockHomeApi(page);
  await page.goto("/vi");

  await expect(page.locator(".marketing-home-search-submit")).toBeVisible();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});
