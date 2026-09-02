import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const recruiterId = "11111111-1111-4111-8111-111111111111";

const recruiterJobs = [
  createJob("job-active", "Tin đang đăng", "PUBLISHED", "APPROVED", {
    applications: 5,
    vacanciesCount: 10,
  }),
  createJob("job-expiring", "Tin sắp hết hạn", "PUBLISHED", "APPROVED", {
    expiredAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    posterId: "recruiter-2",
    posterName: "Trần Minh",
  }),
  createJob("job-pending", "Tin chờ duyệt", "PUBLISHED", "PENDING"),
  createJob("job-draft", "Tin bản nháp", "DRAFT", "PENDING", {
    categoryId: "category-2",
  }),
  createJob("job-closed", "Tin đã đóng", "CLOSED", "APPROVED"),
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ id }) => {
      localStorage.setItem("upnext.recruiter.accessToken", "test-access-token");
      localStorage.setItem("upnext.recruiter.tokenType", "Bearer");
      localStorage.setItem(
        "upnext.recruiter.user",
        JSON.stringify({ id, email: "recruiter@example.com", role: "RECRUITER" }),
      );
    },
    { id: recruiterId },
  );

  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    // The recruiter dashboard reads this for its stat cards.
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

    if (path.endsWith("/auth/me")) {
      await route.fulfill({
        json: {
          data: {
            permissions: ["jobs:manage"],
          },
        },
      });
      return;
    }

    if (path.endsWith("/notifications")) {
      await route.fulfill({
        json: {
          data: [],
          meta: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            unreadCount: 0,
          },
        },
      });
      return;
    }

    if (path.endsWith(`/recruiter-accounts/${recruiterId}/dashboard-stats`)) {
      await route.fulfill({
        json: {
          totalJobPosts: recruiterJobs.length,
          totalCandidates: 5,
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
          profile: {
            id: "profile-1",
            fullName: "UpNext Recruiter",
            phoneNumber: "0900000000",
            gender: "MALE",
            avatarUrl: "/assets/candidate/avatar-sample.svg",
          },
          company: {
            id: "company-1",
            name: "Công ty Công nghệ UpNext",
            verificationStatus: "VERIFIED",
            businessLicenseFileId: "license-1",
          },
        },
      });
      return;
    }

    if (path.endsWith("/companies/company-1/locations")) {
      await route.fulfill({
        json: [
          {
            id: "location-1",
            companyId: "company-1",
            country: "Việt Nam",
            workingModel: "ONSITE",
            city: "Hà Nội",
            district: "Cầu Giấy",
            address: "FPT Cầu Giấy Building, phố Duy Tân, phường Cầu Giấy, Hà Nội",
          },
        ],
      });
      return;
    }

    if (path.endsWith("/companies/company-1")) {
      await route.fulfill({
        json: {
          id: "company-1",
          name: "Công ty Công nghệ UpNext",
          taxCode: "0123456789",
          address: "Cầu Giấy, Hà Nội",
          email: "company@example.com",
          phone: "0900000000",
          companySize: "51-100",
          description: "Công ty công nghệ tuyển dụng.",
          verificationStatus: "VERIFIED",
          logoFile: {
            publicUrl:
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%23059669'/%3E%3Cpath d='M28 28h44v14H43v10h25v14H43v20H28z' fill='white'/%3E%3C/svg%3E",
          },
        },
      });
      return;
    }

    if (path.endsWith("/job-categories")) {
      await route.fulfill({
        json: [
          { id: "category-1", name: "Công nghệ thông tin" },
          { id: "category-2", name: "Thiết kế" },
        ],
      });
      return;
    }

    if (path.endsWith("/employment-types")) {
      await route.fulfill({ json: [{ id: "type-1", name: "Toàn thời gian" }] });
      return;
    }

    if (path.endsWith("/experience-levels")) {
      await route.fulfill({ json: [{ id: "level-1", name: "Senior" }] });
      return;
    }

    if (path.endsWith("/skills")) {
      await route.fulfill({ json: [{ id: "skill-1", name: "React" }] });
      return;
    }

    if (path.endsWith("/specializations")) {
      await route.fulfill({ json: [] });
      return;
    }

    if (path.endsWith("/recruiter/job-posts/job-active/access-members")) {
      await route.fulfill({
        json: {
          jobPost: {
            id: "job-active",
            title: "Tin đang đăng",
            createdByRecruiterId: recruiterId,
          },
          members: [
            {
              companyMemberId: "member-owner",
              recruiterAccountId: recruiterId,
              email: "recruiter@example.com",
              fullName: "UpNext Recruiter",
              avatarUrl: null,
              role: { id: "role-owner", code: "OWNER", name: "Admin" },
              memberStatus: "ACTIVE",
              accountStatus: "ACTIVE",
              isJobCreator: true,
              hasAccess: true,
              revokedAt: null,
            },
            {
              companyMemberId: "member-2",
              recruiterAccountId: "recruiter-2",
              email: "member@example.com",
              fullName: "Trần Minh",
              avatarUrl: null,
              role: { id: "role-hr", code: "HR", name: "HR" },
              memberStatus: "ACTIVE",
              accountStatus: "ACTIVE",
              isJobCreator: false,
              hasAccess: true,
              revokedAt: null,
            },
          ],
        },
      });
      return;
    }

    if (path.endsWith("/recruiter/job-posts/job-active/access-members/recruiter-2")) {
      await route.fulfill({
        json: { recruiterAccountId: "recruiter-2", hasAccess: false },
      });
      return;
    }

    if (path.endsWith("/recruiter/job-posts")) {
      await route.fulfill({ json: recruiterJobs });
      return;
    }

    await route.fulfill({ json: [] });
  });
});

