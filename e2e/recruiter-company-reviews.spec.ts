import { expect, test, type Page } from "@playwright/test";

/**
 * The recruiter workspace layout gates every page on `/auth/me` and the recruiter
 * account, clearing the session and bouncing to login if either fails — so those two
 * have to be stubbed before the page under test is reachable at all.
 */
async function signInAsRecruiter(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("upnext.recruiter.accessToken", "test-token");
    localStorage.setItem("upnext.recruiter.tokenType", "Bearer");
    localStorage.setItem(
      "upnext.recruiter.user",
      JSON.stringify({ id: "rec-1", email: "recruiter@test.dev", role: "RECRUITER" }),
    );
  });

  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { permissions: [] } }),
    }),
  );

  await page.route("**/api/v1/recruiter-accounts/*/dashboard-stats", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ totalJobPosts: 0, totalCandidates: 0 }),
    }),
  );

  await page.route("**/api/v1/recruiter-accounts/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "rec-1",
        email: "recruiter@test.dev",
        status: "ACTIVE",
        recruiterRole: null,
        company: {
          id: "company-1",
          name: "Spec Co",
          status: "ACTIVE",
          verificationStatus: "VERIFIED",
          businessLicenseFileId: null,
          reputationScore: "60",
          restrictedAt: null,
        },
        profile: {
          id: "p-1",
          fullName: "Recruiter",
          phoneNumber: null,
          gender: null,
          avatarUrl: null,
        },
      }),
    }),
  );
}

function review(id: string, overallRating: number, myReport: unknown) {
  return {
    id,
    overallRating,
    summary: `Nhận xét ${id}`,
    createdAt: new Date("2026-08-01").toISOString(),
    reviewer: { id: `profile-${id}`, fullName: "Nguyễn Văn A" },
    myReport,
  };
}

async function mockReviews(page: Page) {
  await page.route("**/api/v1/company-reviews/my-company**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          review("not-reported", 1, null),
          review("pending", 2, {
            id: "rep-1",
            status: "PENDING",
            reason: "Sai sự thật",
            createdAt: new Date("2026-08-02").toISOString(),
          }),
          review("rejected", 5, {
            id: "rep-2",
            status: "REJECTED",
            reason: "Nghi fake",
            createdAt: new Date("2026-08-02").toISOString(),
          }),
        ],
        summary: {
          totalReviews: 3,
          averageOverallRating: 2.7,
          ratingDistribution: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 1 },
        },
        meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
      }),
    }),
  );
}

test("offers the report action only on reviews this recruiter has not reported", async ({
  page,
}) => {
  await signInAsRecruiter(page);
  await mockReviews(page);

  await page.goto("/vi/recruiter/company-reviews");

  await expect(page.getByText("Nhận xét not-reported")).toBeVisible();

  // Filing a second report is a 409, so reported rows must show state, not a button.
  await expect(page.getByRole("button", { name: "Báo cáo" })).toHaveCount(1);
  await expect(page.getByText("Đang chờ admin xử lý")).toBeVisible();
  await expect(page.getByText("Báo cáo bị từ chối")).toBeVisible();
});

test("summarises the company rating above the list", async ({ page }) => {
  await signInAsRecruiter(page);
  await mockReviews(page);

  await page.goto("/vi/recruiter/company-reviews");

  await expect(page.getByText("2.7")).toBeVisible();
  await expect(page.getByText("3 đánh giá").first()).toBeVisible();
});

test("names the reviewer instead of showing an anonymous row", async ({ page }) => {
  await signInAsRecruiter(page);
  await mockReviews(page);

  await page.goto("/vi/recruiter/company-reviews");

  // Reviews are attributed now — the name and its initials stand in for an avatar.
  await expect(page.getByText("Nguyễn Văn A").first()).toBeVisible();
  await expect(page.getByText("NA").first()).toBeVisible();
});
