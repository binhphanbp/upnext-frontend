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

test("keeps the CV on the page when the browser switches to print", async ({ page }) => {
  await page.goto("/vi/candidate/cv-builder");
  await expect(page.getByRole("heading", { name: "UpNext CV Studio" })).toBeVisible();

  const preview = page.locator(".cv-builder-preview").first();
  const printArea = page.locator("#cv-print-area");

  // Edit mode is the default and, below the desktop breakpoint, it deliberately collapses
  // the preview into a tab — so the CV starts out hidden on screen.
  await expect(preview).toHaveClass(/cv-preview-mobile-hidden/);

  // A printer measures width against the paper, not the screen, and A4 is about 794px —
  // narrow enough for those same rules to match. The preview was therefore removed from
  // the printed page, and Export produced a blank sheet on every device. TC_CAN_032.
  await page.emulateMedia({ media: "print" });

  await expect(preview).not.toHaveCSS("display", "none");
  await expect(printArea).toBeVisible();
  const box = await printArea.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(0);
});

test("saves a validated builder CV as a distinct UpNext snapshot", async ({ page }) => {
  const snapshots: Record<string, unknown>[] = [];
  let defaultCvId: string | null = null;
  await page.route("**/cvs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    snapshots.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      body: JSON.stringify({
        id: "cv-builder-e2e",
        isDefault: false,
        source: "BUILDER",
        status: "ACTIVE",
        title: "Frontend Developer · UpNext",
        updatedAt: "2026-08-08T00:00:00.000Z",
        version: 1,
      }),
      contentType: "application/json",
      status: 201,
    });
  });
  await page.route("**/cvs/**", async (route) => {
    if (route.request().method() === "PATCH" && route.request().url().endsWith("/default")) {
      defaultCvId = route.request().url().split("/").at(-2) ?? null;
      await route.fulfill({
        body: JSON.stringify({ id: "cv-builder-e2e", isDefault: true }),
        contentType: "application/json",
        status: 200,
      });
      return;
    }

    await route.continue();
  });

  await page.goto("/vi/candidate/cv-builder");
  await page.getByRole("button", { name: /^Thông tin/ }).click();
  await expect(page.getByLabel("Họ và tên")).toHaveValue("Nguyễn Minh Anh");

  await page.getByRole("button", { name: /^Dự án/ }).click();
  await page.getByRole("button", { name: "Thêm dự án" }).click();
  await page.getByLabel("Tên dự án").fill("UpNext candidate workspace");
  await page.getByLabel("Vai trò").fill("Frontend Developer");
  await page
    .getByLabel("Mô tả dự án")
    .fill("Xây dựng luồng tìm việc có kiểm thử, phân quyền và khả năng truy cập cho ứng viên.");

  await page.getByRole("button", { name: "Lưu bản CV vào UpNext" }).click();
  await expect(page.getByRole("dialog")).toContainText("Lưu một bản CV vào UpNext");
  await page.getByLabel("Tên bản CV").fill("Frontend Developer · UpNext");
  await page.getByRole("checkbox", { name: "Đặt làm CV mặc định" }).click();
  await page.getByRole("button", { name: "Lưu bản CV", exact: true }).click();

  await expect(page.getByText("Đã lưu “Frontend Developer · UpNext” vào UpNext.")).toBeVisible();
  await expect.poll(() => snapshots).toHaveLength(1);
  const snapshot = snapshots[0];
  expect(snapshot).toBeDefined();
  if (!snapshot) throw new Error("Expected one CV snapshot request");

  expect(snapshot).toMatchObject({
    isDefault: true,
    source: "BUILDER",
    status: "ACTIVE",
    title: "Frontend Developer · UpNext",
  });
  expect(snapshot.contentJson).toEqual(
    expect.objectContaining({
      projects: expect.arrayContaining([
        expect.objectContaining({ name: "UpNext candidate workspace" }),
      ]),
    }),
  );
  expect(snapshot.parsedText).toContain("UpNext candidate workspace");
  expect(snapshot.parsedText).toContain("minhanh@example.com");
  expect(snapshot.parsedText).toContain("0901234567");
  expect(snapshot.parsedText).toContain("TP. Hồ Chí Minh");
  await expect.poll(() => defaultCvId).toBe("cv-builder-e2e");
});

