import { expect, test, type Page } from "@playwright/test";

const homePosts = Array.from({ length: 6 }, (_, index) => ({
  category: {
    id: `category-${index}`,
    name: "Career advice",
    slug: "career-advice",
  },
  content: `<p>Practical career advice ${index + 1}</p>`,
  coverImageFile: null,
  createdAt: "2026-07-25T00:00:00.000Z",
  id: `home-post-${index}`,
  postTags: [],
  slug: `home-api-post-${index + 1}`,
  status: "PUBLISHED",
  thumbnailFile: null,
  title: `Home API post ${index + 1}`,
  type: "BLOG",
  updatedAt: "2026-07-25T00:00:00.000Z",
}));

async function mockHomePosts(page: Page) {
  await page.route(/\/posts(?:\?|$)/, async (route) => {
    const requestUrl = new URL(route.request().url());
    if (
      requestUrl.searchParams.get("page") !== "1" ||
      requestUrl.searchParams.get("limit") !== "6"
    ) {
      await route.continue();
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: homePosts,
        meta: {
          hasNextPage: false,
          hasPrevPage: false,
          limit: 6,
          page: 1,
          total: homePosts.length,
          totalPages: 1,
        },
      }),
    });
  });
}

test("loops the home insights rail without disabling the next control", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHomePosts(page);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const next = section.getByRole("button", { name: "Bài viết tiếp theo" });
  const featured = section.locator(".marketing-home-insights-card.is-featured");

  await expect(featured).toBeVisible();
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

test("uses the latest posts API for carousel content and article destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockHomePosts(page);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const featured = section.locator(".marketing-home-insights-card.is-featured");

  await expect(featured).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  await expect(featured.getByRole("link", { name: "Home API post 2" })).toHaveAttribute(
    "href",
    "/vi/posts/home-api-post-2",
  );
  await expect(featured.getByRole("link", { name: "Xem chi tiết" })).toHaveAttribute(
    "href",
    "/vi/posts/home-api-post-2",
  );
  await expect(section.getByRole("link", { name: "Xem tất cả" })).toHaveAttribute(
    "href",
    "/vi/posts",
  );
});
