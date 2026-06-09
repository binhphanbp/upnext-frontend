import { expect, test } from "@playwright/test";

test("renders the UpNext frontend landing smoke screen", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/vi/);
  await expect(page.getByRole("heading", { name: /nền tảng frontend/i })).toBeVisible();
  await expect(page.getByText("UpNext Frontend")).toBeVisible();
});
