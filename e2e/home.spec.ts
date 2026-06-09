import { expect, test } from "@playwright/test";

test("renders the UpNext frontend landing smoke screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /foundation is ready/i })).toBeVisible();
  await expect(page.getByText("UpNext Frontend")).toBeVisible();
});
