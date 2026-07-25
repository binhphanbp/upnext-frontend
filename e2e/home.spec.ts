import { expect, test, type Locator, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function activeGalleryThumbnailIsFullyVisible(galleryDialog: Locator) {
  return galleryDialog.evaluate((dialog) => {
    const rail = dialog.querySelector<HTMLElement>("[data-gallery-filmstrip]");
    const activeThumbnail = dialog.querySelector<HTMLElement>('[aria-current="true"]');

    if (!rail || !activeThumbnail) {
      return false;
    }

    const railRect = rail.getBoundingClientRect();
    const activeThumbnailRect = activeThumbnail.getBoundingClientRect();

    return activeThumbnailRect.left >= railRect.left && activeThumbnailRect.right <= railRect.right;
  });
}

async function backgroundAlpha(locator: Locator) {
  return locator.evaluate((element) => {
    const color = window.getComputedStyle(element).backgroundColor;
    const channels = color.match(/[\d.]+/g)?.map(Number) ?? [];

    return channels.length > 3 ? (channels[3] ?? 1) : 1;
  });
}

async function dragGalleryStage(
  page: Page,
  stage: Locator,
  deltaX: number,
  options: { holdMs?: number; steps?: number } = {},
) {
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();

  const startX = stageBox!.x + stageBox!.width / 2;
  const startY = stageBox!.y + stageBox!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY, { steps: options.steps ?? 4 });

  if (options.holdMs) {
    await page.waitForTimeout(options.holdMs);
  }

  await page.mouse.up();
}

async function dragGalleryStageWithTouch(page: Page, stage: Locator, deltaX: number) {
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();

  const startX = stageBox!.x + stageBox!.width / 2;
  const startY = stageBox!.y + stageBox!.height / 2;
  const cdpSession = await page.context().newCDPSession(page);

  try {
    await cdpSession.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 1,
    });
    await cdpSession.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: startY, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
    });

    for (let step = 1; step <= 6; step += 1) {
      await cdpSession.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: startX + (deltaX * step) / 6,
            y: startY,
            id: 1,
            radiusX: 1,
            radiusY: 1,
            force: 1,
          },
        ],
      });
    }

    await cdpSession.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await cdpSession.detach();
  }
}

