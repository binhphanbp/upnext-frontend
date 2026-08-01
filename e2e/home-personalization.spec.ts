import { expect, test, type Page } from "@playwright/test";

import {
  createHomeData,
  createHomeJob,
  installCandidateSession,
  mockCandidateHomeApi,
  mockHomeApi,
} from "./fixtures/home-api";

async function mockCandidateCollections(page: Page) {
  await page.route(/\/saved-jobs(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      body: JSON.stringify([]),
      contentType: "application/json",
    });
  });
  await page.route(/\/company-follows\/me(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      body: JSON.stringify([]),
      contentType: "application/json",
    });
  });
}

function createRecommendations(startIndex: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const job = createHomeJob(startIndex + index);

    return {
      job,
      matchedSkills: ["TypeScript"],
      reasonCodes: ["SKILL_MATCH", "WORKING_MODEL_MATCH"],
      score: 96 - index,
    };
  });
}

test("shows API-backed recommendations and match reasons for an eligible candidate", async ({
  page,
}) => {
  const requests = { candidateHome: 0, publicHome: 0 };
  const recommendations = createRecommendations(100);

  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith("/home/candidate")) requests.candidateHome += 1;
    if (pathname.endsWith("/home")) requests.publicHome += 1;
  });

  await installCandidateSession(page);
  await mockCandidateCollections(page);
  await mockCandidateHomeApi(
    page,
    createHomeData({
      latestJobs: [createHomeJob(1, { title: "Latest fallback job" })],
      personalization: {
        state: "ELIGIBLE",
        signalGroups: ["SKILLS", "PREFERENCES"],
        missingSignals: [],
      },
      recommendations: {
        title: "RECOMMENDED",
        items: recommendations,
      },
    }),
  );

  await page.goto("/vi");

  const jobsSection = page.locator(".marketing-home-jobs");
  await expect(jobsSection.getByRole("heading", { name: "Gợi ý phù hợp với bạn" })).toBeVisible();
  await expect(
    jobsSection.getByText("Các vị trí được chọn dựa trên kỹ năng và ưu tiên việc làm của bạn."),
  ).toBeVisible();
  await expect(jobsSection.getByText("Home API Engineer 100", { exact: true })).toBeVisible();
  await expect(jobsSection.locator(".featured-job-match-reason").first()).toHaveText(
    "Khớp kỹ năng của bạn",
  );
  await expect(jobsSection.getByText("Latest fallback job", { exact: true })).toHaveCount(0);
  await expect(page.locator(".marketing-home-candidate-action")).toHaveCount(0);
  expect(requests).toEqual({ candidateHome: 1, publicHome: 0 });
});

test("falls back to latest jobs and offers profile completion when candidate signals are insufficient", async ({
  page,
}) => {
  const latestJob = createHomeJob(200, { title: "Latest job while profile is incomplete" });
  const recommendations = createRecommendations(300);

  await installCandidateSession(page);
  await mockCandidateCollections(page);
  await mockCandidateHomeApi(
    page,
    createHomeData({
      latestJobs: [latestJob],
      personalization: {
        state: "INSUFFICIENT",
        signalGroups: ["SKILLS"],
        missingSignals: ["PREFERENCES"],
      },
      recommendations: {
        title: "RECOMMENDED",
        items: recommendations,
      },
    }),
  );

  await page.goto("/vi");

  const jobsSection = page.locator(".marketing-home-jobs");
  const actionPanel = page.locator(".marketing-home-candidate-action");
  await expect(jobsSection.getByRole("heading", { name: "Việc làm mới nhất" })).toBeVisible();
  await expect(jobsSection.getByText(latestJob.title, { exact: true })).toBeVisible();
  await expect(jobsSection.getByText("Home API Engineer 300", { exact: true })).toHaveCount(0);
  await expect(
    actionPanel.getByRole("heading", { name: "Hoàn thiện hồ sơ để nhận gợi ý phù hợp" }),
  ).toBeVisible();
  await expect(actionPanel.getByRole("button", { name: "Cập nhật hồ sơ" })).toBeVisible();
});

test("respects a candidate who is not looking and keeps the generic latest-jobs experience", async ({
  page,
}) => {
  const latestJob = createHomeJob(400, { title: "Latest job for passive candidate" });
  const recommendations = createRecommendations(500);

  await installCandidateSession(page);
  await mockCandidateCollections(page);
  await mockCandidateHomeApi(
    page,
    createHomeData({
      actions: [{ type: "MISSING_CV" }],
      latestJobs: [latestJob],
      personalization: {
        state: "NOT_LOOKING",
        signalGroups: ["SKILLS", "PREFERENCES"],
        missingSignals: [],
      },
      recommendations: {
        title: "RECOMMENDED",
        items: recommendations,
      },
    }),
  );

  await page.goto("/vi");

  const jobsSection = page.locator(".marketing-home-jobs");
  await expect(jobsSection.getByRole("heading", { name: "Việc làm mới nhất" })).toBeVisible();
  await expect(jobsSection.getByText(latestJob.title, { exact: true })).toBeVisible();
  await expect(jobsSection.getByText("Home API Engineer 500", { exact: true })).toHaveCount(0);
  await expect(jobsSection.getByRole("button", { name: "Ứng tuyển ngay" })).toBeVisible();
  await expect(page.locator(".marketing-home-candidate-action")).toHaveCount(0);

  const expiringSection = page.locator(".marketing-home-urgent");
  await expiringSection
    .getByRole("button", { name: "Closing Soon Platform Engineer", exact: true })
    .hover();
  await expect(
    page
      .getByRole("dialog", { name: "Closing Soon Platform Engineer" })
      .getByRole("button", { name: "Ứng tuyển ngay" }),
  ).toBeVisible();
});

test("falls back to latest jobs when recommendation cards cannot explain their match", async ({
  page,
}) => {
  const latestJob = createHomeJob(600, { title: "Latest job with a clear source" });
  const recommendations = createRecommendations(700);
  recommendations[0] = { ...recommendations[0]!, reasonCodes: [] };

  await installCandidateSession(page);
  await mockCandidateCollections(page);
  await mockCandidateHomeApi(
    page,
    createHomeData({
      latestJobs: [latestJob],
      personalization: {
        state: "ELIGIBLE",
        signalGroups: ["SKILLS", "PREFERENCES"],
        missingSignals: [],
      },
      recommendations: {
        title: "RECOMMENDED",
        items: recommendations,
      },
    }),
  );

  await page.goto("/vi");

  const jobsSection = page.locator(".marketing-home-jobs");
  await expect(jobsSection.getByRole("heading", { name: "Việc làm mới nhất" })).toBeVisible();
  await expect(jobsSection.getByText(latestJob.title, { exact: true })).toBeVisible();
  await expect(jobsSection.getByText("Home API Engineer 701", { exact: true })).toHaveCount(0);
});

test("offers a focused sign-in path after guest jobs without blocking browsing", async ({
  page,
}) => {
  await mockHomeApi(page);

  await page.goto("/vi");

  const prompt = page.locator(".marketing-home-candidate-action");
  await expect(
    prompt.getByRole("heading", { name: "Nhận gợi ý việc làm phù hợp hơn" }),
  ).toBeVisible();
  await expect(
    prompt.getByText(
      "Đăng nhập và cập nhật sở thích để UpNext ưu tiên những cơ hội sát với mục tiêu của bạn.",
      { exact: true },
    ),
  ).toBeVisible();
  await prompt.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/vi\/login$/u);
});
