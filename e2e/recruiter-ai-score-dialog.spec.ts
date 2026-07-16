import { expect, test, type Page } from "@playwright/test";

const recruiterId = "11111111-1111-4111-8111-111111111111";
const applicationId = "22222222-2222-4222-8222-222222222222";

const scoreDetail = {
  applicationId,
  candidateName: "Nguyễn Minh Anh",
  jobTitle: "Full-stack Developer",
  finalScore: 41.89,
  semanticScore: 46,
  skillMatchScore: 42,
  retrievalScore: 44,
  aiScore: 41.89,
  skillScore: 10,
  experienceScore: 5,
  projectScore: 8,
  educationScore: 8,
  matchedSkills: ["Agile", "Scrum", "Java", "JavaScript", "Vue.js", "React", "PHP"],
  missingSkills: [
    "Kinh nghiệm Project Manager hoặc Tech Lead",
    "Quản lý tiến độ và phạm vi dự án",
    "Jira, Confluence, Trello",
    "Kỹ năng thương lượng",
  ],
  strengths: [
    "Nền tảng kỹ thuật vững chắc với hơn 4 năm kinh nghiệm phát triển sản phẩm web.",
    "Thành thạo nhiều công nghệ và framework hiện đại.",
    "Có kinh nghiệm làm việc trong môi trường Agile/Scrum.",
  ],
  weaknesses: [
    "Thiếu kinh nghiệm trực tiếp ở vai trò quản lý dự án.",
    "Chưa thể hiện rõ kinh nghiệm sử dụng công cụ quản lý dự án.",
    "Cần làm rõ thêm kỹ năng giao tiếp và thương lượng.",
  ],
  summary:
    "Ứng viên có nền tảng Full-stack tốt và kinh nghiệm phát triển sản phẩm, nhưng chưa có đủ bằng chứng về năng lực quản lý dự án cho vị trí này.",
  recommendation: "Chưa phù hợp với vị trí hiện tại. Có thể cân nhắc cho vai trò kỹ thuật.",
  cvFileUrl: null,
};

test.beforeEach(async ({ page }) => {
  await mockRecruiterWorkspace(page);
});

test("keeps the evaluation dialog clean and usable on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openScoreDialog(page);

  const dialog = page.getByRole("dialog", { name: "Đánh giá ứng viên" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("41.89% phù hợp")).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Chi tiết điểm" })).toBeVisible();
  await expect(dialog.getByRole("progressbar")).toHaveCount(4);
  await expect(dialog.getByText("Kinh nghiệm Project Manager hoặc Tech Lead")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mời phỏng vấn" })).toBeVisible();

  await expectContentToScroll(page, dialog);

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.width).toBeLessThanOrEqual(768);
  expect(dialogBox!.height).toBeLessThanOrEqual(868);

  await page.screenshot({ path: "test-results/recruiter-ai-score-dialog-desktop.png" });
});

test("keeps actions visible and avoids horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScoreDialog(page);

  const dialog = page.getByRole("dialog", { name: "Đánh giá ứng viên" });
  const inviteButton = dialog.getByRole("button", { name: "Mời phỏng vấn" });
  await expect(dialog).toBeVisible();
  await expect(inviteButton).toBeVisible();

  const metrics = await dialog.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      bottom: bounds.bottom,
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });

  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.top).toBeGreaterThanOrEqual(0);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight);

  await expectContentToScroll(page, dialog);

  const recommendation = dialog.getByText(
    "Chưa phù hợp với vị trí hiện tại. Có thể cân nhắc cho vai trò kỹ thuật.",
  );
  await recommendation.scrollIntoViewIfNeeded();
  await expect(recommendation).toBeVisible();
  await expect(inviteButton).toBeVisible();

  await page.screenshot({ path: "test-results/recruiter-ai-score-dialog-mobile.png" });
});

async function expectContentToScroll(page: Page, dialog: ReturnType<Page["getByRole"]>) {
  const viewport = dialog.locator('[data-radix-scroll-area-viewport=""]');
  await expect(viewport).toBeVisible();

  const initialScroll = await viewport.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }));
  expect(initialScroll.scrollHeight).toBeGreaterThan(initialScroll.clientHeight);

  await viewport.hover();
  await page.mouse.wheel(0, 600);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(initialScroll.scrollTop);
}

async function openScoreDialog(page: Page) {
  await page.goto("/vi/recruiter/candidates");
  await expect(page.getByRole("heading", { name: "Ứng viên" })).toBeVisible();
  await page.getByRole("tab", { name: "AI lọc CV" }).click();
  await page.getByTitle("Xem đánh giá chi tiết").click();
  await expect(page.getByRole("dialog", { name: "Đánh giá ứng viên" })).toBeVisible();
}

async function mockRecruiterWorkspace(page: Page) {
  await page.addInitScript(
    ({ detail, id }) => {
      localStorage.setItem("upnext.recruiter.accessToken", "test-access-token");
      localStorage.setItem("upnext.recruiter.tokenType", "Bearer");
      localStorage.setItem(
        "upnext.recruiter.user",
        JSON.stringify({ id, email: "recruiter@example.com", role: "RECRUITER" }),
      );
      sessionStorage.setItem("upnext_activeTab", "cv-ranking");
      sessionStorage.setItem("upnext_rankingTempJobId", "job-1");
      sessionStorage.setItem("upnext_rankingHasFiltered", "true");
      sessionStorage.setItem("upnext_rankingResults", JSON.stringify([detail]));
    },
    { detail: scoreDetail, id: recruiterId },
  );

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith(`/recruiter/applications/${applicationId}/ai-score`)) {
      await route.fulfill({ json: scoreDetail });
      return;
    }

    if (path.endsWith(`/recruiter-accounts/${recruiterId}`)) {
      await route.fulfill({
        json: {
          id: recruiterId,
          email: "recruiter@example.com",
          status: "ACTIVE",
          company: null,
          profile: {
            id: "profile-1",
            fullName: "UpNext Recruiter",
            phoneNumber: null,
            gender: null,
            avatarUrl: null,
          },
        },
      });
      return;
    }

    if (path.endsWith("/recruiter/company-applications")) {
      await route.fulfill({ json: [] });
      return;
    }

    if (path.endsWith("/recruiter/job-posts")) {
      await route.fulfill({
        json: [
          {
            id: "job-1",
            title: "Full-stack Developer",
            vacanciesCount: 2,
          },
        ],
      });
      return;
    }

    await route.fulfill({ json: [] });
  });
}