test("renders the localized UpNext homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/vi/);
  await expect(page.getByRole("heading", { name: /tìm đúng việc it/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tìm việc ngay", exact: true })).toBeVisible();
  await expect(page.getByText("FPT Software").first()).toBeVisible();
});

test("submits homepage job search with query params", async ({ page }) => {
  await page.goto("/vi");

  await page.getByLabel("Từ khóa tìm việc").fill("React");
  await page.getByRole("button", { name: "Tìm việc ngay", exact: true }).click();

  await expect(page).toHaveURL(/\/vi\/jobs\?keyword=React/);
});

test("popular keyword chips route to jobs search", async ({ page }) => {
  await page.goto("/vi");
  await expect(page.locator(".marketing-home-popular-links")).toBeVisible();
  await page
    .locator(".marketing-home-popular-links")
    .getByRole("link", { name: "Frontend" })
    .click();
  await expect(page).toHaveURL(/\/vi\/jobs\?keyword=Frontend/);

  await page.goto("/en");
  await expect(page.locator(".marketing-home-popular-links")).toBeVisible();
  await page
    .locator(".marketing-home-popular-links")
    .getByRole("link", { name: "Frontend" })
    .click();
  await expect(page).toHaveURL(/\/en\/jobs\?keyword=Frontend/);
});

test("keeps the home insights carousel accessible by button, keyboard, and drag", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  const viewport = section.locator(".marketing-home-insights-viewport");

  await section.scrollIntoViewIfNeeded();
  await expect(
    section.getByRole("heading", { name: "Cẩm nang nghề nghiệp", exact: true }),
  ).toBeVisible();
  await expect(section.getByText("Xem tất cả", { exact: true })).toBeVisible();
  await expect(viewport).toHaveAttribute("aria-roledescription", "carousel");
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "1",
  );
  const railLayout = await section.evaluate((element) => {
    const header = element.querySelector<HTMLElement>(".marketing-home-insights-head");
    const stage = element.querySelector<HTMLElement>(".marketing-home-insights-stage");
    const featured = element.querySelector<HTMLElement>(
      ".marketing-home-insights-card.is-featured",
    );
    const sideCard = element.querySelector<HTMLElement>(
      ".marketing-home-insights-card.is-adjacent",
    );

    if (!header || !stage || !featured || !sideCard) return null;

    return {
      headerLeft: header.getBoundingClientRect().left,
      headerWidth: header.getBoundingClientRect().width,
      stageLeft: stage.getBoundingClientRect().left,
      stageWidth: stage.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
      featuredTop: featured.getBoundingClientRect().top,
      sideTop: sideCard.getBoundingClientRect().top,
      featuredOpacity: Number(window.getComputedStyle(featured).opacity),
      sideOpacity: Number(window.getComputedStyle(sideCard).opacity),
    };
  });

  expect(railLayout).not.toBeNull();
  expect(railLayout!.headerLeft).toBeCloseTo(80, 0);
  expect(railLayout!.headerWidth).toBeCloseTo(1280, 0);
  expect(railLayout!.stageLeft).toBe(0);
  expect(railLayout!.stageWidth).toBe(railLayout!.viewportWidth);
  expect(railLayout!.featuredTop).toBeLessThan(railLayout!.sideTop);
  expect(railLayout!.featuredOpacity).toBeGreaterThan(railLayout!.sideOpacity);

  await section.getByRole("button", { name: "Bài viết tiếp theo" }).click();
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "2",
  );

  const nextButton = section.getByRole("button", { name: "Bài viết tiếp theo" });
  await nextButton.focus();
  await page.keyboard.press("Enter");
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "3",
  );

  await section.getByRole("button", { name: "Bài viết tiếp theo" }).click();
  await section.getByRole("button", { name: "Bài viết tiếp theo" }).click();
  await section.getByRole("button", { name: "Bài viết tiếp theo" }).click();
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "0",
  );

  await section.getByRole("button", { name: "Bài viết tiếp theo" }).click();
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "1",
  );

  const scrollBeforeMouseDrag = await viewport.evaluate((element) => element.scrollLeft);
  await dragGalleryStage(page, viewport, -360, { steps: 8 });
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(scrollBeforeMouseDrag);
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "2",
  );

  const scrollBeforeTouchDrag = await viewport.evaluate((element) => element.scrollLeft);
  await dragGalleryStageWithTouch(page, viewport, 360);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeLessThan(scrollBeforeTouchDrag);
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveAttribute(
    "data-insight-index",
    "1",
  );

  const verticalRhythm = await page.evaluate(() => {
    const market = document.querySelector<HTMLElement>(".marketing-home-market");
    const insights = document.querySelector<HTMLElement>(".marketing-home-insights");
    const footer = document.querySelector<HTMLElement>(".marketing-home-footer");
    if (!market || !insights || !footer) return null;

    return {
      marketToInsights:
        insights.getBoundingClientRect().top - market.getBoundingClientRect().bottom,
      insightsToFooter:
        footer.getBoundingClientRect().top - insights.getBoundingClientRect().bottom,
    };
  });

  expect(verticalRhythm).not.toBeNull();
  expect(verticalRhythm!.marketToInsights).toBeLessThanOrEqual(84);
  expect(verticalRhythm!.insightsToFooter).toBeLessThanOrEqual(52);
});

test("keeps the home insights carousel within a compact mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-insights");
  await section.scrollIntoViewIfNeeded();

  await expect(section.getByRole("button", { name: "Bài viết trước" })).toBeVisible();
  await expect(section.getByRole("button", { name: "Bài viết tiếp theo" })).toBeVisible();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});