test("previews the current draft with the candidate job-detail UI", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/recruiter/job-posts");
  await page.getByRole("button", { name: "Tạo tin tuyển dụng" }).click();
  // Creating now goes through a chooser: the two headline options navigate to the import and
  // AI flows, and the manual form sits behind "Đăng tin tuyển dụng từ đầu" inside the modal.
  await page.getByRole("button", { name: "Đăng tin tuyển dụng từ đầu" }).click();

  const titleInput = page.locator("#job-title");
  await titleInput.fill("Senior Frontend Engineer");
  await page.locator("#location-location-1").click();
  await page
    .locator(".ProseMirror")
    .nth(2)
    .fill("Quyền lợi\nChính sách đãi ngộ hấp dẫn dành cho nhân viên.");

  // Preview is no longer a tab inside the editor. It hands the draft to /jobs/preview in a new
  // tab so the half-written post stays on screen next to it, which is also why the editor must
  // still hold the typed title when the preview is closed.
  const previewPage = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Xem trước" }).click(),
  ]).then(([opened]) => opened);
  await previewPage.waitForLoadState("domcontentloaded");

  await expect(
    previewPage.getByRole("heading", { name: "Senior Frontend Engineer" }),
  ).toBeVisible();
  await expect(previewPage.getByText("Công ty Công nghệ UpNext").first()).toBeVisible();
  await expect(previewPage.getByText("Quyền lợi", { exact: true })).toHaveCount(1);
  await expect(previewPage.getByText(/FPT Cầu Giấy Building/)).toHaveCount(0);

  const horizontalOverflow = await previewPage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  await previewPage.close();
  await expect(titleInput).toHaveValue("Senior Frontend Engineer");
});

