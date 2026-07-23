import { expect, test } from "@playwright/test";

test("presents the featured-jobs rail without redundant filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await section.scrollIntoViewIfNeeded();

  await expect(section.getByRole("tablist")).toHaveCount(0);

  const title = section.locator(".featured-job-title").first();
  await expect(title).toHaveCSS("white-space", "nowrap");
  await expect(title).toHaveCSS("text-overflow", "ellipsis");
  await expect(title).toHaveCSS("-webkit-line-clamp", "1");

  const pager = section.locator(".marketing-home-jobs-pager");
  await expect(pager).toHaveCSS("margin-top", "20px");
  await expect(pager.getByRole("button", { name: "Trang sau" })).toBeEnabled();
});
