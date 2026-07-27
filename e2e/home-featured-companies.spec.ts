import { expect, test, type Page } from "@playwright/test";

const companiesRoute = /\/api\/v1\/companies(?:\?.*)?$/;
const jobsRoute = /\/api\/v1\/job-posts$/;

type CompanyFixture = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  logoUrl?: string;
};

function createCompanies(count: number, spotlightName = "API Spotlight") {
  return Array.from(
    { length: count },
    (_, index): CompanyFixture => ({
      id: `company-${index}`,
      name: index === 0 ? spotlightName : `API Company ${index}`,
      slug: index === 0 ? "api-spotlight" : `api-company-${index}`,
      type: index % 2 ? "PRODUCT" : "OUTSOURCING",
      description: `Thông tin thật từ API cho công ty ${index}.`,
      logoUrl: "",
    }),
  );
}

async function mockDirectory(
  page: Page,
  companies: CompanyFixture[],
  { pageNumber = 1, total = companies.length, totalPages = 1 } = {},
) {
  await page.route(companiesRoute, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: companies,
        meta: { page: pageNumber, limit: 10, total, totalPages },
      }),
    });
  });
  await page.route(jobsRoute, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route(/\/api\/v1\/companies\/[^/?]+$/, async (route) => {
    const slug = route.request().url().split("/").at(-1);
    const company = companies.find((item) => item.slug === slug) ?? companies[0];
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ...company, coverFile: null }),
    });
  });
}

test("renders a balanced bento from API data only, without repeating the spotlight", async ({
  page,
}) => {
  const companies = createCompanies(10);
  await page.setViewportSize({ width: 1440, height: 1200 });
  await mockDirectory(page, companies);
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByText("10 công ty tuyển dụng")).toBeVisible();
  await expect(section.locator(".featured-company-card")).toHaveCount(9);
  await expect(section.locator(".featured-company-featured")).toHaveCSS("grid-row", "2 / span 3");
  await expect(section.getByText("API Spotlight", { exact: true })).toHaveCount(1);
  await expect(section.getByText("FPT Software", { exact: true })).toHaveCount(0);
});

test("loads the active company cover from its detail API", async ({ page }) => {
  const companies = createCompanies(10, "VNG Corporation");
  companies[0]!.slug = "vng-corporation";
  await mockDirectory(page, companies);
  await page.route(/\/api\/v1\/companies\/vng-corporation$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ...companies[0],
        coverFile: { publicUrl: "/assets/marketing/home/covers/fpt.jpg" },
      }),
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  const cover = section.locator(".featured-company-featured-cover-img");
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", /fpt\.jpg/);
});

test("pages through live API results instead of local mock pages", async ({ page }) => {
  await page.route(companiesRoute, async (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page"));
    const companies = createCompanies(10, pageNumber === 2 ? "API Page Two" : "API Page One");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: companies,
        meta: { page: pageNumber, limit: 10, total: 20, totalPages: 2 },
      }),
    });
  });
  await page.route(jobsRoute, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route(/\/api\/v1\/companies\/[^/?]+$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ coverFile: null }),
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByText("API Page One", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Trang sau" }).click();
  await expect(section.getByText("API Page Two", { exact: true })).toBeVisible();
});

test("persists company follow state without duplicating the spotlight company", async ({
  page,
}) => {
  const companyId = "219b6dce-7203-f858-bd93-71b4ca72aa2b";
  let following = false;

  await page.addInitScript(() => {
    localStorage.setItem("upnext.candidate.accessToken", "candidate-token");
    localStorage.setItem("upnext.candidate.tokenType", "Bearer");
    localStorage.setItem(
      "upnext.candidate.user",
      JSON.stringify({ id: "candidate-1", email: "candidate@example.com", role: "CANDIDATE" }),
    );
  });
  await mockDirectory(page, [
    {
      id: companyId,
      name: "Followable UpNext Labs",
      slug: "followable-upnext-labs",
      type: "PRODUCT",
      description: "Nền tảng công nghệ dành cho đội ngũ phát triển sản phẩm.",
      logoUrl: "",
    },
  ]);
  await page.route(/\/company-follows\/me(?:\?|$)/, async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-origin": "*",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    await route.fulfill({
      body: JSON.stringify(following ? [{ companyId }] : []),
      contentType: "application/json",
      headers,
    });
  });
  await page.route(new RegExp(`/companies/${companyId}/follow$`), async (route) => {
    const headers = {
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "POST, DELETE, OPTIONS",
      "access-control-allow-origin": "*",
    };
    const method = route.request().method();
    if (method === "OPTIONS") {
      await route.fulfill({ headers, status: 204 });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer candidate-token");
    following = method === "POST";
    await route.fulfill({
      body: method === "POST" ? JSON.stringify({ id: "follow-1", companyId }) : "",
      contentType: "application/json",
      headers,
      status: method === "POST" ? 201 : 204,
    });
  });

  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  const featuredFollow = section.locator(".featured-company-featured-follow");
  await expect(section.getByText("Followable UpNext Labs", { exact: true })).toHaveCount(1);
  await expect(featuredFollow).toBeEnabled();
  await featuredFollow.hover();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Theo dõi để nhận thông báo khi công ty có việc làm mới.",
  );
  await featuredFollow.click();
  await expect.poll(() => following).toBe(true);
  await expect(featuredFollow).toHaveAttribute("aria-pressed", "true");
});

test("does not render mock companies when the API has no results", async ({ page }) => {
  await mockDirectory(page, [], { total: 0, totalPages: 0 });
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await expect(section.getByText("Danh sách công ty đang được cập nhật.")).toBeVisible();
  await expect(section.locator(".featured-company-featured")).toHaveCount(0);
  await expect(section.getByText("FPT Software", { exact: true })).toHaveCount(0);
});

test("keeps the live spotlight panel focused on compact screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockDirectory(page, createCompanies(10));
  await page.goto("/vi");

  const section = page.locator(".marketing-home-companies");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator(".featured-company-featured")).toBeVisible();
  await expect(section.locator(".featured-company-card").first()).toBeHidden();
});
