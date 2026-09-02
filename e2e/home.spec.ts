import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  createHomeData,
  createHomeJob,
  installCandidateSession,
  mockCandidateHomeApi,
  mockHomeApi,
  mockPublicJobDetail,
} from "./fixtures/home-api";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockHomeApi(page);
});

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

  await expect(section).toBeVisible();
  await section.evaluate((element) => element.scrollIntoView({ block: "center" }));
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

  await dragGalleryStage(page, viewport, -360, { steps: 8 });
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveCount(1);

  await dragGalleryStageWithTouch(page, viewport, 360);
  await expect(section.locator(".marketing-home-insights-card.is-featured")).toHaveCount(1);

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
  await section.evaluate((element) => element.scrollIntoView({ block: "center" }));

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
  const levelGroup = sidebar.getByRole("group", { name: "Cấp bậc", exact: true });
  await expect(levelGroup).toBeVisible();
  await expect(levelGroup.getByRole("checkbox", { name: "Middle", exact: true })).toBeVisible();

  await page.locator("#jobs-search-location").selectOption("Hà Nội");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("location")).toBe("Hà Nội");
  await expect(page.getByText("Không tìm thấy việc làm phù hợp")).toBeVisible();
});

test("uses the city, not the country, from aggregate job locations", async ({ page }) => {
  const locationJob = createHomeJob(70, {
    id: "job-city-from-address",
    title: "Platform Engineer",
    location: "12 Lê Lợi, Quận 1, TP. Hồ Chí Minh, Việt Nam",
  });
  await mockHomeApi(page, createHomeData({ latestJobs: [locationJob] }));

  await page.goto("/vi");

  const section = page.locator(".marketing-home-jobs");
  await expect(section.getByText("Platform Engineer", { exact: true })).toBeVisible();
  await expect(section.getByText("TP. Hồ Chí Minh", { exact: true })).toBeVisible();
  await expect(section.getByText("Việt Nam", { exact: true })).toHaveCount(0);
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

test("collapses header controls before the compact desktop layout can overlap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto("/vi");

  await expect(page.locator(".marketing-home-nav")).toBeHidden();
  await expect(page.locator(".marketing-home-employer")).toBeHidden();
  await expect(page.locator(".marketing-home-register")).toBeVisible();

  const compactMenu = page.locator(".marketing-home-compact-menu");
  await expect(compactMenu).toBeVisible();
  await page.getByRole("button", { name: "Mở menu" }).click();
  // The compact menu carries its own landmark, "Điều hướng thu gọn"; "Điều hướng chính"
  // belongs to the desktop navigation that this breakpoint hides.
  const compactNavigation = compactMenu.getByRole("navigation", { name: "Điều hướng thu gọn" });
  await expect(compactNavigation.getByRole("link", { name: "Việc làm IT" })).toHaveAttribute(
    "href",
    "/vi/jobs",
  );
  await expect(compactNavigation.getByRole("link", { name: "Nhà tuyển dụng" })).toHaveAttribute(
    "href",
    "/vi/recruiter/login",
  );

  const header = page.locator(".marketing-home-header-main");
  const register = page.locator(".marketing-home-register");
  const [headerBox, registerBox] = await Promise.all([
    header.boundingBox(),
    register.boundingBox(),
  ]);

  expect(headerBox).not.toBeNull();
  expect(registerBox).not.toBeNull();
  expect(registerBox!.x + registerBox!.width).toBeLessThanOrEqual(headerBox!.x + headerBox!.width);
});

test("uses semibold weight across header navigation and actions", async ({ page }) => {
  // Below 1361px the header collapses into the compact menu, and Playwright defaults to
  // 1280 — so the full navigation has to be asked for explicitly.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  // A nav section that has its own landing page is a link now, not a button — clicking it
  // navigates, and only hovering opens the panel.
  const jobsNavigation = page.getByRole("link", { name: /Việc làm IT/ });
  await expect(jobsNavigation).toBeVisible();
  await expect(jobsNavigation).toHaveCSS("font-weight", "600");

  await expect(page.locator(".marketing-home-employer-text b")).toHaveCSS("font-weight", "600");
  await expect(page.locator(".marketing-home-lang-trigger")).toHaveCSS("font-weight", "600");
  await expect(page.locator(".marketing-home-login")).toHaveCSS("font-weight", "600");
  await expect(page.locator(".marketing-home-register")).toHaveCSS("font-weight", "600");

  await page.getByRole("button", { name: "Chọn ngôn ngữ" }).click();
  await expect(page.locator(".marketing-home-lang-option:not(.is-active)")).toHaveCSS(
    "font-weight",
    "600",
  );
  await expect(page.locator(".marketing-home-lang-option.is-active")).toHaveCSS(
    "font-weight",
    "600",
  );
});

test("uses localized candidate tools in the primary utility bar without adding height on mobile", async ({
  page,
}) => {
  await page.goto("/vi");

  const utilityBar = page.locator(".marketing-home-utility-bar");
  await expect(utilityBar).toBeVisible();
  const vietnameseUtilityNavigation = utilityBar.getByRole("navigation", {
    name: "Công cụ dành cho ứng viên",
  });
  await expect(
    vietnameseUtilityNavigation.getByText("Bắt đầu sự nghiệp", { exact: true }),
  ).toBeVisible();
  await expect(
    vietnameseUtilityNavigation.getByRole("link", { name: "Tạo CV chuẩn ATS" }),
  ).toHaveAttribute("href", "/vi/register");
  await expect(
    vietnameseUtilityNavigation.getByRole("link", { name: "Gợi ý việc theo hồ sơ" }),
  ).toHaveAttribute("href", "/vi/register");
  await expect(
    vietnameseUtilityNavigation.getByRole("link", { name: "AI Interview" }),
  ).toHaveAttribute("href", "/vi/ai-interview");

  await page.goto("/en");
  const englishUtilityNavigation = utilityBar.getByRole("navigation", {
    name: "Candidate tools",
  });
  await expect(
    englishUtilityNavigation.getByText("Build your career", { exact: true }),
  ).toBeVisible();
  await expect(
    englishUtilityNavigation.getByRole("link", { name: "Build an ATS-ready CV" }),
  ).toHaveAttribute("href", "/en/register");
  await expect(
    englishUtilityNavigation.getByRole("link", { name: "AI Interview" }),
  ).toHaveAttribute("href", "/en/ai-interview");

  // The header reads a real candidate session now; the old `upnext.demo.auth` flag no longer
  // signs anyone in, so setting it left the guest utility bar on screen.
  await installCandidateSession(page);
  await page.goto("/vi");
  const signedInCandidateUtilityNavigation = utilityBar.getByRole("navigation", {
    name: "Công cụ dành cho ứng viên",
  });
  await expect(
    signedInCandidateUtilityNavigation.getByText("Tối ưu hồ sơ", { exact: true }),
  ).toBeVisible();
  await expect(
    signedInCandidateUtilityNavigation.getByRole("link", { name: "Cập nhật hồ sơ" }),
  ).toHaveAttribute("href", "/vi/candidate/profile");
  await expect(
    signedInCandidateUtilityNavigation.getByRole("link", { name: "CV của tôi" }),
  ).toHaveAttribute("href", "/vi/candidate/cv-builder");
  await expect(
    signedInCandidateUtilityNavigation.getByRole("link", { name: "AI Interview" }),
  ).toHaveAttribute("href", "/vi/ai-interview");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(utilityBar).toBeHidden();
  await expect(page.locator(".marketing-home-header-main")).toHaveCSS("min-height", "64px");
});

test("localizes header navigation and mega menus without mixed-language labels", async ({
  page,
}) => {
  // Below 1361px the header collapses into the compact menu, and Playwright defaults to
  // 1280 — so the full navigation has to be asked for explicitly.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi");

  const vietnameseNavigation = page.getByLabel("Điều hướng chính");
  await expect(
    vietnameseNavigation.getByRole("link", { name: "Việc làm IT", exact: true }),
  ).toBeVisible();
  await vietnameseNavigation.getByRole("link", { name: "Việc làm IT", exact: true }).hover();
  await expect(page.getByRole("tab", { name: "Theo kỹ năng", exact: true })).toBeVisible();
  await expect(page.getByText("Theo kỹ năng (Skills)", { exact: true })).toHaveCount(0);

  await page.goto("/en");

  const englishNavigation = page.getByLabel("Primary navigation");
  await expect(englishNavigation.getByRole("link", { name: "IT Jobs", exact: true })).toBeVisible();
  await expect(
    englishNavigation.getByRole("link", { name: "Companies", exact: true }),
  ).toBeVisible();

  await englishNavigation.getByRole("link", { name: "Companies", exact: true }).hover();
  const companiesPanel = page.locator("#public-nav-companies-panel");
  await expect(companiesPanel.getByText("Most actively hiring", { exact: true })).toBeVisible();
  await expect(companiesPanel.getByText("Big Tech & enterprises", { exact: true })).toBeVisible();
  await expect(companiesPanel.getByText("Top công ty công nghệ", { exact: true })).toHaveCount(0);
  await expect(companiesPanel.getByRole("link", { name: "View all companies" })).toBeVisible();
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

test("keeps header mega menus open while the pointer crosses into the panel", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto("/vi");

  const header = page.locator(".marketing-home-header");
  const trigger = page.getByRole("link", { name: "Việc làm IT", exact: true });
  const panel = page.locator("#public-nav-jobs-panel");

  await trigger.hover();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await page.waitForTimeout(260);

  const [headerBox, triggerBox, panelBox] = await Promise.all([
    header.boundingBox(),
    trigger.boundingBox(),
    panel.boundingBox(),
  ]);
  expect(headerBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();

  expect(panelBox!.y - (headerBox!.y + headerBox!.height)).toBeLessThanOrEqual(4);
  expect(panelBox!.x).toBeCloseTo(triggerBox!.x, 0);

  await page.mouse.move(
    triggerBox!.x + triggerBox!.width / 2,
    triggerBox!.y + triggerBox!.height + 4,
  );
  await page.waitForTimeout(120);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  await page.mouse.move(panelBox!.x + 12, panelBox!.y + 12);
  await page.waitForTimeout(300);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  await page.mouse.move(12, 700);
  await expect(trigger).toHaveAttribute("aria-expanded", "false", { timeout: 1_000 });
});

test("shows an interactive preview only for urgent job titles", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installCandidateSession(page);
  const data = createHomeData({
    personalization: { state: "INSUFFICIENT", signalGroups: [], missingSignals: ["SKILLS"] },
  });
  const urgentJob = data.jobsSection.expiring.items[0]!;
  await mockCandidateHomeApi(page, data);
  await mockPublicJobDetail(page, urgentJob, {
    description:
      "<p>Mô tả chi tiết được tải từ tin tuyển dụng gốc khi ứng viên mở xem nhanh.</p><ul><li>Theo dõi tiến độ nộp hồ sơ.</li></ul>",
  });
  await page.route(/\/saved-jobs(?:\/[^?]+)?(?:\?|$)/, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ id: "saved" }),
        status: 201,
      });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });
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
  await expect(description).toContainText("Mô tả chi tiết được tải từ tin tuyển dụng gốc");
  await expect(description).toContainText("• Theo dõi tiến độ nộp hồ sơ.");
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

  await expect(page.locator("body")).toHaveCSS("font-family", /lexend/i);
  await expect(footer).toHaveCSS("font-family", /lexend/i);
  await expect(heading).toHaveCSS("font-weight", "700");

  for (const control of await textControls.all()) {
    await expect(control).toHaveCSS("font-family", /lexend/i);
  }
});

test("renders migrated auth pages", async ({ page }) => {
  await page.goto("/vi/login");
  await expect(page.getByRole("heading", { name: "Chào mừng trở lại", exact: true })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập với Google" })).toBeVisible();

  await page.goto("/vi/register");
  await expect(page.getByRole("heading", { name: "Tạo tài khoản", exact: true })).toBeVisible();
  await expect(page.getByLabel("Họ và tên", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Xác nhận mật khẩu", { exact: true })).toBeVisible();

  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in with Google" })).toBeVisible();

  await page.goto("/en/register");
  await expect(
    page.getByRole("heading", { name: "Create your account", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password", { exact: true })).toBeVisible();
});
