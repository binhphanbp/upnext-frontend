import { expect, test, type Page } from "@playwright/test";

const COMPANY_ID = "11111111-1111-4111-8111-111111111111";
const COMPANY_SLUG = "spec-company-co";

const EMPTY_SUMMARY = {
  totalReviews: 0,
  averageOverallRating: null,
  averageBySection: {
    salaryBenefits: null,
    trainingLearning: null,
    managementCare: null,
    cultureFun: null,
    officeWorkspace: null,
    overtimeSatisfaction: null,
  },
};

async function mockCompanyApi(page: Page) {
  await page.route("**/api/v1/companies/**", async (route) => {
    // Match on the path suffix, not a substring: a slug containing "reviews" would
    // otherwise route the company profile request to the reviews handler.
    const { pathname } = new URL(route.request().url());

    if (pathname.endsWith("/reviews/me")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    }

    if (pathname.endsWith("/reviews")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], summary: EMPTY_SUMMARY }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: COMPANY_ID,
        name: "Reviews Spec Co",
        slug: COMPANY_SLUG,
        type: "PRODUCT",
        taxCode: null,
        address: "Hà Nội",
        email: null,
        phone: null,
        website: null,
        description: "Mô tả công ty",
        benefits: null,
        companySize: null,
        workingDays: null,
        verificationStatus: "VERIFIED",
        createdAt: new Date("2026-01-01").toISOString(),
        logoFile: null,
        coverFile: null,
        photos: [],
        jobPosts: [],
      }),
    });
  });
}

test("keeps the review call to action filled on the public company page", async ({ page }) => {
  await mockCompanyApi(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/vi/companies/${COMPANY_SLUG}`);

  const section = page.locator('section[aria-label="Đánh giá từ ứng viên"]');
  await expect(section).toBeVisible();

  const cta = section.getByRole("button", { name: "Viết đánh giá" });
  await expect(cta).toBeVisible();

  // The company page resets `background` on every button inside `.company-shell`, and
  // that rule out-specifies utility classes. A transparent background here means the
  // button renders as white-on-white and is invisible even though it is in the DOM.
  await expect(cta).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("shows the empty state when a company has no approved reviews", async ({ page }) => {
  await mockCompanyApi(page);
  await page.goto(`/vi/companies/${COMPANY_SLUG}`);

  const section = page.locator('section[aria-label="Đánh giá từ ứng viên"]');
  await expect(section.getByText("Chưa có đánh giá nào cho công ty này.")).toBeVisible();
});