test("keeps unfinished work available across devices as a server-side draft", async ({ page }) => {
  const snapshots: Record<string, unknown>[] = [];
  await page.route("**/cvs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    snapshots.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      body: JSON.stringify({
        id: "cv-builder-draft-e2e",
        isDefault: false,
        source: "BUILDER",
        status: "DRAFT",
        title: "Frontend draft",
        updatedAt: "2026-08-08T00:00:00.000Z",
        version: 1,
      }),
      contentType: "application/json",
      status: 201,
    });
  });

  await page.goto("/vi/candidate/cv-builder");
  await page.getByRole("button", { name: "Lưu bản CV vào UpNext" }).click();
  await expect(page.getByRole("dialog")).toContainText("lưu dưới dạng bản nháp");
  await page.getByLabel("Tên bản CV").fill("Frontend draft");
  await page.getByRole("button", { name: "Lưu bản CV", exact: true }).click();

  await expect(
    page.getByText("Đã lưu “Frontend draft” dưới dạng bản nháp vào UpNext."),
  ).toBeVisible();
  await expect.poll(() => snapshots).toHaveLength(1);
  expect(snapshots[0]).toMatchObject({ source: "BUILDER", status: "DRAFT" });
});

test("opens a saved Builder CV and creates a new immutable version when saving edits", async ({
  page,
}) => {
  const savedVersions: Record<string, unknown>[] = [];
  await page.route("**/cvs/existing-builder", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        id: "existing-builder",
        isDefault: true,
        source: "BUILDER",
        status: "ACTIVE",
        title: "Frontend CV",
        updatedAt: "2026-08-08T00:00:00.000Z",
        version: 4,
        versions: [
          {
            contentJson: {
              personalInfo: {
                address: "Hà Nội",
                email: "minhanh@example.com",
                fullName: "Nguyễn Minh Anh",
                phoneNumber: "0901234567",
                title: "Frontend Developer",
                website: "",
              },
            },
            createdAt: "2026-08-08T00:00:00.000Z",
            id: "existing-version-4",
            sourceFile: null,
            sourceFileId: null,
            versionNo: 4,
          },
        ],
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/cvs/existing-builder/builder-versions", async (route) => {
    savedVersions.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      body: JSON.stringify({
        cv: {
          id: "existing-builder",
          isDefault: true,
          status: "ACTIVE",
          title: "Frontend CV",
          updatedAt: "2026-08-08T00:00:00.000Z",
          version: 5,
        },
        version: {
          createdAt: "2026-08-08T00:00:00.000Z",
          id: "existing-version-5",
          sourceFile: null,
          sourceFileId: null,
          versionNo: 5,
        },
      }),
      contentType: "application/json",
      status: 201,
    });
  });

  await page.goto("/vi/candidate/cv-builder?cvId=existing-builder");
  await page.getByRole("button", { name: /^Thông tin/ }).click();
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh Updated");
  await page.getByRole("button", { name: "Lưu bản CV vào UpNext" }).click();
  await page.getByRole("button", { name: "Lưu bản CV", exact: true }).click();

  await expect.poll(() => savedVersions).toHaveLength(1);
  expect(savedVersions[0]).toMatchObject({ expectedVersion: 4 });
});

