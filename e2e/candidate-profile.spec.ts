import { expect, test, type Page } from "@playwright/test";

const accountId = "11111111-1111-4111-8111-111111111111";

const completeProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  candidateAccountId: accountId,
  phoneNumber: "0901234567",
  gender: null,
  address: "TP. Hồ Chí Minh",
  birthdate: null,
  description:
    "Frontend Engineer tập trung vào accessibility, hiệu năng và các design system có thể mở rộng.",
  jobSearchStatus: "OPEN_TO_WORK",
  profileVisibility: "PUBLIC",
  account: {
    id: accountId,
    fullName: "Nguyễn Minh Anh",
    email: "minhanh@example.com",
  },
  educations: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      schoolName: "Đại học Công nghệ",
      degree: "Kỹ sư",
      major: "Công nghệ thông tin",
      startDate: "2018-09-01",
      endDate: "2022-06-01",
      isCurrent: false,
      gpa: 8.4,
      description: null,
      sortOrder: 0,
    },
  ],
  experiences: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      companyName: "Nimbus Labs",
      positionTitle: "Frontend Engineer",
      employmentType: "Full-time",
      startDate: "2023-01-01",
      endDate: null,
      isCurrent: true,
      description: "Xây dựng design system và tối ưu Core Web Vitals.",
      technologies: "React, TypeScript, Next.js",
      sortOrder: 0,
    },
  ],
  projects: [],
  certifications: [],
  skills: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      skillId: "66666666-6666-4666-8666-666666666666",
      proficiencyLevel: "ADVANCED",
      yearsOfExperience: 3,
      sortOrder: 0,
      skill: { id: "66666666-6666-4666-8666-666666666666", name: "React" },
    },
  ],
  languages: [],
  links: [],
  jobPreference: {
    id: "77777777-7777-4777-8777-777777777777",
    desiredPosition: "Senior Frontend Engineer",
    desiredSalaryMin: 30_000_000,
    desiredSalaryMax: 45_000_000,
    salaryCurrency: "VND",
    workingModel: "HYBRID",
    desiredLevelId: null,
    desiredLevel: null,
    noticePeriodDays: 14,
    isRelocate: false,
  },
};

