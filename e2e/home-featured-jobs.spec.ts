import { expect, test } from "@playwright/test";

test("presents the featured-jobs rail without redundant filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await section.scrollIntoViewIfNeeded();

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
  await expect(viewport).toHaveCSS("margin-top", "24px");
});
