import { expect, test } from "@playwright/test";

test("removes a recruiter OAuth error without duplicating the locale", async ({ page }) => {
  await page.goto("/vi/recruiter/login?error=Google%20OAuth%20failed");

  await expect(page).toHaveURL("/vi/recruiter/login");
  await expect(page.getByText("Google OAuth failed")).toBeVisible();
});

test("returns to login when email verification completes in another browser", async ({ page }) => {
  await page.route("**/recruiter-accounts/email-verification/status", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ email: "recruiter@example.com", emailVerified: true }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/vi/recruiter/register/success?email=recruiter%40example.com");

  await expect(page).toHaveURL("/vi/recruiter/login");
  await expect(page.getByText("Email đã được xác thực. Bạn có thể đăng nhập ngay.")).toBeVisible();
});
