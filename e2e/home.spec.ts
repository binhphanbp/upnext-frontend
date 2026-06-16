import { expect, test } from "@playwright/test";

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

  await expect(page).toHaveURL(/\/vi\/jobs-v2\?keyword=React/);
});
