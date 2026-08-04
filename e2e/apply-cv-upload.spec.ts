import { expect, test, type Page } from "@playwright/test";

const candidateId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const oldCvId = "33333333-3333-4333-8333-333333333333";
const oldVersionId = "44444444-4444-4444-8444-444444444444";
const uploadedCvId = "55555555-5555-4555-8555-555555555555";
const uploadedVersionId = "66666666-6666-4666-8666-666666666666";

test("keeps a newly uploaded CV selected and previews its own version", async ({ page }) => {
  await installCandidateSession(page);
  const state = await mockApplyCvFlow(page);

  await page.goto(`/vi/jobs/${jobId}`);
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();

  await expect(page.getByRole("button", { name: "Chọn CV CV cũ.pdf" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByLabel("Tải lên CV").setInputFiles({
    buffer: Buffer.from("%PDF-1.7 uploaded CV"),
    mimeType: "application/pdf",
    name: "CV mới.pdf",
  });

  const uploadedCv = page.getByRole("button", { name: "Chọn CV CV mới.pdf" });
  await expect(uploadedCv).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Chọn CV CV cũ.pdf" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.getByRole("button", { name: "Xem trước CV CV mới.pdf" }).click();
  await expect(page.getByRole("button", { name: "Đóng xem CV" })).toBeVisible();
  await expect(page.locator('iframe[title="CV mới.pdf"]')).toBeVisible();
  expect(state.previewedVersionIds).toEqual([uploadedVersionId]);
});

test("explains an unavailable legacy CV and prevents using it for an application", async ({
  page,
}) => {
  await installCandidateSession(page);
  await mockApplyCvFlow(page, { oldCvUnavailable: true });

  await page.goto(`/vi/jobs/${jobId}`);
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();
  await page.getByRole("button", { name: "Xem trước CV CV cũ.pdf" }).click();

  await expect(
    page.getByText(
      "Chưa thể mở CV này. Bạn có thể chọn một CV khác hoặc tải lại tệp bên dưới để tiếp tục ứng tuyển.",
    ),
  ).toBeVisible();
  await expect(page.getByText("CV chưa thể xem trước")).toBeVisible();
  await expect(page.getByText("Chưa thể xem trước — chọn CV khác hoặc tải lại tệp")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nộp hồ sơ ứng tuyển" })).toBeDisabled();
});

async function installCandidateSession(page: Page) {
  await page.addInitScript(
    ({ id }) => {
      localStorage.setItem("upnext.candidate.accessToken", "test-access-token");
      localStorage.setItem("upnext.candidate.tokenType", "Bearer");
      localStorage.setItem(
        "upnext.candidate.user",
        JSON.stringify({ id, email: "candidate@example.com", role: "CANDIDATE" }),
      );
    },
    { id: candidateId },
  );
}

async function mockApplyCvFlow(page: Page, options: { oldCvUnavailable?: boolean } = {}) {
  let uploaded = false;
  const previewedVersionIds: string[] = [];

  const candidateProfile = {
    account: { email: "candidate@example.com", fullName: "Minh Anh", id: candidateId },
    address: null,
    birthdate: null,
    candidateAccountId: candidateId,
    certifications: [],
    description: null,
    educations: [],
    experiences: [],
    gender: null,
    id: "77777777-7777-4777-8777-777777777777",
    jobSearchStatus: "OPEN_TO_WORK",
    languages: [],
    links: [],
    phoneNumber: "0901234567",
    profileVisibility: "PUBLIC",
    projects: [],
    skills: [],
  };
  const job = {
    benefits: null,
    company: { id: "88888888-8888-4888-8888-888888888888", name: "UpNext Labs" },
    createdAt: "2026-08-01T08:00:00.000Z",
    description: "<p>Xây dựng sản phẩm hữu ích cho ứng viên.</p>",
    employmentType: { name: "Full-time" },
    experienceLevel: { name: "Middle" },
    expiredAt: "2026-09-01T08:00:00.000Z",
    id: jobId,
    jobCategory: { name: "Frontend" },
    jobPostLocations: [{ jobLocation: { city: "Hà Nội" } }],
    jobPostSkills: [],
    publishedAt: "2026-08-01T08:00:00.000Z",
    requirements: null,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    salaryMax: 40_000_000,
    salaryMin: 30_000_000,
    title: "Frontend Engineer",
  };
  const oldCv = {
    createdAt: "2026-07-01T08:00:00.000Z",
    id: oldCvId,
    isDefault: true,
    source: "UPLOAD",
    status: "ACTIVE",
    title: "CV cũ.pdf",
    updatedAt: "2026-07-01T08:00:00.000Z",
    versions: [
      {
        createdAt: "2026-07-01T08:00:00.000Z",
        id: oldVersionId,
        sourceFile: {
          id: "old-file",
          mimeType: "application/pdf",
          originalName: "CV cũ.pdf",
          publicUrl: null,
        },
        sourceFileId: "old-file",
      },
    ],
  };
  const uploadedCv = {
    createdAt: "2026-08-04T08:00:00.000Z",
    id: uploadedCvId,
    isDefault: false,
    source: "UPLOAD",
    status: "ACTIVE",
    title: "CV mới.pdf",
    updatedAt: "2026-08-04T08:00:00.000Z",
    versions: [
      {
        createdAt: "2026-08-04T08:00:00.000Z",
        id: uploadedVersionId,
        sourceFile: {
          id: "new-file",
          mimeType: "application/pdf",
          originalName: "CV mới.pdf",
          publicUrl: null,
        },
        sourceFileId: "new-file",
      },
    ],
  };

  await page.route(/\/job-posts(?:\?.*)?$/, async (route) => {
    await route.fulfill({ body: JSON.stringify([job]), contentType: "application/json" });
  });
  await page.route("**/candidate-profiles/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify(candidateProfile),
      contentType: "application/json",
    });
  });
  await page.route(new RegExp(`/job-posts/${jobId}/applications/me$`), async (route) => {
    await route.fulfill({
      body: JSON.stringify({ applied: false }),
      contentType: "application/json",
    });
  });
  await page.route(/\/cvs\/me(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: uploaded ? [oldCv, uploadedCv] : [oldCv],
        meta: { limit: 100, page: 1, total: uploaded ? 2 : 1, totalPages: 1 },
      }),
      contentType: "application/json",
    });
  });
  await page.route("**/files/upload", async (route) => {
    uploaded = true;
    await route.fulfill({
      body: JSON.stringify({
        file: {
          id: "new-file",
          mimeType: "application/pdf",
          originalName: "CV mới.pdf",
          publicUrl: "",
          sizeBytes: "1024",
        },
      }),
      contentType: "application/json",
      status: 201,
    });
  });
  await page.route(/^.*\/cvs$/, async (route) => {
    await route.fulfill({
      body: JSON.stringify(uploadedCv),
      contentType: "application/json",
      status: 201,
    });
  });
  await page.route(/\/cv-versions\/([^/]+)\/download$/, async (route) => {
    const versionId = route.request().url().split("/").at(-2);
    if (versionId) previewedVersionIds.push(versionId);
    if (options.oldCvUnavailable && versionId === oldVersionId) {
      await route.fulfill({
        body: JSON.stringify({ message: "Không tìm thấy file CV trên hệ thống lưu trữ" }),
        contentType: "application/json",
        status: 404,
      });
      return;
    }
    await route.fulfill({
      body: "%PDF-1.7 preview",
      // Cloudinary private raw assets are delivered with this generic MIME.
      // The client must restore the persisted PDF MIME before creating its
      // object URL, otherwise browsers offer a download instead of a preview.
      contentType: "application/octet-stream",
      status: 200,
    });
  });

  return { previewedVersionIds };
}