test("uses API jobs for search and keeps the sidebar focused on advanced filters", async ({
  page,
}) => {
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "api-react-platform",
          title: "React Platform Engineer",
          description: "Build and improve the React platform.",
          requirements: null,
          benefits: null,
          salaryMin: 30000000,
          salaryMax: 45000000,
          salaryCurrency: "VND",
          salaryIsNegotiable: false,
          salaryIsVisible: true,
          vacanciesCount: 2,
          publishedAt: "2026-07-16T00:00:00.000Z",
          createdAt: "2026-07-16T00:00:00.000Z",
          company: {
            id: "company-1",
            name: "UpNext Labs",
            verificationStatus: "VERIFIED",
          },
          jobCategory: { name: "Frontend Engineering" },
          employmentType: { name: "Full-time" },
          experienceLevel: { name: "Middle" },
          jobPostSkills: [{ minYearsExperience: 2, skill: { name: "React" } }],
          jobPostLocations: [{ jobLocation: { city: "TP. Hồ Chí Minh", workingModel: "HYBRID" } }],
        },
        {
          id: "api-java-backend",
          title: "Java API Engineer",
          description: "Develop Java services.",
          requirements: null,
          benefits: null,
          salaryMin: 25000000,
          salaryMax: 35000000,
          salaryCurrency: "VND",
          salaryIsNegotiable: false,
          salaryIsVisible: true,
          vacanciesCount: 1,
          publishedAt: "2026-07-15T00:00:00.000Z",
          createdAt: "2026-07-15T00:00:00.000Z",
          company: { id: "company-2", name: "UpNext Core" },
          jobCategory: { name: "Backend Engineering" },
          employmentType: { name: "Full-time" },
          experienceLevel: { name: "Senior" },
          jobPostSkills: [{ minYearsExperience: 5, skill: { name: "Java" } }],
          jobPostLocations: [{ jobLocation: { city: "Hà Nội", workingModel: "ONSITE" } }],
        },
      ]),
    });
  });

  await page.goto("/vi/jobs?keyword=React");

  await expect(page.getByText("React Platform Engineer", { exact: true })).toBeVisible();
  await expect(page.getByText("Java API Engineer", { exact: true })).toBeHidden();
  await expect(page.locator("#jobs-search-keyword")).toHaveValue("React");

  const sidebar = page.locator("aside");
  await expect(sidebar.getByLabel("Từ khóa")).toHaveCount(0);
  await expect(sidebar.getByLabel("Địa điểm")).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: "React", exact: true })).toBeVisible();

  await page.locator("#jobs-search-location").selectOption("Hà Nội");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("location")).toBe("Hà Nội");
  await expect(page.getByText("Không tìm thấy việc làm phù hợp")).toBeVisible();
});

test("uses one shared public header across public marketing pages", async ({ page }) => {
  for (const route of ["/vi", "/vi/jobs", "/vi/companies"]) {
    await page.goto(route);
    const header = page.locator(".marketing-home-header");
    await expect(header).toHaveCount(1);
    await expect(header.getByRole("button", { name: "Trang chủ UpNext" })).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/jobs");
  const mobileHeader = page.locator(".marketing-home-header");
  await expect(mobileHeader).toHaveCount(1);
  await expect(mobileHeader.getByRole("button", { name: "Trang chủ UpNext" })).toBeVisible();

  await page.goto("/vi/login");
  await expect(page.locator(".marketing-home-header")).toHaveCount(0);
});

test("keeps the homepage header above page content while scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const header = page.locator(".marketing-home-header");
  await page.evaluate(() => window.scrollTo({ top: 900 }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  const headerState = await header.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(window.innerWidth / 2, 24);

    return {
      top: rect.top,
      isTopLayer: topElement === element || element.contains(topElement),
    };
  });

  expect(headerState.top).toBeCloseTo(0, 0);
  expect(headerState.isTopLayer).toBe(true);
});

