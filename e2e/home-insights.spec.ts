import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function sectionActionSurface(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      borderRadius: style.borderTopLeftRadius,
      minHeight: style.minHeight,
      paddingInline: `${style.paddingLeft} ${style.paddingRight}`,
    };
  });
}

async function expectFocusedCardIsCentered(section: Locator) {
  const viewport = section.locator(".marketing-home-insights-viewport");
  const featured = section.locator(".marketing-home-insights-card.is-featured");

  await expect(featured).toHaveCount(1);
  await expect
    .poll(async () =>
      section.evaluate(() => {
        const viewportElement = document.querySelector<HTMLElement>(
          ".marketing-home-insights-viewport",
        );
        const featuredElement = document.querySelector<HTMLElement>(
          ".marketing-home-insights-card.is-featured",
        );

        if (!viewportElement || !featuredElement) return Number.POSITIVE_INFINITY;

        const viewportRect = viewportElement.getBoundingClientRect();
        const featuredRect = featuredElement.getBoundingClientRect();
        return Math.abs(
          featuredRect.left + featuredRect.width / 2 - (viewportRect.left + viewportRect.width / 2),
        );
      }),
    )
    .toBeLessThan(3);

  await expect(viewport).not.toHaveClass(/is-dragging/);
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

  await expect(featured).toHaveAttribute("data-insight-index", "1");
});

test("settles on exactly one centered article after consecutive long drags", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHomePosts(page);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const viewport = section.locator(".marketing-home-insights-viewport");
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  await expectFocusedCardIsCentered(section);

  for (const deltaX of [-880, -760, 820, -930]) {
    const viewportBox = await viewport.boundingBox();
    expect(viewportBox).not.toBeNull();

    const startX = viewportBox!.x + viewportBox!.width / 2;
    const startY = viewportBox!.y + viewportBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY, { steps: 2 });
    await page.mouse.up();

    await expectFocusedCardIsCentered(section);
  }
});

test("keeps card geometry fixed while the focused article changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHomePosts(page);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const next = section.getByRole("button", { name: "Bài viết tiếp theo" });
  await section.evaluate((element) => element.scrollIntoView({ block: "center" }));

  const getCardGeometry = () =>
    section.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".marketing-home-insights-card")).map(
        (card) => {
          const { height, width } = card.getBoundingClientRect();
          return { height: Math.round(height), width: Math.round(width) };
        },
      ),
    );

  const initialGeometry = await getCardGeometry();
  expect(new Set(initialGeometry.map(({ height }) => height)).size).toBe(1);
  expect(new Set(initialGeometry.map(({ width }) => width)).size).toBe(1);

  await next.click();
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "2",
  );
  expect(await getCardGeometry()).toEqual(initialGeometry);
});

test("uses the featured companies navigation treatment for insights controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHomePosts(page);
  await page.goto("/vi");

  const insightsArrow = page
    .locator(".marketing-home-insights")
    .getByRole("button", { name: "Bài viết tiếp theo" });
  const companiesArrow = page
    .locator(".marketing-home-companies")
    .getByRole("button", { name: "Trang sau" });

  await expect(insightsArrow).toHaveClass(/marketing-home-carousel-nav/);
  await expect(companiesArrow).toHaveClass(/marketing-home-carousel-nav/);
  await expect(insightsArrow).toHaveCSS("width", "46px");
  await expect(companiesArrow).toHaveCSS("width", "46px");

  await insightsArrow.hover();
  await expect(insightsArrow).toHaveCSS("background-color", "rgb(243, 253, 248)");
  await expect(insightsArrow).toHaveCSS("color", "rgb(11, 127, 95)");
});

test("uses the latest posts API for carousel content and article destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockHomePosts(page);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const featured = section.locator(".marketing-home-insights-card.is-featured");
  const allArticles = section.getByRole("link", { name: "Xem tất cả" });
  const allJobs = page.locator(".marketing-home-jobs-all").first();

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
  await expect(allArticles).toHaveAttribute("href", "/vi/posts");
  await expect(allJobs).toBeVisible();
  expect(await sectionActionSurface(allArticles)).toEqual(await sectionActionSurface(allJobs));
});
