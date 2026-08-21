import { expect, test, type Page } from "@playwright/test";

const candidateId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const oldCvId = "33333333-3333-4333-8333-333333333333";
const oldVersionId = "44444444-4444-4444-8444-444444444444";
const uploadedCvId = "55555555-5555-4555-8555-555555555555";
const uploadedVersionId = "66666666-6666-4666-8666-666666666666";
const builderCvId = "77777777-7777-4777-8777-777777777777";
const builderVersionId = "88888888-8888-4888-8888-888888888888";

test("keeps a newly uploaded CV selected and opens it in the browser-native reader", async ({
  page,
}) => {
  await installCandidateSession(page);
  const state = await mockApplyCvFlow(page);

  await page.goto(`/vi/jobs/${jobId}`);
  await waitForCandidateSession(page);
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
  const previewFrame = page.locator('iframe[title="CV mới.pdf"]');
  await expect(previewFrame).toBeVisible();
  await expect(previewFrame).not.toHaveClass(/pointer-events-none/);
  await expect(previewFrame).toHaveCSS("pointer-events", "auto");
  const openInNewTab = page.getByRole("link", { name: "Mở CV mới.pdf trong tab mới" });
  await expect(openInNewTab).toHaveAttribute("target", "_blank");
  await expect(openInNewTab).toHaveAttribute("rel", "noopener noreferrer");
  expect(state.previewedVersionIds).toEqual([uploadedVersionId]);
});

test("supports Escape for nested CV preview and restores focus when the application dialog closes", async ({
  page,
}) => {
  await installCandidateSession(page);
  await mockApplyCvFlow(page);

  await page.goto(`/vi/jobs/${jobId}`);
  await waitForCandidateSession(page);

  const applyTrigger = page.getByRole("button", { name: "Ứng tuyển ngay" });
  await applyTrigger.focus();
  await applyTrigger.click();

  const applyDialog = page.getByRole("dialog", {
    name: "Ứng tuyển vị trí Frontend Engineer",
  });
  await expect(applyDialog).toBeVisible();

  const previewTrigger = page.getByRole("button", { name: "Xem trước CV CV cũ.pdf" });
  await previewTrigger.click();
  await expect(page.getByRole("dialog", { name: "CV cũ.pdf" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "CV cũ.pdf" })).toBeHidden();
  await expect(applyDialog).toBeVisible();
  await expect(previewTrigger).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(applyDialog).toBeHidden();
  await expect(applyTrigger).toBeFocused();
});

test("explains an unavailable legacy CV and prevents using it for an application", async ({
  page,
}) => {
  await installCandidateSession(page);
  await mockApplyCvFlow(page, { oldCvUnavailable: true });

  await page.goto(`/vi/jobs/${jobId}`);
  await waitForCandidateSession(page);
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();
  await page.getByRole("button", { name: "Xem trước CV CV cũ.pdf" }).click();

  await expect(
    page.getByText(
      "Chưa thể mở CV này. Bạn có thể chọn một CV khác hoặc tải lại tệp bên dưới để tiếp tục ứng tuyển.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Không thể xem trước CV")).toBeVisible();
  await expect(page.getByText("Chưa thể xem trước — chọn CV khác hoặc tải lại tệp")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nộp hồ sơ ứng tuyển" })).toBeDisabled();
});

test("previews a Builder CV from its saved snapshot without requesting a file download", async ({
  page,
}) => {
  await installCandidateSession(page);
  const state = await mockApplyCvFlow(page, { builderCv: true });

  await page.goto(`/vi/jobs/${jobId}`);
  await waitForCandidateSession(page);
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();
  const previewTrigger = page.getByRole("button", { name: "Xem trước CV CV tạo trên UpNext" });
  await previewTrigger.click();

  await expect(page.getByRole("dialog", { name: "CV tạo trên UpNext" })).toBeVisible();
  await expect(page.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
  expect(state.previewedVersionIds).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "CV tạo trên UpNext" })).toBeHidden();
  await expect(previewTrigger).toBeFocused();
});

