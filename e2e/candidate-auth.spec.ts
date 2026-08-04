import { expect, test } from "@playwright/test";

const candidateSession = {
  accessToken: "candidate-access-token",
  tokenType: "Bearer",
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "minh.anh@example.com",
    role: "CANDIDATE",
  },
};

test("logs a candidate in through the API and stores the returned session", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  let loginPayload: unknown;

  await page.route("**/candidate/auth/login", async (route) => {
    loginPayload = route.request().postDataJSON();
    await route.fulfill({
      body: JSON.stringify(candidateSession),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/vi/login");
  await page.waitForTimeout(250);

  await expect(page.getByRole("heading", { name: "Chào mừng trở lại" })).toBeVisible();
  await expect(page.locator(".login-showcase")).toBeVisible();
  await expect(page.locator(".login-showcase-brand")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập với Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập với GitHub" })).toBeDisabled();

  await page.getByLabel("Email").fill("minh.anh@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page).toHaveURL(/\/vi\/candidate\/profile$/);
  expect(loginPayload).toEqual({ email: "minh.anh@example.com", password: "correct-password" });
  await expect
    .poll(() =>
      page.evaluate(() => ({
        accessToken: window.localStorage.getItem("upnext.candidate.accessToken"),
        role: window.localStorage.getItem("upnext.demo.auth"),
      })),
    )
    .toEqual({ accessToken: candidateSession.accessToken, role: "candidate" });
});

test("starts the supported Google OAuth flow from the candidate login", async ({ page }) => {
  await page.route(/\/candidate\/auth\/google\?locale=vi$/, async (route) => {
    await route.fulfill({ body: "Google OAuth started", contentType: "text/plain", status: 200 });
  });

  await page.goto("/vi/login");
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Đăng nhập với Google" }).click();

  await expect(page).toHaveURL(/\/candidate\/auth\/google\?locale=vi$/);
});

test("stores the candidate session after the Google OAuth callback", async ({ page }) => {
  const callbackToken = [
    "header",
    Buffer.from(
      JSON.stringify({
        sub: "11111111-1111-4111-8111-111111111111",
        email: "minh.anh@example.com",
        role: "CANDIDATE",
      }),
    )
      .toString("base64")
      .replace(/=/g, ""),
    "signature",
  ].join(".");

  await page.goto(`/vi/candidate/auth/callback?token=${callbackToken}`);

  await expect(page).toHaveURL(/\/vi\/candidate\/profile$/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("upnext.candidate.accessToken")))
    .toBe(callbackToken);
});

test("validates registration before sending the API request and submits the required payload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let registerCalls = 0;
  let registerPayload: unknown;

  await page.route("**/candidate/auth/register", async (route) => {
    registerCalls += 1;
    registerPayload = route.request().postDataJSON();
    await route.fulfill({
      body: JSON.stringify(candidateSession),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/vi/register");
  await page.waitForTimeout(250);

  await expect(page.getByRole("heading", { name: "Tạo tài khoản" })).toBeVisible();
  await expect(page.locator(".login-showcase")).toBeHidden();
  await page.getByLabel("Họ và tên").fill("Minh Anh");
  await page.getByLabel("Email").fill("minh.anh@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("candidate-password");
  await page.getByLabel("Xác nhận mật khẩu").fill("another-password");
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();

  await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible();
  expect(registerCalls).toBe(0);

  await page.getByLabel("Xác nhận mật khẩu").fill("candidate-password");
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();

  await expect(page).toHaveURL(/\/vi\/candidate\/profile$/);
  expect(registerCalls).toBe(1);
  expect(registerPayload).toEqual({
    email: "minh.anh@example.com",
    fullName: "Minh Anh",
    password: "candidate-password",
  });

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("keeps the desktop registration form within the viewport and validates fields after blur", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 768 });
  await page.goto("/vi/register");

  await expect(page.getByRole("heading", { name: "Tạo tài khoản" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight))
    .toBe(true);

  const fullName = page.getByLabel("Họ và tên");
  await fullName.fill("  ");
  await fullName.press("Tab");
  await expect(fullName).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Vui lòng nhập họ và tên")).toBeVisible();

  const email = page.getByLabel("Email");
  await email.fill("not-an-email");
  await email.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Email không hợp lệ")).toBeVisible();

  const password = page.getByLabel("Mật khẩu", { exact: true });
  await password.fill("short");
  await password.press("Tab");
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Mật khẩu tối thiểu 8 ký tự")).toBeVisible();

  const submit = page.getByRole("button", { name: "Tạo tài khoản", exact: true });
  await submit.hover();
  await expect(submit).toHaveCSS("background-color", "rgb(9, 143, 99)");
});
