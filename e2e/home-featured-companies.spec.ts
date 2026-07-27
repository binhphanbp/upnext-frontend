import { expect, test } from "@playwright/test";

test("keeps the featured companies grid balanced without repeating the spotlight company", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.route(/\/api\/v1\/companies$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        meta: { total: 0, page: 1, limit: 9, totalPages: 0 },
      }),
    });
  });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-card")).toHaveCount(9);
  await expect(section.locator(".featured-company-featured")).toHaveCSS("grid-row", "2 / span 3");
  const spotlightName = await section.locator(".featured-company-featured h3").innerText();
  await expect(
    section.locator(".featured-company-card").filter({ hasText: spotlightName }),
  ).toHaveCount(0);
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

  const section = page.locator(".marketing-home-companies");
  const cover = page.locator(".featured-company-featured-cover-img");
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", /fpt\.jpg/);
  await expect(section.getByText("VNG Corporation", { exact: true })).toHaveCount(1);
});

test("persists company follow state without duplicating the spotlight company", async ({
  page,
}) => {
  // Public-company IDs from the staging API are UUID-shaped but do not
  // necessarily use RFC UUID versions 1–5. This is CMC Corporation's ID.
  const companyId = "219b6dce-7203-f858-bd93-71b4ca72aa2b";
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
  await expect(section.getByText("Followable UpNext Labs", { exact: true })).toHaveCount(1);
  await expect(featuredFollow).toBeEnabled();
  await featuredFollow.hover();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Theo dõi để nhận thông báo khi công ty có việc làm mới.",
  );
  await featuredFollow.click();
  await expect.poll(() => following).toBe(true);
  await expect(featuredFollow).toHaveAttribute("aria-pressed", "true");

  await page.mouse.move(0, 0);
  await featuredFollow.hover();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Bạn sẽ nhận thông báo khi công ty có việc làm mới.",
  );

  const toast = page.locator(".upnext-toast").filter({
    hasText: "Đã theo dõi Followable UpNext Labs",
  });
  await expect(toast).toContainText("Đã theo dõi Followable UpNext Labs");
  await toast.getByRole("button", { name: "Hoàn tác" }).click();
  await expect.poll(() => following).toBe(false);
  await expect(
    page.getByText("Hoàn tác theo dõi Followable UpNext Labs", { exact: true }),
  ).toBeVisible();
  await expect(featuredFollow).toHaveAttribute("aria-pressed", "false");
});

test("explains when fallback company data cannot be followed", async ({ page }) => {
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
        items: [],
        meta: { total: 0, page: 1, limit: 1, totalPages: 0 },
      }),
      contentType: "application/json",
    });
  });
  await page.route(/\/company-follows\/me(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify([]),
      contentType: "application/json",
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByText("Chưa hỗ trợ theo dõi").first()).toBeVisible();
  await expect(section.locator(".featured-company-follow").first()).toHaveCount(0);
});

test("keeps the spotlight panel focused on compact screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-featured")).toBeVisible();
  await expect(section.locator(".featured-company-card").first()).toBeHidden();
});