test("keeps local edits safe when a saved CV version conflicts", async ({ page }) => {
  await page.route("**/cvs/conflicting-builder", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        id: "conflicting-builder",
        isDefault: true,
        source: "BUILDER",
        status: "ACTIVE",
        title: "Frontend CV",
        updatedAt: "2026-08-08T00:00:00.000Z",
        version: 4,
        versions: [
          {
            contentJson: {
              personalInfo: {
                address: "Hà Nội",
                email: "minhanh@example.com",
                fullName: "Nguyễn Minh Anh",
                phoneNumber: "0901234567",
                title: "Frontend Developer",
                website: "",
              },
            },
            createdAt: "2026-08-08T00:00:00.000Z",
            id: "conflicting-version-4",
            sourceFile: null,
            sourceFileId: null,
            versionNo: 4,
          },
        ],
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/cvs/conflicting-builder/builder-versions", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ code: "CV_VERSION_CONFLICT", message: "Version conflict" }),
      contentType: "application/json",
      status: 409,
    });
  });

  await page.goto("/vi/candidate/cv-builder?cvId=conflicting-builder");
  await page.getByRole("button", { name: /^Thông tin/ }).click();
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh Updated locally");
  await page.getByRole("button", { name: "Lưu bản CV vào UpNext" }).click();
  await page.getByRole("button", { name: "Lưu bản CV", exact: true }).click();

  await expect(page.getByText("CV này vừa được cập nhật ở nơi khác.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tải bản mới nhất" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu thành CV mới" })).toBeVisible();
  await expect(page.getByLabel("Họ và tên")).toHaveValue("Nguyễn Minh Anh Updated locally");
});

test("takes a reviewer directly to the first field that needs attention", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/vi/candidate/cv-builder");

  await page.getByRole("button", { name: "Xóa nội dung CV" }).click();
  await page.getByRole("button", { name: "Xóa nội dung", exact: true }).click();
  await page.getByRole("button", { name: /^Kiểm tra/ }).click();
  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).first().click();

  await expect(page.getByLabel("Họ và tên")).toBeFocused();
});

test("takes a reviewer to the specific field behind a non-blocking suggestion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/vi/candidate/cv-builder");

  await page.getByRole("button", { name: /^Tóm tắt/ }).click();
  await page.getByLabel("Giới thiệu ngắn").fill("Frontend Developer có kinh nghiệm React.");
  await page.getByRole("button", { name: /^Kiểm tra/ }).click();

  const summaryIssue = page.locator(".cv-review-list li").filter({
    hasText: "Nên viết ít nhất 60 ký tự",
  });
  await summaryIssue.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();

  await expect(page.getByLabel("Giới thiệu ngắn")).toBeFocused();
});

test("keeps workspace controls usable at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/vi/candidate/cv-builder");

  await expect(page.locator(".cv-mobile-mode-switch")).toBeVisible();
  await expect(page.locator(".cv-builder-status-cluster")).toBeHidden();
  await expect(page.getByRole("button", { name: "Lưu bản CV vào UpNext" })).toBeVisible();
  await expect(page.getByRole("button", { name: "In / lưu PDF" })).toBeVisible();
  await page.getByRole("button", { name: "Xem trước", exact: true }).click();
  await expect(page.getByLabel("Bản xem trước A4")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  await expect(page.getByRole("button", { name: "In / lưu PDF", exact: true })).toBeVisible();
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

test("prints the CV from the default edit mode instead of a blank page", async ({ page }) => {
  // The export button never changes mode, so edit mode is what a user prints from.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/candidate/cv-builder");
  await expect(page.getByLabel("Bản xem trước A4")).toBeVisible();

  // A printer resolves `max-width` against the paper, not the screen. Emulating the print
  // media type alone keeps the 1440px viewport and hides nothing, so the page size has to be
  // emulated too — that combination is what a viewport-based hiding rule actually meets when
  // the sheet is A4, on every device.
  await page.emulateMedia({ media: "print" });
  await page.setViewportSize({ width: 794, height: 1123 });

  // Reported as the offending ancestor rather than a bare boolean: `visibility: visible`
  // inside `@media print` cannot resurrect a subtree whose ancestor is `display: none`, so
  // the useful part of a failure is which rule removed it.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const area = document.querySelector("#cv-print-area");
        if (!area) return "missing";
        for (let node: Element | null = area; node; node = node.parentElement) {
          if (getComputedStyle(node).display === "none") {
            return `hidden by ${node.className || node.tagName}`;
          }
        }
        return "visible";
      }),
    )
    .toBe("visible");

  // The real print pipeline, not a model of it: an empty A4 page is about 1KB, so anything
  // near that means the export came out blank however the layout looked on screen.
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  expect(pdf.byteLength).toBeGreaterThan(10_000);
});