test("keeps the candidate-style preview responsive on mobile", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/recruiter/job-posts");
  await page.getByRole("button", { name: "Tạo tin tuyển dụng" }).click();
  await page.getByRole("button", { name: "Đăng tin tuyển dụng từ đầu" }).click();
  await page.locator("#job-title").fill("Senior Frontend Engineer");

  const previewPage = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Xem trước" }).click(),
  ]).then(([opened]) => opened);
  await previewPage.setViewportSize({ width: 390, height: 844 });
  await previewPage.waitForLoadState("domcontentloaded");

  await expect(
    previewPage.getByRole("heading", { name: "Senior Frontend Engineer" }),
  ).toBeVisible();
  const horizontalOverflow = await previewPage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("filters active and draft jobs separately", async ({ page }) => {
  await page.goto("/vi/recruiter/job-posts");
  const statusFilter = page.getByRole("combobox", {
    name: "Lọc theo trạng thái tin tuyển dụng",
  });

  await statusFilter.click();
  await page.getByRole("option", { name: "Đã đăng", exact: true }).click();
  await expect(page.getByText("Tin đang đăng", { exact: true })).toBeVisible();
  await expect(page.getByText("Tin chờ duyệt", { exact: true })).toHaveCount(0);

  await statusFilter.click();
  await page.getByRole("option", { name: "Bản nháp", exact: true }).click();
  await expect(page.getByText("Tin bản nháp", { exact: true })).toBeVisible();
  await expect(page.getByText("Tin đang đăng", { exact: true })).toHaveCount(0);
});

test("shows pending-review jobs instead of the archived dashboard card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/recruiter");

  const pendingCardLabel = page.getByRole("paragraph").filter({ hasText: /^Chờ duyệt$/ });
  await expect(pendingCardLabel).toBeVisible();
  await expect(pendingCardLabel.locator("..")).toContainText("1");
  await expect(page.getByText("Lưu trữ", { exact: true })).toHaveCount(0);

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("shows publish and expiry dates instead of the job description in each row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/recruiter/job-posts");

  const activeJobRow = page.getByRole("row", { name: "Tin đang đăng" });
  await expect(activeJobRow.getByText("Ngày đăng:", { exact: true })).toBeVisible();
  await expect(activeJobRow.getByText("19/07/2026", { exact: true })).toBeVisible();
  await expect(activeJobRow.getByText("Hết hạn:", { exact: true })).toBeVisible();
  await expect(activeJobRow.getByText("Không giới hạn", { exact: true })).toBeVisible();
  await expect(activeJobRow.getByText("Địa điểm:", { exact: true })).toBeVisible();
  await expect(activeJobRow.getByText("Hà Nội - Cầu Giấy", { exact: true })).toBeVisible();
  await expect(
    activeJobRow.getByLabel("5 ứng viên đã ứng tuyển trên 10 chỉ tiêu tuyển"),
  ).toHaveText("5 / 10");
  // The caption under the ratio is gone; the count now stands alone as "5 / 10" and carries its
  // meaning in the aria-label asserted just above, which is what a screen reader announces.
  await expect(activeJobRow.getByText("5 / 10", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Mô tả tuyển dụng đầy đủ cho vị trí đang được kiểm thử.", { exact: true }),
  ).toHaveCount(0);
});

