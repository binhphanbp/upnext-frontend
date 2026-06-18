import { expect, test } from "@playwright/test";

const route = "/vi/recruiter";

for (const viewport of [
  { name: "desktop", size: { width: 1440, height: 1000 } },
  { name: "mobile", size: { width: 390, height: 844 } },
]) {
  test(`renders recruiter dashboard period metrics on ${viewport.name}`, async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });

    await page.setViewportSize(viewport.size);
    await page.goto(route);

    await expect(
      page.getByRole("heading", { name: "Chào buổi sáng, UpNext Studio" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "1 tuần" })).toHaveClass(/bg-emerald-50/);
    await expect(page.getByText("Hiệu suất tuyển dụng 7 ngày")).toBeVisible();
    await expect(page.getByText("Lịch chờ xác nhận")).toHaveCount(0);
    await expect(page.getByText("Đã xác nhận")).toHaveCount(0);
    await expect(page.getByText("Chờ xác nhận")).toHaveCount(0);
    await expect(page.getByText("Đổi lịch")).toHaveCount(0);

    await page.getByRole("button", { name: "1 ngày" }).click();
    await expect(page.getByText("Hiệu suất tuyển dụng hôm nay")).toBeVisible();
    await expect(page.getByText("Phỏng vấn hôm nay", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "1 năm" }).click();
    await expect(page.getByText("Hiệu suất tuyển dụng 12 tháng")).toBeVisible();

    expect(consoleMessages).toEqual([]);
  });
}
