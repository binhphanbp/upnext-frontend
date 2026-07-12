import { expect, test } from "@playwright/test";

const candidateId = "candidate-cv-builder-e2e";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ id }) => {
      localStorage.setItem("upnext.candidate.accessToken", "e2e-access-token");
      localStorage.setItem("upnext.candidate.tokenType", "Bearer");
      localStorage.setItem(
        "upnext.candidate.user",
        JSON.stringify({ id, email: "minhanh@example.com", role: "CANDIDATE" }),
      );
    },
    { id: candidateId },
  );

  await page.route("**/candidate-profiles/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        id: "profile-e2e",
        candidateAccountId: candidateId,
        phoneNumber: "0901234567",
        gender: null,
        address: "TP. Hồ Chí Minh",
        birthdate: null,
        description:
          "Frontend Developer tập trung vào React, TypeScript và trải nghiệm sản phẩm dễ sử dụng.",
        jobSearchStatus: "OPEN_TO_WORK",
        profileVisibility: "PRIVATE",
        account: {
          id: candidateId,
          fullName: "Nguyễn Minh Anh",
          email: "minhanh@example.com",
        },
        educations: [],
        experiences: [],
        projects: [],
        certifications: [],
        skills: [],
        languages: [],
        links: [],
        jobPreference: {
          id: "preference-e2e",
          desiredPosition: "Frontend Developer",
          desiredSalaryMin: null,
          desiredSalaryMax: null,
          salaryCurrency: "VND",
          workingModel: null,
          desiredLevelId: null,
          desiredLevel: null,
          noticePeriodDays: null,
          isRelocate: false,
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });
});

test("edits and restores an account-scoped CV draft", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/vi/candidate/cv-builder");

  await expect(page.getByRole("heading", { name: "UpNext CV Studio" })).toBeVisible();
  await page.getByRole("button", { name: /^Thông tin/ }).click();
  const fullName = page.getByLabel("Họ và tên");
  await expect(fullName).toHaveValue("Nguyễn Minh Anh");

  await fullName.fill("Trần Minh Khoa");
  await expect(
    page.getByLabel("Bản xem trước CV").getByRole("heading", { name: "Trần Minh Khoa" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), `upnext-cv-builder-draft.${candidateId}`),
    )
    .toContain("Trần Minh Khoa");

  await page.reload();
  await page.getByRole("button", { name: /^Thông tin/ }).click();
  await expect(page.getByLabel("Họ và tên")).toHaveValue("Trần Minh Khoa");
});

test("maps target-job keywords to evidence already present in the CV", async ({ page }) => {
  await page.goto("/vi/candidate/cv-builder");

  await page.getByLabel("Vị trí ứng tuyển").fill("Frontend Engineer");
  await page
    .getByLabel("Mô tả công việc", { exact: true })
    .fill(
      "Tìm Frontend Engineer có kinh nghiệm React, TypeScript, GraphQL và tối ưu hiệu năng sản phẩm. React và TypeScript là kỹ năng cốt lõi.",
    );

  const evidenceMap = page.locator(".cv-match-card");
  await expect(evidenceMap.getByText("React", { exact: true })).toBeVisible();
  await expect(evidenceMap.getByText("GraphQL", { exact: true })).toBeVisible();
  await expect(evidenceMap.getByText(/không phải “điểm ATS”/i)).toBeVisible();
});

test("switches between edit and preview without page overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/candidate/cv-builder");

  await page.getByRole("button", { name: /^Thông tin/ }).click();
  await expect(page.getByLabel("Họ và tên")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await page.getByRole("button", { name: "Xem trước", exact: true }).click();
  await expect(page.getByLabel("Bản xem trước A4")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  await page.getByRole("button", { name: /^Thông tin/ }).click();
  await expect(page.getByLabel("Họ và tên")).toBeVisible();
});
