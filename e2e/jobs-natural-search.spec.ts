import { expect, test } from "@playwright/test";

const jobs = [
  {
    id: "react-remote-hcm",
    title: "Senior React Platform Engineer",
    description: "Build a TypeScript platform for enterprise customers.",
    requirements: "At least 3 years of React experience.",
    benefits: null,
    salaryMin: 35_000_000,
    salaryMax: 50_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt: "2026-07-25T00:00:00.000Z",
    createdAt: "2026-07-25T00:00:00.000Z",
    company: { id: "company-1", name: "UpNext Labs", verificationStatus: "VERIFIED" },
    jobCategory: { name: "Frontend Engineering" },
    employmentType: { name: "Full-time" },
    experienceLevel: { name: "Senior" },
    jobPostSkills: [
      { minYearsExperience: 3, skill: { id: "react", name: "React" } },
      { minYearsExperience: 3, skill: { id: "typescript", name: "TypeScript" } },
    ],
    jobPostLocations: [
      {
        jobLocation: {
          city: "TP. Hồ Chí Minh",
          workingModel: "REMOTE",
        },
      },
    ],
  },
  {
    id: "react-remote-hanoi",
    title: "Senior React Engineer",
    description: "Build React applications.",
    requirements: "At least 3 years of experience.",
    benefits: null,
    salaryMin: 35_000_000,
    salaryMax: 45_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt: "2026-07-24T00:00:00.000Z",
    createdAt: "2026-07-24T00:00:00.000Z",
    company: { id: "company-2", name: "Hanoi Product" },
    jobCategory: { name: "Frontend Engineering" },
    employmentType: { name: "Full-time" },
    experienceLevel: { name: "Senior" },
    jobPostSkills: [{ minYearsExperience: 3, skill: { id: "react", name: "React" } }],
    jobPostLocations: [{ jobLocation: { city: "Hà Nội", workingModel: "REMOTE" } }],
  },
  {
    id: "java-hybrid-hanoi",
    title: "Middle Java Backend Engineer",
    description: "Develop Spring services.",
    requirements: "Two years of Java experience.",
    benefits: null,
    salaryMin: 25_000_000,
    salaryMax: 35_000_000,
    salaryCurrency: "VND",
    salaryIsNegotiable: false,
    salaryIsVisible: true,
    publishedAt: "2026-07-23T00:00:00.000Z",
    createdAt: "2026-07-23T00:00:00.000Z",
    company: { id: "company-3", name: "Backend Core" },
    jobCategory: { name: "Backend Engineering" },
    employmentType: { name: "Full-time" },
    experienceLevel: { name: "Middle" },
    jobPostSkills: [{ minYearsExperience: 2, skill: { id: "java", name: "Java" } }],
    jobPostLocations: [{ jobLocation: { city: "Hà Nội", workingModel: "HYBRID" } }],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route(/\/job-posts(?:\?|$)/, async (route) => {
    await route.fulfill({ body: JSON.stringify(jobs), contentType: "application/json" });
  });
  await page.route(/\/search-keywords\/log(?:\?|$)/, async (route) => {
    await route.fulfill({ status: 204 });
  });
});

test("explains and applies natural-language job constraints", async ({ page }) => {
  const query = "Senior React remote ở Hồ Chí Minh lương từ 30 triệu";
  await page.goto(`/vi/jobs?keyword=${encodeURIComponent(query)}`);

  const interpretation = page.getByRole("status").filter({ hasText: "UpNext đã hiểu:" });
  await expect(interpretation).toContainText("Senior");
  await expect(interpretation).toContainText("React");
  await expect(interpretation).toContainText("Remote");
  await expect(interpretation).toContainText("TP. Hồ Chí Minh");
  await expect(interpretation).toContainText("Từ 30 triệu");

  await expect(page.getByText("Senior React Platform Engineer", { exact: true })).toBeVisible();
  await expect(page.getByText("Senior React Engineer", { exact: true })).toBeHidden();
  await expect(page.getByText("Middle Java Backend Engineer", { exact: true })).toBeHidden();
  // The result count is now a pagination summary ("Vị trí 1–1 của 1 việc làm") rather than
  // a "Tìm thấy N…" line, so this asserts the total the summary reports.
  await expect(page.getByText(/Vị trí\s*1–1\s*của\s*1\s*việc làm/)).toBeVisible();
});

test("keeps advanced filters in the URL and restores them after reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/jobs");

  await page.getByRole("checkbox", { name: /Remote/ }).check();
  await expect.poll(() => new URL(page.url()).searchParams.getAll("mode")).toEqual(["remote"]);

  await page.getByRole("button", { name: "TypeScript", exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.getAll("technology"))
    .toEqual(["TypeScript"]);

  await page.getByRole("button", { name: "Lương cao nhất" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("sort")).toBe("salary");

  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Remote/ })).toBeChecked();
  await expect(page.getByRole("button", { name: "TypeScript", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Lương cao nhất" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("restores search state when navigating browser history", async ({ page }) => {
  await page.goto("/vi/jobs");
  const keywordInput = page.getByRole("textbox", { name: "Từ khóa tìm việc" });

  await keywordInput.fill("React");
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("keyword")).toBe("React");

  await keywordInput.fill("Java");
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("keyword")).toBe("Java");

  await page.goBack();
  await expect(keywordInput).toHaveValue("React");
  await expect(page.getByText("Senior React Platform Engineer", { exact: true })).toBeVisible();
});

test("traps and restores focus for the advanced-filter dialog on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/jobs");

  const filterButton = page.getByRole("button", { name: "Bộ lọc", exact: true });
  await filterButton.click();

  const dialog = page.getByRole("dialog", { name: "Bộ lọc tìm kiếm" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Đóng bộ lọc" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(filterButton).toBeFocused();
});
