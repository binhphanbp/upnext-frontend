import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const recruiterId = "11111111-1111-4111-8111-111111111111";
const longDescription = `
  <p>Tham gia xây dựng nền tảng tuyển dụng công nghệ phục vụ hàng nghìn ứng viên và doanh nghiệp.</p>
  <ul>
    <li>Phát triển các luồng nghiệp vụ tuyển dụng có hiệu năng cao và trải nghiệm nhất quán.</li>
    <li>Thiết kế component có khả năng tái sử dụng, dễ kiểm thử và dễ mở rộng.</li>
    <li>Phối hợp cùng Product và Design để phân tích yêu cầu trước khi triển khai.</li>
    <li>Tích hợp API, xử lý trạng thái tải, lỗi và các trường hợp dữ liệu biên.</li>
    <li>Thực hiện code review và duy trì tiêu chuẩn chất lượng chung của đội ngũ.</li>
    <li>Theo dõi chỉ số vận hành, điều tra lỗi và chủ động đề xuất phương án cải thiện.</li>
    <li>Viết tài liệu kỹ thuật cho những quyết định kiến trúc quan trọng.</li>
  </ul>
`;
const longRequirements = `
  <ul>
    <li>Có kinh nghiệm phát triển sản phẩm web thực tế với JavaScript hoặc TypeScript.</li>
    <li>Nắm chắc cách tổ chức component, quản lý state và giao tiếp với REST API.</li>
    <li>Hiểu các nguyên tắc bảo mật, accessibility và tối ưu hiệu năng frontend.</li>
    <li>Có khả năng phân tích vấn đề, trao đổi rõ ràng và làm việc theo mục tiêu.</li>
    <li>Chủ động kiểm thử thay đổi trước khi bàn giao cho QA và người dùng.</li>
  </ul>
`;
const longBenefits = `
  <ul>
    <li>Lương thưởng cạnh tranh và review hiệu suất hai lần mỗi năm.</li>
    <li>Bảo hiểm đầy đủ, ngân sách học tập và thiết bị làm việc hiện đại.</li>
    <li>Môi trường hybrid linh hoạt, tôn trọng quyền tự chủ của kỹ sư.</li>
  </ul>
`;

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

    if (path.endsWith("/auth/me")) {
      await route.fulfill({ json: { data: { permissions: ["job_posts:write"] } } });
      return;
    }
    if (path.endsWith("/notifications")) {
      await route.fulfill({
        json: {
          data: [],
          meta: { page: 1, limit: 8, total: 0, totalPages: 0, unreadCount: 0 },
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
            workingModel: "HYBRID",
            city: "Hồ Chí Minh",
            district: "Quận 1",
            address: "Nguyễn Huệ",
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
          description: "Nền tảng kết nối nhân tài công nghệ với doanh nghiệp.",
          verificationStatus: "VERIFIED",
          logoFile: null,
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
      await route.fulfill({
        json: [
          { id: "skill-react", name: "React" },
          { id: "skill-typescript", name: "TypeScript" },
          { id: "skill-angular", name: "Angular" },
          { id: "skill-laravel", name: "Laravel" },
          { id: "skill-php", name: "PHP" },
          { id: "skill-vue", name: "Vue.js" },
        ],
      });
      return;
    }
    if (path.endsWith("/specializations")) {
      await route.fulfill({
        json: [{ id: "specialization-web", name: "Lập trình web" }],
      });
      return;
    }
    if (path.endsWith("/recruiter/job-posts")) {
      await route.fulfill({ json: [] });
      return;
    }
    if (path.endsWith("/job-post-ai/salary-insights")) {
      const requestPayload = route.request().postDataJSON() as {
        yearsOfExperience?: number;
        skillIds?: string[];
        requiredSkillIds?: string[];
        relatedSkillIds?: string[];
        skillKeywords?: string[];
      };
      expect(typeof requestPayload.yearsOfExperience).toBe("number");
      expect(
        [
          ...(requestPayload.skillIds ?? []),
          ...(requestPayload.requiredSkillIds ?? []),
          ...(requestPayload.relatedSkillIds ?? []),
          ...(requestPayload.skillKeywords ?? []),
        ].length,
      ).toBeGreaterThan(0);
      const market =
        (requestPayload.yearsOfExperience ?? 0) <= 1
          ? { p25: 12_000_000, median: 15_000_000, p75: 18_000_000 }
          : { p25: 27_500_000, median: 30_000_000, p75: 32_500_000 };
      await route.fulfill({
        json: {
          available: true,
          basis: "WEB_GROUNDED_AI",
          currency: "VND",
          period: "MONTH",
          sampleSize: 4,
          lookbackMonths: 24,
          confidence: "MEDIUM",
          market,
          recommended: {
            salaryMin: market.p25,
            salaryMax: market.p75,
          },
          comparison: {
            position: "NOT_PROVIDED",
            differencePercent: null,
          },
          matchedFactors: [
            "Chức danh tương đồng",
            "Cùng cấp bậc",
            "Kỹ năng liên quan",
            "Từ khóa liên quan",
            "Loại hình công ty",
            "Quy mô công ty",
          ],
          marketSummary:
            "Khoảng lương được tổng hợp từ báo cáo thị trường và tin tuyển dụng công khai.",
          sources: [
            { title: "ITviec", url: "https://example.com/itviec" },
            { title: "TopCV", url: "https://example.com/topcv" },
            { title: "Reeracoen", url: "https://example.com/reeracoen" },
            { title: "Second Talent", url: "https://example.com/second-talent" },
          ],
          searchQueries: ["Junior PHP Laravel salary Vietnam"],
          searchedAt: "2026-07-25T10:00:00.000Z",
          model: "gemini-3.1-pro-preview",
          message: "Dữ liệu tham chiếu từ các nguồn web có trích dẫn.",
        },
      });
      return;
    }
    if (path.endsWith("/job-post-ai/generate") || path.endsWith("/job-post-ai/extract")) {
      await route.fulfill({
        json: {
          model: "gemini-test",
          source: "generated",
          draft: {
            title: "Senior React Developer",
            description: longDescription,
            requirements: longRequirements,
            benefits: longBenefits,
            salaryMin: null,
            salaryMax: null,
            salaryPeriod: "MONTH",
            salaryIsNegotiable: true,
            salaryIsVisible: true,
            vacanciesCount: 1,
            educationLevel: "ANY",
            workingDays: null,
            jobCategoryId: "category-1",
            experienceLevelId: "level-1",
            employmentTypeId: "type-1",
            skillIds: ["skill-react", "skill-typescript"],
            specializationIds: ["specialization-web"],
          },
          suggestions: {
            unmatchedSkillNames: [],
            unmatchedSpecializationNames: [],
          },
        },
      });
      return;
    }

    await route.fulfill({ json: [] });
  });
});

