import { expect, test, type Page } from "@playwright/test";

const recruiterId = "11111111-1111-4111-8111-111111111111";
const applicationId = "22222222-2222-4222-8222-222222222222";

const scoreDetail = {
  applicationId,
  candidateName: "Nguyễn Minh Anh",
  jobTitle: "Full-stack Developer",
  finalScore: 30,
  semanticScore: 46,
  skillMatchScore: 42,
  retrievalScore: 44,
  aiScore: 30,
  skillScore: 10,
  experienceScore: 5,
  projectScore: 8,
  educationScore: 7,
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
      summary: "Có dự án liên quan và mô tả tương đối rõ vai trò, quy mô và kết quả.",
      items: [
        {
          key: "project-relevance",
          awardedScore: 2,
          reason: "Dự án có một phần công nghệ liên quan đến vị trí.",
          evidence: "CV mô tả một ứng dụng quản lý công việc bằng React.",
        },
        {
          key: "technical-depth",
          awardedScore: 1,
          reason: "CV chưa mô tả rõ các quyết định kỹ thuật phức tạp.",
          evidence: "CV chỉ liệt kê React trong phần công nghệ.",
        },
        {
          key: "impact-evidence",
          awardedScore: 5,
          reason:
            "Ứng viên mô tả rõ vai trò triển khai và phạm vi áp dụng, nhưng chưa có số liệu về hiệu quả.",
          evidence: "Phụ trách triển khai hệ thống ERP cho 4 phòng ban.",
        },
      ],
    },
    {
      key: "education",
      summary: "Ứng viên thấp hơn yêu cầu học vấn 1 bậc.",
      items: [
        {
          key: "education-level-match",
          awardedScore: 7,
          reason:
            "Tin tuyển dụng yêu cầu Đại học. Ứng viên có trình độ Cao đẳng, thấp hơn yêu cầu 1 bậc.",
          evidence: "CV ghi nhận: Cao đẳng Công nghệ thông tin.",
          candidateEducationLevel: "COLLEGE",
          requiredEducationLevel: "BACHELOR",
          difference: 1,
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
          maxScore: 8,
          description: "Đối chiếu dự án với bài toán của vị trí.",
        },
        {
          key: "technical-depth",
          label: "Độ sâu kỹ thuật",
          maxScore: 5,
          description: "Đánh giá độ phức tạp và chiều sâu triển khai.",
        },
        {
          key: "impact-evidence",
          label: "Tác động và bằng chứng dự án",
          maxScore: 7,
          description:
            "Đánh giá quy mô, kết quả triển khai, vai trò và đóng góp cá nhân của ứng viên dựa trên các thông tin cụ thể, có số liệu hoặc bằng chứng rõ ràng.",
        },
      ],
    },
    {
      key: "education",
      label: "Học vấn",
      maxScore: 10,
      criteria: [
        {
          key: "education-level-match",
          label: "Mức độ đáp ứng yêu cầu học vấn",
          maxScore: 10,
          description:
            "Đối chiếu trình độ học vấn cao nhất của ứng viên với yêu cầu học vấn trong tin tuyển dụng.",
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
  await expect(page.getByText("30% phù hợp")).toBeVisible();
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

  await page.getByRole("button", { name: /Dự án liên quan/ }).click();
  await expect(page.getByText("Vì sao dự án liên quan được 8/20 điểm?")).toBeVisible();
  await expect(page.getByText("Tác động và bằng chứng dự án")).toBeVisible();
  await expect(page.getByText("Đạt 5/7 điểm")).toBeVisible();
  await expect(
    page.getByText(/Ứng viên mô tả rõ vai trò triển khai và phạm vi áp dụng/),
  ).toBeVisible();
  await expect(page.getByText("Phụ trách triển khai hệ thống ERP cho 4 phòng ban.")).toBeVisible();
  await expect(page.getByText("Tác động và quy mô")).toHaveCount(0);
  await expect(page.getByText("Chất lượng bằng chứng")).toHaveCount(0);

  await page.getByRole("button", { name: /Học vấn/ }).click();
  await expect(page.getByText("Vì sao học vấn được 7/10 điểm?")).toBeVisible();
  await expect(page.getByText("Yêu cầu tin tuyển dụng")).toBeVisible();
  await expect(page.getByText("Đại học", { exact: true })).toBeVisible();
  await expect(page.getByText("Trình độ ứng viên")).toBeVisible();
  await expect(page.getByText("Cao đẳng", { exact: true })).toBeVisible();
  await expect(page.getByText(/thấp hơn yêu cầu 1 bậc/)).toBeVisible();
  await expect(page.getByText("Bằng cấp và chuyên ngành")).toHaveCount(0);
  await expect(page.getByText("Chứng chỉ và đào tạo")).toHaveCount(0);
  await expect(page.getByText("Bằng chứng học thuật liên quan")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mời phỏng vấn" })).toBeVisible();
  expect(scoreDetail.finalScore).toBe(
    scoreDetail.skillScore +
      scoreDetail.experienceScore +
      scoreDetail.projectScore +
      scoreDetail.educationScore,
  );

  const rubricButton = page.getByRole("button", { name: "Xem toàn bộ tiêu chí đánh giá" });
  await rubricButton.click();
  const rubric = page.getByRole("dialog", { name: "Toàn bộ tiêu chí đánh giá" });
  await expect(rubric).toBeVisible();
  await expect(rubric.getByText("Kỹ năng bắt buộc")).toBeVisible();
  await expect(rubric.getByText("Số năm kinh nghiệm liên quan")).toBeVisible();
  await expect(rubric.getByText("Tác động và bằng chứng dự án")).toBeVisible();
  await expect(rubric.getByText("Mức độ đáp ứng yêu cầu học vấn")).toBeVisible();
  await expect(page.getByText("Kinh nghiệm Project Manager hoặc Tech Lead")).toBeVisible();

  await page.screenshot({
    path: "test-results/recruiter-ai-score-page-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Đóng tiêu chí đánh giá" }).click();
  await page.getByRole("button", { name: "Quay lại kết quả AI lọc CV" }).click();
  await expect(page).toHaveURL(/\/vi\/recruiter\/candidates\?tab=cv-ranking$/);
  await expect(page.getByRole("tab", { name: "AI lọc CV" })).toHaveAttribute(
    "data-state",
    "active",
  );
});

test("does not crash or display removed criteria from an old cached result", async ({ page }) => {
  const oldScoreDetail = {
    ...scoreDetail,
    criteriaBreakdown: scoreDetail.criteriaBreakdown.map((criterion) => {
      if (criterion.key === "projects") {
        return {
          key: "projects",
          summary: "Kết quả dự án phiên bản cũ.",
          items: [
            ...criterion.items.filter(
              (item) => item.key === "project-relevance" || item.key === "technical-depth",
            ),
            {
              key: "impact-scale",
              awardedScore: 4,
              reason: "Lý do tác động cũ.",
              evidence: "Bằng chứng tác động cũ.",
            },
            {
              key: "evidence-quality",
              awardedScore: 3,
              reason: "Lý do bằng chứng cũ.",
              evidence: "Bằng chứng chất lượng cũ.",
            },
          ],
        };
      }
      if (criterion.key === "education") {
        return {
          key: "education",
          summary: "Kết quả học vấn phiên bản cũ.",
          items: [
            {
              key: "degree-major",
              awardedScore: 5,
              reason: "Lý do cũ.",
              evidence: "Bằng chứng cũ.",
            },
          ],
        };
      }
      return criterion;
    }),
  };

  await page.route(`**/api/v1/recruiter/applications/${applicationId}/ai-score`, async (route) => {
    await route.fulfill({ json: oldScoreDetail });
  });
  await openScorePage(page);
  await page.getByRole("button", { name: /Học vấn/ }).click();

  await expect(page.getByText(/phiên bản chấm điểm cũ/)).toBeVisible();
  await expect(page.getByText("Bằng cấp và chuyên ngành")).toHaveCount(0);
  await expect(page.getByText("degree-major")).toHaveCount(0);

  await page.getByRole("button", { name: /Dự án liên quan/ }).click();
  await expect(page.getByText("Tác động và quy mô")).toHaveCount(0);
  await expect(page.getByText("Chất lượng bằng chứng")).toHaveCount(0);
  await expect(page.getByText("impact-scale")).toHaveCount(0);
  await expect(page.getByText("evidence-quality")).toHaveCount(0);
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
  // Waits on the control this function is about to use, rather than on a page heading the
  // narrow viewports in this file do not render at all.
  const rankingTab = page.getByRole("tab", { name: "AI lọc CV" });
  await expect(rankingTab).toBeVisible();
  await rankingTab.click();
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

    // The workspace shell loads these on every recruiter page. The catch-all below answers
    // `[]`, which is a valid body of the wrong shape, so leaving them unlisted made the
    // shell fail before the page under test ever rendered.
    if (path.endsWith("/auth/me")) {
      await route.fulfill({ json: { data: { permissions: [] } } });
      return;
    }

    if (path.includes("/notifications")) {
      await route.fulfill({ json: { data: [], meta: { unreadCount: 0 } } });
      return;
    }

    if (path.endsWith("/recruiter/candidate-summary")) {
      await route.fulfill({
        json: {
          totals: {
            total: 0,
            unviewed: 0,
            newLast7Days: 0,
            staleOver7Days: 0,
            upcomingInterviews: 0,
            staleThresholdDays: 7,
          },
          funnel: [],
          byStatus: {},
          aiScoreBuckets: {},
          recentApplications: [],
        },
      });
      return;
    }

    if (path.endsWith(`/recruiter-accounts/${recruiterId}`)) {
      await route.fulfill({
        json: {
          id: recruiterId,
          email: "recruiter@example.com",
          status: "ACTIVE",
          // A recruiter with no company sits at tier 0, and /recruiter/candidates requires
          // tier 1 — so the layout bounced this spec to the dashboard before the page under
          // test ever mounted. VERIFIED keeps it clear of the tier-2 gate as well.
          company: {
            id: "company-1",
            name: "UpNext",
            status: "ACTIVE",
            verificationStatus: "VERIFIED",
          },
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
            // The list formats these; without them the row renderer throws
            // "Invalid date value" and takes the page down with it.
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
            deadline: "2026-12-31T00:00:00.000Z",
            status: "ACTIVE",
          },
        ],
      });
      return;
    }

    if (path.includes("/recruiter/cv-screening/config")) {
      await route.fulfill({
        json: {
          weights: { skills: 40, experience: 30, projects: 20, education: 10 },
          weightPreset: null,
          mustHaveCriteria: [],
          niceToHaveCriteria: [],
          customPrompt: null,
          passingScore: null,
          defaultTopN: null,
          inherited: {},
        },
      });
      return;
    }

    await route.fulfill({ json: [] });
  });
}
