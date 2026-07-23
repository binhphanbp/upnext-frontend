import { expect, test } from "@playwright/test";

test("loops the home insights rail without disabling the next control", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const next = section.getByRole("button", { name: "Bài viết tiếp theo" });
  const featured = section.locator(".marketing-home-insights-card.is-featured");

  await section.scrollIntoViewIfNeeded();
  await expect(next).toBeEnabled();

  for (let step = 1; step <= 18; step += 1) {
    await next.click();
    await expect(featured).toHaveAttribute("data-insight-index", String((1 + step) % 6));
    await expect(next).toBeEnabled();
  }

  await page.waitForTimeout(700);
  await expect(featured).toHaveAttribute("data-insight-index", "1");
  await expect(featured).toHaveAttribute("data-insight-slot", "19");
});