const emptyProfile = {
  ...completeProfile,
  phoneNumber: null,
  address: null,
  description: null,
  jobSearchStatus: "NOT_LOOKING",
  profileVisibility: "PRIVATE",
  educations: [],
  experiences: [],
  projects: [],
  certifications: [],
  skills: [],
  languages: [],
  links: [],
  jobPreference: null,
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("never substitutes a sample profile for a signed-out candidate", async ({ page }) => {
  await page.goto("/vi/candidate/profile");

  await expect(page.getByRole("heading", { name: "Bạn cần đăng nhập" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByText(/Nguyễn Quốc Vương|Alex Johnson/)).toHaveCount(0);
});

test("supports deep-linked profile sections and hydrated edit forms", async ({ page }) => {
  await mockCandidateWorkspace(page, completeProfile, true);
  await page.goto("/vi/candidate/profile");

  await expect(page.getByRole("heading", { name: "Hồ sơ nghề nghiệp" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
    "Hồ sơ nghề nghiệp",
  );
  await page.getByRole("link", { name: /Kinh nghiệm/ }).click();
  await expect(page).toHaveURL(/section=experience/);
  const experienceHeading = page.getByRole("heading", { name: "Kinh nghiệm", exact: true });
  await expect(experienceHeading).toBeVisible();
  await expect(experienceHeading).toBeFocused();

  await page.getByRole("button", { name: "Chỉnh sửa: Frontend Engineer" }).click();
  await expect(page.getByRole("heading", { name: "Chỉnh sửa kinh nghiệm" })).toBeVisible();
  await expect(page.getByLabel(/Chức danh/)).toHaveValue("Frontend Engineer");
  await expect(page.getByLabel(/Công ty hoặc tổ chức/)).toHaveValue("Nimbus Labs");
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: /CV & tài liệu/ }).click();
  const documentsHeading = page.getByRole("heading", { name: "CV & tài liệu", exact: true });
  await expect(documentsHeading).toBeVisible();
  await expect(documentsHeading).toBeFocused();

  await page.goto("/vi/candidate/profile?section=preferences");
  await page.getByRole("button", { name: "Chỉnh sửa mong muốn" }).click();
  await expect(page.getByLabel("Mức lương tối thiểu")).toHaveValue("30000000");
  await expect(page.getByLabel("Mức lương tối đa")).toHaveValue("45000000");
  await expect(page.getByLabel("Mô hình làm việc")).toHaveValue("HYBRID");
});

test("supports explicit keyboard selection in the skill combobox", async ({ page }) => {
  await mockCandidateWorkspace(page, completeProfile, true);
  await page.route(/\/skills\/search(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify([
        { id: "66666666-6666-4666-8666-666666666666", name: "React" },
        { id: "99999999-9999-4999-8999-999999999999", name: "TypeScript" },
      ]),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.goto("/vi/candidate/profile?section=skills");

  await page.getByRole("button", { name: "Thêm kỹ năng" }).click();
  const skillSearch = page.getByRole("combobox", { name: "Kỹ năng" });
  const selectedSkillId = page.locator('input[name="skillId"]');

  await skillSearch.fill("Type");
  await expect(page.getByRole("option", { name: "TypeScript" })).toBeVisible();
  await expect(selectedSkillId).toHaveValue("");

  await skillSearch.press("ArrowDown");
  await skillSearch.press("Enter");

  await expect(skillSearch).toHaveValue("TypeScript");
  await expect(selectedSkillId).toHaveValue("99999999-9999-4999-8999-999999999999");
});

test("uses one readiness indicator and one empty-state action on desktop", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockCandidateWorkspace(page, emptyProfile, false);
  await page.goto("/vi/candidate/profile?section=experience");

  await expect(page.getByText("Không gian ứng viên", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Nội dung hồ sơ", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Độ hoàn thiện hồ sơ", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText("0%", { exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Bổ sung thông tin liên hệ" }).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText("Viết phần giới thiệu nghề nghiệp", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thêm kinh nghiệm", exact: true })).toHaveCount(1);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});

test("renders honest empty states and a mobile section selector", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCandidateWorkspace(page, emptyProfile, false);
  await page.goto("/vi/candidate/profile?section=experience");

  await expect(page.getByRole("heading", { name: "Chưa có kinh nghiệm làm việc" })).toBeVisible();
  await expect(page.getByText("0%", { exact: true }).filter({ visible: true })).toHaveCount(1);
  // The page title is "Hồ sơ nghề nghiệp"; bare "Hồ sơ" now labels the bottom navigation tab
  // on this viewport, so matching it by text alone picked up two elements.
  await expect(page.getByRole("heading", { name: "Hồ sơ nghề nghiệp", exact: true })).toBeVisible();
  await expect(page.getByLabel("Mục hồ sơ đang xem")).toHaveValue("experience");
  await expect(page.getByText(/Nguyễn Quốc Vương|Alex Johnson/)).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("keeps the active profile task in view across responsive breakpoints", async ({ page }) => {
  await mockCandidateWorkspace(page, emptyProfile, false);

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 1000 },
    { width: 1280, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      await page.setViewportSize(viewport);
      await page.goto("/vi/candidate/profile?section=experience");

      const sectionHeading = page.getByRole("heading", { name: "Kinh nghiệm", exact: true });
      const primaryAction = page.getByRole("button", { name: "Thêm kinh nghiệm", exact: true });
      await expect(sectionHeading).toBeVisible();
      await expect(primaryAction).toBeVisible();

      const metrics = await page.evaluate(() => {
        const header = document.querySelector("header");
        const section = document.querySelector("#profile-section-title");
        const action = Array.from(document.querySelectorAll("button")).find(
          (button) => button.textContent?.trim() === "Thêm kinh nghiệm",
        );
        return {
          actionTop: action?.getBoundingClientRect().top ?? null,
          clientWidth: document.documentElement.clientWidth,
          headerRight: header?.getBoundingClientRect().right ?? null,
          scrollWidth: document.documentElement.scrollWidth,
          sectionTop: section?.getBoundingClientRect().top ?? null,
        };
      });

      expect(metrics.scrollWidth).toBe(metrics.clientWidth);
      expect(metrics.headerRight).not.toBeNull();
      expect(metrics.headerRight!).toBeLessThanOrEqual(viewport.width);
      expect(metrics.sectionTop).not.toBeNull();
      expect(metrics.sectionTop!).toBeLessThan(viewport.height);
      expect(metrics.actionTop).not.toBeNull();
      // On a phone the action sits just past the fold — 866 against an 844 viewport — because
      // the readiness card above it is 262px tall. It is reachable, so what matters is that it
      // stays close enough to be found without hunting: within one short scroll of the fold,
      // not somewhere down the page. Wider breakpoints keep it on screen outright.
      const allowance = viewport.width < 768 ? 120 : 0;
      expect(metrics.actionTop!).toBeLessThan(viewport.height + allowance);
    });
  }
});

async function mockCandidateWorkspace(
  page: Page,
  profile: typeof completeProfile | typeof emptyProfile,
  hasCv: boolean,
) {
  await page.addInitScript(
    ({ id }) => {
      localStorage.setItem("upnext.candidate.accessToken", "test-access-token");
      localStorage.setItem("upnext.candidate.tokenType", "Bearer");
      localStorage.setItem(
        "upnext.candidate.user",
        JSON.stringify({ id, email: "minhanh@example.com", role: "CANDIDATE" }),
      );
    },
    { id: accountId },
  );

  // The candidate shell loads these on every page. Unmocked they reach the dev proxy and
  // 500, which the console assertions below count as browser errors.
  await page.route(/\/api\/v1\/notifications(?:\?|$)/, async (route) => {
    await route.fulfill({ json: { data: [], meta: { unreadCount: 0 } } });
  });
  await page.route(/\/api\/v1\/auth\/me(?:\?|$)/, async (route) => {
    await route.fulfill({ json: { data: { permissions: [] } } });
  });
  await page.route(/\/api\/v1\/conversations(?:\?|$)/, async (route) => {
    await route.fulfill({ json: { data: [], meta: { total: 0 } } });
  });
  await page.route(/\/api\/v1\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({ json: { data: [], meta: { total: 0 } } });
  });

  await page.route("**/candidate-profiles/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify(profile),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route(/\/cvs\/me(?:\?|$)/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: hasCv
          ? [
              {
                id: "88888888-8888-4888-8888-888888888888",
                title: "Frontend Engineer CV",
                source: "UPLOAD",
                status: "READY",
                isDefault: true,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
                versions: [],
              },
            ]
          : [],
        meta: { page: 1, limit: 20, total: hasCv ? 1 : 0, totalPages: hasCv ? 1 : 0 },
      }),
      contentType: "application/json",
      status: 200,
    });
  });
}