test("requires a reachable phone number before an application can be submitted", async ({
  page,
}) => {
  await installCandidateSession(page);
  const state = await mockApplyCvFlow(page);

  await page.goto(`/vi/jobs/${jobId}`);
  await waitForCandidateSession(page);
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();

  const phoneInput = page.getByLabel("Số điện thoại");
  await phoneInput.fill("0");
  await expect(phoneInput).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("Nhập số điện thoại hợp lệ để nhà tuyển dụng có thể liên hệ."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Nộp hồ sơ ứng tuyển" })).toBeDisabled();

  await phoneInput.fill("+1 202 555 0123");
  await expect(phoneInput).toHaveAttribute("aria-invalid", "false");
  const submitButton = page.getByRole("button", { name: "Nộp hồ sơ ứng tuyển" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect.poll(() => state.updatedPhoneNumbers).toEqual(["+12025550123"]);
  await expect.poll(() => state.submittedApplicationCount).toBe(1);
});

test("keeps account identity read-only while allowing contact details to be updated", async ({
  page,
}) => {
  await installCandidateSession(page);
  await mockApplyCvFlow(page);

  await page.goto(`/vi/jobs/${jobId}`);
  await waitForCandidateSession(page);
  await page.getByRole("button", { name: "Ứng tuyển ngay" }).click();

  const nameInput = page.getByLabel("Họ và tên");
  await expect(nameInput).toHaveValue("Minh Anh");
  await expect(nameInput).toHaveAttribute("readonly", "");
  await expect(nameInput).toHaveAttribute("aria-readonly", "true");
  await expect(page.getByText("Thông tin này được lấy từ tài khoản của bạn.")).toBeVisible();
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

async function waitForCandidateSession(page: Page) {
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("upnext.candidate.accessToken")))
    .toBe("test-access-token");
}

async function mockApplyCvFlow(
  page: Page,
  options: { builderCv?: boolean; oldCvUnavailable?: boolean } = {},
) {
  let uploaded = false;
  const previewedVersionIds: string[] = [];
  const updatedPhoneNumbers: string[] = [];
  let submittedApplicationCount = 0;

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
  const builderCv = {
    createdAt: "2026-08-04T08:00:00.000Z",
    id: builderCvId,
    isDefault: true,
    source: "BUILDER",
    status: "ACTIVE",
    title: "CV tạo trên UpNext",
    updatedAt: "2026-08-04T08:00:00.000Z",
    versions: [
      {
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
          summary: "Xây dựng trải nghiệm ứng viên dễ sử dụng.",
        },
        createdAt: "2026-08-04T08:00:00.000Z",
        id: builderVersionId,
        sourceFile: null,
        sourceFileId: null,
      },
    ],
  };

  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: {
          id: candidateId,
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
  await page.route(/\/saved-jobs(?:\?.*)?$/, async (route) => {
    await route.fulfill({ body: JSON.stringify([]), contentType: "application/json", status: 200 });
  });

  await page.route(/\/job-posts(?:\?.*)?$/, async (route) => {
    await route.fulfill({ body: JSON.stringify([job]), contentType: "application/json" });
  });
  await page.route("**/candidate-profiles/me", async (route) => {
    if (route.request().method() === "PATCH") {
      const payload = route.request().postDataJSON() as { phoneNumber?: string };
      if (payload.phoneNumber) updatedPhoneNumbers.push(payload.phoneNumber);
      await route.fulfill({
        body: JSON.stringify({ ...candidateProfile, phoneNumber: payload.phoneNumber ?? null }),
        contentType: "application/json",
      });
      return;
    }

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
        items: options.builderCv ? [builderCv] : uploaded ? [oldCv, uploadedCv] : [oldCv],
        meta: {
          limit: 100,
          page: 1,
          total: options.builderCv ? 1 : uploaded ? 2 : 1,
          totalPages: 1,
        },
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
  await page.route(/^.*\/applications$/, async (route) => {
    submittedApplicationCount += 1;
    await route.fulfill({
      body: JSON.stringify({ id: "application-id", status: "SUBMITTED" }),
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

  return {
    previewedVersionIds,
    updatedPhoneNumbers,
    get submittedApplicationCount() {
      return submittedApplicationCount;
    },
  };
}
