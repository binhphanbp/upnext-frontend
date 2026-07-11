import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("renders the localized UpNext homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/vi/);
  await expect(page.getByRole("heading", { name: /tìm đúng việc it/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tìm việc", exact: true })).toBeVisible();
  await expect(page.getByText("FPT Software").first()).toBeVisible();
});

test("submits homepage job search with query params", async ({ page }) => {
  await page.goto("/vi");

  await page.getByLabel("Từ khóa tìm việc").fill("React");
  await page.getByRole("button", { name: "Tìm việc", exact: true }).click();

  await expect(page).toHaveURL(/\/vi\/jobs\?keyword=React/);
});

test("popular keyword chips route to jobs search", async ({ page }) => {
  await page.goto("/vi");
  await expect(page.locator(".marketing-home-popular-viewport")).toBeVisible();
  await page
    .locator(".marketing-home-popular-row")
    .first()
    .getByRole("button", { name: "Frontend" })
    .click();
  await expect(page).toHaveURL(/\/vi\/jobs\?keyword=Frontend/);

  await page.goto("/en");
  await expect(page.locator(".marketing-home-popular-viewport")).toBeVisible();
  await page
    .locator(".marketing-home-popular-row")
    .first()
    .getByRole("button", { name: "Frontend" })
    .click();
  await expect(page).toHaveURL(/\/en\/jobs\?keyword=Frontend/);
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

test("keeps every public header mega menu readable and inside the viewport", async ({ page }) => {
  const menuCases = [
    {
      key: "jobs",
      label: "Việc làm IT",
      destinations: [
        "/vi/jobs?position=Frontend Developer",
        "/vi/jobs?position=Backend Developer",
        "/vi/jobs?position=Mobile Developer",
        "/vi/jobs?position=AI/ML Engineer",
        "/vi/jobs?position=DevOps Engineer",
        "/vi/jobs",
      ],
    },
    {
      key: "companies",
      label: "Công ty IT",
      destinations: ["/vi/companies", "/vi/companies", "/vi/companies"],
    },
    {
      key: "blog",
      label: "Bài viết",
      destinations: ["/vi/jobs", "/vi/jobs", "/vi/jobs"],
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
      await expect(links).toHaveCount(menuCase.destinations.length);
      const destinations = await links.evaluateAll((elements) =>
        elements.map((element) => {
          const url = new URL((element as HTMLAnchorElement).href);
          return decodeURIComponent(`${url.pathname}${url.search}`);
        }),
      );
      expect(destinations).toEqual(menuCase.destinations);

      const layout = await panel.evaluate((element) => {
        const panelRect = element.getBoundingClientRect();
        const items = Array.from(
          element.querySelectorAll<HTMLElement>(".marketing-home-mega-item"),
        );

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

test("renders migrated public jobs and companies pages", async ({ page }) => {
  await page.goto("/vi/jobs");

  await expect(page.getByRole("heading", { name: /khám phá/i })).toBeVisible();
  await page.locator(".jobs-detail").first().click();
  await page.waitForURL(/\/vi\/jobs\//, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: /fresher java|frontend|devops|mobile|ai/i }),
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

test("opens company culture gallery with overflow images", async ({ page }) => {
  await page.goto("/vi/companies/fpt-software");

  await expect(page.getByText("+15 ảnh")).toBeVisible();
  await page.getByRole("button", { name: "Xem ảnh môi trường làm việc 3" }).click();

  const galleryDialog = page.getByRole("dialog", { name: "Ảnh môi trường làm việc" });
  await expect(galleryDialog).toBeVisible();
  await expect(galleryDialog.getByText("3/18")).toBeVisible();

  await galleryDialog.getByRole("button", { name: "Xem ảnh tiếp theo" }).click();
  await expect(galleryDialog.getByText("4/18")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(galleryDialog).toBeHidden();
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