test("keeps every public header mega menu readable and inside the viewport", async ({ page }) => {
  const menuCases = [
    {
      key: "jobs",
      label: "Việc làm IT",
      destinations: null,
    },
    {
      key: "companies",
      label: "Công ty IT",
      destinations: ["/vi/companies", "/vi/companies", "/vi/companies"],
    },
    {
      key: "blog",
      label: "Bài viết",
      destinations: [
        "/vi/posts?category=blog-upnext",
        "/vi/posts?category=su-nghiep-it",
        "/vi/posts?category=chuyen-mon-it",
      ],
    },
    {
      key: "features",
      label: "Tính năng",
      destinations: [
        "/vi/register",
        "/vi/register",
        "/vi/register",
        "/vi/jobs",
        "/vi/register",
        "/vi/register",
      ],
    },
  ] as const;

  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/vi");

    const navigation = page.getByLabel("Điều hướng chính");

    for (const menuCase of menuCases) {
      const triggerId = `public-nav-${menuCase.key}-trigger`;
      const panelId = `public-nav-${menuCase.key}-panel`;
      const trigger = navigation.getByRole("button", { name: menuCase.label, exact: true });

      await expect(trigger).toHaveAttribute("id", triggerId);
      await expect(trigger).toHaveAttribute("aria-controls", panelId);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");

      const panel = navigation.locator(`#${panelId}`);
      await expect(panel).toHaveAttribute("aria-labelledby", triggerId);
      await expect(panel).toBeVisible();

      const links = panel.getByRole("link");
      if (menuCase.destinations) {
        await expect(links).toHaveCount(menuCase.destinations.length);
      } else {
        await expect.poll(() => links.count()).toBeGreaterThan(1);
      }
      const destinations = await links.evaluateAll((elements) =>
        elements.map((element) => {
          const url = new URL((element as HTMLAnchorElement).href);
          return decodeURIComponent(`${url.pathname}${url.search}`);
        }),
      );
      if (menuCase.destinations) {
        expect(destinations).toEqual(menuCase.destinations);
      } else {
        expect(destinations.every((destination) => destination.startsWith("/vi/jobs"))).toBe(true);
      }

      const layout = await panel.evaluate((element) => {
        const panelRect = element.getBoundingClientRect();
        const items = Array.from(element.querySelectorAll<HTMLElement>("a"));

        return {
          panelInsideViewport: panelRect.left >= 0 && panelRect.right <= window.innerWidth,
          pageHasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
          overflowingItems: items
            .filter((item) => item.scrollWidth > item.clientWidth)
            .map((item) => item.textContent?.trim()),
          nonWrappingDescriptions: Array.from(
            element.querySelectorAll<HTMLElement>(".marketing-home-mega-text small"),
          ).filter((description) => getComputedStyle(description).whiteSpace !== "normal").length,
        };
      });

      expect(layout.panelInsideViewport).toBe(true);
      expect(layout.pageHasHorizontalOverflow).toBe(false);
      expect(layout.overflowingItems).toEqual([]);
      expect(layout.nonWrappingDescriptions).toBe(0);

      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
    }
  }
});

test("loads live backend data for every jobs menu category", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const trigger = page.locator("#public-nav-jobs-trigger");
  await trigger.click();

  const panel = page.locator("#public-nav-jobs-panel");
  const tabPanel = panel.getByRole("tabpanel");
  const tabs = panel.getByRole("tab");
  const filterParams = ["jobCategory", "skill", "title", "expertise", "company", "location"];

  await expect(tabs).toHaveCount(filterParams.length);

  for (const [index, filterParam] of filterParams.entries()) {
    const tab = tabs.nth(index);
    await tab.hover();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const tabId = await tab.getAttribute("id");
    expect(tabId).not.toBeNull();
    await expect(tabPanel).toHaveAttribute("aria-labelledby", tabId!);

    const links = tabPanel.getByRole("link");
    await expect.poll(() => links.count()).toBeGreaterThan(0);
    const firstHref = await links.first().getAttribute("href");
    expect(new URL(firstHref ?? "", page.url()).searchParams.has(filterParam)).toBe(true);
  }

  await tabs.nth(0).focus();
  await page.keyboard.press("ArrowDown");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
});

