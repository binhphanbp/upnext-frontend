import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("upnext.candidate.accessToken", "e2e-access-token");
    localStorage.setItem("upnext.candidate.tokenType", "Bearer");
    localStorage.setItem(
      "upnext.candidate.user",
      JSON.stringify({
        id: "candidate-ai-e2e",
        email: "candidate@example.com",
        role: "CANDIDATE",
      }),
    );
  });

  await page.goto("/vi/candidate/ai");
  await expect(page.getByRole("heading", { name: "UpNext AI Copilot" })).toBeVisible();
});

test("shows an actionable rate-limit state without leaking an internal error code", async ({
  page,
}) => {
  await page.getByLabel("Chạy thử một kịch bản").selectOption("rate_limited");

  await expect(page.getByRole("alert")).toContainText("Bạn đã dùng hết hạn mức");
  await expect(page.getByRole("alert")).toContainText("Hạn mức sẽ được khôi phục");
  await expect(page.getByRole("button", { name: "Thử lại" })).toHaveCount(0);
  await expect(page.getByText("AI_RATE_LIMITED", { exact: true })).toHaveCount(0);
});

test("presents grounded CV progress with friendly, accessible source labels", async ({ page }) => {
  await page.getByLabel("Chạy thử một kịch bản").selectOption("cv_analysis");

  const progressToggle = page.getByRole("button", { name: /Đã kiểm tra 2\/2 nguồn dữ liệu/ });
  await expect(progressToggle).toBeVisible({ timeout: 20_000 });
  await expect(progressToggle).toHaveAttribute("aria-expanded", "true");

  const controlsId = await progressToggle.getAttribute("aria-controls");
  expect(controlsId).toBeTruthy();
  await expect(page.locator(`#${controlsId}`)).toContainText("Đọc CV đang chọn");
  await expect(page.locator(`#${controlsId}`)).toContainText("Trích xuất dữ liệu có cấu trúc");
  await expect(page.getByText("get_own_cv", { exact: true })).toHaveCount(0);
  await expect(page.getByText("analyze_own_cv", { exact: true })).toHaveCount(0);

  await progressToggle.click();
  await expect(progressToggle).toHaveAttribute("aria-expanded", "false");

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
});
