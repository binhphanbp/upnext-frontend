import { expect, test, type Page } from "@playwright/test";

const accountId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const applicationId = "33333333-3333-4333-8333-333333333333";

const jobPost = {
  id: jobId,
  slug: "frontend-engineer",
  title: "Frontend Engineer",
  description: "Build accessible candidate experiences.",
  salaryMin: 30_000_000,
  salaryMax: 45_000_000,
  salaryCurrency: "VND",
  salaryIsNegotiable: false,
  salaryIsVisible: true,
  status: "PUBLISHED",
  publishedAt: "2026-07-01T00:00:00.000Z",
  expiredAt: "2027-07-01T00:00:00.000Z",
  company: {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Nimbus Labs",
    logoUrl: null,
    verificationStatus: "VERIFIED",
  },
  experienceLevel: { id: "level", name: "Senior" },
  employmentType: { id: "type", name: "Full-time" },
  jobCategory: { id: "category", name: "Frontend" },
};

const application = {
  id: applicationId,
  jobPostId: jobId,
  candidateProfileId: "55555555-5555-4555-8555-555555555555",
  cvVersionId: "66666666-6666-4666-8666-666666666666",
  coverLetter: "Tôi quan tâm đến trải nghiệm ứng viên có khả năng truy cập tốt.",
  status: "VIEWED",
  submittedAt: "2026-07-10T02:00:00.000Z",
  viewedAt: "2026-07-11T03:00:00.000Z",
  rejectedAt: null,
  hiredAt: null,
  createdAt: "2026-07-10T02:00:00.000Z",
  updatedAt: "2026-07-11T03:00:00.000Z",
  jobPost,
  cvVersion: {
    id: "66666666-6666-4666-8666-666666666666",
    cvId: "77777777-7777-4777-8777-777777777777",
    versionNumber: 2,
    sourceFileId: null,
    createdAt: "2026-07-09T00:00:00.000Z",
  },
};

const savedJob = {
  id: "88888888-8888-4888-8888-888888888888",
  candidateProfileId: "55555555-5555-4555-8555-555555555555",
  jobPostId: jobId,
  createdAt: "2026-07-11T00:00:00.000Z",
  jobPost,
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockCandidateActivity(page);
});

