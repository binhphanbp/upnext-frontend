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

test("persists company follow state and keeps duplicate cards in sync", async ({ page }) => {
  const companyId = "d9ac5688-e8e3-4bea-9fb1-9f0b1e3ced09";
  let following = false;

  await page.addInitScript(() => {
    localStorage.setItem("upnext.candidate.accessToken", "candidate-token");
    localStorage.setItem("upnext.candidate.tokenType", "Bearer");
    localStorage.setItem(
      "upnext.candidate.user",
      JSON.stringify({ id: "candidate-1", email: "candidate@example.com", role: "CANDIDATE" }),
    );
  });
  await page.route(/\/companies(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            id: companyId,
            name: "Followable UpNext Labs",
            slug: "followable-upnext-labs",
            type: "PRODUCT",
            description: "Nền tảng công nghệ dành cho đội ngũ phát triển sản phẩm.",
            logoUrl: "",
          },
        ],
        meta: { total: 1, page: 1, limit: 1, totalPages: 1 },
      }),
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.route(/\/company-follows\/me(?:\?|$)/, async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-origin": "*",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    await route.fulfill({
      body: JSON.stringify(following ? [{ companyId }] : []),
      contentType: "application/json",
      headers,
    });
  });
  await page.route(new RegExp(`/companies/${companyId}/follow$`), async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "POST, DELETE, OPTIONS",
      "access-control-allow-origin": "*",
    };
    const method = route.request().method();
    if (method === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    following = method === "POST";
    await route.fulfill({
      body: method === "POST" ? JSON.stringify({ id: "follow-1", companyId }) : "",
      contentType: "application/json",
      headers,
      status: method === "POST" ? 201 : 204,
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  const featuredFollow = section.locator(".featured-company-featured-follow");
  await expect(featuredFollow).toBeEnabled();
  await featuredFollow.click();
  await expect.poll(() => following).toBe(true);
  await expect(featuredFollow).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".featured-company-follow").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await featuredFollow.click();
  await expect.poll(() => following).toBe(false);
  await expect(featuredFollow).toHaveAttribute("aria-pressed", "false");
});

test("keeps the spotlight panel focused on compact screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-featured")).toBeVisible();
  await expect(section.locator(".featured-company-card").first()).toBeHidden();
});
