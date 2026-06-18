import { expect, test } from "@playwright/test";

const route = "/vi/recruiter/interviews";

for (const viewport of [
  { name: "desktop", size: { width: 1440, height: 1000 } },
  { name: "mobile", size: { width: 390, height: 844 } },
]) {
  test(`renders recruiter interviews dashboard without horizontal overflow on ${viewport.name}`, async ({
    page,
  }) => {
    const consoleMessages: string[] = [];

    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });

    await page.setViewportSize(viewport.size);
    await page.goto(route);

    await expect(page.getByRole("heading", { name: "Lịch phỏng vấn" })).toBeVisible();
    if (viewport.name === "desktop") {
      await expect(page.getByRole("link", { name: "Lịch phỏng vấn" })).toHaveClass(/bg-emerald-50/);
    }
    await expect(page.getByText("Chờ xác nhận")).toHaveCount(0);
    await expect(page.getByText("Đề xuất đổi lịch")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tạo lịch phỏng vấn" }).first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;

      return {
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
      };
    });

    expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.bodyClientWidth + 1);
    expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.docClientWidth + 1);

    await page.getByRole("button", { name: "Tạo lịch phỏng vấn" }).first().click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(
      page.getByText("Hệ thống không yêu cầu ứng viên xác nhận hoặc đổi lịch."),
    ).toBeVisible();

    expect(consoleMessages).toEqual([]);
  });
}