test("shows an interactive preview only for urgent job titles", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const urgentSection = page.locator(".marketing-home-urgent");
  const title = urgentSection.locator(".urgent-job-title").first();
  await title.scrollIntoViewIfNeeded();
  await title.hover();

  const preview = urgentSection.getByRole("dialog");
  await expect(preview).toBeVisible();
  await expect(title).toHaveAttribute("aria-expanded", "true");
  const previewSize = await preview.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(previewSize.width).toBeLessThanOrEqual(500);
  expect(previewSize.height).toBeLessThanOrEqual(460);
  await expect(preview.getByRole("button", { name: "Ứng tuyển ngay" })).toBeVisible();
  await expect(preview.getByRole("button", { name: /Xem chi tiết/u })).toBeVisible();

  const description = preview.locator(".urgent-job-preview-description");
  await expect(description).toBeVisible();
  const descriptionState = await description.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflowY: style.overflowY,
      lineClamp: style.getPropertyValue("-webkit-line-clamp"),
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    };
  });
  expect(descriptionState.overflowY).toBe("auto");
  expect(descriptionState.lineClamp).toBe("none");
  expect(descriptionState.scrollHeight).toBeGreaterThanOrEqual(descriptionState.clientHeight);

  await preview.hover();
  await page.waitForTimeout(200);
  await expect(preview).toBeVisible();

  const saveButton = preview.locator(".urgent-job-preview-save");
  await saveButton.click();
  await expect(saveButton).toHaveAttribute("aria-pressed", "true");

  await title.focus();
  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();
  await expect(title).toBeFocused();

  await expect(page.locator(".marketing-home-jobs").getByRole("dialog")).toHaveCount(0);
});

test("uses one shared public footer across public marketing pages", async ({ page }) => {
  for (const route of ["/vi", "/vi/jobs", "/vi/companies"]) {
    await page.goto(route);
    const footer = page.locator("#site-footer");
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("button", { name: "Trang chủ UpNext" })).toBeVisible();
    await expect(footer.getByRole("button", { name: "Tìm việc IT" })).toBeVisible();
  }

  await page.goto("/vi/login");
  await expect(page.locator("#site-footer")).toHaveCount(0);
});

test("uses the shared Lexend typography in the public footer", async ({ page }) => {
  await page.goto("/vi");

  const footer = page.locator("#site-footer");
  const heading = footer.getByRole("heading").first();
  const textControls = footer.locator("button, input, summary");

  await expect(page.locator("body")).toHaveCSS("font-family", /Lexend/);
  await expect(footer).toHaveCSS("font-family", /Lexend/);
  await expect(heading).toHaveCSS("font-weight", "700");

  for (const control of await textControls.all()) {
    await expect(control).toHaveCSS("font-family", /Lexend/);
  }
});

