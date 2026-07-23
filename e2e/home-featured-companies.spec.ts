import { expect, test } from "@playwright/test";

test("keeps the featured companies grid balanced and exposes the follow affordance", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-card")).toHaveCount(9);
  await expect(section.locator(".featured-company-featured")).toHaveCSS("grid-row", "2 / span 3");
  await expect(section.locator(".featured-company-follow").first().locator("svg")).toBeVisible();
});

test("loads the active company's cover image for the spotlight panel", async ({ page }) => {
  const companies = Array.from({ length: 9 }, (_, index) => ({
    id: `company-${index}`,
    name: index === 0 ? "VNG Corporation" : `Company ${index}`,
    slug: index === 0 ? "vng-corporation" : `company-${index}`,
    type: "PRODUCT",
    description: "Nền tảng công nghệ dành cho đội ngũ phát triển sản phẩm.",
    logoUrl: "",
  }));

  await page.route(/\/api\/v1\/companies$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: companies,
        meta: { total: 9, page: 1, limit: 9, totalPages: 1 },
      }),
    });
  });
  await page.route(/\/api\/v1\/companies\/vng-corporation$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ...companies[0],
        coverFile: {
          publicUrl: "/assets/marketing/home/covers/fpt.jpg",
        },
      }),
    });
  });

  await page.goto("/vi");

  const cover = page.locator(".featured-company-featured-cover-img");
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", /fpt\.jpg/);
});

test("keeps the spotlight panel focused on compact screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-featured")).toBeVisible();
  await expect(section.locator(".featured-company-card").first()).toBeHidden();
});
