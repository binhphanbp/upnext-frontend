import { expect, test } from "@playwright/test";

const recruiterId = "11111111-1111-4111-8111-111111111111";

const recruiterJobs = [
  createJob("job-active", "Tin đang đăng", "PUBLISHED", "APPROVED"),
  createJob("job-pending", "Tin chờ duyệt", "PUBLISHED", "PENDING"),
  createJob("job-draft", "Tin bản nháp", "DRAFT", "PENDING"),
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

    if (path.endsWith(`/recruiter-accounts/${recruiterId}`)) {
      await route.fulfill({
        json: {
          id: recruiterId,
          email: "recruiter@example.com",
          status: "ACTIVE",
          profile: { id: "profile-1", fullName: "UpNext Recruiter" },
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
      await route.fulfill({ json: [{ id: "category-1", name: "Công nghệ thông tin" }] });
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

    if (path.endsWith("/recruiter/job-posts")) {
      await route.fulfill({ json: recruiterJobs });
      return;
    }

    await route.fulfill({ json: [] });
  });
});

test("previews the current draft with the candidate job-detail UI", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/recruiter/job-posts");
  await page.getByRole("button", { name: "Tạo tin tuyển dụng" }).click();

  const titleInput = page.locator("#job-title");
  await titleInput.fill("Senior Frontend Engineer");
  await page.locator("#location-location-1").click();
  await page
    .locator(".ProseMirror")
    .nth(2)
    .fill("Quyền lợi\nChính sách đãi ngộ hấp dẫn dành cho nhân viên.");
  await page.getByRole("tab", { name: "Xem trước" }).click();

  await expect(page.getByRole("tab", { name: "Xem trước" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("heading", { name: "Senior Frontend Engineer" })).toBeVisible();
  await expect(page.getByText("Công ty Công nghệ UpNext").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Thông tin tuyển dụng" })).toBeVisible();
  const previewPanel = page.getByRole("tabpanel", { name: "Xem trước" });
  await expect(
    previewPanel.getByRole("img", { name: "Logo Công ty Công nghệ UpNext" }).first(),
  ).toBeVisible();
  await expect(previewPanel.getByText("Quyền lợi", { exact: true })).toHaveCount(1);
  await expect(previewPanel.getByText("Hà Nội", { exact: true }).first()).toBeVisible();
  await expect(previewPanel.getByText(/FPT Cầu Giấy Building/)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ứng tuyển ngay (chỉ minh họa)" }).first(),
  ).toBeDisabled();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  await page.screenshot({ path: "test-results/recruiter-job-post-preview.png", fullPage: true });

  await page.getByRole("tab", { name: "Soạn tin" }).click();
  await expect(titleInput).toHaveValue("Senior Frontend Engineer");
});

test("keeps the candidate-style preview responsive on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/recruiter/job-posts");
  await page.getByRole("button", { name: "Tạo tin tuyển dụng" }).click();
  await page.locator("#job-title").fill("Senior Frontend Engineer");
  await page.getByRole("tab", { name: "Xem trước" }).click();

  await expect(page.getByRole("heading", { name: "Senior Frontend Engineer" })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  await page.screenshot({
    path: "test-results/recruiter-job-post-preview-mobile.png",
    fullPage: true,
  });
});

test("filters published and pending-review jobs separately", async ({ page }) => {
  await page.goto("/vi/recruiter/job-posts");
  const statusFilter = page.getByRole("combobox", {
    name: "Lọc theo trạng thái tin tuyển dụng",
  });

  await statusFilter.click();
  await page.getByRole("option", { name: "Đang đăng", exact: true }).click();
  await expect(page.getByText("Tin đang đăng", { exact: true })).toBeVisible();
  await expect(page.getByText("Tin chờ duyệt", { exact: true })).toHaveCount(0);

  await statusFilter.click();
  await page.getByRole("option", { name: "Chờ duyệt", exact: true }).click();
  await expect(page.getByText("Tin chờ duyệt", { exact: true })).toBeVisible();
  await expect(page.getByText("Tin đang đăng", { exact: true })).toHaveCount(0);
});

function createJob(id: string, title: string, status: string, moderationStatus: string) {
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
    vacanciesCount: 1,
    status,
    moderationStatus,
    publishedAt: status === "PUBLISHED" ? "2026-07-19T00:00:00.000Z" : null,
    createdAt: "2026-07-19T00:00:00.000Z",
    company: {
      id: "company-1",
      name: "Công ty Công nghệ UpNext",
      verificationStatus: "VERIFIED",
      businessLicenseFileId: "license-1",
    },
    jobCategory: null,
    employmentType: null,
    experienceLevel: null,
    jobPostSkills: [],
    jobPostLocations: [],
    workingDays: null,
    expiredAt: null,
    _count: { applications: 0, views: 0 },
  };
}