test("renders migrated public jobs and companies pages", async ({ page }) => {
  await page.goto("/vi/jobs");

  await expect(
    page.getByRole("heading", {
      name: "Tìm kiếm việc làm từ các công ty hàng đầu đang tuyển dụng",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chi tiết", exact: true }).first().click();
  await page.waitForURL(/\/vi\/jobs\//, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Technical Project Manager / Scrum Master", exact: true }),
  ).toBeVisible();

  await page.goto("/vi/companies");
  await expect(page.getByRole("heading", { name: "FPT Software", exact: true })).toBeVisible();
});

test("renders reference-inspired job detail and company profile sections", async ({ page }) => {
  await page.goto("/vi/jobs/fpt-java-fresher");

  await expect(page.getByRole("heading", { name: /fresher java developer/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sẵn sàng ứng tuyển?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tổng quan công việc" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lý do nên ứng tuyển" })).toBeVisible();

  await page.goto("/vi/companies/fpt-software");

  await expect(page.getByRole("heading", { name: "FPT Software", exact: true })).toBeVisible();
  await expect(page.getByText("Nhà tuyển dụng được yêu thích")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Thông tin nhanh" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Việc làm đang tuyển" })).toBeVisible();
});

test("updates company follow controls to the confirmed state", async ({ page }) => {
  await page.goto("/vi/companies/fpt-software");

  const followControls = page.locator("button.company-follow");
  const followButton = followControls.first();
  await expect(followButton).toHaveAttribute("aria-pressed", "false");
  await followButton.click();

  await expect(followButton).toHaveText("Đang theo dõi");
  await expect(followButton).toHaveAttribute("aria-pressed", "true");
  await expect(followButton.locator(".company-follow-icon svg")).toHaveCount(1);
  await expect(followControls).toHaveCount(2);
  await expect(followControls).toHaveText(["Đang theo dõi", "Đang theo dõi"]);
  await expect(followControls.nth(1)).toHaveAttribute("aria-pressed", "true");
});

test("opens company culture gallery with overflow images", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/companies/fpt-software");

  await expect(page.getByText("+15 ảnh")).toBeVisible();
  const galleryOpener = page.getByRole("button", {
    name: "Xem ảnh môi trường làm việc 3",
  });
  await galleryOpener.click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh môi trường làm việc" });
  await expect(galleryDialog).toBeVisible();
  await expect(galleryDialog.getByText("3/18")).toBeVisible();
  await expect.soft(galleryDialog.locator('[aria-live="polite"]')).toHaveText("3/18", {
    timeout: 1_000,
  });

  const dialogBox = await galleryDialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.x).toBeCloseTo(0, 0);
  expect(dialogBox!.y).toBeCloseTo(0, 0);
  expect(dialogBox!.width).toBeCloseTo(1440, 0);
  expect(dialogBox!.height).toBeCloseTo(900, 0);

  const overlayAlpha = await backgroundAlpha(page.locator(".company-gallery-lightbox-backdrop"));
  expect(overlayAlpha).toBeGreaterThanOrEqual(0.45);
  expect(overlayAlpha).toBeLessThanOrEqual(0.72);

  const toolbar = galleryDialog.getByRole("toolbar", {
    name: "Điều khiển bộ sưu tập ảnh",
  });
  await expect(toolbar).toBeVisible();
  await expect(galleryDialog.getByRole("button", { name: "Thu nhỏ ảnh" })).toBeVisible();
  await expect(galleryDialog.getByRole("button", { name: "Phóng to ảnh" })).toBeVisible();

  const fullscreenButton = galleryDialog.getByRole("button", { name: "Xem toàn màn hình" });
  if ((await fullscreenButton.count()) > 0) {
    await expect(fullscreenButton).toHaveAttribute("aria-pressed", "false");
  }

  const zoomReset = galleryDialog.getByRole("button", {
    name: "Đặt lại thu phóng về 100%",
  });
  await galleryDialog.getByRole("button", { name: "Phóng to ảnh" }).click();
  await galleryDialog.getByRole("button", { name: "Phóng to ảnh" }).click();
  await expect(zoomReset).toHaveText("150%");

  const nextButton = galleryDialog.getByRole("button", { name: "Xem ảnh tiếp theo" });
  await nextButton.click();
  await expect(galleryDialog.getByText("4/18")).toBeVisible();
  await expect(zoomReset).toHaveText("100%");
  await expect(nextButton).toBeFocused();

  const filmstripToggle = galleryDialog.getByRole("button", {
    name: "Ẩn dải ảnh thu nhỏ",
  });
  await expect(filmstripToggle).toHaveAttribute("aria-pressed", "true");
  await filmstripToggle.click();
  await expect(galleryDialog.locator("[data-gallery-filmstrip]")).toBeHidden();
  const showFilmstrip = galleryDialog.getByRole("button", {
    name: "Hiện dải ảnh thu nhỏ",
  });
  await expect(showFilmstrip).toHaveAttribute("aria-pressed", "false");
  await showFilmstrip.click();
  const filmstrip = galleryDialog.locator("[data-gallery-filmstrip]");
  await expect(filmstrip).toBeVisible();
  await filmstrip.click({ position: { x: 2, y: 2 } });
  await expect(galleryDialog).toBeVisible();

  await galleryDialog.locator('[aria-current="true"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(galleryDialog.getByText("5/18")).toBeVisible();
  await expect(galleryDialog.getByRole("button", { name: "Chọn ảnh 5" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(galleryDialog.getByText("5/18")).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(galleryDialog.getByText("4/18")).toBeVisible();
  await expect(galleryDialog.getByRole("button", { name: "Chọn ảnh 4" })).toBeFocused();

  for (let imageNumber = 4; imageNumber < 15; imageNumber += 1) {
    await galleryDialog.getByRole("button", { name: "Xem ảnh tiếp theo" }).click();
  }

  await expect(galleryDialog.getByText("15/18")).toBeVisible();
  expect.soft(await activeGalleryThumbnailIsFullyVisible(galleryDialog)).toBe(true);

  await page.keyboard.press("End");
  await expect.soft(galleryDialog.getByText("18/18")).toBeVisible({ timeout: 1_000 });

  await page.keyboard.press("ArrowRight");
  await expect.soft(galleryDialog.getByText("1/18")).toBeVisible({ timeout: 1_000 });

  await page.keyboard.press("Home");
  await expect.soft(galleryDialog.getByText("1/18")).toBeVisible({ timeout: 1_000 });

  await page.keyboard.press("ArrowLeft");
  await expect.soft(galleryDialog.getByText("18/18")).toBeVisible({ timeout: 1_000 });

  await galleryDialog
    .locator(".company-gallery-lightbox-stage")
    .click({ position: { x: 2, y: 2 } });
  await expect(galleryDialog).toBeHidden();
  await expect(galleryOpener).toBeFocused();

  await galleryOpener.click();
  await expect(galleryDialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(galleryDialog).toBeHidden();
  await expect.soft(galleryOpener).toBeFocused();
});

test("supports direct drag navigation and keeps zoom drag as pan", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/companies/fpt-software");
  await page.getByRole("button", { name: "Xem ảnh môi trường làm việc 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh môi trường làm việc" });
  const stage = galleryDialog.locator(".company-gallery-lightbox-stage");
  const currentSlide = galleryDialog.locator('[data-gallery-slide="current"]');
  const nextSlide = galleryDialog.locator('[data-gallery-slide="next"]');
  await expect(currentSlide).toBeVisible();

  const stageBox = await stage.boundingBox();
  const currentBoxBeforeDrag = await currentSlide.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(currentBoxBeforeDrag).not.toBeNull();

  const startX = stageBox!.x + stageBox!.width / 2;
  const startY = stageBox!.y + stageBox!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 180, startY, { steps: 6 });

  const currentBoxDuringDrag = await currentSlide.boundingBox();
  const nextBoxDuringDrag = await nextSlide.boundingBox();
  expect(currentBoxDuringDrag).not.toBeNull();
  expect(nextBoxDuringDrag).not.toBeNull();
  expect(currentBoxDuringDrag!.x).toBeLessThan(currentBoxBeforeDrag!.x - 120);
  expect(nextBoxDuringDrag!.x).toBeLessThan(stageBox!.x + stageBox!.width);
  expect(nextBoxDuringDrag!.x + nextBoxDuringDrag!.width).toBeGreaterThan(stageBox!.x);
  await expect(galleryDialog.getByText("3/18")).toBeVisible();

  await page.mouse.up();
  await expect(galleryDialog.getByText("4/18")).toBeVisible();
  await expect.poll(async () => (await currentSlide.boundingBox())?.x).toBeCloseTo(stageBox!.x, 0);

  const currentBoxBeforeSnapBack = await currentSlide.boundingBox();
  expect(currentBoxBeforeSnapBack).not.toBeNull();
  await dragGalleryStage(page, stage, 36, { holdMs: 260, steps: 6 });
  await expect(galleryDialog.getByText("4/18")).toBeVisible();
  await expect
    .poll(async () => (await currentSlide.boundingBox())?.x)
    .toBeCloseTo(currentBoxBeforeSnapBack!.x, 0);

  await page.mouse.move(stageBox!.x + 5, stageBox!.y + 20);
  await page.mouse.down();
  await page.mouse.move(stageBox!.x + 5, stageBox!.y + 140, { steps: 6 });
  await page.mouse.up();
  await expect(galleryDialog).toBeVisible();
  await expect(galleryDialog.getByText("4/18")).toBeVisible();

  await galleryDialog.getByRole("button", { name: "Phóng to ảnh" }).click();
  await expect(galleryDialog.getByRole("button", { name: "Đặt lại thu phóng về 100%" })).toHaveText(
    "125%",
  );

  const zoomedSlideBoxBeforeDrag = await currentSlide.boundingBox();
  const zoomedImage = currentSlide.locator("img");
  const imageTransformBeforePan = await zoomedImage.evaluate((image) => image.style.transform);
  await dragGalleryStage(page, stage, -160, { steps: 6 });
  await expect(galleryDialog.getByText("4/18")).toBeVisible();
  expect((await currentSlide.boundingBox())?.x).toBeCloseTo(zoomedSlideBoxBeforeDrag!.x, 0);
  expect(await zoomedImage.evaluate((image) => image.style.transform)).not.toBe(
    imageTransformBeforePan,
  );
});

test("keeps the company culture gallery usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/companies/fpt-software");

  await page.getByRole("button", { name: "Xem ảnh môi trường làm việc 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh môi trường làm việc" });
  await expect(galleryDialog).toBeVisible();

  const dialogBox = await galleryDialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(390);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  for (const control of [
    galleryDialog.getByRole("button", { name: "Xem ảnh trước" }),
    galleryDialog.getByRole("button", { name: "Xem ảnh tiếp theo" }),
    galleryDialog.getByRole("button", { name: "Thu nhỏ ảnh" }),
    galleryDialog.getByRole("button", { name: "Phóng to ảnh" }),
    galleryDialog.getByRole("button", { name: "Ẩn dải ảnh thu nhỏ" }),
    galleryDialog.getByRole("button", { name: "Đóng bộ sưu tập ảnh" }),
  ]) {
    await expect(control).toBeVisible();
    await expect(control).toBeInViewport();
  }

  const stage = galleryDialog.locator(".company-gallery-lightbox-stage");
  await dragGalleryStageWithTouch(page, stage, -90);
  await expect(galleryDialog.getByText("4/18")).toBeVisible();

  for (let imageNumber = 4; imageNumber < 15; imageNumber += 1) {
    await galleryDialog.getByRole("button", { name: "Xem ảnh tiếp theo" }).click();
  }

  await expect(galleryDialog.getByText("15/18")).toBeVisible();
  expect(await activeGalleryThumbnailIsFullyVisible(galleryDialog)).toBe(true);
  await expect(galleryDialog.locator('[aria-current="true"]')).toBeInViewport();
});