test("manages company-member access from the job action menu", async ({ page }) => {
  await page.goto("/vi/recruiter/job-posts");

  const activeJobRow = page.getByRole("row", { name: "Tin đang đăng" });
  await activeJobRow.getByRole("button", { name: "Thao tác" }).click();
  const actionMenu = page.getByRole("menu");
  const accessMenuItem = page.getByRole("menuitem", { name: "Quản lý quyền truy cập" });
  await expect(actionMenu).toBeVisible();
  expect((await actionMenu.boundingBox())?.width).toBeGreaterThanOrEqual(250);
  expect((await accessMenuItem.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await accessMenuItem.click();

  await expect(
    page.getByRole("heading", {
      name: "Quản lý thành viên được quyền truy cập tin tuyển dụng",
    }),
  ).toBeVisible();
  const memberRow = page.getByRole("row", { name: /Trần Minh/ });
  await expect(memberRow.getByText("Đang hoạt động", { exact: true })).toBeVisible();
  await memberRow.getByRole("button", { name: "Thu hồi quyền" }).click();
  await expect(memberRow.getByText("Đã thu hồi", { exact: true })).toBeVisible();
  await expect(memberRow.getByRole("button", { name: "Cấp lại quyền" })).toBeVisible();
});

test("uses a distinct badge color for each job-post status", async ({ page }) => {
  await page.goto("/vi/recruiter/job-posts");

  await expect(
    page.getByRole("row", { name: "Tin đang đăng" }).getByText("Đã đăng", { exact: true }),
  ).toHaveClass(/bg-emerald-100/);
  await expect(
    page.getByRole("row", { name: "Tin sắp hết hạn" }).getByText("Sắp hết hạn", { exact: true }),
  ).toHaveClass(/bg-orange-100/);
  await expect(
    page.getByRole("row", { name: "Tin bản nháp" }).getByText("Bản nháp", { exact: true }),
  ).toHaveClass(/bg-blue-100/);
  await expect(
    page.getByRole("row", { name: "Tin đã đóng" }).getByText("Đã đóng", { exact: true }),
  ).toHaveClass(/bg-slate-100/);
});

test("filters job posts by expiry, poster, and category", async ({ page }) => {
  await page.goto("/vi/recruiter/job-posts");

  const statusFilter = page.getByRole("combobox", {
    name: "Lọc theo trạng thái tin tuyển dụng",
  });
  await statusFilter.click();
  await page.getByRole("option", { name: "Sắp hết hạn", exact: true }).click();
  const expiringJobRow = page.getByRole("row", { name: "Tin sắp hết hạn" });
  await expect(expiringJobRow).toBeVisible();
  await expect(expiringJobRow.getByText("Sắp hết hạn", { exact: true })).toHaveClass(
    /bg-orange-100/,
  );
  await expect(expiringJobRow.getByText(/· Sắp hết hạn$/)).toHaveClass(/text-rose-600/);
  await expect(page.getByText("Tin đang đăng", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Đặt lại" }).click();
  const posterFilter = page.getByRole("combobox", { name: "Lọc theo người đăng bài" });
  await posterFilter.click();
  await page.getByRole("option", { name: "Trần Minh", exact: true }).click();
  await expect(page.getByText("Tin sắp hết hạn", { exact: true })).toBeVisible();
  await expect(page.getByText("Tin bản nháp", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Đặt lại" }).click();
  const categoryFilter = page.getByRole("combobox", { name: "Lọc theo ngành nghề" });
  await categoryFilter.click();
  await page.getByRole("option", { name: "Thiết kế", exact: true }).click();
  await expect(page.getByText("Tin bản nháp", { exact: true })).toBeVisible();
  await expect(page.getByText("Tin đang đăng", { exact: true })).toHaveCount(0);
});

test("exports all job posts matching the active filters to Excel", async ({ page }) => {
  await page.goto("/vi/recruiter/job-posts");

  const categoryFilter = page.getByRole("combobox", { name: "Lọc theo ngành nghề" });
  await categoryFilter.click();
  await page.getByRole("option", { name: "Thiết kế", exact: true }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(download.suggestedFilename()).toMatch(/^UpNext_Job_Posts_\d{4}-\d{2}-\d{2}\.csv$/);
  expect(downloadPath).not.toBeNull();

  const exportedCsv = await readFile(downloadPath!, "utf8");
  expect(exportedCsv).toContain("Tin bản nháp");
  expect(exportedCsv).toContain("Thiết kế");
  expect(exportedCsv).toContain("Hà Nội - Cầu Giấy");
  expect(exportedCsv).not.toContain("Tin đang đăng");
});

test("shows the job-post filters without horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/recruiter/job-posts");

  await page.getByRole("button", { name: "Hiện bộ lọc tin tuyển dụng" }).click();
  await expect(page.getByRole("combobox", { name: "Lọc theo người đăng bài" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Lọc theo ngành nghề" })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("bleeds the sticky filter bar one gutter past the job list on wide screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/vi/recruiter/job-posts");

  const filterBox = await page.getByRole("region", { name: "Bộ lọc tin tuyển dụng" }).boundingBox();
  const listBox = await page
    .getByRole("region", { name: "Danh sách tin tuyển dụng" })
    .boundingBox();

  expect(filterBox).not.toBeNull();
  expect(listBox).not.toBeNull();

  // The filter bar is deliberately full-bleed: it is sticky, carries a border top and bottom,
  // and cancels the page gutter with `-mx-8`, so it spans the full width while the list stays
  // inside the padding. This pins that relationship — one gutter wider on each side, and
  // symmetric — which would catch either the bleed being lost or the two drifting apart.
  const GUTTER = 32;
  expect(Math.round(listBox!.x - filterBox!.x)).toBe(GUTTER);
  expect(Math.round(filterBox!.x + filterBox!.width - (listBox!.x + listBox!.width))).toBe(GUTTER);
});

test("renders an unpublished recruiter draft at the public preview URL", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "upnext.recruiter.job-post-preview",
      JSON.stringify({
        companyName: "Preview Company",
        companyLogoUrl: "",
        companyVerified: false,
        values: {
          title: "Preview-only Frontend Engineer",
          description: "<p>This draft is only a preview.</p>",
          salaryIsNegotiable: true,
          salaryIsVisible: true,
          vacanciesCount: 1,
          jobLocationIds: [],
          skillIds: [],
          specializationIds: [],
        },
        catalogs: {
          categories: [],
          employmentTypes: [],
          experienceLevels: [],
          skills: [],
          specializations: [],
        },
        locations: [],
      }),
    );
  });

  await page.goto("/vi/jobs/preview");

  await expect(page).toHaveURL(/\/vi\/jobs\/preview$/);
  await expect(page.getByRole("heading", { name: "Preview-only Frontend Engineer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quay lại soạn tin" })).toBeVisible();
  await expect(page.getByRole("contentinfo", { name: "Footer UpNext" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ứng tuyển ngay (chỉ minh họa)" }).first(),
  ).toBeDisabled();

  await page.getByRole("button", { name: "Quay lại soạn tin" }).click();
  await expect(page).toHaveURL(/\/vi\/recruiter\/job-posts\/create$/);
});

function createJob(
  id: string,
  title: string,
  status: string,
  moderationStatus: string,
  options: {
    posterId?: string;
    posterName?: string;
    categoryId?: string;
    expiredAt?: string;
    applications?: number;
    vacanciesCount?: number;
  } = {},
) {
  const posterId = options.posterId ?? recruiterId;
  const categoryId = options.categoryId ?? "category-1";
  return {
    id,
    title,
    description: "Mô tả tuyển dụng đầy đủ cho vị trí đang được kiểm thử.",
    requirements: null,
    benefits: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "VND",
    salaryIsVisible: true,
    salaryIsNegotiable: true,
    vacanciesCount: options.vacanciesCount ?? 1,
    status,
    moderationStatus,
    createdByRecruiterId: posterId,
    createdByRecruiter: {
      id: posterId,
      email: `${posterId}@example.com`,
      profile: {
        id: `profile-${posterId}`,
        fullName: options.posterName ?? "UpNext Recruiter",
      },
    },
    publishedAt: status === "PUBLISHED" ? "2026-07-19T00:00:00.000Z" : null,
    createdAt: "2026-07-19T00:00:00.000Z",
    company: {
      id: "company-1",
      name: "Công ty Công nghệ UpNext",
      verificationStatus: "VERIFIED",
      businessLicenseFileId: "license-1",
    },
    jobCategory: {
      id: categoryId,
      name: categoryId === "category-2" ? "Thiết kế" : "Công nghệ thông tin",
    },
    employmentType: null,
    experienceLevel: null,
    jobPostSkills: [],
    jobPostLocations: [
      {
        jobLocation: {
          id: "location-1",
          city: "Hà Nội",
          district: "Cầu Giấy",
          address: null,
          workingModel: "ONSITE",
        },
      },
    ],
    workingDays: null,
    expiredAt: options.expiredAt ?? null,
    _count: { applications: options.applications ?? 0, views: 0 },
  };
}