test("creates an IT JD draft with AI and fills the recruiter form", async ({ page }) => {
  // Ends in a browser-rendered PDF export, which is the slowest step in the suite.
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/recruiter/job-posts/create/ai");

  await expect(page.getByRole("heading", { name: /Tạo JD tự động với/u })).toBeVisible();
  // The layout picker was removed: every draft uses the standard skill-first layout.
  await expect(page.getByText("Chọn cách trình bày JD")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/recruiter-job-post-ai-desktop.png",
    fullPage: false,
  });

  await page.getByLabel("Chức danh công việc *").fill("Senior React Developer");
  await page.getByLabel("Thêm kỹ năng hoặc từ khóa liên quan").fill("React, TypeScript, Fintech");
  await page.getByLabel("Số năm kinh nghiệm *").fill("3");
  const salaryRequestPromise = page.waitForRequest((request) =>
    new URL(request.url()).pathname.endsWith("/job-post-ai/salary-insights"),
  );
  await page.getByRole("button", { name: "Tạo JD với AI" }).click();
  const salaryRequest = await salaryRequestPromise;
  expect(salaryRequest.postDataJSON()).toMatchObject({
    skillKeywords: ["React", "TypeScript", "Fintech"],
  });

  await expect(page).toHaveURL(/\/vi\/recruiter\/job-posts\/create\/ai$/);
  await expect(page.getByLabel("Kết quả tạo JD từ AI")).toBeVisible();
  const jdDocument = page.locator("#ai-jd-print-area");
  await expect(
    jdDocument.getByText("Lập trình web · Vị trí Senior React Developer", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(jdDocument.getByText("Ngành nghề", { exact: true })).toHaveCount(0);
  await expect(jdDocument.getByRole("heading", { name: "Mô tả công việc" })).toBeVisible();
  await expect(jdDocument.getByRole("heading", { name: "Yêu cầu công việc" })).toBeVisible();
  await expect(jdDocument.getByRole("heading", { name: "Quyền lợi / Phúc lợi" })).toBeVisible();
  await expect(jdDocument.getByText("Kỹ năng & công nghệ", { exact: true })).toHaveCount(0);
  await expect(jdDocument.getByText("Năng lực để thành công", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "AI tham chiếu lương thị trường" })).toBeVisible();
  await expect(page.getByText("Loại hình công ty", { exact: true })).toBeVisible();
  await expect(page.getByText("Quy mô công ty", { exact: true })).toBeVisible();
  await expect(page.getByText("4 nguồn web được trích dẫn")).toBeVisible();
  await page.getByText("Nguồn web tham khảo (4)").click();
  await expect(page.getByRole("link", { name: /ITviec/u })).toBeVisible();
  await page.getByRole("button", { name: /Áp dụng khoảng/u }).click();
  await expect(page.locator("#ai-jd-print-area")).toContainText("27,5 Tr – 32,5 Tr / tháng");
  await page.reload();
  await expect(page.getByLabel("Kết quả tạo JD từ AI")).toBeVisible();
  await expect(page.locator("#ai-jd-print-area")).toContainText("27,5 Tr – 32,5 Tr / tháng");
  await expect(page.getByLabel("Chức danh công việc *")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xuất PDF" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tạo tin tuyển dụng từ JD này" }).first(),
  ).toBeVisible();
  // The PDF is rendered in the browser, and on a loaded machine that regularly runs past the
  // 30s default — this test failed all three attempts in a full suite run while passing on
  // its own. The budget is generous rather than the assertion weakened: the file is still
  // opened and checked below.
  const downloadPromise = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: "Xuất PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("senior-react-developer-JD.pdf");
  expect(await download.failure()).toBeNull();
  const exportedPdfPath = "test-results/recruiter-job-post-ai-export.pdf";
  await download.saveAs(exportedPdfPath);
  const exportedPdf = (await readFile(exportedPdfPath)).toString("latin1");
  expect([...exportedPdf.matchAll(/\/Type \/Page\b/g)]).toHaveLength(2);
  await page.screenshot({
    path: "test-results/recruiter-job-post-ai-result-desktop.png",
    fullPage: true,
  });

  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#ai-jd-print-area")).toBeVisible();
  await expect(page.locator(".ai-jd-no-print").first()).toBeHidden();
  await page.pdf({
    path: "test-results/recruiter-job-post-ai-result.pdf",
    format: "A4",
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });

  await page.getByRole("button", { name: "Tạo tin tuyển dụng từ JD này" }).first().click();
  await expect(page).toHaveURL(/\/vi\/recruiter\/job-posts\/create\?aiDraft=1$/, {
    timeout: 15_000,
  });
  await expect(page.locator("#job-title")).toHaveValue("Senior React Developer");
  await expect(page.locator("#job-salary-min")).toHaveValue("27500000");
  await expect(page.locator("#job-salary-max")).toHaveValue("32500000");
  await expect(page.getByText("Mô tả công việc", { exact: true })).toBeVisible();
  await expect(page.getByText("React", { exact: true })).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("keeps the AI generator usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/recruiter/job-posts/create/ai");

  await expect(page).toHaveURL(/\/vi\/recruiter\/job-posts\/create\/ai$/);
  await expect(page.getByLabel("Chức danh công việc *")).toBeVisible();
  await page.screenshot({
    path: "test-results/recruiter-job-post-ai-mobile.png",
    fullPage: false,
  });

  await page.getByLabel("Chức danh công việc *").fill("Frontend Developer");
  await page.getByLabel("Thêm kỹ năng hoặc từ khóa liên quan").fill("React, TypeScript");
  await page.getByLabel("Số năm kinh nghiệm *").fill("1");
  await page.getByRole("button", { name: "Tạo JD với AI" }).click();

  await expect(page.getByLabel("Kết quả tạo JD từ AI")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xuất PDF" })).toBeVisible();
  await page.screenshot({
    path: "test-results/recruiter-job-post-ai-result-mobile.png",
    fullPage: false,
  });

  await page.reload();
  await expect(page.getByLabel("Kết quả tạo JD từ AI")).toBeVisible();
  await page.getByRole("button", { name: "Thoát" }).click();
  await expect(page.getByText("Thoát khỏi JD này?")).toBeVisible();
  await page.getByRole("button", { name: "Thoát, không lưu" }).click();
  await expect(page).toHaveURL(/\/vi\/recruiter\/job-posts$/);
  await page.goto("/vi/recruiter/job-posts/create/ai");
  await expect(page.getByLabel("Chức danh công việc *")).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("extracts a pasted existing JD and fills the same recruiter form", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/vi/recruiter/job-posts");
  await page.getByRole("button", { name: "Tạo tin tuyển dụng" }).click();
  await page.getByRole("button", { name: "Sử dụng JD sẵn có" }).click();

  await expect(
    page.getByRole("heading", { name: "Tạo tin từ JD có sẵn với UpNext AI" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn file JD", exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Dán nội dung" }).click();
  await page
    .getByLabel("Nội dung JD")
    .fill(
      "Senior React Developer. Phát triển nền tảng tuyển dụng IT. Yêu cầu React, TypeScript và ba năm kinh nghiệm.",
    );
  await page.getByRole("button", { name: "Quét và tự động điền" }).click();

  await expect(page.locator("#job-title")).toHaveValue("Senior React Developer");
  // Salary reference now lives only on the AI generator screen, not on the create form.
  await expect(page.getByRole("heading", { name: "AI tham chiếu lương thị trường" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "Lưu bản nháp" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng tin" })).toBeVisible();
});

test("redirects an unverified company before mounting the create form", async ({ page }) => {
  await page.route(`**/api/v1/recruiter-accounts/${recruiterId}`, async (route) => {
    await route.fulfill({
      json: {
        id: recruiterId,
        email: "recruiter@example.com",
        status: "ACTIVE",
        profile: { id: "profile-1", fullName: "UpNext Recruiter" },
        company: {
          id: "company-1",
          name: "UpNext",
          status: "ACTIVE",
          verificationStatus: "PENDING",
          businessLicenseFileId: "license-1",
        },
      },
    });
  });

  await page.goto("/vi/recruiter/job-posts/create");

  await expect(page).toHaveURL(/\/vi\/recruiter\/company-profile$/);
  await expect(page.locator("#job-title")).toHaveCount(0);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});