test("keeps all company gallery controls reachable on a compact mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/vi/companies/fpt-software");

  await page.getByRole("button", { name: "Xem ảnh môi trường làm việc 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh môi trường làm việc" });
  await expect(galleryDialog).toBeVisible();

  for (const controlName of [
    "Thu nhỏ ảnh",
    "Phóng to ảnh",
    "Ẩn dải ảnh thu nhỏ",
    "Đóng bộ sưu tập ảnh",
    "Xem ảnh trước",
    "Xem ảnh tiếp theo",
  ]) {
    const control = galleryDialog.getByRole("button", { name: controlName });
    await expect(control).toBeVisible();
    await expect(control).toBeInViewport();
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("renders migrated auth pages", async ({ page }) => {
  await page.goto("/vi/login");
  await expect(page.getByRole("heading", { name: "Đăng nhập", exact: true })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tiếp tục với Google" })).toBeVisible();

  await page.goto("/vi/register");
  await expect(page.getByRole("heading", { name: "Đăng ký", exact: true })).toBeVisible();
  await expect(page.getByLabel("Họ và tên", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Xác nhận mật khẩu", { exact: true })).toBeVisible();

  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: "Log in", exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();

  await page.goto("/en/register");
  await expect(page.getByRole("heading", { name: "Sign up", exact: true })).toBeVisible();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password", { exact: true })).toBeVisible();
});
