import { expect, test, type Page, type Route } from "@playwright/test";

type StreamMode = "rate-limited" | "cv-analysis";

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function respondJson(route: Route, data: unknown) {
  await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data }) });
}

/**
 * The Copilot must be testable through the production API transport.  This
 * catches regressions in conversation creation and SSE parsing without turning
 * on the internal state-preview control in a user build.
 */
async function mockCopilotApi(page: Page, mode: StreamMode) {
  await page.route("**/api/v1/ai/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path.endsWith("/ai/conversations") && request.method() === "GET") {
      await respondJson(route, []);
      return;
    }

    if (path.endsWith("/ai/conversations") && request.method() === "POST") {
      await respondJson(route, {
        id: "conversation-e2e",
        title: "",
        contextType: "GENERAL",
        updatedAt: "2026-08-13T00:00:00.000Z",
        messageCount: 0,
      });
      return;
    }

    if (/\/ai\/conversations\/conversation-e2e\/messages$/.test(path)) {
      const body =
        mode === "rate-limited"
          ? [
              sse("status", { step: "queued" }),
              sse("error", {
                code: "AI_MODEL_RATE_LIMIT",
                detail: "Bạn đã hỏi quá nhiều trong thời gian ngắn. Chờ một chút rồi thử lại nhé.",
                status: "rate_limited",
              }),
            ].join("")
          : [
              sse("status", { step: "queued" }),
              sse("intent", { intent: "CV_ANALYSIS" }),
              sse("status", { step: "processing" }),
              sse("tool_start", {
                tool: {
                  id: "cv",
                  name: "get_own_cv",
                  label: "Đọc CV đang chọn",
                  status: "running",
                },
              }),
              sse("tool_result", {
                id: "cv",
                status: "succeeded",
                detail: "Đã đọc CV đang chọn của bạn.",
                durationMs: 120,
              }),
              sse("tool_start", {
                tool: {
                  id: "analysis",
                  name: "analyze_own_cv",
                  label: "Trích xuất dữ liệu có cấu trúc",
                  status: "running",
                },
              }),
              sse("tool_result", {
                id: "analysis",
                status: "succeeded",
                detail: "Đã tổng hợp thông tin từ CV.",
                durationMs: 160,
              }),
              sse("status", { step: "streaming" }),
              sse("content_delta", { text: "CV của bạn có nền tảng tốt. " }),
              sse("done", {
                messageId: "assistant-e2e",
                meta: {
                  model: "test-model",
                  promptVersion: "e2e",
                  latencyMs: 280,
                  inputTokens: 20,
                  outputTokens: 12,
                },
              }),
            ].join("");

      await route.fulfill({
        contentType: "text/event-stream",
        headers: { "Cache-Control": "no-cache" },
        body,
      });
      return;
    }

    await route.continue();
  });
}

test.beforeEach(async ({ page }, testInfo) => {
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

  await mockCopilotApi(
    page,
    testInfo.title.includes("rate-limit") ? "rate-limited" : "cv-analysis",
  );

  await page.goto("/vi/candidate/ai");
  await expect(page.getByRole("heading", { name: "UpNext AI Copilot" })).toBeVisible();
});

test("shows an actionable rate-limit state without leaking an internal error code", async ({
  page,
}) => {
  await page.getByLabel("Nội dung câu hỏi").fill("Kiểm tra hạn mức của tôi");
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();

  const runAlert = page.getByRole("region", { name: "UpNext AI Copilot" }).getByRole("alert");
  await expect(runAlert).toContainText("Bạn đã dùng hết hạn mức");
  await expect(runAlert).toContainText("Bạn đã hỏi quá nhiều trong thời gian ngắn");
  await expect(page.getByRole("button", { name: "Thử lại" })).toHaveCount(0);
  await expect(page.getByText("AI_RATE_LIMITED", { exact: true })).toHaveCount(0);
});

test("presents grounded CV progress with friendly, accessible source labels", async ({ page }) => {
  await page.getByLabel("Nội dung câu hỏi").fill("Phân tích CV của tôi");
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();

  const progressToggle = page.getByRole("button", { name: /Đã kiểm tra 2\/2 nguồn dữ liệu/ });
  await expect(progressToggle).toBeVisible({ timeout: 20_000 });
  // Progress stays collapsed by default so it does not dominate a completed
  // answer. Keyboard and pointer users can inspect its grounded sources.
  await expect(progressToggle).toHaveAttribute("aria-expanded", "false");

  await progressToggle.click();
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