test("renders API-backed applications with consistent navigation and detail", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/vi/candidate/applications");

  await expect(page.getByRole("heading", { name: "Việc đã ứng tuyển" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
    "Việc đã ứng tuyển",
  );
  await expect(page.getByText("Hồ sơ & hoạt động", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Đang xử lý/ })).toContainText("1");
  await expect(page.getByRole("link", { name: "Frontend Engineer" })).toBeVisible();
  await expect(page.getByText("Đã xem", { exact: true })).toBeVisible();

  await expect(page.getByRole("link", { name: "Xem tiến trình" })).toHaveAttribute(
    "href",
    `/vi/candidate/applications/${applicationId}`,
  );
  await page.goto(`/vi/candidate/applications/${applicationId}`);
  await expect(page.getByRole("heading", { name: "Lịch sử ứng tuyển" })).toBeVisible();
  await expect(page.getByText("Nhà tuyển dụng đã xem", { exact: true })).toBeVisible();
  await expect(page.getByText("Phiên bản 2", { exact: true })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});

test("opens the immutable Builder CV snapshot from an submitted application", async ({ page }) => {
  const builderApplication = {
    ...application,
    cvVersion: {
      ...application.cvVersion,
      contentJson: {
        cvLanguage: "vi",
        personalInfo: {
          fullName: "Nguyễn Minh Anh",
          title: "Frontend Engineer",
          email: "candidate@example.com",
          phoneNumber: "+84 912 345 678",
          address: "Hà Nội",
          website: "",
        },
        summary: "CV đã nộp được lưu nguyên vẹn cùng đơn ứng tuyển.",
      },
      cv: { source: "BUILDER", title: "CV Frontend Builder" },
      versionNo: 2,
    },
  };
  await page.route(new RegExp(`/api/v1/applications/${applicationId}(?:\\?|$)`), async (route) => {
    await route.fulfill({
      body: JSON.stringify(builderApplication),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto(`/vi/candidate/applications/${applicationId}`);
  await page.getByRole("button", { name: "Xem CV" }).click();

  await expect(page.getByRole("dialog", { name: "CV Frontend Builder" })).toBeVisible();
  await expect(page.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
});

test("keeps profile as a single destination in the account menu", async ({ page }) => {
  await page.goto("/vi");

  const accountTrigger = page.getByRole("button", { name: "Tài khoản" });
  await expect(accountTrigger).toBeVisible();
  await accountTrigger.focus();
  await page.keyboard.press("Enter");

  const accountMenu = page.getByRole("menu");
  await expect(accountMenu).toBeVisible();
  await expect(accountMenu.getByRole("menuitem", { name: "Hồ sơ", exact: true })).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(accountMenu).not.toBeVisible();
});

test("removes a saved job optimistically and supports undo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/candidate/saved-jobs");

  await expect(page.getByRole("heading", { name: "Việc đã lưu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Frontend Engineer" })).toBeVisible();

  await page.getByRole("button", { name: "Bỏ lưu Frontend Engineer" }).click();
  await expect(page.getByText("Đã bỏ việc làm khỏi shortlist.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Frontend Engineer" })).toHaveCount(0);

  await page.getByRole("button", { name: "Hoàn tác" }).click();
  await expect(page.getByRole("link", { name: "Frontend Engineer" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("withdraws an active application without losing its detail data", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/vi/candidate/applications/${applicationId}`);

  await page.getByRole("button", { name: "Rút hồ sơ" }).click();
  const dialog = page.getByRole("dialog", { name: "Xác nhận rút hồ sơ" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Xác nhận rút" }).click();

  await expect(
    page.getByLabel("Thông tin hỗ trợ").getByText("Đã rút hồ sơ", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Frontend Engineer" })).toBeVisible();
  await expect(page.getByText("Nimbus Labs", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Rút hồ sơ" })).toHaveCount(0);
});

test("shows a pending offer as an explicit candidate decision, then records acceptance", async ({
  page,
}) => {
  const offeredApplication = {
    ...application,
    availableActions: {
      canChangeCv: false,
      canRespondToOffer: true,
      canWithdraw: false,
    },
    offerDeadlineAt: "2027-08-01T02:00:00.000Z",
    offerDetails: {
      salaryOffer: "45.000.000 VNĐ/tháng",
      startDate: "01/09/2027",
      note: "Chúng tôi mong được chào đón bạn vào đội ngũ.",
    },
    offerResponse: "PENDING",
    status: "OFFERED",
    statusLogs: [
      {
        id: "offer-status-log",
        oldStatus: "INTERVIEWING",
        newStatus: "OFFERED",
        note: "Offer sent",
        changedAt: "2027-07-20T02:00:00.000Z",
      },
    ],
  };
  let offerAccepted = false;
  const acceptedApplication = {
    ...offeredApplication,
    availableActions: { ...offeredApplication.availableActions, canRespondToOffer: false },
    offerResponse: "ACCEPTED",
  };
  await page.route(new RegExp(`/api/v1/applications/${applicationId}(?:\\?|$)`), async (route) => {
    await route.fulfill({
      body: JSON.stringify(offerAccepted ? acceptedApplication : offeredApplication),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(
    new RegExp(`/api/v1/applications/${applicationId}/respond-offer$`),
    async (route) => {
      offerAccepted = true;
      await route.fulfill({
        body: JSON.stringify(acceptedApplication),
        contentType: "application/json",
        status: 200,
      });
    },
  );

  await page.goto(`/vi/candidate/applications/${applicationId}`);
  await expect(
    page.getByRole("heading", { name: "Bạn có một đề nghị cần phản hồi" }),
  ).toBeVisible();
  await expect(page.getByText("45.000.000 VNĐ/tháng", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Đồng ý đề nghị" }).click();
  const dialog = page.getByRole("dialog", { name: "Đồng ý với đề nghị này?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Gửi phản hồi đồng ý" }).click();

  await expect(page.getByRole("heading", { name: "Bạn đã đồng ý đề nghị" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Từ chối đề nghị" })).toHaveCount(0);
});

test("shows an actionable empty state when there are no applications", async ({ page }) => {
  await page.route(/\/applications\/me\/activity(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
        summary: {
          total: 0,
          active: 0,
          interviewing: 0,
          actionRequired: 0,
          nextInterviewAt: null,
          nextInterviewApplicationId: null,
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/vi/candidate/applications");

  await expect(
    page.getByRole("heading", { name: "Bạn chưa ứng tuyển công việc nào" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Khám phá việc làm" }).last()).toHaveAttribute(
    "href",
    "/vi/jobs",
  );
});

test("keeps application filters usable without mobile horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/candidate/applications");

  await page.getByRole("button", { name: /Đang xử lý/ }).click();
  await expect(page.getByRole("heading", { name: "Việc đã ứng tuyển" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("shows a recoverable saved-jobs error state", async ({ page }) => {
  await page.route(/\/api\/v1\/saved-jobs(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: "Temporary upstream error" }),
      contentType: "application/json",
      status: 503,
    });
  });

  await page.goto("/vi/candidate/saved-jobs");

  await expect(page.getByRole("heading", { name: "Không thể tải việc đã lưu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
});

async function mockCandidateActivity(page: Page) {
  let savedJobs = [savedJob];

  await page.addInitScript(
    ({ id }) => {
      localStorage.setItem("upnext.candidate.accessToken", "test-access-token");
      localStorage.setItem("upnext.candidate.tokenType", "Bearer");
      localStorage.setItem(
        "upnext.candidate.user",
        JSON.stringify({ id, email: "candidate@example.com", role: "CANDIDATE" }),
      );
    },
    { id: accountId },
  );

  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: {
          id: accountId,
          email: "candidate@example.com",
          fullName: "Minh Anh",
          role: "CANDIDATE",
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/conversations(?:\?.*)?$/, async (route) => {
    await route.fulfill({ body: JSON.stringify([]), contentType: "application/json", status: 200 });
  });

  await page.route("**/candidate-profiles/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        id: "55555555-5555-4555-8555-555555555555",
        candidateAccountId: accountId,
        phoneNumber: null,
        gender: null,
        address: "TP. Hồ Chí Minh",
        birthdate: null,
        description: null,
        jobSearchStatus: "OPEN_TO_WORK",
        profileVisibility: "PUBLIC",
        account: { id: accountId, fullName: "Minh Anh", email: "candidate@example.com" },
        educations: [],
        experiences: [],
        projects: [],
        certifications: [],
        skills: [],
        languages: [],
        links: [],
        jobPreference: null,
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/cvs\/me(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            id: "77777777-7777-4777-8777-777777777777",
            title: "Frontend CV",
            source: "UPLOAD",
            status: "ACTIVE",
            isDefault: true,
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
            versions: [],
          },
        ],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/applications\/me(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify([application]),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/applications\/me\/activity(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [application],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        summary: {
          total: 1,
          active: 1,
          interviewing: 0,
          actionRequired: 0,
          nextInterviewAt: null,
          nextInterviewApplicationId: null,
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(new RegExp(`/api/v1/applications/${applicationId}(?:\\?|$)`), async (route) => {
    await route.fulfill({
      body: JSON.stringify(application),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(new RegExp(`/api/v1/applications/${applicationId}/withdraw$`), async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        id: applicationId,
        status: "WITHDRAWN",
        updatedAt: "2026-07-12T04:00:00.000Z",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/job-posts(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      body: JSON.stringify([
        {
          ...jobPost,
          requirements: null,
          benefits: null,
          createdAt: "2026-07-01T00:00:00.000Z",
          jobPostLocations: [{ jobLocation: { city: "TP. Hồ Chí Minh" } }],
        },
      ]),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/api\/v1\/saved-jobs(?:\/[^?]+)?(?:\?|$)/, async (route) => {
    if (route.request().method() === "DELETE") {
      savedJobs = [];
      await route.fulfill({ status: 204 });
      return;
    }
    if (route.request().method() === "POST") {
      savedJobs = [savedJob];
      await route.fulfill({
        body: JSON.stringify(savedJob),
        contentType: "application/json",
        status: 201,
      });
      return;
    }
    await route.fulfill({
      body: JSON.stringify(savedJobs),
      contentType: "application/json",
      status: 200,
    });
  });
}
