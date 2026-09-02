import { expect, test, type Locator, type Page } from "@playwright/test";

import { installCandidateSession, mockHomeApi } from "./fixtures/home-api";
import {
  createPublicCompany,
  createPublicJob,
  mockPublicCompany,
  mockPublicCompanyList,
  mockPublicJobDetailBySlug,
  mockPublicJobs,
} from "./fixtures/public-api";

/**
 * Public pages that read live backend data.
 *
 * Split out of `home.spec` because these are not header or layout checks: they open the
 * jobs and companies listings, a job detail page, a company profile and its culture
 * gallery, and they assert on specific seeded records — a job titled "Technical Project
 * Manager / Scrum Master", a company slug `fpt-java-fresher`, a gallery with fifteen
 * overflow images. `home.spec` has no API fixtures, so these only ever passed against a
 * developer machine with a seeded database running, which is why the suite could not run in
 * CI even before it drifted.
 *
 * They stay quarantined until the endpoints behind them (`/api/v1/job-posts`,
 * `/api/v1/companies` and their detail routes) have fixtures in the shape of
 * `e2e/fixtures/home-api`. Fabricating those response shapes from component code would
 * produce tests that pass against an invented contract, which is worse than a known gap.
 */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockHomeApi(page);
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

test("keeps every public header mega menu readable and inside the viewport", async ({ page }) => {
  const menuCases = [
    {
      key: "jobs",
      label: "Việc làm IT",
      destinations: null,
      directoryItems: null,
    },
    {
      key: "companies",
      label: "Công ty IT",
      // The company rows are filtered entry points now, not four links to the same listing.
      destinations: [
        "/vi/companies?sort=jobs",
        "/vi/companies?size=over-5000",
        "/vi/companies?type=PRODUCT",
        "/vi/companies",
      ],
      directoryItems: 3,
    },
    {
      key: "blog",
      label: "Bài viết",
      destinations: [
        "/vi/posts?category=blog-upnext",
        "/vi/posts?category=su-nghiep-it",
        "/vi/posts?category=chuyen-mon-it",
        "/vi/posts",
      ],
      directoryItems: 3,
    },
    {
      key: "features",
      label: "Tính năng",
      destinations: [
        "/vi/register",
        "/vi/ai-interview",
        "/vi/register",
        "/vi/jobs",
        "/vi/register",
        "/vi/register",
        "/vi/register",
      ],
      directoryItems: 6,
    },
  ] as const;

  // 1280 is intentionally absent: below 1361px the header collapses to the compact menu, so
  // there is no desktop navigation to inspect there. That width is covered by the
  // compact-layout test instead.
  // The jobs panel lists destinations built from the loaded jobs, so it needs more than one.
  await mockPublicJobs(page, [
    createPublicJob(1, { title: "Senior React Engineer" }),
    createPublicJob(2, { title: "Backend Java Engineer" }),
    createPublicJob(3, { title: "Data Engineer" }),
  ]);

  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/vi");

    const navigation = page.getByLabel("Điều hướng chính");

    for (const menuCase of menuCases) {
      const triggerId = `public-nav-${menuCase.key}-trigger`;
      const panelId = `public-nav-${menuCase.key}-panel`;
      // A section with its own landing page renders as a link, one without stays a button, so
      // the trigger is addressed by the id this loop already asserts rather than by role.
      const trigger = navigation.locator(`#${triggerId}`);

      await expect(trigger).toHaveAttribute("id", triggerId);
      await expect(trigger).toHaveAttribute("aria-controls", panelId);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Sections that have a landing page are links: Enter follows them, so the panel opens on
      // hover and on focus instead, and ArrowDown is the explicit keyboard affordance.
      // Sections without a page are still buttons and still toggle on click.
      const opensByPointerOnly = (await trigger.evaluate((node) => node.tagName)) === "A";

      if (opensByPointerOnly) {
        await trigger.hover();
      } else {
        await trigger.click();
      }
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      // A hover-opened panel cannot be dismissed with Escape while the pointer is still on the
      // trigger — it would reopen immediately — so leaving the trigger is the closing gesture.
      if (opensByPointerOnly) {
        await page.mouse.move(0, 0);
      } else {
        await page.keyboard.press("Escape");
      }
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      await trigger.focus();
      if (opensByPointerOnly) {
        await page.keyboard.press("ArrowDown");
      } else {
        await page.keyboard.press("Enter");
      }
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
        await expect(panel).toHaveClass(/marketing-home-directory-mega/);
        await expect(panel.locator(".marketing-home-directory-items > li")).toHaveCount(
          menuCase.directoryItems,
        );
        await expect(panel.locator(".marketing-home-directory-footer")).toBeVisible();
        await expect(panel.locator(".marketing-home-directory-icon")).toHaveCount(0);
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
            element.querySelectorAll<HTMLElement>(".marketing-home-directory-text small"),
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

test("gives directory menu rows the same hover feedback as job rows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  // The companies section has a landing page, so its trigger is a link named "Công ty"; the
  // panel opens on hover because clicking would navigate.
  await page.locator("#public-nav-companies-trigger").hover();
  const firstItem = page
    .locator("#public-nav-companies-panel .marketing-home-directory-item")
    .first();

  await firstItem.hover();
  await expect(firstItem).toHaveCSS("background-color", "rgb(243, 250, 247)");
  await expect(firstItem.locator(".marketing-home-directory-text b")).toHaveCSS(
    "color",
    "rgb(7, 135, 95)",
  );
});

test("loads live backend data for every jobs menu category", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Every tab in this menu is built from the loaded jobs, so the fixture has to vary the
  // skill, title, company and city or some tabs come back empty.
  await mockPublicJobs(page, [
    createPublicJob(1, {
      title: "Senior React Engineer",
      jobPostSkills: [{ skill: { id: "react", name: "React" } }],
      jobCategory: { name: "Frontend" },
    }),
    createPublicJob(2, {
      title: "Backend Java Engineer",
      jobPostSkills: [{ skill: { id: "java", name: "Java" } }],
      jobCategory: { name: "Backend" },
      company: {
        id: "public-company-2",
        name: "Hanoi Product",
        slug: "hanoi-product",
        address: "Đà Nẵng",
        companySize: "200",
        verificationStatus: "VERIFIED",
        logoUrl: null,
        logoFile: null,
      },
      jobPostLocations: [
        { jobLocation: { city: "Đà Nẵng", workingModel: "ONSITE", address: "Hải Châu" } },
      ],
    }),
  ]);
  await page.goto("/vi");

  // The section has its own landing page, so its trigger is a link: clicking navigates and
  // only hovering opens the panel.
  const trigger = page.locator("#public-nav-jobs-trigger");
  await trigger.hover();

  const panel = page.locator("#public-nav-jobs-panel");
  const tabPanel = panel.getByRole("tabpanel");
  const tabs = panel.getByRole("tab");
  // The "by job category" group was dropped; five remain.
  const filterParams = ["skill", "title", "expertise", "company", "location"];

  // The panel animates in, and hovering a tab mid-transition fails its stability check.
  await expect(panel).toBeVisible();
  await expect
    .poll(async () => {
      const first = await panel.boundingBox();
      await page.waitForTimeout(100);
      const second = await panel.boundingBox();
      return first?.y === second?.y && first?.height === second?.height;
    })
    .toBe(true);

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

test("renders migrated public jobs and companies pages", async ({ page }) => {
  const listedJob = createPublicJob(1, { title: "Technical Project Manager / Scrum Master" });
  await mockPublicJobs(page, [listedJob]);
  await mockPublicJobDetailBySlug(page, listedJob);
  await mockPublicCompanyList(page);
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
  await mockPublicJobDetailBySlug(
    page,
    createPublicJob(2, { title: "Fresher Java Developer", slug: "fpt-java-fresher" }),
  );
  await mockPublicCompany(page, createPublicCompany());
  await page.goto("/vi/jobs/fpt-java-fresher");

  await expect(page.getByRole("heading", { name: /fresher java developer/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Thông tin tuyển dụng" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mô tả công việc" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yêu cầu ứng viên" })).toBeVisible();

  await page.goto("/vi/companies/fpt-software");

  // The company heading carries its verification badge, so its accessible name is
  // "FPT Software Đã xác minh" rather than the name alone.
  await expect(page.getByRole("heading", { name: /^FPT Software/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Giới thiệu công ty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Thông tin công ty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Việc làm đang tuyển" })).toBeVisible();
});

test("updates company follow controls to the confirmed state", async ({ page }) => {
  // The follow control only renders for a resolved, signed-in candidate — a guest sees no
  // button at all, which is why this needs a session rather than only company data.
  await installCandidateSession(page);
  await mockPublicCompany(page, createPublicCompany());
  // Reading the list and changing it are different routes: the list is
  // `/company-follows/me`, while following posts to `/companies/{id}/follow`.
  const followed = new Set<string>();
  await page.route(/\/api\/v1\/company-follows\/me(?:\?|$)/, async (route) => {
    await route.fulfill({
      json: [...followed].map((companyId) => ({
        id: `follow-${companyId}`,
        candidateProfileId: "candidate-profile-1",
        companyId,
        createdAt: "2026-08-01T00:00:00.000Z",
      })),
    });
  });
  await page.route(/\/api\/v1\/companies\/([^/?]+)\/follow(?:\?|$)/, async (route) => {
    const companyId = /companies\/([^/?]+)\/follow/.exec(route.request().url())?.[1] ?? "";
    if (route.request().method() === "DELETE") {
      followed.delete(companyId);
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    followed.add(companyId);
    await route.fulfill({
      json: {
        id: `follow-${companyId}`,
        candidateProfileId: "candidate-profile-1",
        companyId,
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    });
  });
  await page.goto("/vi/companies/fpt-software");

  const followControls = page.locator("button.company-follow");
  const followButton = followControls.first();
  await expect(followButton).toHaveAttribute("aria-pressed", "false");
  await followButton.click();

  await expect(followButton).toHaveText("Đang theo dõi");
  await expect(followButton).toHaveAttribute("aria-pressed", "true");
  // The heart is rendered directly in the button now, without the wrapper span the old
  // markup used, and it fills once the company is followed.
  await expect(followButton.locator("svg")).toHaveCount(1);
  // The page renders a single follow control now; the duplicate that this test used to keep
  // in sync with it no longer exists.
  await expect(followControls).toHaveCount(1);
});

test("opens company culture gallery with overflow images", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // "+15 ảnh" is the overflow badge past the three visible tiles, so eighteen photos.
  await mockPublicCompany(page, createPublicCompany({ photoCount: 18 }));
  await page.goto("/vi/companies/fpt-software");

  await expect(page.getByText("+15 ảnh")).toBeVisible();
  const galleryOpener = page.getByRole("button", {
    name: "Xem ảnh công ty 3",
  });
  await galleryOpener.click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh công ty" });
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
  // "+15 ảnh" is the overflow badge past the three visible tiles, so eighteen photos.
  await mockPublicCompany(page, createPublicCompany({ photoCount: 18 }));
  await page.goto("/vi/companies/fpt-software");
  await page.getByRole("button", { name: "Xem ảnh công ty 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh công ty" });
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

  await expect
    .poll(async () => (await currentSlide.boundingBox())?.x)
    .toBeLessThan(currentBoxBeforeDrag!.x - 120);

  const nextBoxDuringDrag = await nextSlide.boundingBox();
  expect(nextBoxDuringDrag).not.toBeNull();
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
  // "+15 ảnh" is the overflow badge past the three visible tiles, so eighteen photos.
  await mockPublicCompany(page, createPublicCompany({ photoCount: 18 }));
  await page.goto("/vi/companies/fpt-software");

  await page.getByRole("button", { name: "Xem ảnh công ty 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh công ty" });
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
  // "+15 ảnh" is the overflow badge past the three visible tiles, so eighteen photos.
  await mockPublicCompany(page, createPublicCompany({ photoCount: 18 }));
  await page.goto("/vi/companies/fpt-software");

  await page.getByRole("button", { name: "Xem ảnh công ty 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh công ty" });
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
