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
