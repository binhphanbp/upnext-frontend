import { expect, test, type Page } from "@playwright/test";

const recruiterId = "11111111-1111-4111-8111-111111111111";
const applicationId = "22222222-2222-4222-8222-222222222222";

const scoreDetail = {
  applicationId,
  candidateName: "Nguyễn Minh Anh",
  jobTitle: "Full-stack Developer",
  finalScore: 31,
  semanticScore: 46,
  skillMatchScore: 42,
  retrievalScore: 44,
  aiScore: 31,
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
  criteriaBreakdown: [
    {
      key: "skills",
      summary: "Ứng viên mới đáp ứng một phần kỹ năng bắt buộc.",
      items: [
        {
          key: "required-skills",
          awardedScore: 10,
          reason: "Có JavaScript nhưng thiếu TypeScript và Next.js theo yêu cầu.",
          evidence: "CV ghi nhận kinh nghiệm JavaScript và React.",
        },
      ],
    },
    {
      key: "experience",
      summary: "Kinh nghiệm liên quan còn thấp hơn yêu cầu.",
      items: [
        {
          key: "relevant-years",
          awardedScore: 5,
          reason: "Chỉ có một năm kinh nghiệm liên quan so với ba năm yêu cầu.",
          evidence: "CV ghi nhận một năm làm Frontend Developer.",
        },
      ],
    },
    {
      key: "projects",
      summary: "Có dự án liên quan nhưng thiếu số liệu tác động.",
      items: [
        {
          key: "project-relevance",
          awardedScore: 8,
          reason: "Dự án dùng React nhưng chưa chứng minh quy mô triển khai.",
          evidence: "CV mô tả một ứng dụng quản lý công việc bằng React.",
        },
      ],
    },
    {
      key: "education",
      summary: "Chuyên ngành phù hợp, chưa có chứng chỉ bổ sung.",
      items: [
        {
          key: "degree-major",
          awardedScore: 8,
          reason: "Bằng cấp liên quan nhưng thiếu chứng chỉ chuyên môn.",
          evidence: "CV ghi nhận bằng Công nghệ thông tin.",
        },
      ],
    },
  ],
  evaluationRubric: [
    {
      key: "skills",
      label: "Kỹ năng",
      maxScore: 40,
      criteria: [
        {
          key: "required-skills",
          label: "Kỹ năng bắt buộc",
          maxScore: 40,
          description: "Đối chiếu kỹ năng cốt lõi trong tin tuyển dụng.",
        },
      ],
    },
    {
      key: "experience",
      label: "Kinh nghiệm",
      maxScore: 30,
      criteria: [
        {
          key: "relevant-years",
          label: "Số năm kinh nghiệm liên quan",
          maxScore: 30,
          description: "Đối chiếu thời lượng kinh nghiệm liên quan.",
        },
      ],
    },
    {
      key: "projects",
      label: "Dự án liên quan",
      maxScore: 20,
      criteria: [
        {
          key: "project-relevance",
          label: "Mức liên quan của dự án",
          maxScore: 20,
          description: "Đối chiếu dự án với bài toán của vị trí.",
        },
      ],
    },
    {
      key: "education",
      label: "Học vấn",
      maxScore: 10,
      criteria: [
        {
          key: "degree-major",
          label: "Bằng cấp và chuyên ngành",
          maxScore: 10,
          description: "Đối chiếu bằng cấp và chuyên ngành.",
        },
      ],
    },
  ],
  cvFileUrl: null,
};

test.beforeEach(async ({ page }) => {
  await mockRecruiterWorkspace(page);
});

test("shows only the final CV ranking columns", async ({ page }) => {
  await page.goto("/vi/recruiter/candidates");
  await page.getByRole("tab", { name: "AI lọc CV" }).click();

  await expect(page.getByRole("columnheader", { name: "Hạng", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Độ phù hợp" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Hạng sơ tuyển" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Khớp kỹ năng" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Điểm lọc hybrid" })).toHaveCount(0);
});

test("opens a complete evaluation page on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openScorePage(page);

  await expect(page).toHaveURL(`/vi/recruiter/candidates/${applicationId}/evaluation`);
  await expect(page.getByRole("heading", { name: scoreDetail.candidateName })).toBeVisible();
  await expect(page.getByText("31% phù hợp")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chi tiết điểm" })).toBeVisible();
  await expect(page.getByText("Vì sao kỹ năng được 10/40 điểm?")).toBeVisible();
  await expect(page.getByText("-30 điểm")).toBeVisible();
  await expect(
    page.getByText("Có JavaScript nhưng thiếu TypeScript và Next.js theo yêu cầu."),
  ).toBeVisible();
  await expect(page.getByText("CV ghi nhận kinh nghiệm JavaScript và React.")).toBeVisible();

  await page.getByRole("button", { name: /Kinh nghiệm/ }).click();
  await expect(page.getByText("Vì sao kinh nghiệm được 5/30 điểm?")).toBeVisible();
  await expect(page.getByText("-25 điểm")).toBeVisible();

  const rubricButton = page.locator('summary[aria-label="Xem toàn bộ tiêu chí đánh giá"]');
  await rubricButton.click();
  const rubric = page.getByRole("dialog", { name: "Toàn bộ tiêu chí đánh giá" });
  await expect(rubric).toBeVisible();
  await expect(rubric.getByText("Kỹ năng bắt buộc")).toBeVisible();
  await expect(rubric.getByText("Số năm kinh nghiệm liên quan")).toBeVisible();
  await expect(page.getByText("Kinh nghiệm Project Manager hoặc Tech Lead")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mời phỏng vấn" })).toBeVisible();

  await page.screenshot({
    path: "test-results/recruiter-ai-score-page-desktop.png",
    fullPage: true,
  });

  await rubricButton.click();
  await page.getByRole("button", { name: "Quay lại kết quả AI lọc CV" }).click();
  await expect(page).toHaveURL(/\/vi\/recruiter\/candidates\?tab=cv-ranking$/);
  await expect(page.getByRole("tab", { name: "AI lọc CV" })).toHaveAttribute(
    "data-state",
    "active",
  );
});

test("keeps the evaluation page readable without horizontal overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScorePage(page);

  await expect(page.getByRole("heading", { name: scoreDetail.candidateName })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  const recommendation = page.getByText(
    "Chưa phù hợp với vị trí hiện tại. Có thể cân nhắc cho vai trò kỹ thuật.",
  );
  await recommendation.scrollIntoViewIfNeeded();
  await expect(recommendation).toBeVisible();
  const inviteButton = page.getByRole("button", { name: "Mời phỏng vấn" });
  await inviteButton.scrollIntoViewIfNeeded();
  await expect(inviteButton).toBeVisible();

  await page.screenshot({
    path: "test-results/recruiter-ai-score-page-mobile.png",
    fullPage: true,
  });
});

async function openScorePage(page: Page) {
  await page.goto("/vi/recruiter/candidates");
  await expect(page.getByRole("heading", { name: "Ứng viên" })).toBeVisible();
  await page.getByRole("tab", { name: "AI lọc CV" }).click();
  await page.getByTitle("Xem đánh giá chi tiết").click();
  await expect(page).toHaveURL(`/vi/recruiter/candidates/${applicationId}/evaluation`);
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
